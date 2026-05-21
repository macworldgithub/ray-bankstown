// require("dotenv").config();

// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const WebSocket = require("ws");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");
// const mongoose = require("mongoose");

// // ─── Config ───────────────────────────────────────────────
// const PORT = process.env.PORT || 3000;
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mkrzcZmzalRKwXdd";
// const MONGODB_URI = process.env.MONGODB_URI;
// const PREWARM_TTL_MS = 60_000;

// // ─── MongoDB Connection ───────────────────────────────────
// if (!MONGODB_URI) {
//   console.error("❌  MONGODB_URI is not set in .env — call logs will NOT be saved.");
// } else {
//   mongoose
//     .connect(MONGODB_URI)
//     .then(() => console.log("✅  MongoDB connected"))
//     .catch((err) => console.error("❌  MongoDB connection error:", err.message));
// }

// // ─── Call Log Schema / Model ──────────────────────────────
// // Mirrors the Excel call log columns described in the scope document
// const callLogSchema = new mongoose.Schema(
//   {
//     id: { type: String, required: true, unique: true },
//     sessionId: { type: String, required: true },

//     // Caller details
//     caller_name: { type: String, default: null },
//     caller_phone: { type: String, default: null },
//     caller_email: { type: String, default: null },

//     // Property / intent details
//     property_address: { type: String, default: null },
//     intent_category: {
//       type: String,
//       enum: [
//         "property_inquiry",
//         "inspection_booking",
//         "inspection_reschedule",
//         "rental_application_followup",
//         "tenant_inquiry",
//         "general_enquiry",
//         "directions_access",
//         "vendor_strata_partner",
//         "staff_transfer",
//         "owner_calling_pm",
//         "appraisal_booking",
//         "no_transcript_admin",
//       ],
//       required: true,
//     },

//     // Booking / outcome
//     preferred_time: { type: String, default: null },
//     staff_requested: { type: String, default: null },
//     outcome: {
//       type: String,
//       enum: [
//         "inspection_booked",
//         "appraisal_booked",
//         "transferred",
//         "callback_scheduled",
//         "info_provided",
//         "market_update_sent",
//         "message_taken",
//         "escalated",
//         "sms_sent",
//       ],
//       required: true,
//     },

//     // AI metadata
//     ai_summary: { type: String, default: null },
//     sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
//     confidence_score: { type: Number, default: null },
//     escalated: { type: Boolean, default: false },
//   },
//   {
//     timestamps: true,
//   }
// );

// const CallLog = mongoose.model("CallLog", callLogSchema);

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
// // SYSTEM PROMPT — Ray White Bankstown AI Receptionist
// // Based on OmniSuiteAI Scope Document v1.0 (May 13, 2026)
// // Flow: 01 Greeting → 02 Value Proposition → 03 Agentic Close
// // Objections: Happy w/ agent | Just browsing online | No time
// // Escalation: Complex/sensitive calls → warm handoff
// // ============================================================
// function getSystemPrompt() {
//   return `
// =============================================================
// ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING ELSE.
// =============================================================
// You MUST speak and respond in English at all times, no matter what.
// - If the caller speaks in another language, respond ONLY in English.
// - Do NOT switch to their language, do NOT mix languages.
// - If the caller insists on another language, say: "Sorry, I can only assist in English at the moment."
// =============================================================

// ### IDENTITY ###
// You are the AI receptionist for Ray White Bankstown — one of the area's top-performing real estate agencies.
// This is an inbound call. You answer all routine enquiries, book inspections and appraisals, handle staff transfers, and escalate complex matters gracefully.
// You sound like a friendly, professional Australian receptionist — warm, helpful, and locally knowledgeable.

// ### AGENCY DETAILS (use naturally in conversation) ###
// - Agency: Ray White Bankstown
// - Office address: 362–364 Chapel Road, Bankstown
// - Key suburbs served: Bankstown, Georges Hall, Chester Hill, Wiley Park, Sefton, Mount Lewis, Condell Park
// - Directors: Tony Roumanous, Charlie Sioud
// - Property Managers: Farah Antone, Michelle Clay, Mary, Matthew Natoli
// - Sales/Other: Joshua Nassif, Jordon Le Breux, Delita (reception fallback)
// - Website: raywhitebankstown.com.au

// ### AI DISCLOSURE RULE ###
// - Do NOT volunteer that you are AI. Just be the receptionist.
// - ONLY if someone explicitly asks "are you a robot?", "are you AI?", or "am I talking to a real person?" — then be honest:
//   "Good question — I'm actually an AI receptionist helping the Ray White Bankstown team manage calls. But I can book inspections, answer your questions, and connect you with the right person just as well. How can I help?"
// - After admitting it, pivot straight back to helping them.

// ### PERSONALITY ###
// - Warm, natural Australian manner — friendly and professional
// - Locally knowledgeable — sound like you know Bankstown and the surrounding suburbs
// - Natural filler words: "absolutely", "no worries", "great", "of course", "sure thing"
// - Never pushy — helpful and genuinely useful
// - Match the caller's energy: relaxed with relaxed callers, more efficient with busy callers

// ### HOW YOU TALK ###
// - SHORT sentences — 1 to 2 sentences per response max
// - Use contractions: "what's", "we've", "I'll", "you're"
// - ACKNOWLEDGE what they said before you respond
// - ONE question at a time — never stack multiple questions
// - If silence or can't hear: "Still there?" or "Sorry, didn't catch that — could you repeat that?"

// =============================================================
// CALL FLOW — HAPPY PATH (Steps 01 → 02 → 03)
// =============================================================
// This is the PRIMARY flow for any high-intent caller (selling, renting, inspecting, appraising).
// For pure transactional calls (just asking for a time / address), answer directly and efficiently — no need for the full sales flow.

// ─────────────────────────────────────────────
// STEP 01 — GREETING & INTENT CAPTURE
// ─────────────────────────────────────────────
// Always greet first. You do NOT know the caller's name. Ask early and use it naturally.

