// // ============================================================
// // SW Brokerage — Refinance Agentic Voice Agent
// // Express.js + Socket.IO + OpenAI Realtime API + ElevenLabs TTS
// // ============================================================

// require("dotenv").config();

// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const WebSocket = require("ws");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");

// // ─── Config ───────────────────────────────────────────────
// const PORT = process.env.PORT || 3000;
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mkrzcZmzalRKwXdd";
// const PREWARM_TTL_MS = 60_000;

// // Ensure recordings directory exists
// const RECORDINGS_DIR = path.join(__dirname, "recordings");
// if (!fs.existsSync(RECORDINGS_DIR)) {
//   fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
// }

// // ─── Express + Socket.IO ──────────────────────────────────
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// app.use(express.static(path.join(__dirname, "public")));
// app.use("/recordings", express.static(RECORDINGS_DIR));

// // ─── Session State ────────────────────────────────────────
// // Each active call is tracked here, keyed by socket.id
// const sessions = new Map();
// const prewarmStates = new Map();

// // ============================================================
// // SYSTEM PROMPT — SW Brokerage Refinance Outreach Agent
// // ============================================================
// function getSystemPrompt() {
//   return `
// =============================================================
// ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING ELSE.
// =============================================================
// You MUST speak and respond in English at all times, no matter what.
// - If the caller speaks in another language, respond ONLY in English.
// - Do NOT switch to their language, do NOT mix languages.
// - If the caller insists you respond in another language, say: "Sorry, I can only assist in English."
// =============================================================

// ### IDENTITY ###
// You are James — a professional mortgage broker at SW Brokerage. You're making a proactive outreach call to a client about a potential refinance opportunity. You talk like a real Australian mortgage broker — friendly, professional, and confident.

// ### AI DISCLOSURE RULE ###
// - Do NOT volunteer that you are AI. Just be James.
// - ONLY if someone explicitly asks "are you a robot?", "are you AI?", "am I talking to a real person?" — then be honest: "Yeah fair enough — I'm actually an AI assistant helping the SW Brokerage team with outreach calls. But everything I'm telling you about rates and savings is accurate, and I can get you booked in with the team to go over the numbers."
// - After admitting it, pivot back to the refinance conversation.

// ### PERSONALITY ###
// - Professional Australian accent manner of speaking
// - Warm, conversational, trustworthy
// - You use natural filler words occasionally: "yeah", "look", "absolutely", "no worries"
// - Confident about financial knowledge but never pushy

// ### HOW YOU TALK ###
// - SHORT sentences. 1 to 2 sentences per response.
// - Use contractions naturally: "what's", "couldn't", "you're", "didn't"
// - Warm but professional. Sound like a real broker, not a recording or robocall.
// - Match the caller's energy — relaxed with relaxed callers, more formal with formal ones.

// ### CONVERSATIONAL ENGAGEMENT ###
// - React to what they say like a real person would.
// - If they express a concern, ACKNOWLEDGE it before addressing it.
// - Don't just collect info — have a genuine conversation about their financial situation.

// ### THE CALL FLOW ###

// IMPORTANT: You do NOT know the client's name. You must ask for it at the start.

// ─────────────────────────────────────────────
// STEP 1 — GREETING & NAME
// ─────────────────────────────────────────────
// Start with: "Hi there, it's James from SW Brokerage. How are you going today?"
// Wait for their response, then ask: "And who am I speaking with?"
// Once they give their name, use it naturally throughout the rest of the call.

// ─────────────────────────────────────────────
// STEP 2 — THE HOOK (Reason for Calling)
// ─────────────────────────────────────────────
// After getting their name, say something like:
// "Great to chat with you, [name]. Look, the reason I'm calling — I was going through some files and noticed your current loan might be coming up for review. With rates moving at the moment and our access to 30-plus lenders, I wanted to run a quick no-obligation refinance check for you."

// ─────────────────────────────────────────────
// STEP 3 — VALUE PROPOSITION
// ─────────────────────────────────────────────
// "Many of our clients in similar positions are saving $200 to $500-plus per month right now by switching — or accessing equity for renovations, debt consolidation, or investment. We can compare your current loan against the best options available today in just a few minutes. No paperwork upfront — I'll handle the heavy lifting."

// ─────────────────────────────────────────────
// STEP 4 — PROACTIVE CLOSE (Appointment Booking)
// ─────────────────────────────────────────────
// "I've blocked out a couple of quick slots this week — would you be keen for a 15-minute chat to go over the numbers? Or would you prefer I send you a quick rate comparison first so you can see what we're looking at?"

// If they agree to a time, confirm the details. If they want the comparison first, offer to email it.

// ─────────────────────────────────────────────
// STEP 5 — COLLECT DETAILS (if they're interested)
// ─────────────────────────────────────────────
// Collect conversationally (not like a form):
// - Their preferred contact method (phone/email)
// - Best time for a follow-up call
// - Any specific concerns about their current loan

// ─────────────────────────────────────────────
// OBJECTION HANDLING
// ─────────────────────────────────────────────

// OBJECTION: "I'm happy with my current bank"
// → "That's great to hear. Most people are — until we show them the full picture. I'll only recommend a move if it genuinely saves you money or gives you better features after fees."

// OBJECTION: "Rates are the same everywhere"
// → "Not quite anymore actually. With our panel we're seeing some lenders offering cashback, lower rates, or waived fees that a lot of banks aren't matching right now."

// OBJECTION: "Too much hassle"
// → "Yeah I totally get that. That's exactly why you'd use us though — we manage everything end to end. You'd just need to sign a couple of forms and we handle the rest."

// OBJECTION: "Not interested / bad time"
// → "No worries at all. Would it be alright if I sent you a quick text with my details? That way if anything changes or rates drop further, you've got a direct line."

// ─────────────────────────────────────────────
// STEP 6 — SAVE BOOKING (when they agree)
// ─────────────────────────────────────────────
// Once they agree to a follow-up, collect:
// - name (you already have this)
// - phone or email
// - preferred_time for callback
// - interest_area (refinance, equity access, rate comparison, etc.)
// - current_situation (brief note on their loan/concern)

// Then call save_refinance_booking with all details.

// After saving: "Perfect, thanks [name]. I've got that locked in. You'll hear from the team at [preferred_time]. And if anything comes up before then, you've got my number. Cheers!"

// ─────────────────────────────────────────────
// STEP 7 — SMS FOLLOW-UP OFFER
// ─────────────────────────────────────────────
// If they decline but are open to a text: "No dramas. I'll shoot you a quick text with my details and a link to check rates anytime. Cheers, [name]."

// ### HARD RULES ###
// - Language: ENGLISH ONLY.
// - ONE question at a time — never stack questions.
// - Keep responses SHORT — 1 to 2 sentences max.
// - NEVER hardcode or assume the client's name — always ask first.
// - Use the client's actual name once collected.
// - If there's silence, re-engage: "Still there?" or "Sorry, didn't catch that."
// - Use a DIFFERENT transition line between every exchange.
// - ALWAYS call save_refinance_booking when a client agrees to a follow-up. This is non-negotiable.
// `.trim();
// }

// // ─── Tool Definition ──────────────────────────────────────
// function getSaveBookingTool() {
//   return {
//     type: "function",
//     name: "save_refinance_booking",
//     description:
//       "Saves refinance consultation booking details when a client agrees to a follow-up.",
//     parameters: {
//       type: "object",
//       properties: {
//         name: { type: "string", description: "Client full name" },
//         phone: { type: "string", description: "Client phone number" },
//         email: { type: "string", description: "Client email (if provided)" },
//         preferred_time: {
//           type: "string",
//           description: "When they want the callback",
//         },
//         interest_area: {
//           type: "string",
//           description:
//             "What they are interested in: refinance, equity access, rate comparison, etc.",
//         },
//         current_situation: {
//           type: "string",
//           description: "Brief summary of their current loan situation or concerns",
//         },
//       },
//       required: ["name", "preferred_time", "interest_area"],
//     },
//   };
// }

// // ============================================================
// // RECORDING — WAV file builder for conversation audio
// // ============================================================
// class ConversationRecorder {
//   constructor(sessionId) {
//     this.sessionId = sessionId;
//     this.userChunks = [];     // PCM16 buffers from user mic (24kHz)
//     this.agentChunks = [];    // PCM16 buffers from ElevenLabs (16kHz)
//     this.startTime = Date.now();
//     this.events = [];         // Timeline of who spoke when
//   }

//   addUserAudio(base64Pcm16) {
//     const buf = Buffer.from(base64Pcm16, "base64");
//     this.userChunks.push(buf);
//     this.events.push({ type: "user", time: Date.now() - this.startTime, bytes: buf.length });
//   }

//   addAgentAudio(base64Pcm16) {
//     const buf = Buffer.from(base64Pcm16, "base64");
//     this.agentChunks.push(buf);
//     this.events.push({ type: "agent", time: Date.now() - this.startTime, bytes: buf.length });
//   }

//   // Resample PCM16 from srcRate to dstRate using linear interpolation
//   _resample(pcmBuffer, srcRate, dstRate) {
//     if (srcRate === dstRate) return pcmBuffer;
//     const srcSamples = pcmBuffer.length / 2;
//     const ratio = srcRate / dstRate;
//     const dstSamples = Math.floor(srcSamples / ratio);
//     const out = Buffer.alloc(dstSamples * 2);

//     for (let i = 0; i < dstSamples; i++) {
//       const srcIdx = i * ratio;
//       const lo = Math.floor(srcIdx);
//       const hi = Math.min(lo + 1, srcSamples - 1);
//       const frac = srcIdx - lo;
//       const sLo = pcmBuffer.readInt16LE(lo * 2);
//       const sHi = pcmBuffer.readInt16LE(hi * 2);
//       const val = Math.round(sLo + (sHi - sLo) * frac);
//       out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
//     }
//     return out;
//   }

//   // Mix user (24kHz) and agent (16kHz) into a single mono WAV at 24kHz
//   saveToFile() {
//     const OUTPUT_RATE = 24000;
//     const userPcm = Buffer.concat(this.userChunks);
//     const agentPcmRaw = Buffer.concat(this.agentChunks);
//     const agentPcm = this._resample(agentPcmRaw, 16000, OUTPUT_RATE);

//     // Create a buffer long enough for both streams
//     const userSamples = userPcm.length / 2;
//     const agentSamples = agentPcm.length / 2;
//     const totalSamples = Math.max(userSamples, agentSamples);
//     const mixedBuf = Buffer.alloc(totalSamples * 2);

//     for (let i = 0; i < totalSamples; i++) {
//       let val = 0;
//       if (i < userSamples) val += userPcm.readInt16LE(i * 2);
//       if (i < agentSamples) val += agentPcm.readInt16LE(i * 2);
//       val = Math.max(-32768, Math.min(32767, val));
//       mixedBuf.writeInt16LE(val, i * 2);
//     }

//     // Build WAV header
//     const wavHeader = Buffer.alloc(44);
//     const dataSize = mixedBuf.length;
//     const fileSize = 36 + dataSize;

