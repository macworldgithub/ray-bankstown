/**
 * telephony-bridge.js
 * ─────────────────────────────────────────────────────────
 * Bridges Asterisk's AudioSocket protocol (TCP, 8kHz 16-bit
 * signed linear mono PCM) to the OpenAI Realtime + ElevenLabs
 * pipeline already implemented in server.js.
 *
 * Flow per call:
 *   Asterisk dials out to this TCP server (per extensions.conf)
 *   → sends a UUID packet, then audio packets (8kHz PCM16)
 *   → we upsample 8kHz -> 24kHz and feed OpenAI's
 *     input_audio_buffer.append (base64)
 *   → ElevenLabs streams back 16kHz PCM audio
 *   → we downsample 16kHz -> 8kHz, chunk into 20ms frames
 *     (320 bytes), and drip-feed them back to Asterisk on a
 *     20ms clock (required — Asterisk expects real-time paced
 *     audio, not a burst)
 *
 * This module does NOT reimplement the OpenAI/ElevenLabs
 * session logic — it calls back into the functions already
 * exported from server.js (see "Integration" section in the
 * README for the two small edits needed there).
 * ─────────────────────────────────────────────────────────
 */

const net = require("net");

const AUDIOSOCKET_PORT = Number(process.env.AUDIOSOCKET_PORT || 8090);
const AUDIOSOCKET_BIND = process.env.AUDIOSOCKET_BIND || "127.0.0.1"; // keep local-only, Asterisk connects from localhost

// AudioSocket packet kinds (Asterisk res_audiosocket protocol)
const KIND_HANGUP = 0x00;
const KIND_UUID = 0x01;
const KIND_AUDIO = 0x10;
const KIND_ERROR = 0xff;

const FRAME_MS = 20;
const SAMPLES_PER_FRAME_8K = (8000 * FRAME_MS) / 1000; // 160 samples
const BYTES_PER_FRAME_8K = SAMPLES_PER_FRAME_8K * 2; // 320 bytes (16-bit)

// ─── PCM resampling helpers (linear interpolation) ────────
function resamplePcm16(pcmBuffer, srcRate, dstRate) {
  if (srcRate === dstRate) return pcmBuffer;
  const srcSamples = pcmBuffer.length / 2;
  const ratio = srcRate / dstRate;
  const dstSamples = Math.max(1, Math.floor(srcSamples / ratio));
  const out = Buffer.alloc(dstSamples * 2);

  for (let i = 0; i < dstSamples; i++) {
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, srcSamples - 1);
    const frac = srcIdx - lo;
    const sLo = pcmBuffer.readInt16LE(Math.min(lo, srcSamples - 1) * 2);
    const sHi = pcmBuffer.readInt16LE(hi * 2);
    const val = Math.round(sLo + (sHi - sLo) * frac);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
  }
  return out;
}

// ─── Outbound audio pacing queue ───────────────────────────
// Asterisk/RTP expects audio delivered in real time, not as one big
// burst. We buffer everything ElevenLabs gives us and drip it out
// in fixed 20ms/320-byte frames on a timer.
class PacedAudioSender {
  constructor(socket) {
    this.socket = socket;
    this.queue = Buffer.alloc(0);
    this.timer = null;
    this.stopped = false;
  }

  push(pcm8kBuffer) {
    if (this.stopped) return;
    this.queue = Buffer.concat([this.queue, pcm8kBuffer]);
    this._ensureTimer();
  }