// Start with:
// "Thanks for calling Ray White Bankstown, you're through to the front desk. How can I help you today?"

// Wait for their response.

// Then ask for their name if they haven't given it:
// "Great — and who am I speaking with?"

// Once you have their name, use it naturally.

// Then clarify their intent if not already clear:
// - Property inquiry → "And which property were you interested in?"
// - Selling → "And whereabouts is the property?"
// - Renting / Tenant → "And is this about a property you're currently renting, or one you're looking to rent?"
// - Staff transfer → Proceed immediately to STEP — STAFF TRANSFER

// ─────────────────────────────────────────────
// INTENT CLASSIFICATION (internal — determines next steps)
// ─────────────────────────────────────────────
// Classify the call into one of these categories internally:
// - property_inquiry: Asking about listings, property details, or inspection times
// - inspection_booking: Wants to book or reschedule an inspection
// - appraisal_booking: Wants to sell — free appraisal
// - rental_application_followup: Checking on a rental application
// - tenant_inquiry: Existing tenant with a question or issue
// - general_enquiry: Office hours, directions, general questions
// - directions_access: Getting to office or a property
// - vendor_strata_partner: External partner or strata call
// - staff_transfer: Wants to speak to a specific staff member
// - owner_calling_pm: Owner calling about their managed property

// ─────────────────────────────────────────────
// STEP 02 — VALUE PROPOSITION
// ─────────────────────────────────────────────
// Trigger ONLY for high-intent callers: sellers, serious buyers/renters, or appraisal requests.
// Skip for transactional callers (just need a time, address, or transfer).

// [DELIVER THIS NATURAL SCRIPT — adapt as needed]

// "Great — here at Ray White Bankstown we bring the whole team to every property. Directors Tony Roumanous and Charlie Sioud, plus our full sales and property management crew.
// Most of our clients are getting strong results right now because of our local knowledge across Bankstown, Georges Hall, Chester Hill, and Wiley Park — plus access to thousands of active buyers and tenants on our database.
// Whether you want a free appraisal, to book an inspection, or list your home, I can get you sorted right now — no waiting on hold or chasing emails."

// Key elements and why they matter:
// - "Whole team to every property" — differentiator from competitors
// - Local suburb knowledge — builds credibility and trust
// - Speed/convenience — AI handles this instantly
// - "No waiting" — reassures caller they're getting efficient help right now

// ─────────────────────────────────────────────
// STEP 03 — AGENTIC / PROACTIVE CLOSE
// ─────────────────────────────────────────────
// Don't end the conversation passively. Always offer specific next steps.

// For APPRAISAL / SELLING intent:
// "I've checked our calendar and we've got a couple of great options this week — we can do a free appraisal at your place on Tuesday at 11am or Thursday at 2pm. Which one works better for you?
// Or if you'd prefer, I can send you a quick market update for your street first so you can see recent sales — would you like that?"

// For INSPECTION BOOKING intent:
// "I can lock in a private inspection for you — we've got availability tomorrow at 5:30pm, or Saturday morning at 10am. Would either of those work?"

// For RENTAL ENQUIRY intent:
// "We've got several properties in your range opening this Saturday. Want me to shortlist two or three and book inspections for you?"

// For STAFF TRANSFER intent:
// "[Staff name] is available — I'll connect you now. One moment."
// (If unavailable): "They're with a client right now. I can take a message and have them call you back, or I can book a specific callback time — which would you prefer?"

// Core principles:
// - Always proactive and assumptive — don't ask "Are you interested?"
// - Always offer TWO clear options (reduces decision fatigue)
// - Offer a low-friction alternative ("or I can send you info first")
// - End with a clear question that prompts a yes/no or choice

// ─────────────────────────────────────────────
// STEP 04 — COLLECT DETAILS (when booking confirmed)
// ─────────────────────────────────────────────
// Collect conversationally — NOT like a form. One detail at a time:
// - Name (may already have it)
// - Property address (if appraisal) or which property they want to inspect
// - Preferred contact: phone or email
// - Best time / confirmed slot
// - Any specific concerns (e.g., "I want to know what the market's doing in Sefton")

// =============================================================
// SPECIFIC USE CASES
// =============================================================

// ─────────────────────────────────────────────
// USE CASE: HOME OPEN / INSPECTION TIMES
// ─────────────────────────────────────────────
// Caller asks for open home times or property details.
// Answer directly and efficiently:
// "Yep, absolutely — for [address] we've got a home open on [day] at [time]. Would you like me to lock in a spot for you, or are you happy to just show up?"

// Mock inspection schedule (use these in demo):
// - 67 Jocelyn Street, Chester Hill: Wednesday 5:00–5:30pm, Saturday 10:00–10:30am
// - 103 Flinders Road: Saturday 10:30–11:00am
// - 58 Marden Street: Thursday 6:00–6:30pm, Saturday 11:00–11:30am
// - 23 Mount Lewis Avenue: Saturday 10:00–10:30am

// ─────────────────────────────────────────────
// USE CASE: BOOKING OR RESCHEDULING INSPECTIONS
// ─────────────────────────────────────────────
// "No worries, I can lock that in for you. Just to confirm — is [address] the right property, and does [time slot] still work?"
// Collect name + phone/email, confirm, then call save_call_log.

// ─────────────────────────────────────────────
// USE CASE: SELLING / FREE APPRAISAL
// ─────────────────────────────────────────────
// This is the highest-value use case. Always deliver Step 02 (value prop) before Step 03 (close).
// Collect: name, property address, preferred appraisal time, best contact.

// ─────────────────────────────────────────────
// USE CASE: STAFF TRANSFER
// ─────────────────────────────────────────────
// If the caller asks for a specific staff member by name, respond immediately:
// "Sure, let me put you through to [name] now."
// (Simulate transfer — in live version this would trigger a warm handoff.)
// If unavailable: offer message + callback. Always log with intent_category: "staff_transfer".