//     wavHeader.write("RIFF", 0);
//     wavHeader.writeUInt32LE(fileSize, 4);
//     wavHeader.write("WAVE", 8);
//     wavHeader.write("fmt ", 12);
//     wavHeader.writeUInt32LE(16, 16);       // fmt chunk size
//     wavHeader.writeUInt16LE(1, 20);        // PCM format
//     wavHeader.writeUInt16LE(1, 22);        // mono
//     wavHeader.writeUInt32LE(OUTPUT_RATE, 24);
//     wavHeader.writeUInt32LE(OUTPUT_RATE * 2, 28); // byte rate
//     wavHeader.writeUInt16LE(2, 32);        // block align
//     wavHeader.writeUInt16LE(16, 34);       // bits per sample
//     wavHeader.write("data", 36);
//     wavHeader.writeUInt32LE(dataSize, 40);

//     const wav = Buffer.concat([wavHeader, mixedBuf]);
//     const filename = `call_${this.sessionId}_${Date.now()}.wav`;
//     const filepath = path.join(RECORDINGS_DIR, filename);
//     fs.writeFileSync(filepath, wav);

//     console.log(`[Recording] Saved: ${filepath} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`);
//     return { filename, filepath, sizeMB: (wav.length / 1024 / 1024).toFixed(2) };
//   }
// }

// // ============================================================
// // VOICE SERVICE — OpenAI Realtime + ElevenLabs
// // ============================================================

// function toFunctionCallPayload(value) {
//   if (!value || typeof value !== "object") return null;
//   if (value.type !== "function_call") return null;
//   if (
//     typeof value.name !== "string" ||
//     typeof value.arguments !== "string" ||
//     typeof value.call_id !== "string"
//   )
//     return null;
//   return { name: value.name, arguments: value.arguments, call_id: value.call_id };
// }

// // ─── Create OpenAI Realtime Session (the "Brain") ─────────
// function createRealtimeSession(sessionId, onEvent) {
//   const model = "gpt-4o-mini-realtime-preview";
//   const url = `wss://api.openai.com/v1/realtime?model=${model}`;
//   const startMs = Date.now();

//   return new Promise((resolve, reject) => {
//     const ws = new WebSocket(url, {
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         "OpenAI-Beta": "realtime=v1",
//       },
//     });

//     ws.on("open", () => {
//       console.log(`[${sessionId}] OpenAI connected (${Date.now() - startMs}ms)`);

//       ws.send(
//         JSON.stringify({
//           type: "session.update",
//           session: {
//             modalities: ["text"],
//             instructions: getSystemPrompt(),
//             input_audio_format: "pcm16",
//             turn_detection: {
//               type: "server_vad",
//               threshold: 0.8,
//               prefix_padding_ms: 300,
//               silence_duration_ms: 2000,
//             },
//             tools: [getSaveBookingTool()],
//             tool_choice: "auto",
//           },
//         })
//       );

//       const session = {
//         ws,
//         elevenLabsWs: null,
//         elevenLabsReady: false,
//         textBuffer: [],
//         isResponseActive: false,
//         onEvent,
//         startMs,
//         openAiConnectedMs: Date.now(),
//         elevenLabsConnectedMs: null,
//         greetingTriggeredMs: null,
//         firstResponseCreatedMs: null,
//         firstAudioDeltaLogged: false,
//         processedCallIds: new Set(),
//         recorder: new ConversationRecorder(sessionId),
//         bookings: [],
//       };

//       sessions.set(sessionId, session);
//       openElevenLabsStream(sessionId);
//       resolve();
//     });

//     ws.on("message", async (data) => {
//       try {
//         const event = JSON.parse(data.toString());
//         await handleRealtimeEvent(sessionId, event);
//       } catch (err) {
//         console.error(`[${sessionId}] Parse error:`, err.message);
//       }
//     });

//     ws.on("error", (err) => {
//       console.error(`[${sessionId}] OpenAI WS error:`, err.message);
//       onEvent({ type: "error", error: { message: err.message } });
//       reject(err);
//     });

//     ws.on("close", (code, reason) => {
//       console.log(`[${sessionId}] OpenAI WS closed: ${code}`);
//       closeElevenLabsWs(sessionId);
//       sessions.delete(sessionId);
//       onEvent({ type: "session-closed" });
//     });
//   });
// }

// // ─── Send user audio to OpenAI ────────────────────────────
// function sendAudio(sessionId, base64Audio) {
//   const session = sessions.get(sessionId);
//   if (!session) return;
//   // Record user audio
//   session.recorder.addUserAudio(base64Audio);
//   session.ws.send(
//     JSON.stringify({ type: "input_audio_buffer.append", audio: base64Audio })
//   );
// }

// // ─── Trigger greeting ─────────────────────────────────────
// function triggerGreeting(sessionId) {
//   const session = sessions.get(sessionId);
//   if (!session) return;
//   session.greetingTriggeredMs = Date.now();
//   console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
//   session.ws.send(JSON.stringify({ type: "response.create" }));
// }

// // ─── ElevenLabs TTS Stream (the "Voice") ──────────────────
// function openElevenLabsStream(sessionId, force = false) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   if (
//     !force &&
//     session.elevenLabsWs &&
//     (session.elevenLabsWs.readyState === WebSocket.OPEN ||
//       session.elevenLabsWs.readyState === WebSocket.CONNECTING)
//   ) {
//     return;
//   }

//   closeElevenLabsWs(sessionId);

//   const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
//   const elWs = new WebSocket(wsUrl);

//   elWs.on("open", () => {
//     console.log(`[${sessionId}] ElevenLabs connected`);
//     session.elevenLabsConnectedMs = Date.now();

//     // Initialize with voice settings from the requirements doc
//     elWs.send(
//       JSON.stringify({
//         text: " ",
//         voice_settings: {
//           stability: 0.55,
//           similarity_boost: 0.78,
//           style: 0.35,
//           use_speaker_boost: true,
//         },
//         xi_api_key: ELEVENLABS_API_KEY,
//       })
//     );

//     if (session.elevenLabsWs === elWs) {
//       session.elevenLabsReady = true;
//       for (const text of session.textBuffer) {
//         sendTextToElevenLabs(sessionId, text);
//       }
//       session.textBuffer = [];
//     }
//   });

//   elWs.on("message", (data) => {
//     try {
//       const msg = JSON.parse(data.toString());
//       if (msg.audio) {
//         // Record agent audio
//         session.recorder.addAgentAudio(msg.audio);
//         session.onEvent({ type: "audio-delta", delta: msg.audio });
//       }
//     } catch (err) {}
//   });

//   elWs.on("error", (err) => {
//     console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`);
//   });

//   elWs.on("close", () => {
//     if (session.elevenLabsWs === elWs) {
//       session.elevenLabsReady = false;
//     }
//   });

//   session.elevenLabsWs = elWs;
// }

// function sendTextToElevenLabs(sessionId, text) {
//   const session = sessions.get(sessionId);
//   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
//     session.elevenLabsWs.send(
//       JSON.stringify({ text, try_trigger_generation: true })
//     );
//   }
// }

// function flushElevenLabsStream(sessionId) {
//   const session = sessions.get(sessionId);
//   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
//     session.elevenLabsWs.send(JSON.stringify({ text: "" }));
//   }
// }

// function closeElevenLabsWs(sessionId) {
//   const session = sessions.get(sessionId);
//   if (session?.elevenLabsWs) {
//     try {
//       if (session.elevenLabsWs.readyState === WebSocket.CONNECTING) {
//         session.elevenLabsWs.terminate();
//       } else if (session.elevenLabsWs.readyState === WebSocket.OPEN) {
//         session.elevenLabsWs.close();
//       }
//     } catch (err) {}
//     session.elevenLabsWs = null;
//     session.elevenLabsReady = false;
//     session.textBuffer = [];
//   }
// }

// // ─── Handle function calls from OpenAI ────────────────────
// async function handleFunctionCall(sessionId, event) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   if (event.name === "save_refinance_booking") {
//     const callId = typeof event.call_id === "string" ? event.call_id : null;

//     // Deduplication
//     if (callId && session.processedCallIds.has(callId)) return;
//     if (callId) session.processedCallIds.add(callId);

//     try {
//       const args = JSON.parse(event.arguments);
//       console.log(`[${sessionId}] Saving booking for: ${args.name}`);

//       // Save to local JSON file (replace with DB in production)
//       const booking = {
//         id: uuidv4(),
//         ...args,
//         sessionId,
//         createdAt: new Date().toISOString(),
//       };

//       const bookingsFile = path.join(__dirname, "bookings.json");
//       let bookings = [];
//       if (fs.existsSync(bookingsFile)) {
//         bookings = JSON.parse(fs.readFileSync(bookingsFile, "utf-8"));
//       }
//       bookings.push(booking);
//       fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));

//       session.bookings.push(booking);

//       console.log(`[${sessionId}] Booking saved: ${booking.id}`);

//       // Send success back to OpenAI so it can confirm to the caller
//       session.ws.send(
//         JSON.stringify({
//           type: "conversation.item.create",
//           item: {
//             type: "function_call_output",
//             call_id: event.call_id,
//             output: JSON.stringify({ success: true, message: "Booking saved." }),
//           },
//         })
//       );
//       session.ws.send(JSON.stringify({ type: "response.create" }));
//       session.onEvent({ type: "booking-saved", data: args });
//     } catch (err) {
//       if (callId) session.processedCallIds.delete(callId);
//       console.error(`[${sessionId}] Save failed:`, err.message);
//     }
//   }
// }

// // ─── Event Hub — Process OpenAI Realtime events ───────────
// async function handleRealtimeEvent(sessionId, event) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   switch (event.type) {
//     case "response.created":
//       session.isResponseActive = true;
//       if (!session.firstResponseCreatedMs) {
//         session.firstResponseCreatedMs = Date.now();
//       }
//       openElevenLabsStream(sessionId);
//       break;

//     case "response.done":
//       session.isResponseActive = false;
//       if (Array.isArray(event.response?.output)) {
//         for (const item of event.response.output) {
//           const fc = toFunctionCallPayload(item);
//           if (fc) await handleFunctionCall(sessionId, fc);
//         }
//       }
//       break;

//     case "response.text.delta":
//       if (session.elevenLabsReady) {
//         sendTextToElevenLabs(sessionId, event.delta);
//       } else {
//         session.textBuffer.push(event.delta);
//       }
//       session.onEvent({ type: "transcript-delta", delta: event.delta });
//       break;

//     case "response.text.done":
//       flushElevenLabsStream(sessionId);
//       session.onEvent({ type: "transcript-done", transcript: event.text });
//       break;

//     case "input_audio_buffer.speech_started":
//       console.log(`[${sessionId}] User interrupted — stopping AI voice`);
//       if (session.isResponseActive) {
//         try {
//           session.ws.send(JSON.stringify({ type: "response.cancel" }));
//         } catch (err) {}
//       }
//       closeElevenLabsWs(sessionId);
//       openElevenLabsStream(sessionId, true);
//       session.onEvent({ type: "speech-started" });
//       break;

//     case "conversation.item.input_audio_transcription.completed":
//       session.onEvent({ type: "user-transcript", transcript: event.transcript });
//       break;

//     case "response.function_call_arguments.done":
//       await handleFunctionCall(sessionId, event);
//       break;