  _ensureTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.stopped) return;
      if (this.queue.length === 0) return; // nothing to send this tick

      let frame;
      if (this.queue.length >= BYTES_PER_FRAME_8K) {
        frame = this.queue.subarray(0, BYTES_PER_FRAME_8K);
        this.queue = this.queue.subarray(BYTES_PER_FRAME_8K);
      } else {
        // pad the final partial frame with silence so Asterisk gets a
        // consistent frame size
        const padded = Buffer.alloc(BYTES_PER_FRAME_8K);
        this.queue.copy(padded, 0);
        frame = padded;
        this.queue = Buffer.alloc(0);
      }

      sendAudioFrame(this.socket, frame);
    }, FRAME_MS);
  }

  // Drop any buffered-but-not-yet-sent audio (used on barge-in /
  // response.cancel, mirroring closeElevenLabsWs() behaviour in server.js)
  clear() {
    this.queue = Buffer.alloc(0);
  }

  stop() {
    this.stopped = true;
    this.queue = Buffer.alloc(0);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

// ─── Wire protocol helpers ─────────────────────────────────
function sendAudioFrame(socket, pcmBuffer) {
  if (socket.destroyed) return;
  const header = Buffer.alloc(3);
  header.writeUInt8(KIND_AUDIO, 0);
  header.writeUInt16BE(pcmBuffer.length, 1);
  socket.write(Buffer.concat([header, pcmBuffer]));
}

function sendHangup(socket) {
  if (socket.destroyed) return;
  const header = Buffer.alloc(3);
  header.writeUInt8(KIND_HANGUP, 0);
  header.writeUInt16BE(0, 1);
  socket.write(header);
}

function uuidBytesToString(buf) {
  const hex = buf.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * Starts the AudioSocket TCP server.
 *
 * @param {Object} handlers
 * @param {(callId: string, ctx: object) => void} handlers.onCallStart
 *        Called once per inbound call, right after Asterisk sends the UUID
 *        packet. `ctx` exposes:
 *          ctx.sendPcm24k(base64Pcm24k)   -> ready to hand to OpenAI as-is
 *          ctx.pushOutboundPcm16k(buf)    -> feed ElevenLabs audio (16kHz) here
 *          ctx.clearOutbound()            -> flush pending TTS on barge-in
 *          ctx.hangup()                   -> end the call from our side
 * @param {(callId: string, base64Pcm24k: string) => void} handlers.onAudio
 *        Called for every inbound audio packet, already upsampled to 24kHz
 *        and base64-encoded (matches OPENAI_INPUT_SAMPLE_RATE default).
 * @param {(callId: string) => void} handlers.onCallEnd
 */
function startAudioSocketServer({ onCallStart, onAudio, onCallEnd }) {
  const server = net.createServer((socket) => {
    let callId = null;
    let buffer = Buffer.alloc(0);
    let sender = null;

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      // Parse as many complete packets as are available
      while (buffer.length >= 3) {
        const kind = buffer.readUInt8(0);
        const length = buffer.readUInt16BE(1);
        if (buffer.length < 3 + length) break; // wait for the rest

        const payload = buffer.subarray(3, 3 + length);
        buffer = buffer.subarray(3 + length);

        if (kind === KIND_UUID) {
          callId = uuidBytesToString(payload);
          sender = new PacedAudioSender(socket);

          const ctx = {
            sendPcm24k: () => {}, // placeholder, unused inbound-direction
            pushOutboundPcm16k: (pcm16kBuffer) => {
              const pcm8k = resamplePcm16(pcm16kBuffer, 16000, 8000);
              sender.push(pcm8k);
            },
            clearOutbound: () => sender.clear(),
            hangup: () => {
              sendHangup(socket);
              socket.end();
            },
          };

          console.log(`[AudioSocket] Call started: ${callId}`);
          onCallStart(callId, ctx);
        } else if (kind === KIND_AUDIO) {
          if (!callId) continue; // shouldn't happen — UUID always arrives first
          const pcm24k = resamplePcm16(payload, 8000, 24000);
          onAudio(callId, pcm24k.toString("base64"));
        } else if (kind === KIND_HANGUP) {
          console.log(`[AudioSocket] Asterisk sent HANGUP for ${callId}`);
          if (callId) onCallEnd(callId);
          socket.end();
        } else if (kind === KIND_ERROR) {
          console.warn(`[AudioSocket] Error packet on call ${callId}`);
        }
      }
    });

    socket.on("close", () => {
      if (sender) sender.stop();
      if (callId) {
        console.log(`[AudioSocket] Connection closed: ${callId}`);
        onCallEnd(callId);
      }
    });

    socket.on("error", (err) => {
      console.error(`[AudioSocket] Socket error (${callId || "unknown"}):`, err.message);
    });
  });

  server.listen(AUDIOSOCKET_PORT, AUDIOSOCKET_BIND, () => {
    console.log(`[AudioSocket] Listening on ${AUDIOSOCKET_BIND}:${AUDIOSOCKET_PORT}`);
  });

  server.on("error", (err) => {
    console.error("[AudioSocket] Server error:", err.message);
  });

  return server;
}

module.exports = {
  startAudioSocketServer,
  resamplePcm16,
};