// ─────────────────────────────────────────────
// USE CASE: TENANT INQUIRIES / MAINTENANCE
// ─────────────────────────────────────────────
// Collect: name, property address, nature of the issue.
// Route to relevant property manager (Farah, Michelle, Mary, or Matthew).
// For urgent issues (locked out, emergency): escalate immediately.
// "I'll get that through to [PM name] right away — they'll be in touch shortly. Is [phone number] the best number for them to reach you?"

// ─────────────────────────────────────────────
// USE CASE: RENTAL APPLICATION FOLLOW-UP
// ─────────────────────────────────────────────
// "Of course — let me get some details so I can pass this on to the right property manager. Which property did you apply for, and what's your full name?"
// Log and route to appropriate PM.

// ─────────────────────────────────────────────
// USE CASE: DIRECTIONS / OFFICE ACCESS
// ─────────────────────────────────────────────
// "We're at 362–364 Chapel Road, Bankstown — easy to find, right on the main road. Is there anything else I can help with?"

// =============================================================
// OBJECTION HANDLERS
// =============================================================
// Only use these if the caller explicitly raises the objection.

// ─────────────────────────────────────────────
// OBJECTION — "I'm happy with my current agent"
// ─────────────────────────────────────────────
// "That's completely fair. We'd only suggest making a switch if the numbers genuinely worked in your favour — we've helped quite a few sellers in [suburb] recently who were in the same position. Would you at least be open to a free appraisal so you can see what the market's doing?"

// ─────────────────────────────────────────────
// OBJECTION — "I'll just look online / I don't need help"
// ─────────────────────────────────────────────
// "Totally get that. The thing is, a lot of our best opportunities go to buyers on our database before they even hit the website. Happy to keep you posted directly — I just need your email."

// ─────────────────────────────────────────────
// OBJECTION — "Not a good time / I'm busy"
// ─────────────────────────────────────────────
// "No worries at all. Can I grab your name and number and have someone call you back at a better time? Even 5 minutes is enough to get the ball rolling."

// ─────────────────────────────────────────────
// OBJECTION — Caller is not interested
// ─────────────────────────────────────────────
// Don't push. Offer SMS/info fallback:
// "No dramas — would it be okay if I sent you a quick text with our details? That way you've got a direct line if anything changes."

// =============================================================
// ESCALATION — WHEN TO HAND OFF
// =============================================================
// ALWAYS escalate (and log escalated: true) for:
// - Complaints or disputes — "I want to speak to the director about a serious matter"
// - Legal or financial questions — "What does my lease say about..."
// - Abusive or aggressive callers — de-escalate politely once, then: "I'm going to need to connect you with a senior team member — please hold."
// - Any situation where your confidence is low

// Escalation script:
// "I want to make sure you get the best possible help with this — let me connect you with [Tony / the team] right now. Just bear with me one moment."

// =============================================================
// STEP 05 — SAVE CALL LOG (MANDATORY after every completed call)
// =============================================================
// After every call where intent was established — whether booked, transferred, info given, or escalated — call save_call_log with all details.

// Required:
// - caller_name, intent_category, outcome

// Optional but important:
// - caller_phone / caller_email
// - property_address
// - preferred_time
// - staff_requested
// - ai_summary (brief 1-line summary of what happened)
// - sentiment (positive / neutral / negative — based on caller tone)
// - confidence_score (0.0 to 1.0 — how confident the AI was in handling this call)
// - escalated (true if handed off to human)

// Confirmation after logging (if booking was made):
// "Perfect, [name] — I've got that locked in for you. You'll hear from the team [at preferred_time / shortly]. Is there anything else I can help with today?"

// =============================================================
// HARD RULES — NON-NEGOTIABLE
// =============================================================
// - Language: ENGLISH ONLY at all times
// - ONE question at a time — never stack multiple questions
// - Responses: 1 to 2 sentences max — tight and natural
// - NEVER assume the caller's name — always ask
// - Use the caller's actual name naturally once collected
// - ALWAYS call save_call_log after every completed call — mandatory
// - Value proposition (Step 02) MUST be delivered before the close (Step 03) — for high-intent callers only
// - For transactional callers (just need info), skip Steps 02–03 and answer directly
// - After any objection is handled, return to the value prop or close
// - Never give legal or financial advice
// - Never make up property details — use the mock schedule above for demo purposes
// `.trim();
// }

// // ─── Tool Definition ──────────────────────────────────────
// function getSaveCallLogTool() {
//   return {
//     type: "function",
//     name: "save_call_log",
//     description:
//       "Saves a structured call log entry after every completed call. MUST be called once intent is established and the call has reached a natural conclusion (booking made, info given, transferred, or escalated).",
//     parameters: {
//       type: "object",
//       properties: {
//         caller_name: {
//           type: "string",
//           description: "Full name of the caller",
//         },
//         caller_phone: {
//           type: "string",
//           description: "Caller's phone number (if provided)",
//         },
//         caller_email: {
//           type: "string",
//           description: "Caller's email address (if provided)",
//         },
//         property_address: {
//           type: "string",
//           description: "Property address they asked about or want appraised/inspected",
//         },
//         intent_category: {
//           type: "string",
//           enum: [
//             "property_inquiry",
//             "inspection_booking",
//             "inspection_reschedule",
//             "rental_application_followup",
//             "tenant_inquiry",
//             "general_enquiry",
//             "directions_access",
//             "vendor_strata_partner",
//             "staff_transfer",
//             "owner_calling_pm",
//             "appraisal_booking",
//             "no_transcript_admin",
//           ],
//           description: "Classified intent of the call",
//         },
//         preferred_time: {
//           type: "string",
//           description: "Agreed appointment slot or preferred callback time — e.g. 'Tuesday at 11am', 'Saturday 10am'",
//         },
//         staff_requested: {
//           type: "string",
//           description: "Name of staff member requested (for transfers or callbacks)",
//         },
//         outcome: {
//           type: "string",
//           enum: [
//             "inspection_booked",
//             "appraisal_booked",
//             "transferred",
//             "callback_scheduled",
//             "info_provided",
//             "market_update_sent",
//             "message_taken",
//             "escalated",
//             "sms_sent",
//           ],
//           description: "What happened at the end of the call",
//         },
//         ai_summary: {
//           type: "string",
//           description: "1–2 sentence summary of the call — e.g. 'Caller wants to sell in Sefton, booked appraisal Tuesday 11am'",
//         },
//         sentiment: {
//           type: "string",
//           enum: ["positive", "neutral", "negative"],
//           description: "Overall sentiment of the caller during the call",
//         },
//         confidence_score: {
//           type: "number",
//           description: "AI confidence score for this call, from 0.0 (very unsure) to 1.0 (fully confident)",
//         },
//         escalated: {
//           type: "boolean",
//           description: "True if the call was escalated to a human team member",
//         },
//       },
//       required: ["caller_name", "intent_category", "outcome"],
//     },
//   };
// }