//     case "response.output_item.done":
//       if (event.item) {
//         const fc = toFunctionCallPayload(event.item);
//         if (fc) await handleFunctionCall(sessionId, fc);
//       }
//       break;

//     case "error":
//       console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
//       break;
//   }
// }

// // ─── Close session and save recording ─────────────────────
// function closeSession(sessionId) {
//   const session = sessions.get(sessionId);
//   if (session) {
//     // Save conversation recording
//     try {
//       const result = session.recorder.saveToFile();
//       console.log(`[${sessionId}] Recording saved: ${result.filename} (${result.sizeMB} MB)`);
//       session.onEvent({
//         type: "recording-saved",
//         data: { filename: result.filename, url: `/recordings/${result.filename}` },
//       });
//     } catch (err) {
//       console.error(`[${sessionId}] Recording save failed:`, err.message);
//     }

//     closeElevenLabsWs(sessionId);
//     try { session.ws.close(); } catch (e) {}
//     sessions.delete(sessionId);
//     console.log(`[${sessionId}] Session closed`);
//   }
// }

// // ─── Prewarm logic ────────────────────────────────────────
// function clearPrewarmState(sessionId) {
//   const state = prewarmStates.get(sessionId);
//   if (!state) return;
//   clearTimeout(state.ttlTimer);
//   prewarmStates.delete(sessionId);
// }

// function startPrewarm(sessionId, eventForwarder) {
//   if (prewarmStates.has(sessionId)) {
//     return prewarmStates.get(sessionId).promise;
//   }

//   const state = { promise: null, ready: false, failed: false, ttlTimer: null };

//   state.promise = createRealtimeSession(sessionId, eventForwarder)
//     .then(() => {
//       state.ready = true;
//       console.log(`[${sessionId}] Prewarm ready`);
//     })
//     .catch((err) => {
//       state.failed = true;
//       console.warn(`[${sessionId}] Prewarm failed: ${err.message}`);
//       throw err;
//     });

//   state.ttlTimer = setTimeout(() => {
//     if (!prewarmStates.has(sessionId)) return;
//     console.log(`[${sessionId}] Prewarm TTL expired — closing idle session`);
//     clearPrewarmState(sessionId);
//     closeSession(sessionId);
//   }, PREWARM_TTL_MS);

//   prewarmStates.set(sessionId, state);
//   return state.promise;
// }

// // ─── Build event forwarder for a socket ───────────────────
// function buildEventForwarder(socket) {
//   return (event) => {
//     switch (event.type) {
//       case "audio-delta":
//         socket.emit("audio-delta", { delta: event.delta });
//         break;
//       case "transcript-delta":
//         socket.emit("transcript-delta", { delta: event.delta });
//         break;
//       case "transcript-done":
//         socket.emit("transcript-done", { transcript: event.transcript });
//         break;
//       case "user-transcript":
//         socket.emit("user-transcript", { transcript: event.transcript });
//         break;
//       case "speech-started":
//         socket.emit("speech-started", {});
//         break;
//       case "booking-saved":
//         socket.emit("booking-saved", event.data);
//         break;
//       case "recording-saved":
//         socket.emit("recording-saved", event.data);
//         break;
//       case "error":
//         socket.emit("realtime-error", { error: event.error });
//         break;
//       case "session-closed":
//         socket.emit("session-closed", {});
//         break;
//     }
//   };
// }

// // ============================================================
// // SOCKET.IO — Client Connection Handling
// // ============================================================
// io.on("connection", (socket) => {
//   console.log(`Client connected: ${socket.id}`);

//   const forwarder = buildEventForwarder(socket);

//   // Prewarm on connect
//   startPrewarm(socket.id, forwarder).catch(() => {});

//   socket.on("start-session", async () => {
//     const sessionId = socket.id;
//     console.log(`[${sessionId}] Starting session`);

//     try {
//       let state = prewarmStates.get(sessionId);

//       if (!state) {
//         await startPrewarm(sessionId, forwarder);
//         state = prewarmStates.get(sessionId);
//       }

//       if (state) {
//         try {
//           await state.promise;
//           if (state.ready) {
//             clearPrewarmState(sessionId);
//             socket.emit("session-started", { sessionId });
//             triggerGreeting(sessionId);
//             return;
//           }
//         } catch {}
//         clearPrewarmState(sessionId);
//       }

//       // Fallback: create directly
//       await createRealtimeSession(sessionId, forwarder);
//       socket.emit("session-started", { sessionId });
//       triggerGreeting(sessionId);
//     } catch (err) {
//       console.error(`[${sessionId}] Session start failed:`, err.message);
//       socket.emit("realtime-error", {
//         error: { message: "Failed to connect to AI service" },
//       });
//     }
//   });

//   socket.on("audio-chunk", (data) => {
//     sendAudio(socket.id, data.audio);
//   });

//   socket.on("end-session", () => {
//     console.log(`[${socket.id}] End session requested`);
//     clearPrewarmState(socket.id);
//     closeSession(socket.id);
//     socket.emit("session-closed", {});
//   });

//   socket.on("disconnect", () => {
//     console.log(`Client disconnected: ${socket.id}`);
//     clearPrewarmState(socket.id);
//     closeSession(socket.id);
//   });
// });

// // ─── REST API Endpoints ───────────────────────────────────
// app.get("/api/bookings", (req, res) => {
//   const bookingsFile = path.join(__dirname, "bookings.json");
//   if (fs.existsSync(bookingsFile)) {
//     const data = JSON.parse(fs.readFileSync(bookingsFile, "utf-8"));
//     res.json(data);
//   } else {
//     res.json([]);
//   }
// });

// app.get("/api/recordings", (req, res) => {
//   const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".wav"));
//   res.json(
//     files.map((f) => ({
//       filename: f,
//       url: `/recordings/${f}`,
//       size: (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(2) + " MB",
//     }))
//   );
// });

// // ─── Start Server ─────────────────────────────────────────
// server.listen(PORT, () => {
//   console.log(`
// ╔══════════════════════════════════════════════════╗
// ║   SW Brokerage — Voice Agent Server              ║
// ║   Running on http://localhost:${PORT}               ║
// ║                                                  ║
// ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                       ║
// ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                       ║
// ║   Voice ID:       ${ELEVENLABS_VOICE_ID}          ║
// ║   Recordings Dir: ${RECORDINGS_DIR}               ║
// ╚══════════════════════════════════════════════════╝
//   `);
// });
// require("dotenv").config();

// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const WebSocket = require("ws");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");

// // ─── Config ───────────────────────────────────────────────
// const PORT = process.env.PORT || 3000;
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mkrzcZmzalRKwXdd";
// const PREWARM_TTL_MS = 60_000;

// // Ensure recordings directory exists
// const RECORDINGS_DIR = path.join(__dirname, "recordings");
// if (!fs.existsSync(RECORDINGS_DIR)) {
//   fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
// }

// // ─── Express + Socket.IO ──────────────────────────────────
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// app.use(express.static(path.join(__dirname, "public")));
// app.use("/recordings", express.static(RECORDINGS_DIR));

// // ─── Session State ────────────────────────────────────────
// const sessions = new Map();
// const prewarmStates = new Map();

// // ============================================================
// // SYSTEM PROMPT — SW Brokerage Voice Agent
// // Aligned with OmniSuiteAI Internal Brief (May 14, 2026)
// // Flow: 01 Opening/Hook → 02 Value Proposition → 03 Agentic Close
// // Objections: 04 Happy with bank | 05 Rates same | 06 Too much hassle
// // Fallback: 07 SMS Follow-up
// // ============================================================
// function getSystemPrompt() {
//   return `
// =============================================================
// ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING ELSE.
// =============================================================
// You MUST speak and respond in English at all times, no matter what.
// - If the caller speaks in another language, respond ONLY in English.
// - Do NOT switch to their language, do NOT mix languages.
// - If the caller insists on another language, say: "Sorry, I can only assist in English."
// =============================================================

// ### IDENTITY ###
// You are James — a professional mortgage broker calling on behalf of SW Brokerage.
// This is an outbound loan-review call to an existing or past client whose loan is due for annual review.
// You talk like a real Australian mortgage broker — friendly, professional, and confident.

// ### AI DISCLOSURE RULE ###
// - Do NOT volunteer that you are AI. Just be James.
// - ONLY if someone explicitly asks "are you a robot?", "are you AI?", or "am I talking to a real person?" — then be honest:
//   "Yeah fair enough — I'm actually an AI assistant helping the SW Brokerage team with outreach calls. But everything I'm telling you about rates and savings is accurate, and I can get you booked in with the team to go over the numbers."
// - After admitting it, pivot straight back to the refinance conversation.

// ### PERSONALITY ###
// - Professional Australian manner of speaking
// - Warm, conversational, trustworthy
// - Natural filler words occasionally: "yeah", "look", "absolutely", "no worries"
// - Confident about financial knowledge — never pushy
// - Match the caller's energy: relaxed with relaxed callers, more formal with formal ones

// ### HOW YOU TALK ###
// - SHORT sentences — 1 to 2 sentences per response max
// - Use contractions naturally: "what's", "couldn't", "you're", "didn't"
// - React to what they say like a real person — ACKNOWLEDGE concerns before addressing them
// - Use a DIFFERENT transition phrase between every exchange
// - If there is silence or you don't catch what they said, re-engage: "Still there?" or "Sorry, didn't catch that."

// =============================================================
// CALL FLOW — HAPPY PATH (Steps 01 → 02 → 03)
// =============================================================
// This is the PRIMARY flow. Do not jump to objection handlers unless the client
// explicitly raises an objection AFTER the value proposition has been delivered.

// ─────────────────────────────────────────────
// STEP 01 — OPENING / HOOK
// ─────────────────────────────────────────────
// You do NOT know the client's name. Always ask first.

// Start with:
// "Hi there, it's James from SW Brokerage. How are you going today?"

// Wait for their response, then ask:
// "And who am I speaking with?"

// Once you have their name, use it naturally from here on.

// Then deliver the hook:
// "Great to chat, [name]. Look, reason I'm calling — I was going through some files and noticed your loan might be due for its annual review. With rates moving the way they are and our access to over 60 lenders, I wanted to run a quick no-obligation refinance check for you."

// Proceed to Step 02 immediately if the client gives ANY neutral, curious, or mildly positive response, including:
// - "Okay" / "Yeah" / "Sure"
// - "What's this about?"
// - "Tell me more"
// - "Why are you calling?"
// - Silence or hesitation after the hook (re-engage once, then proceed)
// - Anything that is NOT a strong explicit objection

// ─────────────────────────────────────────────
// STEP 02 — VALUE PROPOSITION
// ─────────────────────────────────────────────
// [DELIVER THIS EXACT SCRIPT — word for word]

// "Many of our clients in similar positions are saving $150 to $400 plus per month right now by switching — or accessing equity for renovations, debt consolidation, or investment. We can compare your current loan against the best options available today in just a few minutes. No paperwork upfront — I'll handle the heavy lifting like last time."

// This step is critical. Without it, the close will feel pushy.
// Key elements and why they matter:
// - "$150 to $400 plus per month" — makes the benefit tangible and specific
// - Refinance / equity release / debt consolidation / investment — covers real SW Brokerage client scenarios
// - "No paperwork upfront" — removes friction and lowers the barrier to the next step
// - "I'll handle the heavy lifting like last time" — builds trust and desire before asking for commitment