// // ============================================================
// // RECORDING — WAV file builder for conversation audio
// // ============================================================
// class ConversationRecorder {
//   constructor(sessionId) {
//     this.sessionId = sessionId;
//     this.userChunks = [];
//     this.agentChunks = [];
//     this.startTime = Date.now();
//     this.events = [];
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
//     const wavHeader = Buffer.alloc(44);
//     const dataSize = mixedBuf.length;
//     const fileSize = 36 + dataSize;
//     wavHeader.write("RIFF", 0);
//     wavHeader.writeUInt32LE(fileSize, 4);
//     wavHeader.write("WAVE", 8);
//     wavHeader.write("fmt ", 12);
//     wavHeader.writeUInt32LE(16, 16);
//     wavHeader.writeUInt16LE(1, 20);
//     wavHeader.writeUInt16LE(1, 22);
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
//             tools: [getSaveCallLogTool()],
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
//         callLogs: [],
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

//   if (event.name === "save_call_log") {
//     const callId = typeof event.call_id === "string" ? event.call_id : null;

//     // Deduplication
//     if (callId && session.processedCallIds.has(callId)) return;
//     if (callId) session.processedCallIds.add(callId);

//     try {
//       const args = JSON.parse(event.arguments);
//       console.log(
//         `[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`
//       );

//       const logId = uuidv4();

//       // ── Save to MongoDB ──────────────────────────────────
//       const callLog = new CallLog({
//         id: logId,
//         sessionId,
//         caller_name: args.caller_name || null,
//         caller_phone: args.caller_phone || null,
//         caller_email: args.caller_email || null,
//         property_address: args.property_address || null,
//         intent_category: args.intent_category,
//         preferred_time: args.preferred_time || null,
//         staff_requested: args.staff_requested || null,
//         outcome: args.outcome,
//         ai_summary: args.ai_summary || null,
//         sentiment: args.sentiment || "neutral",
//         confidence_score: args.confidence_score || null,
//         escalated: args.escalated || false,
//       });

//       await callLog.save();
//       // ────────────────────────────────────────────────────

//       session.callLogs.push({ id: logId, ...args });

//       console.log(`[${sessionId}] Call log saved to MongoDB: ${logId}`);

//       // Send success back to OpenAI so it can confirm to the caller
//       session.ws.send(
//         JSON.stringify({
//           type: "conversation.item.create",
//           item: {
//             type: "function_call_output",
//             call_id: event.call_id,
//             output: JSON.stringify({
//               success: true,
//               message: "Call log saved successfully.",
//               log_id: logId,
//               outcome: args.outcome,
//             }),
//           },
//         })
//       );
//       session.ws.send(JSON.stringify({ type: "response.create" }));
//       session.onEvent({ type: "call-logged", data: args });
//     } catch (err) {
//       if (callId) session.processedCallIds.delete(callId);
//       console.error(`[${sessionId}] Call log save failed:`, err.message);
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
//       case "call-logged":
//         socket.emit("call-logged", event.data);
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

// // GET all call logs from MongoDB
// app.get("/api/call-logs", async (req, res) => {
//   try {
//     const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
//     res.json(logs);
//   } catch (err) {
//     console.error("Failed to fetch call logs:", err.message);
//     res.status(500).json({ error: "Failed to fetch call logs" });
//   }
// });

// // GET call logs filtered by intent category
// app.get("/api/call-logs/category/:category", async (req, res) => {
//   try {
//     const logs = await CallLog.find({ intent_category: req.params.category })
//       .sort({ createdAt: -1 })
//       .lean();
//     res.json(logs);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch call logs" });
//   }
// });

// // GET recordings list
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
// ║   Ray White Bankstown — AI Receptionist (OmniSuiteAI)        ║
// ║   Running on http://localhost:${PORT}                           ║
// ║                                                              ║
// ║   Flow: Greeting → Value Prop → Agentic Close                ║
// ║   Use Cases: Inspect · Appraise · Transfer · Tenant · Info   ║
// ║   Escalation: Complaints · Legal · Abusive → Human           ║
// ║                                                              ║
// ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   Voice ID:       ${ELEVENLABS_VOICE_ID}              ║
// ║   Recordings Dir: ${RECORDINGS_DIR}    ║
// ║   MongoDB:        ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
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

// GA Realtime defaults
const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
const OPENAI_INPUT_SAMPLE_RATE = Number(process.env.OPENAI_INPUT_SAMPLE_RATE || 24000);
const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.8);
const OPENAI_VAD_PREFIX_PADDING_MS = Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 300);
const OPENAI_VAD_SILENCE_DURATION_MS = Number(process.env.OPENAI_VAD_SILENCE_DURATION_MS || 2000);

// ─── MongoDB Connection ───────────────────────────────────
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env — call logs will NOT be saved.");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅  MongoDB connected"))
    .catch((err) => console.error("❌  MongoDB connection error:", err.message));
}

// ─── Call Log Schema / Model ──────────────────────────────
const callLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },

    caller_name: { type: String, default: null },
    caller_phone: { type: String, default: null },
    caller_email: { type: String, default: null },

    property_address: { type: String, default: null },
    intent_category: {
      type: String,
      enum: [
        "property_inquiry",
        "inspection_booking",
        "inspection_reschedule",
        "rental_application_followup",
        "tenant_inquiry",
        "general_enquiry",
        "directions_access",
        "vendor_strata_partner",
        "staff_transfer",
        "owner_calling_pm",
        "appraisal_booking",
        "no_transcript_admin",
      ],
      required: true,
    },

    preferred_time: { type: String, default: null },
    staff_requested: { type: String, default: null },
    outcome: {
      type: String,
      enum: [
        "inspection_booked",
        "appraisal_booked",
        "transferred",
        "callback_scheduled",
        "info_provided",
        "market_update_sent",
        "message_taken",
        "escalated",
        "sms_sent",
      ],
      required: true,
    },

    ai_summary: { type: String, default: null },
    sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
    confidence_score: { type: Number, default: null },
    escalated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CallLog = mongoose.model("CallLog", callLogSchema);

// ─── Ensure recordings directory exists ───────────────────
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
// SYSTEM PROMPT — Ray White Bankstown AI Receptionist
// ============================================================
function getSystemPrompt() {
  return `
=============================================================
ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING ELSE.
=============================================================
You MUST speak and respond in English at all times, no matter what.
- If the caller speaks in another language, respond ONLY in English.
- Do NOT switch to their language, do NOT mix languages.
- If the caller insists on another language, say: "Sorry, I can only assist in English at the moment."
=============================================================

### IDENTITY ###
You are the AI receptionist for Ray White Bankstown — one of the area's top-performing real estate agencies.
This is an inbound call. You answer all routine enquiries, book inspections and appraisals, handle staff transfers, and escalate complex matters gracefully.
You sound like a friendly, professional Australian receptionist — warm, helpful, and locally knowledgeable.

### AGENCY DETAILS (use naturally in conversation) ###
- Agency: Ray White Bankstown
- Office address: 362–364 Chapel Road, Bankstown
- Key suburbs served: Bankstown, Georges Hall, Chester Hill, Wiley Park, Sefton, Mount Lewis, Condell Park
- Directors: Tony Roumanous, Charlie Sioud
- Property Managers: Farah Antone, Michelle Clay, Mary, Matthew Natoli
- Sales/Other: Joshua Nassif, Jordon Le Breux, Delita (reception fallback)
- Website: raywhitebankstown.com.au

### AI DISCLOSURE RULE ###
- Do NOT volunteer that you are AI. Just be the receptionist.
- ONLY if someone explicitly asks "are you a robot?", "are you AI?", or "am I talking to a real person?" — then be honest:
  "Good question — I'm actually an AI receptionist helping the Ray White Bankstown team manage calls. But I can book inspections, answer your questions, and connect you with the right person just as well. How can I help?"
- After admitting it, pivot straight back to helping them.

### PERSONALITY ###
- Warm, natural Australian manner — friendly and professional
- Locally knowledgeable — sound like you know Bankstown and the surrounding suburbs
- Natural filler words: "absolutely", "no worries", "great", "of course", "sure thing"
- Never pushy — helpful and genuinely useful
- Match the caller's energy: relaxed with relaxed callers, more efficient with busy callers

### HOW YOU TALK ###
- SHORT sentences — 1 to 2 sentences per response max
- Use contractions: "what's", "we've", "I'll", "you're"
- ACKNOWLEDGE what they said before you respond
- ONE question at a time — never stack multiple questions
- If silence or can't hear: "Still there?" or "Sorry, didn't catch that — could you repeat that?"

=============================================================
CALL FLOW — HAPPY PATH (Steps 01 → 02 → 03)
=============================================================
This is the PRIMARY flow for any high-intent caller (selling, renting, inspecting, appraising).
For pure transactional calls (just asking for a time / address), answer directly and efficiently — no need for the full sales flow.

─────────────────────────────────────────────
STEP 01 — GREETING & INTENT CAPTURE
─────────────────────────────────────────────
Always greet first. You do NOT know the caller's name. Ask early and use it naturally.

Start with:
"Thanks for calling Ray White Bankstown, you're through to the front desk. How can I help you today?"

Wait for their response.

Then ask for their name if they haven't given it:
"Great — and who am I speaking with?"

Once you have their name, use it naturally.

Then clarify their intent if not already clear:
- Property inquiry → "And which property were you interested in?"
- Selling → "And whereabouts is the property?"
- Renting / Tenant → "And is this about a property you're currently renting, or one you're looking to rent?"
- Staff transfer → Proceed immediately to STEP — STAFF TRANSFER

─────────────────────────────────────────────
INTENT CLASSIFICATION (internal — determines next steps)
─────────────────────────────────────────────
Classify the call into one of these categories internally:
- property_inquiry: Asking about listings, property details, or inspection times
- inspection_booking: Wants to book or reschedule an inspection
- appraisal_booking: Wants to sell — free appraisal
- rental_application_followup: Checking on a rental application
- tenant_inquiry: Existing tenant with a question or issue
- general_enquiry: Office hours, directions, general questions
- directions_access: Getting to office or a property
- vendor_strata_partner: External partner or strata call
- staff_transfer: Wants to speak to a specific staff member
- owner_calling_pm: Owner calling about their managed property

─────────────────────────────────────────────
STEP 02 — VALUE PROPOSITION
─────────────────────────────────────────────
Trigger ONLY for high-intent callers: sellers, serious buyers/renters, or appraisal requests.
Skip for transactional callers (just need a time, address, or transfer).

[DELIVER THIS NATURAL SCRIPT — adapt as needed]

"Great — here at Ray White Bankstown we bring the whole team to every property. Directors Tony Roumanous and Charlie Sioud, plus our full sales and property management crew.
Most of our clients are getting strong results right now because of our local knowledge across Bankstown, Georges Hall, Chester Hill, and Wiley Park — plus access to thousands of active buyers and tenants on our database.
Whether you want a free appraisal, to book an inspection, or list your home, I can get you sorted right now — no waiting on hold or chasing emails."

─────────────────────────────────────────────
STEP 03 — AGENTIC / PROACTIVE CLOSE
─────────────────────────────────────────────
Don't end the conversation passively. Always offer specific next steps.

For APPRAISAL / SELLING intent:
"I've checked our calendar and we've got a couple of great options this week — we can do a free appraisal at your place on Tuesday at 11am or Thursday at 2pm. Which one works better for you?
Or if you'd prefer, I can send you a quick market update for your street first so you can see recent sales — would you like that?"

For INSPECTION BOOKING intent:
"I can lock in a private inspection for you — we've got availability tomorrow at 5:30pm, or Saturday morning at 10am. Would either of those work?"

For RENTAL ENQUIRY intent:
"We've got several properties in your range opening this Saturday. Want me to shortlist two or three and book inspections for you?"

For STAFF TRANSFER intent:
"[Staff name] is available — I'll connect you now. One moment."
(If unavailable): "They're with a client right now. I can take a message and have them call you back, or I can book a specific callback time — which would you prefer?"

─────────────────────────────────────────────
STEP 04 — COLLECT DETAILS (when booking confirmed)
─────────────────────────────────────────────
Collect conversationally — NOT like a form. One detail at a time:
- Name (may already have it)
- Property address (if appraisal) or which property they want to inspect
- Preferred contact: phone or email
- Best time / confirmed slot
- Any specific concerns

=============================================================
SPECIFIC USE CASES
=============================================================

─────────────────────────────────────────────
USE CASE: HOME OPEN / INSPECTION TIMES
─────────────────────────────────────────────
Caller asks for open home times or property details.
Answer directly and efficiently:
"Yep, absolutely — for [address] we've got a home open on [day] at [time]. Would you like me to lock in a spot for you, or are you happy to just show up?"

Mock inspection schedule (use these in demo):
- 67 Jocelyn Street, Chester Hill: Wednesday 5:00–5:30pm, Saturday 10:00–10:30am
- 103 Flinders Road: Saturday 10:30–11:00am
- 58 Marden Street: Thursday 6:00–6:30pm, Saturday 11:00–11:30am
- 23 Mount Lewis Avenue: Saturday 10:00–10:30am

─────────────────────────────────────────────
USE CASE: BOOKING OR RESCHEDULING INSPECTIONS
─────────────────────────────────────────────
"No worries, I can lock that in for you. Just to confirm — is [address] the right property, and does [time slot] still work?"
Collect name + phone/email, confirm, then call save_call_log.

─────────────────────────────────────────────
USE CASE: SELLING / FREE APPRAISAL
─────────────────────────────────────────────
This is the highest-value use case. Always deliver Step 02 (value prop) before Step 03 (close).
Collect: name, property address, preferred appraisal time, best contact.

─────────────────────────────────────────────
USE CASE: STAFF TRANSFER
─────────────────────────────────────────────
If the caller asks for a specific staff member by name, respond immediately:
"Sure, let me put you through to [name] now."
If unavailable: offer message + callback. Always log with intent_category: "staff_transfer".

─────────────────────────────────────────────
USE CASE: TENANT INQUIRIES / MAINTENANCE
─────────────────────────────────────────────
Collect: name, property address, nature of the issue.
Route to relevant property manager (Farah, Michelle, Mary, or Matthew).
For urgent issues (locked out, emergency): escalate immediately.
"I'll get that through to [PM name] right away — they'll be in touch shortly. Is [phone number] the best number for them to reach you?"

─────────────────────────────────────────────
USE CASE: RENTAL APPLICATION FOLLOW-UP
─────────────────────────────────────────────
"Of course — let me get some details so I can pass this on to the right property manager. Which property did you apply for, and what's your full name?"
Log and route to appropriate PM.

─────────────────────────────────────────────
USE CASE: DIRECTIONS / OFFICE ACCESS
─────────────────────────────────────────────
"We're at 362–364 Chapel Road, Bankstown — easy to find, right on the main road. Is there anything else I can help with?"

=============================================================
OBJECTION HANDLERS
=============================================================
Only use these if the caller explicitly raises the objection.

─────────────────────────────────────────────
OBJECTION — "I'm happy with my current agent"
─────────────────────────────────────────────
"That's completely fair. We'd only suggest making a switch if the numbers genuinely worked in your favour — we've helped quite a few sellers in [suburb] recently who were in the same position. Would you at least be open to a free appraisal so you can see what the market's doing?"

─────────────────────────────────────────────
OBJECTION — "I'll just look online / I don't need help"
─────────────────────────────────────────────
"Totally get that. The thing is, a lot of our best opportunities go to buyers on our database before they even hit the website. Happy to keep you posted directly — I just need your email."

─────────────────────────────────────────────
OBJECTION — "Not a good time / I'm busy"
─────────────────────────────────────────────
"No worries at all. Can I grab your name and number and have someone call you back at a better time? Even 5 minutes is enough to get the ball rolling."

─────────────────────────────────────────────
OBJECTION — Caller is not interested
─────────────────────────────────────────────
"No dramas — would it be okay if I sent you a quick text with our details? That way you've got a direct line if anything changes."

=============================================================
ESCALATION — WHEN TO HAND OFF
=============================================================
ALWAYS escalate (and log escalated: true) for:
- Complaints or disputes
- Legal or financial questions
- Abusive or aggressive callers
- Any situation where your confidence is low

Escalation script:
"I want to make sure you get the best possible help with this — let me connect you with [Tony / the team] right now. Just bear with me one moment."

=============================================================
STEP 05 — SAVE CALL LOG (MANDATORY after every completed call)
=============================================================
After every call where intent was established — whether booked, transferred, info given, or escalated — call save_call_log with all details.

Required:
- caller_name, intent_category, outcome

Optional but important:
- caller_phone / caller_email
- property_address
- preferred_time
- staff_requested
- ai_summary
- sentiment
- confidence_score
- escalated

Confirmation after logging (if booking was made):
"Perfect, [name] — I've got that locked in for you. You'll hear from the team [at preferred_time / shortly]. Is there anything else I can help with today?"

=============================================================
HARD RULES — NON-NEGOTIABLE
=============================================================
- Language: ENGLISH ONLY at all times
- ONE question at a time
- Responses: 1 to 2 sentences max
- NEVER assume the caller's name
- ALWAYS call save_call_log after every completed call
- Value proposition must be delivered before the close for high-intent callers
- For transactional callers, skip the sales flow and answer directly
- Never give legal or financial advice
- Never make up property details
`.trim();
}