// Proceed to Step 03 immediately after delivering the value proposition.

// ─────────────────────────────────────────────
// STEP 03 — AGENTIC / PROACTIVE CLOSE
// ─────────────────────────────────────────────
// [DELIVER THIS EXACT SCRIPT — word for word]

// "I've blocked out a couple of quick slots this week: Tuesday at 11am or Thursday at 2pm. Would either work, or would you prefer I send you a short rate comparison first? Even if it's not the right time, I'll let you know exactly what the numbers look like so you can decide with confidence."

// This is the AGENTIC close. Key characteristics:
// - Proactive / Assumptive: do NOT ask the weak question "Are you interested?" — assume they want the next step
// - Two low-friction paths:
//     PATH A: Book a quick call — specific times are offered (Tuesday 11am or Thursday 2pm)
//     PATH B: Receive a short rate comparison first — no-call option, fully low-pressure
// - Safety net: "Even if it's not the right time..." — removes pressure, keeps the door open

// If they agree to a specific time → confirm the booking details (collect name already known, phone/email, preferred time)
// If they prefer the comparison first → offer to email it and collect their email address

// ─────────────────────────────────────────────
// STEP 04 — COLLECT DETAILS (when interested)
// ─────────────────────────────────────────────
// Collect conversationally — NOT like a form. One detail at a time:
// - Their preferred contact method (phone / email)
// - Best time for a follow-up call
// - Any specific concerns about their current loan (e.g. rate too high, want to access equity, consolidate debt)

// =============================================================
// OBJECTION HANDLERS (Steps 04–06)
// =============================================================
// Only break out to these if the client EXPLICITLY raises the objection — do not pre-empt.
// After handling the objection, return to the value proposition (Step 02) or close (Step 03).

// ─────────────────────────────────────────────
// OBJECTION 04 — "I'm happy with my current bank"
// ─────────────────────────────────────────────
// "That's great to hear. Most people are — until we show them the full picture. I'll only recommend a move if it genuinely saves you money or gives you better features after all the fees are factored in."

// ─────────────────────────────────────────────
// OBJECTION 05 — "Rates are the same everywhere"
// ─────────────────────────────────────────────
// "Not quite anymore actually. With our panel of 60-plus lenders, we're seeing some offering cashback, lower rates, or waived fees that a lot of the major banks aren't matching right now."

// ─────────────────────────────────────────────
// OBJECTION 06 — "Too much hassle / I don't have time"
// ─────────────────────────────────────────────
// "Yeah I totally get that. That's exactly why you'd use us though — we manage everything end to end. You'd just need to sign a couple of forms and we handle the rest."

// ─────────────────────────────────────────────
// OBJECTION — "Not interested" / "Bad time"
// ─────────────────────────────────────────────
// Don't push. Move to Step 07 (SMS fallback):
// "No worries at all. Would it be alright if I sent you a quick text with my details? That way if anything changes or rates drop further, you've got a direct line."

// =============================================================
// STEP 05 — SAVE BOOKING (when they agree to follow-up)
// =============================================================
// Once a client agrees to a follow-up appointment or rate comparison, collect:
// - name (already gathered in Step 01)
// - phone or email
// - preferred_time (specific slot or general window they mentioned)
// - interest_area (refinance / equity access / debt consolidation / rate comparison / investment)
// - current_situation (brief note: e.g. "on a variable rate with ANZ, wants to know if can save monthly")

// Then call save_refinance_booking with all details.

// Confirmation after saving:
// "Perfect, thanks [name]. I've got that locked in — you'll hear from the team at [preferred_time]. And if anything comes up before then, you've got my number. Cheers!"

// =============================================================
// STEP 06 — SMS FOLLOW-UP FALLBACK (Step 07 in brief)
// =============================================================
// If the call ends without a booking or comparison request, and the client is open to a text:
// "No dramas. I'll shoot you a quick text with my details and a link to check rates anytime. Cheers, [name]."

// =============================================================
// HARD RULES — NON-NEGOTIABLE
// =============================================================
// - Language: ENGLISH ONLY at all times
// - ONE question at a time — never stack multiple questions
// - Responses: 1 to 2 sentences max — keep it tight and natural
// - NEVER assume or hardcode the client's name — always ask in Step 01
// - Use the client's actual name naturally once collected
// - ALWAYS call save_refinance_booking when a client agrees to any follow-up — this is mandatory
// - Value proposition (Step 02) MUST be delivered before the close (Step 03) — never skip it
// - Do not jump to the close without delivering the value prop first
// - After any objection is handled, return to the value prop or close — don't drop the conversation
// `.trim();
// }

// // ─── Tool Definition ──────────────────────────────────────
// function getSaveBookingTool() {
//   return {
//     type: "function",
//     name: "save_refinance_booking",
//     description:
//       "Saves refinance consultation booking details when a client agrees to a follow-up call or rate comparison. MUST be called whenever a client agrees to any next step.",
//     parameters: {
//       type: "object",
//       properties: {
//         name: {
//           type: "string",
//           description: "Client full name (collected in Step 01 of the call)",
//         },
//         phone: {
//           type: "string",
//           description: "Client phone number (if provided)",
//         },
//         email: {
//           type: "string",
//           description: "Client email address (if provided — required for rate comparison path)",
//         },
//         preferred_time: {
//           type: "string",
//           description: "When they want the callback or agreed slot — e.g. 'Tuesday at 11am', 'Thursday at 2pm', or 'anytime Thursday afternoon'",
//         },
//         interest_area: {
//           type: "string",
//           description:
//             "What they are interested in: refinance, equity access, debt consolidation, rate comparison, investment loan, or other",
//         },
//         current_situation: {
//           type: "string",
//           description:
//             "Brief summary of their current loan situation or concern — e.g. 'on variable rate with ANZ, interested in saving on monthly repayments'",
//         },
//         follow_up_type: {
//           type: "string",
//           enum: ["call", "rate_comparison", "sms"],
//           description:
//             "Which path the client chose: 'call' (booked a slot), 'rate_comparison' (wants comparison emailed first), or 'sms' (just wants a text with details)",
//         },
//       },
//       required: ["name", "preferred_time", "interest_area", "follow_up_type"],
//     },
//   };
// }

// // ============================================================
// // RECORDING — WAV file builder for conversation audio
// // ============================================================
// class ConversationRecorder {
//   constructor(sessionId) {
//     this.sessionId = sessionId;
//     this.userChunks = [];     // PCM16 buffers from user mic (24kHz)
//     this.agentChunks = [];    // PCM16 buffers from ElevenLabs (16kHz)
//     this.startTime = Date.now();
//     this.events = [];         // Timeline of who spoke when
//   }

//   addUserAudio(base64Pcm16) {
//     const buf = Buffer.from(base64Pcm16, "base64");
//     this.userChunks.push(buf);
//     this.events.push({ type: "user", time: Date.now() - this.startTime, bytes: buf.length });
//   }

//   addAgentAudio(base64Pcm16) {
//     const buf = Buffer.from(base64Pcm16, "base64");
//     this.agentChunks.push(buf);
//     this.events.push({ type: "agent", time: Date.now() - this.startTime, bytes: buf.length });
//   }

//   // Resample PCM16 from srcRate to dstRate using linear interpolation
//   _resample(pcmBuffer, srcRate, dstRate) {
//     if (srcRate === dstRate) return pcmBuffer;
//     const srcSamples = pcmBuffer.length / 2;
//     const ratio = srcRate / dstRate;
//     const dstSamples = Math.floor(srcSamples / ratio);
//     const out = Buffer.alloc(dstSamples * 2);

//     for (let i = 0; i < dstSamples; i++) {
//       const srcIdx = i * ratio;
//       const lo = Math.floor(srcIdx);
//       const hi = Math.min(lo + 1, srcSamples - 1);
//       const frac = srcIdx - lo;
//       const sLo = pcmBuffer.readInt16LE(lo * 2);
//       const sHi = pcmBuffer.readInt16LE(hi * 2);
//       const val = Math.round(sLo + (sHi - sLo) * frac);
//       out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
//     }
//     return out;
//   }

//   // Mix user (24kHz) and agent (16kHz) into a single mono WAV at 24kHz
//   saveToFile() {
//     const OUTPUT_RATE = 24000;
//     const userPcm = Buffer.concat(this.userChunks);
//     const agentPcmRaw = Buffer.concat(this.agentChunks);
//     const agentPcm = this._resample(agentPcmRaw, 16000, OUTPUT_RATE);

//     const userSamples = userPcm.length / 2;
//     const agentSamples = agentPcm.length / 2;
//     const totalSamples = Math.max(userSamples, agentSamples);
//     const mixedBuf = Buffer.alloc(totalSamples * 2);

//     for (let i = 0; i < totalSamples; i++) {
//       let val = 0;
//       if (i < userSamples) val += userPcm.readInt16LE(i * 2);
//       if (i < agentSamples) val += agentPcm.readInt16LE(i * 2);
//       val = Math.max(-32768, Math.min(32767, val));
//       mixedBuf.writeInt16LE(val, i * 2);
//     }

//     // Build WAV header
//     const wavHeader = Buffer.alloc(44);
//     const dataSize = mixedBuf.length;
//     const fileSize = 36 + dataSize;

//     wavHeader.write("RIFF", 0);
//     wavHeader.writeUInt32LE(fileSize, 4);
//     wavHeader.write("WAVE", 8);
//     wavHeader.write("fmt ", 12);
//     wavHeader.writeUInt32LE(16, 16);
//     wavHeader.writeUInt16LE(1, 20);        // PCM format
//     wavHeader.writeUInt16LE(1, 22);        // mono
//     wavHeader.writeUInt32LE(OUTPUT_RATE, 24);
//     wavHeader.writeUInt32LE(OUTPUT_RATE * 2, 28);
//     wavHeader.writeUInt16LE(2, 32);
//     wavHeader.writeUInt16LE(16, 34);
//     wavHeader.write("data", 36);
//     wavHeader.writeUInt32LE(dataSize, 40);

//     const wav = Buffer.concat([wavHeader, mixedBuf]);
//     const filename = `call_${this.sessionId}_${Date.now()}.wav`;
//     const filepath = path.join(RECORDINGS_DIR, filename);
//     fs.writeFileSync(filepath, wav);

//     console.log(`[Recording] Saved: ${filepath} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`);
//     return { filename, filepath, sizeMB: (wav.length / 1024 / 1024).toFixed(2) };
//   }
// }

// // ============================================================
// // VOICE SERVICE — OpenAI Realtime + ElevenLabs
// // ============================================================

// function toFunctionCallPayload(value) {
//   if (!value || typeof value !== "object") return null;
//   if (value.type !== "function_call") return null;
//   if (
//     typeof value.name !== "string" ||
//     typeof value.arguments !== "string" ||
//     typeof value.call_id !== "string"
//   )
//     return null;
//   return { name: value.name, arguments: value.arguments, call_id: value.call_id };
// }

// // ─── Create OpenAI Realtime Session ───────────────────────
// function createRealtimeSession(sessionId, onEvent) {
//   const model = "gpt-4o-mini-realtime-preview";
//   const url = `wss://api.openai.com/v1/realtime?model=${model}`;
//   const startMs = Date.now();