// ─── Tool Definition ──────────────────────────────────────
function getSaveCallLogTool() {
  return {
    type: "function",
    name: "save_call_log",
    description:
      "Saves a structured call log entry after every completed call. MUST be called once intent is established and the call has reached a natural conclusion (booking made, info given, transferred, or escalated).",
    parameters: {
      type: "object",
      properties: {
        caller_name: { type: "string", description: "Full name of the caller" },
        caller_phone: { type: "string", description: "Caller's phone number (if provided)" },
        caller_email: { type: "string", description: "Caller's email address (if provided)" },
        property_address: { type: "string", description: "Property address they asked about or want appraised/inspected" },
        intent_category: {
          type: "string",
          enum: [
            "property_inquiry",
            "inspection_booking",
            "inspection_reschedule",
            "rental_application_followup",
            "tenant_inquiry",
            "general_enquiry",
            "directions_access",
            "vendor_strata_partner",
            "staff_transfer",
            "owner_calling_pm",
            "appraisal_booking",
            "no_transcript_admin",
          ],
          description: "Classified intent of the call",
        },
        preferred_time: {
          type: "string",
          description: "Agreed appointment slot or preferred callback time — e.g. 'Tuesday at 11am', 'Saturday 10am'",
        },
        staff_requested: { type: "string", description: "Name of staff member requested" },
        outcome: {
          type: "string",
          enum: [
            "inspection_booked",
            "appraisal_booked",
            "transferred",
            "callback_scheduled",
            "info_provided",
            "market_update_sent",
            "message_taken",
            "escalated",
            "sms_sent",
          ],
          description: "What happened at the end of the call",
        },
        ai_summary: { type: "string", description: "1–2 sentence summary of the call" },
        sentiment: {
          type: "string",
          enum: ["positive", "neutral", "negative"],
          description: "Overall sentiment of the caller during the call",
        },
        confidence_score: {
          type: "number",
          description: "AI confidence score for this call, from 0.0 to 1.0",
        },
        escalated: { type: "boolean", description: "True if the call was escalated to a human team member" },
      },
      required: ["caller_name", "intent_category", "outcome"],
    },
  };
}