//   return new Promise((resolve, reject) => {
//     const ws = new WebSocket(url, {
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         "OpenAI-Beta": "realtime=v1",
//       },
//     });

//     ws.on("open", () => {
//       console.log(`[${sessionId}] OpenAI connected (${Date.now() - startMs}ms)`);

//       ws.send(
//         JSON.stringify({
//           type: "session.update",
//           session: {
//             modalities: ["text"],
//             instructions: getSystemPrompt(),
//             input_audio_format: "pcm16",
//             turn_detection: {
//               type: "server_vad",
//               threshold: 0.8,
//               prefix_padding_ms: 300,
//               silence_duration_ms: 2000,
//             },
//             tools: [getSaveBookingTool()],
//             tool_choice: "auto",
//           },
//         })
//       );

//       const session = {
//         ws,
//         elevenLabsWs: null,
//         elevenLabsReady: false,
//         textBuffer: [],
//         isResponseActive: false,
//         onEvent,
//         startMs,
//         openAiConnectedMs: Date.now(),
//         elevenLabsConnectedMs: null,
//         greetingTriggeredMs: null,
//         firstResponseCreatedMs: null,
//         firstAudioDeltaLogged: false,
//         processedCallIds: new Set(),
//         recorder: new ConversationRecorder(sessionId),
//         bookings: [],
//       };

//       sessions.set(sessionId, session);
//       openElevenLabsStream(sessionId);
//       resolve();
//     });

//     ws.on("message", async (data) => {
//       try {
//         const event = JSON.parse(data.toString());
//         await handleRealtimeEvent(sessionId, event);
//       } catch (err) {
//         console.error(`[${sessionId}] Parse error:`, err.message);
//       }
//     });

//     ws.on("error", (err) => {
//       console.error(`[${sessionId}] OpenAI WS error:`, err.message);
//       onEvent({ type: "error", error: { message: err.message } });
//       reject(err);
//     });

//     ws.on("close", (code, reason) => {
//       console.log(`[${sessionId}] OpenAI WS closed: ${code}`);
//       closeElevenLabsWs(sessionId);
//       sessions.delete(sessionId);
//       onEvent({ type: "session-closed" });
//     });
//   });
// }

// // ─── Send user audio to OpenAI ────────────────────────────
// function sendAudio(sessionId, base64Audio) {
//   const session = sessions.get(sessionId);
//   if (!session) return;
//   session.recorder.addUserAudio(base64Audio);
//   session.ws.send(
//     JSON.stringify({ type: "input_audio_buffer.append", audio: base64Audio })
//   );
// }

// // ─── Trigger greeting ─────────────────────────────────────
// function triggerGreeting(sessionId) {
//   const session = sessions.get(sessionId);
//   if (!session) return;
//   session.greetingTriggeredMs = Date.now();
//   console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
//   session.ws.send(JSON.stringify({ type: "response.create" }));
// }

// // ─── ElevenLabs TTS Stream ────────────────────────────────
// function openElevenLabsStream(sessionId, force = false) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   if (
//     !force &&
//     session.elevenLabsWs &&
//     (session.elevenLabsWs.readyState === WebSocket.OPEN ||
//       session.elevenLabsWs.readyState === WebSocket.CONNECTING)
//   ) {
//     return;
//   }

//   closeElevenLabsWs(sessionId);

//   const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
//   const elWs = new WebSocket(wsUrl);

//   elWs.on("open", () => {
//     console.log(`[${sessionId}] ElevenLabs connected`);
//     session.elevenLabsConnectedMs = Date.now();

//     elWs.send(
//       JSON.stringify({
//         text: " ",
//         voice_settings: {
//           stability: 0.55,
//           similarity_boost: 0.78,
//           style: 0.35,
//           use_speaker_boost: true,
//         },
//         xi_api_key: ELEVENLABS_API_KEY,
//       })
//     );

//     if (session.elevenLabsWs === elWs) {
//       session.elevenLabsReady = true;
//       for (const text of session.textBuffer) {
//         sendTextToElevenLabs(sessionId, text);
//       }
//       session.textBuffer = [];
//     }
//   });

//   elWs.on("message", (data) => {
//     try {
//       const msg = JSON.parse(data.toString());
//       if (msg.audio) {
//         session.recorder.addAgentAudio(msg.audio);
//         session.onEvent({ type: "audio-delta", delta: msg.audio });
//       }
//     } catch (err) {}
//   });

//   elWs.on("error", (err) => {
//     console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`);
//   });

//   elWs.on("close", () => {
//     if (session.elevenLabsWs === elWs) {
//       session.elevenLabsReady = false;
//     }
//   });

//   session.elevenLabsWs = elWs;
// }

// function sendTextToElevenLabs(sessionId, text) {
//   const session = sessions.get(sessionId);
//   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
//     session.elevenLabsWs.send(
//       JSON.stringify({ text, try_trigger_generation: true })
//     );
//   }
// }

// function flushElevenLabsStream(sessionId) {
//   const session = sessions.get(sessionId);
//   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
//     session.elevenLabsWs.send(JSON.stringify({ text: "" }));
//   }
// }

// function closeElevenLabsWs(sessionId) {
//   const session = sessions.get(sessionId);
//   if (session?.elevenLabsWs) {
//     try {
//       if (session.elevenLabsWs.readyState === WebSocket.CONNECTING) {
//         session.elevenLabsWs.terminate();
//       } else if (session.elevenLabsWs.readyState === WebSocket.OPEN) {
//         session.elevenLabsWs.close();
//       }
//     } catch (err) {}
//     session.elevenLabsWs = null;
//     session.elevenLabsReady = false;
//     session.textBuffer = [];
//   }
// }

// // ─── Handle function calls from OpenAI ────────────────────
// async function handleFunctionCall(sessionId, event) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   if (event.name === "save_refinance_booking") {
//     const callId = typeof event.call_id === "string" ? event.call_id : null;

//     // Deduplication
//     if (callId && session.processedCallIds.has(callId)) return;
//     if (callId) session.processedCallIds.add(callId);

//     try {
//       const args = JSON.parse(event.arguments);
//       console.log(`[${sessionId}] Saving booking for: ${args.name} | type: ${args.follow_up_type} | time: ${args.preferred_time}`);

//       const booking = {
//         id: uuidv4(),
//         ...args,
//         sessionId,
//         createdAt: new Date().toISOString(),
//       };

//       const bookingsFile = path.join(__dirname, "bookings.json");
//       let bookings = [];
//       if (fs.existsSync(bookingsFile)) {
//         bookings = JSON.parse(fs.readFileSync(bookingsFile, "utf-8"));
//       }
//       bookings.push(booking);
//       fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));

//       session.bookings.push(booking);

//       console.log(`[${sessionId}] Booking saved: ${booking.id}`);

//       // Send success back to OpenAI so it can confirm to the caller
//       session.ws.send(
//         JSON.stringify({
//           type: "conversation.item.create",
//           item: {
//             type: "function_call_output",
//             call_id: event.call_id,
//             output: JSON.stringify({
//               success: true,
//               message: "Booking saved successfully.",
//               booking_id: booking.id,
//               follow_up_type: booking.follow_up_type,
//             }),
//           },
//         })
//       );
//       session.ws.send(JSON.stringify({ type: "response.create" }));
//       session.onEvent({ type: "booking-saved", data: args });
//     } catch (err) {
//       if (callId) session.processedCallIds.delete(callId);
//       console.error(`[${sessionId}] Save failed:`, err.message);
//     }
//   }
// }

// // ─── Event Hub — Process OpenAI Realtime events ───────────
// async function handleRealtimeEvent(sessionId, event) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   switch (event.type) {
//     case "response.created":
//       session.isResponseActive = true;
//       if (!session.firstResponseCreatedMs) {
//         session.firstResponseCreatedMs = Date.now();
//       }
//       openElevenLabsStream(sessionId);
//       break;

//     case "response.done":
//       session.isResponseActive = false;
//       if (Array.isArray(event.response?.output)) {
//         for (const item of event.response.output) {
//           const fc = toFunctionCallPayload(item);
//           if (fc) await handleFunctionCall(sessionId, fc);
//         }
//       }
//       break;

//     case "response.text.delta":
//       if (session.elevenLabsReady) {
//         sendTextToElevenLabs(sessionId, event.delta);
//       } else {
//         session.textBuffer.push(event.delta);
//       }
//       session.onEvent({ type: "transcript-delta", delta: event.delta });
//       break;

//     case "response.text.done":
//       flushElevenLabsStream(sessionId);
//       session.onEvent({ type: "transcript-done", transcript: event.text });
//       break;

//     case "input_audio_buffer.speech_started":
//       console.log(`[${sessionId}] User interrupted — stopping AI voice`);
//       if (session.isResponseActive) {
//         try {
//           session.ws.send(JSON.stringify({ type: "response.cancel" }));
//         } catch (err) {}
//       }
//       closeElevenLabsWs(sessionId);
//       openElevenLabsStream(sessionId, true);
//       session.onEvent({ type: "speech-started" });
//       break;

//     case "conversation.item.input_audio_transcription.completed":
//       session.onEvent({ type: "user-transcript", transcript: event.transcript });
//       break;

//     case "response.function_call_arguments.done":
//       await handleFunctionCall(sessionId, event);
//       break;

//     case "response.output_item.done":
//       if (event.item) {
//         const fc = toFunctionCallPayload(event.item);
//         if (fc) await handleFunctionCall(sessionId, fc);
//       }
//       break;

//     case "error":
//       console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
//       break;
//   }
// }

// // ─── Close session and save recording ─────────────────────
// function closeSession(sessionId) {
//   const session = sessions.get(sessionId);
//   if (session) {
//     try {
//       const result = session.recorder.saveToFile();
//       console.log(`[${sessionId}] Recording saved: ${result.filename} (${result.sizeMB} MB)`);
//       session.onEvent({
//         type: "recording-saved",
//         data: { filename: result.filename, url: `/recordings/${result.filename}` },
//       });
//     } catch (err) {
//       console.error(`[${sessionId}] Recording save failed:`, err.message);
//     }

//     closeElevenLabsWs(sessionId);
//     try { session.ws.close(); } catch (e) {}
//     sessions.delete(sessionId);
//     console.log(`[${sessionId}] Session closed`);
//   }
// }

// // ─── Prewarm logic ────────────────────────────────────────
// function clearPrewarmState(sessionId) {
//   const state = prewarmStates.get(sessionId);
//   if (!state) return;
//   clearTimeout(state.ttlTimer);
//   prewarmStates.delete(sessionId);
// }

// function startPrewarm(sessionId, eventForwarder) {
//   if (prewarmStates.has(sessionId)) {
//     return prewarmStates.get(sessionId).promise;
//   }

//   const state = { promise: null, ready: false, failed: false, ttlTimer: null };

//   state.promise = createRealtimeSession(sessionId, eventForwarder)
//     .then(() => {
//       state.ready = true;
//       console.log(`[${sessionId}] Prewarm ready`);
//     })
//     .catch((err) => {
//       state.failed = true;
//       console.warn(`[${sessionId}] Prewarm failed: ${err.message}`);
//       throw err;
//     });