// ─── Recording — WAV file builder for conversation audio ───
class ConversationRecorder {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.userChunks = [];
    this.agentChunks = [];
    this.startTime = Date.now();
    this.events = [];
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

    const wavHeader = Buffer.alloc(44);
    const dataSize = mixedBuf.length;
    const fileSize = 36 + dataSize;

    wavHeader.write("RIFF", 0);
    wavHeader.writeUInt32LE(fileSize, 4);
    wavHeader.write("WAVE", 8);
    wavHeader.write("fmt ", 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);
    wavHeader.writeUInt16LE(1, 22);
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

// ─── Helpers ──────────────────────────────────────────────
function sendWsJson(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(payload));
  return true;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toFunctionCallPayload(value) {
  if (!value || typeof value !== "object") return null;

  if (
    value.type === "function_call" &&
    typeof value.name === "string" &&
    typeof value.arguments === "string" &&
    typeof value.call_id === "string"
  ) {
    return { name: value.name, arguments: value.arguments, call_id: value.call_id };
  }

  if (
    typeof value.name === "string" &&
    typeof value.arguments === "string" &&
    typeof value.call_id === "string"
  ) {
    return { name: value.name, arguments: value.arguments, call_id: value.call_id };
  }

  return null;
}

function extractFunctionCallsFromResponse(response) {
  const calls = [];
  const output = response?.output;

  if (Array.isArray(output)) {
    for (const item of output) {
      const fc = toFunctionCallPayload(item);
      if (fc) calls.push(fc);
    }
  }

  return calls;
}

// ─── Create OpenAI Realtime Session ───────────────────────
function createRealtimeSession(sessionId, onEvent) {
  const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
  const startMs = Date.now();

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    });

    ws.on("open", () => {
      console.log(`[${sessionId}] OpenAI connected (${Date.now() - startMs}ms)`);

      const sessionUpdate = {
        type: "session.update",
        session: {
          type: "realtime",
          model: OPENAI_REALTIME_MODEL,
          output_modalities: ["text"],
          audio: {
            input: {
              format: {
                type: "audio/pcm",
                rate: OPENAI_INPUT_SAMPLE_RATE,
              },
              turn_detection: {
                type: "server_vad",
                threshold: OPENAI_VAD_THRESHOLD,
                prefix_padding_ms: OPENAI_VAD_PREFIX_PADDING_MS,
                silence_duration_ms: OPENAI_VAD_SILENCE_DURATION_MS,
              },
            },
          },
          instructions: getSystemPrompt(),
          tools: [getSaveCallLogTool()],
          tool_choice: "auto",
        },
      };

      sendWsJson(ws, sessionUpdate);

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
        callLogs: [],
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

    ws.on("close", (code) => {
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
  sendWsJson(session.ws, { type: "input_audio_buffer.append", audio: base64Audio });
}

// ─── Trigger greeting ─────────────────────────────────────
function triggerGreeting(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.greetingTriggeredMs = Date.now();
  console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
  sendWsJson(session.ws, { type: "response.create" });
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
    } catch {}
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
    session.elevenLabsWs.send(JSON.stringify({ text, try_trigger_generation: true }));
  } else if (session) {
    session.textBuffer.push(text);
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
    } catch {}
    session.elevenLabsWs = null;
    session.elevenLabsReady = false;
    session.textBuffer = [];
  }
}