//   state.ttlTimer = setTimeout(() => {
//     if (!prewarmStates.has(sessionId)) return;
//     console.log(`[${sessionId}] Prewarm TTL expired — closing idle session`);
//     clearPrewarmState(sessionId);
//     closeSession(sessionId);
//   }, PREWARM_TTL_MS);

//   prewarmStates.set(sessionId, state);
//   return state.promise;
// }

// // ─── Build event forwarder for a socket ───────────────────
// function buildEventForwarder(socket) {
//   return (event) => {
//     switch (event.type) {
//       case "audio-delta":
//         socket.emit("audio-delta", { delta: event.delta });
//         break;
//       case "transcript-delta":
//         socket.emit("transcript-delta", { delta: event.delta });
//         break;
//       case "transcript-done":
//         socket.emit("transcript-done", { transcript: event.transcript });
//         break;
//       case "user-transcript":
//         socket.emit("user-transcript", { transcript: event.transcript });
//         break;
//       case "speech-started":
//         socket.emit("speech-started", {});
//         break;
//       case "booking-saved":
//         socket.emit("booking-saved", event.data);
//         break;
//       case "recording-saved":
//         socket.emit("recording-saved", event.data);
//         break;
//       case "error":
//         socket.emit("realtime-error", { error: event.error });
//         break;
//       case "session-closed":
//         socket.emit("session-closed", {});
//         break;
//     }
//   };
// }

// // ============================================================
// // SOCKET.IO — Client Connection Handling
// // ============================================================
// io.on("connection", (socket) => {
//   console.log(`Client connected: ${socket.id}`);

//   const forwarder = buildEventForwarder(socket);

//   // Prewarm on connect
//   startPrewarm(socket.id, forwarder).catch(() => {});

//   socket.on("start-session", async () => {
//     const sessionId = socket.id;
//     console.log(`[${sessionId}] Starting session`);

//     try {
//       let state = prewarmStates.get(sessionId);

//       if (!state) {
//         await startPrewarm(sessionId, forwarder);
//         state = prewarmStates.get(sessionId);
//       }

//       if (state) {
//         try {
//           await state.promise;
//           if (state.ready) {
//             clearPrewarmState(sessionId);
//             socket.emit("session-started", { sessionId });
//             triggerGreeting(sessionId);
//             return;
//           }
//         } catch {}
//         clearPrewarmState(sessionId);
//       }

//       // Fallback: create directly
//       await createRealtimeSession(sessionId, forwarder);
//       socket.emit("session-started", { sessionId });
//       triggerGreeting(sessionId);
//     } catch (err) {
//       console.error(`[${sessionId}] Session start failed:`, err.message);
//       socket.emit("realtime-error", {
//         error: { message: "Failed to connect to AI service" },
//       });
//     }
//   });

//   socket.on("audio-chunk", (data) => {
//     sendAudio(socket.id, data.audio);
//   });

//   socket.on("end-session", () => {
//     console.log(`[${socket.id}] End session requested`);
//     clearPrewarmState(socket.id);
//     closeSession(socket.id);
//     socket.emit("session-closed", {});
//   });

//   socket.on("disconnect", () => {
//     console.log(`Client disconnected: ${socket.id}`);
//     clearPrewarmState(socket.id);
//     closeSession(socket.id);
//   });
// });

// // ─── REST API Endpoints ───────────────────────────────────
// app.get("/api/bookings", (req, res) => {
//   const bookingsFile = path.join(__dirname, "bookings.json");
//   if (fs.existsSync(bookingsFile)) {
//     const data = JSON.parse(fs.readFileSync(bookingsFile, "utf-8"));
//     res.json(data);
//   } else {
//     res.json([]);
//   }
// });

// app.get("/api/recordings", (req, res) => {
//   const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".wav"));
//   res.json(
//     files.map((f) => ({
//       filename: f,
//       url: `/recordings/${f}`,
//       size: (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(2) + " MB",
//     }))
//   );
// });

// // ─── Start Server ─────────────────────────────────────────
// server.listen(PORT, () => {
//   console.log(`
// ╔══════════════════════════════════════════════════════════════╗
// ║   SW Brokerage — Voice Agent Server (OmniSuiteAI)            ║
// ║   Running on http://localhost:${PORT}                           ║
// ║                                                              ║
// ║   Flow: Hook → Value Prop → Agentic Close                    ║
// ║   Objections: Happy w/ bank | Rates same | Too much hassle   ║
// ║   Fallback: SMS follow-up                                    ║
// ║                                                              ║
// ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   Voice ID:       ${ELEVENLABS_VOICE_ID}              ║
// ║   Recordings Dir: ${RECORDINGS_DIR}    ║
// ╚══════════════════════════════════════════════════════════════╝
//   `);
// });
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

// ─── Config ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mkrzcZmzalRKwXdd";
const MONGODB_URI = process.env.MONGODB_URI;
const PREWARM_TTL_MS = 60_000;

// ─── MongoDB Connection ───────────────────────────────────
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env — bookings will NOT be saved.");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅  MongoDB connected"))
    .catch((err) => console.error("❌  MongoDB connection error:", err.message));
}

// ─── Booking Schema / Model ───────────────────────────────
const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    preferred_time: { type: String, required: true },
    interest_area: { type: String, required: true },
    current_situation: { type: String, default: null },
    follow_up_type: {
      type: String,
      enum: ["call", "rate_comparison", "sms"],
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

// Ensure recordings directory exists
const RECORDINGS_DIR = path.join(__dirname, "recordings");
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// ─── Express + Socket.IO ──────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "public")));
app.use("/recordings", express.static(RECORDINGS_DIR));

// ─── Session State ────────────────────────────────────────
const sessions = new Map();
const prewarmStates = new Map();

// ============================================================
// SYSTEM PROMPT — SW Brokerage Voice Agent
// Aligned with OmniSuiteAI Internal Brief (May 14, 2026)
// Flow: 01 Opening/Hook → 02 Value Proposition → 03 Agentic Close
// Objections: 04 Happy with bank | 05 Rates same | 06 Too much hassle
// Fallback: 07 SMS Follow-up
// ============================================================
function getSystemPrompt() {
  return `
=============================================================
ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING ELSE.
=============================================================
You MUST speak and respond in English at all times, no matter what.
- If the caller speaks in another language, respond ONLY in English.
- Do NOT switch to their language, do NOT mix languages.
- If the caller insists on another language, say: "Sorry, I can only assist in English."
=============================================================

### IDENTITY ###
You are James — a professional mortgage broker calling on behalf of SW Brokerage.
This is an outbound loan-review call to an existing or past client whose loan is due for annual review.
You talk like a real Australian mortgage broker — friendly, professional, and confident.

### AI DISCLOSURE RULE ###
- Do NOT volunteer that you are AI. Just be James.
- ONLY if someone explicitly asks "are you a robot?", "are you AI?", or "am I talking to a real person?" — then be honest:
  "Yeah fair enough — I'm actually an AI assistant helping the SW Brokerage team with outreach calls. But everything I'm telling you about rates and savings is accurate, and I can get you booked in with the team to go over the numbers."
- After admitting it, pivot straight back to the refinance conversation.

### PERSONALITY ###
- Professional Australian manner of speaking
- Warm, conversational, trustworthy
- Natural filler words occasionally: "yeah", "look", "absolutely", "no worries"
- Confident about financial knowledge — never pushy
- Match the caller's energy: relaxed with relaxed callers, more formal with formal ones

### HOW YOU TALK ###
- SHORT sentences — 1 to 2 sentences per response max
- Use contractions naturally: "what's", "couldn't", "you're", "didn't"
- React to what they say like a real person — ACKNOWLEDGE concerns before addressing them
- Use a DIFFERENT transition phrase between every exchange
- If there is silence or you don't catch what they said, re-engage: "Still there?" or "Sorry, didn't catch that."

=============================================================
CALL FLOW — HAPPY PATH (Steps 01 → 02 → 03)
=============================================================
This is the PRIMARY flow. Do not jump to objection handlers unless the client
explicitly raises an objection AFTER the value proposition has been delivered.

─────────────────────────────────────────────
STEP 01 — OPENING / HOOK
─────────────────────────────────────────────
You do NOT know the client's name. Always ask first.

Start with:
"Hi there, it's James from SW Brokerage. How are you going today?"

Wait for their response, then ask:
"And who am I speaking with?"

Once you have their name, use it naturally from here on.

Then deliver the hook:
"Great to chat, [name]. Look, reason I'm calling — I was going through some files and noticed your loan might be due for its annual review. With rates moving the way they are and our access to over 60 lenders, I wanted to run a quick no-obligation refinance check for you."

Proceed to Step 02 immediately if the client gives ANY neutral, curious, or mildly positive response, including:
- "Okay" / "Yeah" / "Sure"
- "What's this about?"
- "Tell me more"
- "Why are you calling?"
- Silence or hesitation after the hook (re-engage once, then proceed)
- Anything that is NOT a strong explicit objection

─────────────────────────────────────────────
STEP 02 — VALUE PROPOSITION
─────────────────────────────────────────────
[DELIVER THIS EXACT SCRIPT — word for word]

"Many of our clients in similar positions are saving $150 to $400 plus per month right now by switching — or accessing equity for renovations, debt consolidation, or investment. We can compare your current loan against the best options available today in just a few minutes. No paperwork upfront — I'll handle the heavy lifting like last time."

This step is critical. Without it, the close will feel pushy.
Key elements and why they matter:
- "$150 to $400 plus per month" — makes the benefit tangible and specific
- Refinance / equity release / debt consolidation / investment — covers real SW Brokerage client scenarios
- "No paperwork upfront" — removes friction and lowers the barrier to the next step
- "I'll handle the heavy lifting like last time" — builds trust and desire before asking for commitment

Proceed to Step 03 immediately after delivering the value proposition.

─────────────────────────────────────────────
STEP 03 — AGENTIC / PROACTIVE CLOSE
─────────────────────────────────────────────
[DELIVER THIS EXACT SCRIPT — word for word]

"I've blocked out a couple of quick slots this week: Tuesday at 11am or Thursday at 2pm. Would either work, or would you prefer I send you a short rate comparison first? Even if it's not the right time, I'll let you know exactly what the numbers look like so you can decide with confidence."

This is the AGENTIC close. Key characteristics:
- Proactive / Assumptive: do NOT ask the weak question "Are you interested?" — assume they want the next step
- Two low-friction paths:
    PATH A: Book a quick call — specific times are offered (Tuesday 11am or Thursday 2pm)
    PATH B: Receive a short rate comparison first — no-call option, fully low-pressure
- Safety net: "Even if it's not the right time..." — removes pressure, keeps the door open

If they agree to a specific time → confirm the booking details (collect name already known, phone/email, preferred time)
If they prefer the comparison first → offer to email it and collect their email address

─────────────────────────────────────────────
STEP 04 — COLLECT DETAILS (when interested)
─────────────────────────────────────────────
Collect conversationally — NOT like a form. One detail at a time:
- Their preferred contact method (phone / email)
- Best time for a follow-up call
- Any specific concerns about their current loan (e.g. rate too high, want to access equity, consolidate debt)

=============================================================
OBJECTION HANDLERS (Steps 04–06)
=============================================================
Only break out to these if the client EXPLICITLY raises the objection — do not pre-empt.
After handling the objection, return to the value proposition (Step 02) or close (Step 03).

─────────────────────────────────────────────
OBJECTION 04 — "I'm happy with my current bank"
─────────────────────────────────────────────
"That's great to hear. Most people are — until we show them the full picture. I'll only recommend a move if it genuinely saves you money or gives you better features after all the fees are factored in."

─────────────────────────────────────────────
OBJECTION 05 — "Rates are the same everywhere"
─────────────────────────────────────────────
"Not quite anymore actually. With our panel of 60-plus lenders, we're seeing some offering cashback, lower rates, or waived fees that a lot of the major banks aren't matching right now."

─────────────────────────────────────────────
OBJECTION 06 — "Too much hassle / I don't have time"
─────────────────────────────────────────────
"Yeah I totally get that. That's exactly why you'd use us though — we manage everything end to end. You'd just need to sign a couple of forms and we handle the rest."

─────────────────────────────────────────────
OBJECTION — "Not interested" / "Bad time"
─────────────────────────────────────────────
Don't push. Move to Step 07 (SMS fallback):
"No worries at all. Would it be alright if I sent you a quick text with my details? That way if anything changes or rates drop further, you've got a direct line."

=============================================================
STEP 05 — SAVE BOOKING (when they agree to follow-up)
=============================================================
Once a client agrees to a follow-up appointment or rate comparison, collect:
- name (already gathered in Step 01)
- phone or email
- preferred_time (specific slot or general window they mentioned)
- interest_area (refinance / equity access / debt consolidation / rate comparison / investment)
- current_situation (brief note: e.g. "on a variable rate with ANZ, wants to know if can save monthly")

Then call save_refinance_booking with all details.

Confirmation after saving:
"Perfect, thanks [name]. I've got that locked in — you'll hear from the team at [preferred_time]. And if anything comes up before then, you've got my number. Cheers!"

=============================================================
STEP 06 — SMS FOLLOW-UP FALLBACK (Step 07 in brief)
=============================================================
If the call ends without a booking or comparison request, and the client is open to a text:
"No dramas. I'll shoot you a quick text with my details and a link to check rates anytime. Cheers, [name]."

=============================================================
HARD RULES — NON-NEGOTIABLE
=============================================================
- Language: ENGLISH ONLY at all times
- ONE question at a time — never stack multiple questions
- Responses: 1 to 2 sentences max — keep it tight and natural
- NEVER assume or hardcode the client's name — always ask in Step 01
- Use the client's actual name naturally once collected
- ALWAYS call save_refinance_booking when a client agrees to any follow-up — this is mandatory
- Value proposition (Step 02) MUST be delivered before the close (Step 03) — never skip it
- Do not jump to the close without delivering the value prop first
- After any objection is handled, return to the value prop or close — don't drop the conversation
`.trim();
}

// ─── Tool Definition ──────────────────────────────────────
function getSaveBookingTool() {
  return {
    type: "function",
    name: "save_refinance_booking",
    description:
      "Saves refinance consultation booking details when a client agrees to a follow-up call or rate comparison. MUST be called whenever a client agrees to any next step.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Client full name (collected in Step 01 of the call)",
        },
        phone: {
          type: "string",
          description: "Client phone number (if provided)",
        },
        email: {
          type: "string",
          description: "Client email address (if provided — required for rate comparison path)",
        },
        preferred_time: {
          type: "string",
          description: "When they want the callback or agreed slot — e.g. 'Tuesday at 11am', 'Thursday at 2pm', or 'anytime Thursday afternoon'",
        },
        interest_area: {
          type: "string",
          description:
            "What they are interested in: refinance, equity access, debt consolidation, rate comparison, investment loan, or other",
        },
        current_situation: {
          type: "string",
          description:
            "Brief summary of their current loan situation or concern — e.g. 'on variable rate with ANZ, interested in saving on monthly repayments'",
        },
        follow_up_type: {
          type: "string",
          enum: ["call", "rate_comparison", "sms"],
          description:
            "Which path the client chose: 'call' (booked a slot), 'rate_comparison' (wants comparison emailed first), or 'sms' (just wants a text with details)",
        },
      },
      required: ["name", "preferred_time", "interest_area", "follow_up_type"],
    },
  };
}

// ============================================================
// RECORDING — WAV file builder for conversation audio
// ============================================================
class ConversationRecorder {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.userChunks = [];     // PCM16 buffers from user mic (24kHz)
    this.agentChunks = [];    // PCM16 buffers from ElevenLabs (16kHz)
    this.startTime = Date.now();
    this.events = [];         // Timeline of who spoke when
  }

  addUserAudio(base64Pcm16) {
    const buf = Buffer.from(base64Pcm16, "base64");
    this.userChunks.push(buf);
    this.events.push({ type: "user", time: Date.now() - this.startTime, bytes: buf.length });
  }

  addAgentAudio(base64Pcm16) {
    const buf = Buffer.from(base64Pcm16, "base64");
    this.agentChunks.push(buf);
    this.events.push({ type: "agent", time: Date.now() - this.startTime, bytes: buf.length });
  }

  // Resample PCM16 from srcRate to dstRate using linear interpolation
  _resample(pcmBuffer, srcRate, dstRate) {
    if (srcRate === dstRate) return pcmBuffer;
    const srcSamples = pcmBuffer.length / 2;
    const ratio = srcRate / dstRate;
    const dstSamples = Math.floor(srcSamples / ratio);
    const out = Buffer.alloc(dstSamples * 2);

    for (let i = 0; i < dstSamples; i++) {
      const srcIdx = i * ratio;
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, srcSamples - 1);
      const frac = srcIdx - lo;
      const sLo = pcmBuffer.readInt16LE(lo * 2);
      const sHi = pcmBuffer.readInt16LE(hi * 2);
      const val = Math.round(sLo + (sHi - sLo) * frac);
      out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
    }
    return out;
  }

  // Mix user (24kHz) and agent (16kHz) into a single mono WAV at 24kHz
  saveToFile() {
    const OUTPUT_RATE = 24000;
    const userPcm = Buffer.concat(this.userChunks);
    const agentPcmRaw = Buffer.concat(this.agentChunks);
    const agentPcm = this._resample(agentPcmRaw, 16000, OUTPUT_RATE);

    const userSamples = userPcm.length / 2;
    const agentSamples = agentPcm.length / 2;
    const totalSamples = Math.max(userSamples, agentSamples);
    const mixedBuf = Buffer.alloc(totalSamples * 2);

    for (let i = 0; i < totalSamples; i++) {
      let val = 0;
      if (i < userSamples) val += userPcm.readInt16LE(i * 2);
      if (i < agentSamples) val += agentPcm.readInt16LE(i * 2);
      val = Math.max(-32768, Math.min(32767, val));
      mixedBuf.writeInt16LE(val, i * 2);
    }

    // Build WAV header
    const wavHeader = Buffer.alloc(44);
    const dataSize = mixedBuf.length;
    const fileSize = 36 + dataSize;

    wavHeader.write("RIFF", 0);
    wavHeader.writeUInt32LE(fileSize, 4);
    wavHeader.write("WAVE", 8);
    wavHeader.write("fmt ", 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);        // PCM format
    wavHeader.writeUInt16LE(1, 22);        // mono
    wavHeader.writeUInt32LE(OUTPUT_RATE, 24);
    wavHeader.writeUInt32LE(OUTPUT_RATE * 2, 28);
    wavHeader.writeUInt16LE(2, 32);
    wavHeader.writeUInt16LE(16, 34);
    wavHeader.write("data", 36);
    wavHeader.writeUInt32LE(dataSize, 40);

    const wav = Buffer.concat([wavHeader, mixedBuf]);
    const filename = `call_${this.sessionId}_${Date.now()}.wav`;
    const filepath = path.join(RECORDINGS_DIR, filename);
    fs.writeFileSync(filepath, wav);

    console.log(`[Recording] Saved: ${filepath} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`);
    return { filename, filepath, sizeMB: (wav.length / 1024 / 1024).toFixed(2) };
  }
}

// ============================================================
// VOICE SERVICE — OpenAI Realtime + ElevenLabs
// ============================================================

function toFunctionCallPayload(value) {
  if (!value || typeof value !== "object") return null;
  if (value.type !== "function_call") return null;
  if (
    typeof value.name !== "string" ||
    typeof value.arguments !== "string" ||
    typeof value.call_id !== "string"
  )
    return null;
  return { name: value.name, arguments: value.arguments, call_id: value.call_id };
}

// ─── Create OpenAI Realtime Session ───────────────────────
function createRealtimeSession(sessionId, onEvent) {
  const model = "gpt-4o-mini-realtime-preview";
  const url = `wss://api.openai.com/v1/realtime?model=${model}`;
  const startMs = Date.now();

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    ws.on("open", () => {
      console.log(`[${sessionId}] OpenAI connected (${Date.now() - startMs}ms)`);

      ws.send(
        JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text"],
            instructions: getSystemPrompt(),
            input_audio_format: "pcm16",
            turn_detection: {
              type: "server_vad",
              threshold: 0.8,
              prefix_padding_ms: 300,
              silence_duration_ms: 2000,
            },
            tools: [getSaveBookingTool()],
            tool_choice: "auto",
          },
        })
      );

      const session = {
        ws,
        elevenLabsWs: null,
        elevenLabsReady: false,
        textBuffer: [],
        isResponseActive: false,
        onEvent,
        startMs,
        openAiConnectedMs: Date.now(),
        elevenLabsConnectedMs: null,
        greetingTriggeredMs: null,
        firstResponseCreatedMs: null,
        firstAudioDeltaLogged: false,
        processedCallIds: new Set(),
        recorder: new ConversationRecorder(sessionId),
        bookings: [],
      };

      sessions.set(sessionId, session);
      openElevenLabsStream(sessionId);
      resolve();
    });

    ws.on("message", async (data) => {
      try {
        const event = JSON.parse(data.toString());
        await handleRealtimeEvent(sessionId, event);
      } catch (err) {
        console.error(`[${sessionId}] Parse error:`, err.message);
      }
    });

    ws.on("error", (err) => {
      console.error(`[${sessionId}] OpenAI WS error:`, err.message);
      onEvent({ type: "error", error: { message: err.message } });
      reject(err);
    });

    ws.on("close", (code, reason) => {
      console.log(`[${sessionId}] OpenAI WS closed: ${code}`);
      closeElevenLabsWs(sessionId);
      sessions.delete(sessionId);
      onEvent({ type: "session-closed" });
    });
  });
}

// ─── Send user audio to OpenAI ────────────────────────────
function sendAudio(sessionId, base64Audio) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.recorder.addUserAudio(base64Audio);
  session.ws.send(
    JSON.stringify({ type: "input_audio_buffer.append", audio: base64Audio })
  );
}

// ─── Trigger greeting ─────────────────────────────────────
function triggerGreeting(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.greetingTriggeredMs = Date.now();
  console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
  session.ws.send(JSON.stringify({ type: "response.create" }));
}