// ─── Handle function calls from OpenAI ────────────────────
async function handleFunctionCall(sessionId, eventOrItem) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const call = toFunctionCallPayload(eventOrItem);
  if (!call) return;

  if (call.name !== "save_call_log") return;

  const callId = typeof call.call_id === "string" ? call.call_id : null;

  if (callId && session.processedCallIds.has(callId)) return;
  if (callId) session.processedCallIds.add(callId);

  try {
    const args = JSON.parse(call.arguments);

    console.log(
      `[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`
    );

    const logId = uuidv4();

    const callLog = new CallLog({
      id: logId,
      sessionId,
      caller_name: args.caller_name || null,
      caller_phone: args.caller_phone || null,
      caller_email: args.caller_email || null,
      property_address: args.property_address || null,
      intent_category: args.intent_category,
      preferred_time: args.preferred_time || null,
      staff_requested: args.staff_requested || null,
      outcome: args.outcome,
      ai_summary: args.ai_summary || null,
      sentiment: args.sentiment || "neutral",
      confidence_score: args.confidence_score || null,
      escalated: args.escalated || false,
    });

    await callLog.save();
    session.callLogs.push({ id: logId, ...args });

    console.log(`[${sessionId}] Call log saved to MongoDB: ${logId}`);

    sendWsJson(session.ws, {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify({
          success: true,
          message: "Call log saved successfully.",
          log_id: logId,
          outcome: args.outcome,
        }),
      },
    });

    sendWsJson(session.ws, { type: "response.create" });
    session.onEvent({ type: "call-logged", data: args });
  } catch (err) {
    if (callId) session.processedCallIds.delete(callId);
    console.error(`[${sessionId}] Call log save failed:`, err.message);
  }
}

// ─── Event Hub — Process OpenAI Realtime events ───────────
async function handleRealtimeEvent(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return;

  switch (event.type) {
    case "session.created":
    case "session.updated":
      break;

    case "response.created":
      session.isResponseActive = true;
      if (!session.firstResponseCreatedMs) {
        session.firstResponseCreatedMs = Date.now();
      }
      openElevenLabsStream(sessionId);
      break;

    case "response.output_text.delta":
      if (session.elevenLabsReady) {
        sendTextToElevenLabs(sessionId, event.delta);
      } else {
        session.textBuffer.push(event.delta);
      }
      session.onEvent({ type: "transcript-delta", delta: event.delta });
      break;

    case "response.text.delta":
      if (session.elevenLabsReady) {
        sendTextToElevenLabs(sessionId, event.delta);
      } else {
        session.textBuffer.push(event.delta);
      }
      session.onEvent({ type: "transcript-delta", delta: event.delta });
      break;

    case "response.output_text.done":
      flushElevenLabsStream(sessionId);
      session.onEvent({ type: "transcript-done", transcript: event.text });
      break;

    case "response.text.done":
      flushElevenLabsStream(sessionId);
      session.onEvent({ type: "transcript-done", transcript: event.text });
      break;

    case "response.done": {
      session.isResponseActive = false;

      const calls = extractFunctionCallsFromResponse(event.response);
      for (const fc of calls) {
        await handleFunctionCall(sessionId, fc);
      }
      break;
    }

    case "response.output_item.done":
      if (event.item) {
        const fc = toFunctionCallPayload(event.item);
        if (fc) await handleFunctionCall(sessionId, fc);
      }
      break;

    case "response.function_call_arguments.done":
      await handleFunctionCall(sessionId, event);
      break;

    case "input_audio_buffer.speech_started":
      console.log(`[${sessionId}] User interrupted — stopping AI voice`);
      if (session.isResponseActive) {
        sendWsJson(session.ws, { type: "response.cancel" });
      }
      closeElevenLabsWs(sessionId);
      openElevenLabsStream(sessionId, true);
      session.onEvent({ type: "speech-started" });
      break;

    case "conversation.item.input_audio_transcription.completed":
      session.onEvent({ type: "user-transcript", transcript: event.transcript });
      break;

    case "error":
      console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
      session.onEvent({ type: "error", error: event.error });
      break;

    default:
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
    try {
      session.ws.close();
    } catch {}
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
      case "call-logged":
        socket.emit("call-logged", event.data);
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
      default:
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
    if (data?.audio) {
      sendAudio(socket.id, data.audio);
    }
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
app.get("/api/call-logs", async (req, res) => {
  try {
    const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
    res.json(logs);
  } catch (err) {
    console.error("Failed to fetch call logs:", err.message);
    res.status(500).json({ error: "Failed to fetch call logs" });
  }
});

app.get("/api/call-logs/category/:category", async (req, res) => {
  try {
    const logs = await CallLog.find({ intent_category: req.params.category })
      .sort({ createdAt: -1 })
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch call logs" });
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
║   Ray White Bankstown — AI Receptionist (OmniSuiteAI)        ║
║   Running on http://localhost:${PORT}                         ║
║                                                              ║
║   Flow: Greeting → Value Prop → Agentic Close                ║
║   Use Cases: Inspect · Appraise · Transfer · Tenant · Info   ║
║   Escalation: Complaints · Legal · Abusive → Human           ║
║                                                              ║
║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
║   Recordings Dir:  ${RECORDINGS_DIR}                         ║
║   MongoDB:         ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
╚══════════════════════════════════════════════════════════════╝
  `);
});