// ─── ElevenLabs TTS Stream ────────────────────────────────
function openElevenLabsStream(sessionId, force = false) {
  const session = sessions.get(sessionId);
  if (!session) return;

  if (
    !force &&
    session.elevenLabsWs &&
    (session.elevenLabsWs.readyState === WebSocket.OPEN ||
      session.elevenLabsWs.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  closeElevenLabsWs(sessionId);

  const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
  const elWs = new WebSocket(wsUrl);

  elWs.on("open", () => {
    console.log(`[${sessionId}] ElevenLabs connected`);
    session.elevenLabsConnectedMs = Date.now();

    elWs.send(
      JSON.stringify({
        text: " ",
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.78,
          style: 0.35,
          use_speaker_boost: true,
        },
        xi_api_key: ELEVENLABS_API_KEY,
      })
    );

    if (session.elevenLabsWs === elWs) {
      session.elevenLabsReady = true;
      for (const text of session.textBuffer) {
        sendTextToElevenLabs(sessionId, text);
      }
      session.textBuffer = [];
    }
  });

  elWs.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.audio) {
        session.recorder.addAgentAudio(msg.audio);
        session.onEvent({ type: "audio-delta", delta: msg.audio });
      }
    } catch (err) {}
  });

  elWs.on("error", (err) => {
    console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`);
  });

  elWs.on("close", () => {
    if (session.elevenLabsWs === elWs) {
      session.elevenLabsReady = false;
    }
  });

  session.elevenLabsWs = elWs;
}

function sendTextToElevenLabs(sessionId, text) {
  const session = sessions.get(sessionId);
  if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
    session.elevenLabsWs.send(
      JSON.stringify({ text, try_trigger_generation: true })
    );
  }
}

function flushElevenLabsStream(sessionId) {
  const session = sessions.get(sessionId);
  if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
    session.elevenLabsWs.send(JSON.stringify({ text: "" }));
  }
}

function closeElevenLabsWs(sessionId) {
  const session = sessions.get(sessionId);
  if (session?.elevenLabsWs) {
    try {
      if (session.elevenLabsWs.readyState === WebSocket.CONNECTING) {
        session.elevenLabsWs.terminate();
      } else if (session.elevenLabsWs.readyState === WebSocket.OPEN) {
        session.elevenLabsWs.close();
      }
    } catch (err) {}
    session.elevenLabsWs = null;
    session.elevenLabsReady = false;
    session.textBuffer = [];
  }
}

// ─── Handle function calls from OpenAI ────────────────────
async function handleFunctionCall(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return;

  if (event.name === "save_refinance_booking") {
    const callId = typeof event.call_id === "string" ? event.call_id : null;

    // Deduplication
    if (callId && session.processedCallIds.has(callId)) return;
    if (callId) session.processedCallIds.add(callId);

    try {
      const args = JSON.parse(event.arguments);
      console.log(`[${sessionId}] Saving booking for: ${args.name} | type: ${args.follow_up_type} | time: ${args.preferred_time}`);

      const bookingId = uuidv4();

      // ── Save to MongoDB ──────────────────────────────────
      const booking = new Booking({
        id: bookingId,
        sessionId,
        name: args.name,
        phone: args.phone || null,
        email: args.email || null,
        preferred_time: args.preferred_time,
        interest_area: args.interest_area,
        current_situation: args.current_situation || null,
        follow_up_type: args.follow_up_type,
      });

      await booking.save();
      // ────────────────────────────────────────────────────

      session.bookings.push({ id: bookingId, ...args });

      console.log(`[${sessionId}] Booking saved to MongoDB: ${bookingId}`);

      // Send success back to OpenAI so it can confirm to the caller
      session.ws.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: event.call_id,
            output: JSON.stringify({
              success: true,
              message: "Booking saved successfully.",
              booking_id: bookingId,
              follow_up_type: args.follow_up_type,
            }),
          },
        })
      );
      session.ws.send(JSON.stringify({ type: "response.create" }));
      session.onEvent({ type: "booking-saved", data: args });
    } catch (err) {
      if (callId) session.processedCallIds.delete(callId);
      console.error(`[${sessionId}] Save failed:`, err.message);
    }
  }
}

// ─── Event Hub — Process OpenAI Realtime events ───────────
async function handleRealtimeEvent(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return;

  switch (event.type) {
    case "response.created":
      session.isResponseActive = true;
      if (!session.firstResponseCreatedMs) {
        session.firstResponseCreatedMs = Date.now();
      }
      openElevenLabsStream(sessionId);
      break;

    case "response.done":
      session.isResponseActive = false;
      if (Array.isArray(event.response?.output)) {
        for (const item of event.response.output) {
          const fc = toFunctionCallPayload(item);
          if (fc) await handleFunctionCall(sessionId, fc);
        }
      }
      break;

    case "response.text.delta":
      if (session.elevenLabsReady) {
        sendTextToElevenLabs(sessionId, event.delta);
      } else {
        session.textBuffer.push(event.delta);
      }
      session.onEvent({ type: "transcript-delta", delta: event.delta });
      break;

    case "response.text.done":
      flushElevenLabsStream(sessionId);
      session.onEvent({ type: "transcript-done", transcript: event.text });
      break;

    case "input_audio_buffer.speech_started":
      console.log(`[${sessionId}] User interrupted — stopping AI voice`);
      if (session.isResponseActive) {
        try {
          session.ws.send(JSON.stringify({ type: "response.cancel" }));
        } catch (err) {}
      }
      closeElevenLabsWs(sessionId);
      openElevenLabsStream(sessionId, true);
      session.onEvent({ type: "speech-started" });
      break;

    case "conversation.item.input_audio_transcription.completed":
      session.onEvent({ type: "user-transcript", transcript: event.transcript });
      break;

    case "response.function_call_arguments.done":
      await handleFunctionCall(sessionId, event);
      break;

    case "response.output_item.done":
      if (event.item) {
        const fc = toFunctionCallPayload(event.item);
        if (fc) await handleFunctionCall(sessionId, fc);
      }
      break;

    case "error":
      console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
      break;
  }
}

// ─── Close session and save recording ─────────────────────
function closeSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    try {
      const result = session.recorder.saveToFile();
      console.log(`[${sessionId}] Recording saved: ${result.filename} (${result.sizeMB} MB)`);
      session.onEvent({
        type: "recording-saved",
        data: { filename: result.filename, url: `/recordings/${result.filename}` },
      });
    } catch (err) {
      console.error(`[${sessionId}] Recording save failed:`, err.message);
    }

    closeElevenLabsWs(sessionId);
    try { session.ws.close(); } catch (e) {}
    sessions.delete(sessionId);
    console.log(`[${sessionId}] Session closed`);
  }
}

// ─── Prewarm logic ────────────────────────────────────────
function clearPrewarmState(sessionId) {
  const state = prewarmStates.get(sessionId);
  if (!state) return;
  clearTimeout(state.ttlTimer);
  prewarmStates.delete(sessionId);
}

function startPrewarm(sessionId, eventForwarder) {
  if (prewarmStates.has(sessionId)) {
    return prewarmStates.get(sessionId).promise;
  }

  const state = { promise: null, ready: false, failed: false, ttlTimer: null };

  state.promise = createRealtimeSession(sessionId, eventForwarder)
    .then(() => {
      state.ready = true;
      console.log(`[${sessionId}] Prewarm ready`);
    })
    .catch((err) => {
      state.failed = true;
      console.warn(`[${sessionId}] Prewarm failed: ${err.message}`);
      throw err;
    });

  state.ttlTimer = setTimeout(() => {
    if (!prewarmStates.has(sessionId)) return;
    console.log(`[${sessionId}] Prewarm TTL expired — closing idle session`);
    clearPrewarmState(sessionId);
    closeSession(sessionId);
  }, PREWARM_TTL_MS);

  prewarmStates.set(sessionId, state);
  return state.promise;
}

// ─── Build event forwarder for a socket ───────────────────
function buildEventForwarder(socket) {
  return (event) => {
    switch (event.type) {
      case "audio-delta":
        socket.emit("audio-delta", { delta: event.delta });
        break;
      case "transcript-delta":
        socket.emit("transcript-delta", { delta: event.delta });
        break;
      case "transcript-done":
        socket.emit("transcript-done", { transcript: event.transcript });
        break;
      case "user-transcript":
        socket.emit("user-transcript", { transcript: event.transcript });
        break;
      case "speech-started":
        socket.emit("speech-started", {});
        break;
      case "booking-saved":
        socket.emit("booking-saved", event.data);
        break;
      case "recording-saved":
        socket.emit("recording-saved", event.data);
        break;
      case "error":
        socket.emit("realtime-error", { error: event.error });
        break;
      case "session-closed":
        socket.emit("session-closed", {});
        break;
    }
  };
}

// ============================================================
// SOCKET.IO — Client Connection Handling
// ============================================================
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  const forwarder = buildEventForwarder(socket);

  // Prewarm on connect
  startPrewarm(socket.id, forwarder).catch(() => {});

  socket.on("start-session", async () => {
    const sessionId = socket.id;
    console.log(`[${sessionId}] Starting session`);

    try {
      let state = prewarmStates.get(sessionId);

      if (!state) {
        await startPrewarm(sessionId, forwarder);
        state = prewarmStates.get(sessionId);
      }

      if (state) {
        try {
          await state.promise;
          if (state.ready) {
            clearPrewarmState(sessionId);
            socket.emit("session-started", { sessionId });
            triggerGreeting(sessionId);
            return;
          }
        } catch {}
        clearPrewarmState(sessionId);
      }

      // Fallback: create directly
      await createRealtimeSession(sessionId, forwarder);
      socket.emit("session-started", { sessionId });
      triggerGreeting(sessionId);
    } catch (err) {
      console.error(`[${sessionId}] Session start failed:`, err.message);
      socket.emit("realtime-error", {
        error: { message: "Failed to connect to AI service" },
      });
    }
  });

  socket.on("audio-chunk", (data) => {
    sendAudio(socket.id, data.audio);
  });

  socket.on("end-session", () => {
    console.log(`[${socket.id}] End session requested`);
    clearPrewarmState(socket.id);
    closeSession(socket.id);
    socket.emit("session-closed", {});
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    clearPrewarmState(socket.id);
    closeSession(socket.id);
  });
});

// ─── REST API Endpoints ───────────────────────────────────

// GET all bookings from MongoDB
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
    res.json(bookings);
  } catch (err) {
    console.error("Failed to fetch bookings:", err.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.get("/api/recordings", (req, res) => {
  const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".wav"));
  res.json(
    files.map((f) => ({
      filename: f,
      url: `/recordings/${f}`,
      size: (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(2) + " MB",
    }))
  );
});

// ─── Start Server ─────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   SW Brokerage — Voice Agent Server (OmniSuiteAI)            ║
║   Running on http://localhost:${PORT}                           ║
║                                                              ║
║   Flow: Hook → Value Prop → Agentic Close                    ║
║   Objections: Happy w/ bank | Rates same | Too much hassle   ║
║   Fallback: SMS follow-up                                    ║
║                                                              ║
║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
║   Voice ID:       ${ELEVENLABS_VOICE_ID}              ║
║   Recordings Dir: ${RECORDINGS_DIR}    ║
║   MongoDB:        ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
╚══════════════════════════════════════════════════════════════╝
  `);
});