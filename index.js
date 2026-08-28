// // // require("dotenv").config();

// // // const express = require("express");
// // // const http = require("http");
// // // const { Server } = require("socket.io");
// // // const WebSocket = require("ws");
// // // const path = require("path");
// // // const fs = require("fs");
// // // const { v4: uuidv4 } = require("uuid");
// // // const mongoose = require("mongoose");

// // // // ─── Config ───────────────────────────────────────────────
// // // const PORT = process.env.PORT || 3000;
// // // const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// // // const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// // // const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mkrzcZmzalRKwXdd";
// // // const MONGODB_URI = process.env.MONGODB_URI;
// // // const PREWARM_TTL_MS = 60_000;

// // // // GA Realtime defaults
// // // const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
// // // const OPENAI_INPUT_SAMPLE_RATE = Number(process.env.OPENAI_INPUT_SAMPLE_RATE || 24000);
// // // const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.8);
// // // const OPENAI_VAD_PREFIX_PADDING_MS = Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 300);
// // // const OPENAI_VAD_SILENCE_DURATION_MS = Number(process.env.OPENAI_VAD_SILENCE_DURATION_MS || 2000);

// // // // ─── MongoDB Connection ───────────────────────────────────
// // // if (!MONGODB_URI) {
// // //   console.error("❌  MONGODB_URI is not set in .env — call logs will NOT be saved.");
// // // } else {
// // //   mongoose
// // //     .connect(MONGODB_URI)
// // //     .then(() => console.log("✅  MongoDB connected"))
// // //     .catch((err) => console.error("❌  MongoDB connection error:", err.message));
// // // }

// // // // ─── Call Log Schema / Model ──────────────────────────────
// // // const callLogSchema = new mongoose.Schema(
// // //   {
// // //     id: { type: String, required: true, unique: true },
// // //     sessionId: { type: String, required: true },

// // //     caller_name: { type: String, default: null },
// // //     caller_phone: { type: String, default: null },
// // //     caller_email: { type: String, default: null },

// // //     property_address: { type: String, default: null },
// // //     intent_category: {
// // //       type: String,
// // //       enum: [
// // //         "property_inquiry",
// // //         "inspection_booking",
// // //         "inspection_reschedule",
// // //         "rental_application_followup",
// // //         "tenant_inquiry",
// // //         "general_enquiry",
// // //         "directions_access",
// // //         "vendor_strata_partner",
// // //         "staff_transfer",
// // //         "owner_calling_pm",
// // //         "appraisal_booking",
// // //         "no_transcript_admin",
// // //       ],
// // //       required: true,
// // //     },

// // //     preferred_time: { type: String, default: null },
// // //     staff_requested: { type: String, default: null },
// // //     outcome: {
// // //       type: String,
// // //       enum: [
// // //         "inspection_booked",
// // //         "appraisal_booked",
// // //         "transferred",
// // //         "callback_scheduled",
// // //         "info_provided",
// // //         "market_update_sent",
// // //         "message_taken",
// // //         "escalated",
// // //         "sms_sent",
// // //       ],
// // //       required: true,
// // //     },

// // //     ai_summary: { type: String, default: null },
// // //     sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
// // //     confidence_score: { type: Number, default: null },
// // //     escalated: { type: Boolean, default: false },
// // //   },
// // //   { timestamps: true }
// // // );

// // // const CallLog = mongoose.model("CallLog", callLogSchema);

// // // // ─── Ensure recordings directory exists ───────────────────
// // // const RECORDINGS_DIR = path.join(__dirname, "recordings");
// // // if (!fs.existsSync(RECORDINGS_DIR)) {
// // //   fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
// // // }

// // // // ─── Express + Socket.IO ──────────────────────────────────
// // // const app = express();
// // // const server = http.createServer(app);
// // // const io = new Server(server, { cors: { origin: "*" } });

// // // app.use(express.static(path.join(__dirname, "public")));
// // // app.use("/recordings", express.static(RECORDINGS_DIR));

// // // // ─── Session State ────────────────────────────────────────
// // // const sessions = new Map();
// // // const prewarmStates = new Map();

// // // // ============================================================
// // // // SYSTEM PROMPT — Ray White Bankstown AI Receptionist
// // // // ============================================================
// // // function getSystemPrompt() {
// // //   return `
// // // =============================================================
// // // ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING ELSE.
// // // =============================================================
// // // You MUST speak and respond in English at all times, no matter what.
// // // - If the caller speaks in another language, respond ONLY in English.
// // // - Do NOT switch to their language, do NOT mix languages.
// // // - If the caller insists on another language, say: "Sorry, I can only assist in English at the moment."
// // // =============================================================

// // // ### IDENTITY ###
// // // You are the AI receptionist for Ray White Bankstown — one of the area's top-performing real estate agencies.
// // // This is an inbound call. You answer all routine enquiries, book inspections and appraisals, handle staff transfers, and escalate complex matters gracefully.
// // // You sound like a friendly, professional Australian receptionist — warm, helpful, and locally knowledgeable.

// // // ### AGENCY DETAILS (use naturally in conversation) ###
// // // - Agency: Ray White Bankstown
// // // - Office address: 362–364 Chapel Road, Bankstown
// // // - Key suburbs served: Bankstown, Georges Hall, Chester Hill, Wiley Park, Sefton, Mount Lewis, Condell Park
// // // - Directors: Tony Roumanous, Charlie Sioud
// // // - Property Managers: Farah Antone, Michelle Clay, Mary, Matthew Natoli
// // // - Sales/Other: Joshua Nassif, Jordon Le Breux, Delita (reception fallback)
// // // - Website: raywhitebankstown.com.au

// // // ### AI DISCLOSURE RULE ###
// // // - Do NOT volunteer that you are AI. Just be the receptionist.
// // // - ONLY if someone explicitly asks "are you a robot?", "are you AI?", or "am I talking to a real person?" — then be honest:
// // //   "Good question — I'm actually an AI receptionist helping the Ray White Bankstown team manage calls. But I can book inspections, answer your questions, and connect you with the right person just as well. How can I help?"
// // // - After admitting it, pivot straight back to helping them.

// // // ### PERSONALITY ###
// // // - Warm, natural Australian manner — friendly and professional
// // // - Locally knowledgeable — sound like you know Bankstown and the surrounding suburbs
// // // - Natural filler words: "absolutely", "no worries", "great", "of course", "sure thing"
// // // - Never pushy — helpful and genuinely useful
// // // - Match the caller's energy: relaxed with relaxed callers, more efficient with busy callers

// // // ### HOW YOU TALK ###
// // // - SHORT sentences — 1 to 2 sentences per response max
// // // - Use contractions: "what's", "we've", "I'll", "you're"
// // // - ACKNOWLEDGE what they said before you respond
// // // - ONE question at a time — never stack multiple questions
// // // - If silence or can't hear: "Still there?" or "Sorry, didn't catch that — could you repeat that?"

// // // =============================================================
// // // CALL FLOW — HAPPY PATH (Steps 01 → 02 → 03)
// // // =============================================================
// // // This is the PRIMARY flow for any high-intent caller (selling, renting, inspecting, appraising).
// // // For pure transactional calls (just asking for a time / address), answer directly and efficiently — no need for the full sales flow.

// // // ─────────────────────────────────────────────
// // // STEP 01 — GREETING & INTENT CAPTURE
// // // ─────────────────────────────────────────────
// // // Always greet first. You do NOT know the caller's name. Ask early and use it naturally.

// // // Start with:
// // // "Thanks for calling Ray White Bankstown, you're through to the front desk. How can I help you today?"

// // // Wait for their response.

// // // Then ask for their name if they haven't given it:
// // // "Great — and who am I speaking with?"

// // // Once you have their name, use it naturally.

// // // Then clarify their intent if not already clear:
// // // - Property inquiry → "And which property were you interested in?"
// // // - Selling → "And whereabouts is the property?"
// // // - Renting / Tenant → "And is this about a property you're currently renting, or one you're looking to rent?"
// // // - Staff transfer → Proceed immediately to STEP — STAFF TRANSFER

// // // ─────────────────────────────────────────────
// // // INTENT CLASSIFICATION (internal — determines next steps)
// // // ─────────────────────────────────────────────
// // // Classify the call into one of these categories internally:
// // // - property_inquiry: Asking about listings, property details, or inspection times
// // // - inspection_booking: Wants to book or reschedule an inspection
// // // - appraisal_booking: Wants to sell — free appraisal
// // // - rental_application_followup: Checking on a rental application
// // // - tenant_inquiry: Existing tenant with a question or issue
// // // - general_enquiry: Office hours, directions, general questions
// // // - directions_access: Getting to office or a property
// // // - vendor_strata_partner: External partner or strata call
// // // - staff_transfer: Wants to speak to a specific staff member
// // // - owner_calling_pm: Owner calling about their managed property

// // // ─────────────────────────────────────────────
// // // STEP 02 — VALUE PROPOSITION
// // // ─────────────────────────────────────────────
// // // Trigger ONLY for high-intent callers: sellers, serious buyers/renters, or appraisal requests.
// // // Skip for transactional callers (just need a time, address, or transfer).

// // // [DELIVER THIS NATURAL SCRIPT — adapt as needed]

// // // "Great — here at Ray White Bankstown we bring the whole team to every property. Directors Tony Roumanous and Charlie Sioud, plus our full sales and property management crew.
// // // Most of our clients are getting strong results right now because of our local knowledge across Bankstown, Georges Hall, Chester Hill, and Wiley Park — plus access to thousands of active buyers and tenants on our database.
// // // Whether you want a free appraisal, to book an inspection, or list your home, I can get you sorted right now — no waiting on hold or chasing emails."

// // // ─────────────────────────────────────────────
// // // STEP 03 — AGENTIC / PROACTIVE CLOSE
// // // ─────────────────────────────────────────────
// // // Don't end the conversation passively. Always offer specific next steps.

// // // For APPRAISAL / SELLING intent:
// // // "I've checked our calendar and we've got a couple of great options this week — we can do a free appraisal at your place on Tuesday at 11am or Thursday at 2pm. Which one works better for you?
// // // Or if you'd prefer, I can send you a quick market update for your street first so you can see recent sales — would you like that?"

// // // For INSPECTION BOOKING intent:
// // // "I can lock in a private inspection for you — we've got availability tomorrow at 5:30pm, or Saturday morning at 10am. Would either of those work?"

// // // For RENTAL ENQUIRY intent:
// // // "We've got several properties in your range opening this Saturday. Want me to shortlist two or three and book inspections for you?"

// // // For STAFF TRANSFER intent:
// // // "[Staff name] is available — I'll connect you now. One moment."
// // // (If unavailable): "They're with a client right now. I can take a message and have them call you back, or I can book a specific callback time — which would you prefer?"

// // // ─────────────────────────────────────────────
// // // STEP 04 — COLLECT DETAILS (when booking confirmed)
// // // ─────────────────────────────────────────────
// // // Collect conversationally — NOT like a form. One detail at a time:
// // // - Name (may already have it)
// // // - Property address (if appraisal) or which property they want to inspect
// // // - Preferred contact: phone or email
// // // - Best time / confirmed slot
// // // - Any specific concerns

// // // =============================================================
// // // SPECIFIC USE CASES
// // // =============================================================

// // // ─────────────────────────────────────────────
// // // USE CASE: HOME OPEN / INSPECTION TIMES
// // // ─────────────────────────────────────────────
// // // Caller asks for open home times or property details.
// // // Answer directly and efficiently:
// // // "Yep, absolutely — for [address] we've got a home open on [day] at [time]. Would you like me to lock in a spot for you, or are you happy to just show up?"

// // // Mock inspection schedule (use these in demo):
// // // - 67 Jocelyn Street, Chester Hill: Wednesday 5:00–5:30pm, Saturday 10:00–10:30am
// // // - 103 Flinders Road: Saturday 10:30–11:00am
// // // - 58 Marden Street: Thursday 6:00–6:30pm, Saturday 11:00–11:30am
// // // - 23 Mount Lewis Avenue: Saturday 10:00–10:30am

// // // ─────────────────────────────────────────────
// // // USE CASE: BOOKING OR RESCHEDULING INSPECTIONS
// // // ─────────────────────────────────────────────
// // // "No worries, I can lock that in for you. Just to confirm — is [address] the right property, and does [time slot] still work?"
// // // Collect name + phone/email, confirm, then call save_call_log.

// // // ─────────────────────────────────────────────
// // // USE CASE: SELLING / FREE APPRAISAL
// // // ─────────────────────────────────────────────
// // // This is the highest-value use case. Always deliver Step 02 (value prop) before Step 03 (close).
// // // Collect: name, property address, preferred appraisal time, best contact.

// // // ─────────────────────────────────────────────
// // // USE CASE: STAFF TRANSFER
// // // ─────────────────────────────────────────────
// // // If the caller asks for a specific staff member by name, respond immediately:
// // // "Sure, let me put you through to [name] now."
// // // If unavailable: offer message + callback. Always log with intent_category: "staff_transfer".

// // // ─────────────────────────────────────────────
// // // USE CASE: TENANT INQUIRIES / MAINTENANCE
// // // ─────────────────────────────────────────────
// // // Collect: name, property address, nature of the issue.
// // // Route to relevant property manager (Farah, Michelle, Mary, or Matthew).
// // // For urgent issues (locked out, emergency): escalate immediately.
// // // "I'll get that through to [PM name] right away — they'll be in touch shortly. Is [phone number] the best number for them to reach you?"

// // // ─────────────────────────────────────────────
// // // USE CASE: RENTAL APPLICATION FOLLOW-UP
// // // ─────────────────────────────────────────────
// // // "Of course — let me get some details so I can pass this on to the right property manager. Which property did you apply for, and what's your full name?"
// // // Log and route to appropriate PM.

// // // ─────────────────────────────────────────────
// // // USE CASE: DIRECTIONS / OFFICE ACCESS
// // // ─────────────────────────────────────────────
// // // "We're at 362–364 Chapel Road, Bankstown — easy to find, right on the main road. Is there anything else I can help with?"

// // // =============================================================
// // // OBJECTION HANDLERS
// // // =============================================================
// // // Only use these if the caller explicitly raises the objection.

// // // ─────────────────────────────────────────────
// // // OBJECTION — "I'm happy with my current agent"
// // // ─────────────────────────────────────────────
// // // "That's completely fair. We'd only suggest making a switch if the numbers genuinely worked in your favour — we've helped quite a few sellers in [suburb] recently who were in the same position. Would you at least be open to a free appraisal so you can see what the market's doing?"

// // // ─────────────────────────────────────────────
// // // OBJECTION — "I'll just look online / I don't need help"
// // // ─────────────────────────────────────────────
// // // "Totally get that. The thing is, a lot of our best opportunities go to buyers on our database before they even hit the website. Happy to keep you posted directly — I just need your email."

// // // ─────────────────────────────────────────────
// // // OBJECTION — "Not a good time / I'm busy"
// // // ─────────────────────────────────────────────
// // // "No worries at all. Can I grab your name and number and have someone call you back at a better time? Even 5 minutes is enough to get the ball rolling."

// // // ─────────────────────────────────────────────
// // // OBJECTION — Caller is not interested
// // // ─────────────────────────────────────────────
// // // "No dramas — would it be okay if I sent you a quick text with our details? That way you've got a direct line if anything changes."

// // // =============================================================
// // // ESCALATION — WHEN TO HAND OFF
// // // =============================================================
// // // ALWAYS escalate (and log escalated: true) for:
// // // - Complaints or disputes
// // // - Legal or financial questions
// // // - Abusive or aggressive callers
// // // - Any situation where your confidence is low

// // // Escalation script:
// // // "I want to make sure you get the best possible help with this — let me connect you with [Tony / the team] right now. Just bear with me one moment."

// // // =============================================================
// // // STEP 05 — SAVE CALL LOG (MANDATORY after every completed call)
// // // =============================================================
// // // After every call where intent was established — whether booked, transferred, info given, or escalated — call save_call_log with all details.

// // // Required:
// // // - caller_name, intent_category, outcome

// // // Optional but important:
// // // - caller_phone / caller_email
// // // - property_address
// // // - preferred_time
// // // - staff_requested
// // // - ai_summary
// // // - sentiment
// // // - confidence_score
// // // - escalated

// // // Confirmation after logging (if booking was made):
// // // "Perfect, [name] — I've got that locked in for you. You'll hear from the team [at preferred_time / shortly]. Is there anything else I can help with today?"

// // // =============================================================
// // // HARD RULES — NON-NEGOTIABLE
// // // =============================================================
// // // - Language: ENGLISH ONLY at all times
// // // - ONE question at a time
// // // - Responses: 1 to 2 sentences max
// // // - NEVER assume the caller's name
// // // - ALWAYS call save_call_log after every completed call
// // // - Value proposition must be delivered before the close for high-intent callers
// // // - For transactional callers, skip the sales flow and answer directly
// // // - Never give legal or financial advice
// // // - Never make up property details
// // // `.trim();
// // // }

// // // // ─── Tool Definition ──────────────────────────────────────
// // // function getSaveCallLogTool() {
// // //   return {
// // //     type: "function",
// // //     name: "save_call_log",
// // //     description:
// // //       "Saves a structured call log entry after every completed call. MUST be called once intent is established and the call has reached a natural conclusion (booking made, info given, transferred, or escalated).",
// // //     parameters: {
// // //       type: "object",
// // //       properties: {
// // //         caller_name: { type: "string", description: "Full name of the caller" },
// // //         caller_phone: { type: "string", description: "Caller's phone number (if provided)" },
// // //         caller_email: { type: "string", description: "Caller's email address (if provided)" },
// // //         property_address: { type: "string", description: "Property address they asked about or want appraised/inspected" },
// // //         intent_category: {
// // //           type: "string",
// // //           enum: [
// // //             "property_inquiry",
// // //             "inspection_booking",
// // //             "inspection_reschedule",
// // //             "rental_application_followup",
// // //             "tenant_inquiry",
// // //             "general_enquiry",
// // //             "directions_access",
// // //             "vendor_strata_partner",
// // //             "staff_transfer",
// // //             "owner_calling_pm",
// // //             "appraisal_booking",
// // //             "no_transcript_admin",
// // //           ],
// // //           description: "Classified intent of the call",
// // //         },
// // //         preferred_time: {
// // //           type: "string",
// // //           description: "Agreed appointment slot or preferred callback time — e.g. 'Tuesday at 11am', 'Saturday 10am'",
// // //         },
// // //         staff_requested: { type: "string", description: "Name of staff member requested" },
// // //         outcome: {
// // //           type: "string",
// // //           enum: [
// // //             "inspection_booked",
// // //             "appraisal_booked",
// // //             "transferred",
// // //             "callback_scheduled",
// // //             "info_provided",
// // //             "market_update_sent",
// // //             "message_taken",
// // //             "escalated",
// // //             "sms_sent",
// // //           ],
// // //           description: "What happened at the end of the call",
// // //         },
// // //         ai_summary: { type: "string", description: "1–2 sentence summary of the call" },
// // //         sentiment: {
// // //           type: "string",
// // //           enum: ["positive", "neutral", "negative"],
// // //           description: "Overall sentiment of the caller during the call",
// // //         },
// // //         confidence_score: {
// // //           type: "number",
// // //           description: "AI confidence score for this call, from 0.0 to 1.0",
// // //         },
// // //         escalated: { type: "boolean", description: "True if the call was escalated to a human team member" },
// // //       },
// // //       required: ["caller_name", "intent_category", "outcome"],
// // //     },
// // //   };
// // // }

// // // // ─── Recording — WAV file builder for conversation audio ───
// // // class ConversationRecorder {
// // //   constructor(sessionId) {
// // //     this.sessionId = sessionId;
// // //     this.userChunks = [];
// // //     this.agentChunks = [];
// // //     this.startTime = Date.now();
// // //     this.events = [];
// // //   }

// // //   addUserAudio(base64Pcm16) {
// // //     const buf = Buffer.from(base64Pcm16, "base64");
// // //     this.userChunks.push(buf);
// // //     this.events.push({ type: "user", time: Date.now() - this.startTime, bytes: buf.length });
// // //   }

// // //   addAgentAudio(base64Pcm16) {
// // //     const buf = Buffer.from(base64Pcm16, "base64");
// // //     this.agentChunks.push(buf);
// // //     this.events.push({ type: "agent", time: Date.now() - this.startTime, bytes: buf.length });
// // //   }

// // //   _resample(pcmBuffer, srcRate, dstRate) {
// // //     if (srcRate === dstRate) return pcmBuffer;
// // //     const srcSamples = pcmBuffer.length / 2;
// // //     const ratio = srcRate / dstRate;
// // //     const dstSamples = Math.floor(srcSamples / ratio);
// // //     const out = Buffer.alloc(dstSamples * 2);

// // //     for (let i = 0; i < dstSamples; i++) {
// // //       const srcIdx = i * ratio;
// // //       const lo = Math.floor(srcIdx);
// // //       const hi = Math.min(lo + 1, srcSamples - 1);
// // //       const frac = srcIdx - lo;
// // //       const sLo = pcmBuffer.readInt16LE(lo * 2);
// // //       const sHi = pcmBuffer.readInt16LE(hi * 2);
// // //       const val = Math.round(sLo + (sHi - sLo) * frac);
// // //       out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
// // //     }
// // //     return out;
// // //   }

// // //   saveToFile() {
// // //     const OUTPUT_RATE = 24000;
// // //     const userPcm = Buffer.concat(this.userChunks);
// // //     const agentPcmRaw = Buffer.concat(this.agentChunks);
// // //     const agentPcm = this._resample(agentPcmRaw, 16000, OUTPUT_RATE);

// // //     const userSamples = userPcm.length / 2;
// // //     const agentSamples = agentPcm.length / 2;
// // //     const totalSamples = Math.max(userSamples, agentSamples);
// // //     const mixedBuf = Buffer.alloc(totalSamples * 2);

// // //     for (let i = 0; i < totalSamples; i++) {
// // //       let val = 0;
// // //       if (i < userSamples) val += userPcm.readInt16LE(i * 2);
// // //       if (i < agentSamples) val += agentPcm.readInt16LE(i * 2);
// // //       val = Math.max(-32768, Math.min(32767, val));
// // //       mixedBuf.writeInt16LE(val, i * 2);
// // //     }

// // //     const wavHeader = Buffer.alloc(44);
// // //     const dataSize = mixedBuf.length;
// // //     const fileSize = 36 + dataSize;

// // //     wavHeader.write("RIFF", 0);
// // //     wavHeader.writeUInt32LE(fileSize, 4);
// // //     wavHeader.write("WAVE", 8);
// // //     wavHeader.write("fmt ", 12);
// // //     wavHeader.writeUInt32LE(16, 16);
// // //     wavHeader.writeUInt16LE(1, 20);
// // //     wavHeader.writeUInt16LE(1, 22);
// // //     wavHeader.writeUInt32LE(OUTPUT_RATE, 24);
// // //     wavHeader.writeUInt32LE(OUTPUT_RATE * 2, 28);
// // //     wavHeader.writeUInt16LE(2, 32);
// // //     wavHeader.writeUInt16LE(16, 34);
// // //     wavHeader.write("data", 36);
// // //     wavHeader.writeUInt32LE(dataSize, 40);

// // //     const wav = Buffer.concat([wavHeader, mixedBuf]);
// // //     const filename = `call_${this.sessionId}_${Date.now()}.wav`;
// // //     const filepath = path.join(RECORDINGS_DIR, filename);
// // //     fs.writeFileSync(filepath, wav);

// // //     console.log(`[Recording] Saved: ${filepath} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`);
// // //     return { filename, filepath, sizeMB: (wav.length / 1024 / 1024).toFixed(2) };
// // //   }
// // // }

// // // // ─── Helpers ──────────────────────────────────────────────
// // // function sendWsJson(ws, payload) {
// // //   if (!ws || ws.readyState !== WebSocket.OPEN) return false;
// // //   ws.send(JSON.stringify(payload));
// // //   return true;
// // // }

// // // function safeJsonParse(text) {
// // //   try {
// // //     return JSON.parse(text);
// // //   } catch {
// // //     return null;
// // //   }
// // // }

// // // function toFunctionCallPayload(value) {
// // //   if (!value || typeof value !== "object") return null;

// // //   if (
// // //     value.type === "function_call" &&
// // //     typeof value.name === "string" &&
// // //     typeof value.arguments === "string" &&
// // //     typeof value.call_id === "string"
// // //   ) {
// // //     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
// // //   }

// // //   if (
// // //     typeof value.name === "string" &&
// // //     typeof value.arguments === "string" &&
// // //     typeof value.call_id === "string"
// // //   ) {
// // //     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
// // //   }

// // //   return null;
// // // }

// // // function extractFunctionCallsFromResponse(response) {
// // //   const calls = [];
// // //   const output = response?.output;

// // //   if (Array.isArray(output)) {
// // //     for (const item of output) {
// // //       const fc = toFunctionCallPayload(item);
// // //       if (fc) calls.push(fc);
// // //     }
// // //   }

// // //   return calls;
// // // }

// // // // ─── Create OpenAI Realtime Session ───────────────────────
// // // function createRealtimeSession(sessionId, onEvent) {
// // //   const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
// // //   const startMs = Date.now();

// // //   return new Promise((resolve, reject) => {
// // //     const ws = new WebSocket(url, {
// // //       headers: {
// // //         Authorization: `Bearer ${OPENAI_API_KEY}`,
// // //       },
// // //     });

// // //     ws.on("open", () => {
// // //       console.log(`[${sessionId}] OpenAI connected (${Date.now() - startMs}ms)`);

// // //       const sessionUpdate = {
// // //         type: "session.update",
// // //         session: {
// // //           type: "realtime",
// // //           model: OPENAI_REALTIME_MODEL,
// // //           output_modalities: ["text"],
// // //           audio: {
// // //             input: {
// // //               format: {
// // //                 type: "audio/pcm",
// // //                 rate: OPENAI_INPUT_SAMPLE_RATE,
// // //               },
// // //               turn_detection: {
// // //                 type: "server_vad",
// // //                 threshold: OPENAI_VAD_THRESHOLD,
// // //                 prefix_padding_ms: OPENAI_VAD_PREFIX_PADDING_MS,
// // //                 silence_duration_ms: OPENAI_VAD_SILENCE_DURATION_MS,
// // //               },
// // //             },
// // //           },
// // //           instructions: getSystemPrompt(),
// // //           tools: [getSaveCallLogTool()],
// // //           tool_choice: "auto",
// // //         },
// // //       };

// // //       sendWsJson(ws, sessionUpdate);

// // //       const session = {
// // //         ws,
// // //         elevenLabsWs: null,
// // //         elevenLabsReady: false,
// // //         textBuffer: [],
// // //         isResponseActive: false,
// // //         onEvent,
// // //         startMs,
// // //         openAiConnectedMs: Date.now(),
// // //         elevenLabsConnectedMs: null,
// // //         greetingTriggeredMs: null,
// // //         firstResponseCreatedMs: null,
// // //         firstAudioDeltaLogged: false,
// // //         processedCallIds: new Set(),
// // //         recorder: new ConversationRecorder(sessionId),
// // //         callLogs: [],
// // //       };

// // //       sessions.set(sessionId, session);
// // //       openElevenLabsStream(sessionId);
// // //       resolve();
// // //     });

// // //     ws.on("message", async (data) => {
// // //       try {
// // //         const event = JSON.parse(data.toString());
// // //         await handleRealtimeEvent(sessionId, event);
// // //       } catch (err) {
// // //         console.error(`[${sessionId}] Parse error:`, err.message);
// // //       }
// // //     });

// // //     ws.on("error", (err) => {
// // //       console.error(`[${sessionId}] OpenAI WS error:`, err.message);
// // //       onEvent({ type: "error", error: { message: err.message } });
// // //       reject(err);
// // //     });

// // //     ws.on("close", (code) => {
// // //       console.log(`[${sessionId}] OpenAI WS closed: ${code}`);
// // //       closeElevenLabsWs(sessionId);
// // //       sessions.delete(sessionId);
// // //       onEvent({ type: "session-closed" });
// // //     });
// // //   });
// // // }

// // // // ─── Send user audio to OpenAI ────────────────────────────
// // // function sendAudio(sessionId, base64Audio) {
// // //   const session = sessions.get(sessionId);
// // //   if (!session) return;

// // //   session.recorder.addUserAudio(base64Audio);
// // //   sendWsJson(session.ws, { type: "input_audio_buffer.append", audio: base64Audio });
// // // }

// // // // ─── Trigger greeting ─────────────────────────────────────
// // // function triggerGreeting(sessionId) {
// // //   const session = sessions.get(sessionId);
// // //   if (!session) return;

// // //   session.greetingTriggeredMs = Date.now();
// // //   console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
// // //   sendWsJson(session.ws, { type: "response.create" });
// // // }

// // // // ─── ElevenLabs TTS Stream ────────────────────────────────
// // // function openElevenLabsStream(sessionId, force = false) {
// // //   const session = sessions.get(sessionId);
// // //   if (!session) return;

// // //   if (
// // //     !force &&
// // //     session.elevenLabsWs &&
// // //     (session.elevenLabsWs.readyState === WebSocket.OPEN ||
// // //       session.elevenLabsWs.readyState === WebSocket.CONNECTING)
// // //   ) {
// // //     return;
// // //   }

// // //   closeElevenLabsWs(sessionId);

// // //   const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
// // //   const elWs = new WebSocket(wsUrl);

// // //   elWs.on("open", () => {
// // //     console.log(`[${sessionId}] ElevenLabs connected`);
// // //     session.elevenLabsConnectedMs = Date.now();

// // //     elWs.send(
// // //       JSON.stringify({
// // //         text: " ",
// // //         voice_settings: {
// // //           stability: 0.55,
// // //           similarity_boost: 0.78,
// // //           style: 0.35,
// // //           use_speaker_boost: true,
// // //         },
// // //         xi_api_key: ELEVENLABS_API_KEY,
// // //       })
// // //     );

// // //     if (session.elevenLabsWs === elWs) {
// // //       session.elevenLabsReady = true;
// // //       for (const text of session.textBuffer) {
// // //         sendTextToElevenLabs(sessionId, text);
// // //       }
// // //       session.textBuffer = [];
// // //     }
// // //   });

// // //   elWs.on("message", (data) => {
// // //     try {
// // //       const msg = JSON.parse(data.toString());
// // //       if (msg.audio) {
// // //         session.recorder.addAgentAudio(msg.audio);
// // //         session.onEvent({ type: "audio-delta", delta: msg.audio });
// // //       }
// // //     } catch {}
// // //   });

// // //   elWs.on("error", (err) => {
// // //     console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`);
// // //   });

// // //   elWs.on("close", () => {
// // //     if (session.elevenLabsWs === elWs) {
// // //       session.elevenLabsReady = false;
// // //     }
// // //   });

// // //   session.elevenLabsWs = elWs;
// // // }

// // // function sendTextToElevenLabs(sessionId, text) {
// // //   const session = sessions.get(sessionId);
// // //   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
// // //     session.elevenLabsWs.send(JSON.stringify({ text, try_trigger_generation: true }));
// // //   } else if (session) {
// // //     session.textBuffer.push(text);
// // //   }
// // // }

// // // function flushElevenLabsStream(sessionId) {
// // //   const session = sessions.get(sessionId);
// // //   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
// // //     session.elevenLabsWs.send(JSON.stringify({ text: "" }));
// // //   }
// // // }

// // // function closeElevenLabsWs(sessionId) {
// // //   const session = sessions.get(sessionId);
// // //   if (session?.elevenLabsWs) {
// // //     try {
// // //       if (session.elevenLabsWs.readyState === WebSocket.CONNECTING) {
// // //         session.elevenLabsWs.terminate();
// // //       } else if (session.elevenLabsWs.readyState === WebSocket.OPEN) {
// // //         session.elevenLabsWs.close();
// // //       }
// // //     } catch {}
// // //     session.elevenLabsWs = null;
// // //     session.elevenLabsReady = false;
// // //     session.textBuffer = [];
// // //   }
// // // }

// // // // ─── Handle function calls from OpenAI ────────────────────
// // // async function handleFunctionCall(sessionId, eventOrItem) {
// // //   const session = sessions.get(sessionId);
// // //   if (!session) return;

// // //   const call = toFunctionCallPayload(eventOrItem);
// // //   if (!call) return;

// // //   if (call.name !== "save_call_log") return;

// // //   const callId = typeof call.call_id === "string" ? call.call_id : null;

// // //   if (callId && session.processedCallIds.has(callId)) return;
// // //   if (callId) session.processedCallIds.add(callId);

// // //   try {
// // //     const args = JSON.parse(call.arguments);

// // //     console.log(
// // //       `[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`
// // //     );

// // //     const logId = uuidv4();

// // //     const callLog = new CallLog({
// // //       id: logId,
// // //       sessionId,
// // //       caller_name: args.caller_name || null,
// // //       caller_phone: args.caller_phone || null,
// // //       caller_email: args.caller_email || null,
// // //       property_address: args.property_address || null,
// // //       intent_category: args.intent_category,
// // //       preferred_time: args.preferred_time || null,
// // //       staff_requested: args.staff_requested || null,
// // //       outcome: args.outcome,
// // //       ai_summary: args.ai_summary || null,
// // //       sentiment: args.sentiment || "neutral",
// // //       confidence_score: args.confidence_score || null,
// // //       escalated: args.escalated || false,
// // //     });

// // //     await callLog.save();
// // //     session.callLogs.push({ id: logId, ...args });

// // //     console.log(`[${sessionId}] Call log saved to MongoDB: ${logId}`);

// // //     sendWsJson(session.ws, {
// // //       type: "conversation.item.create",
// // //       item: {
// // //         type: "function_call_output",
// // //         call_id: call.call_id,
// // //         output: JSON.stringify({
// // //           success: true,
// // //           message: "Call log saved successfully.",
// // //           log_id: logId,
// // //           outcome: args.outcome,
// // //         }),
// // //       },
// // //     });

// // //     sendWsJson(session.ws, { type: "response.create" });
// // //     session.onEvent({ type: "call-logged", data: args });
// // //   } catch (err) {
// // //     if (callId) session.processedCallIds.delete(callId);
// // //     console.error(`[${sessionId}] Call log save failed:`, err.message);
// // //   }
// // // }

// // // // ─── Event Hub — Process OpenAI Realtime events ───────────
// // // async function handleRealtimeEvent(sessionId, event) {
// // //   const session = sessions.get(sessionId);
// // //   if (!session) return;

// // //   switch (event.type) {
// // //     case "session.created":
// // //     case "session.updated":
// // //       break;

// // //     case "response.created":
// // //       session.isResponseActive = true;
// // //       if (!session.firstResponseCreatedMs) {
// // //         session.firstResponseCreatedMs = Date.now();
// // //       }
// // //       openElevenLabsStream(sessionId);
// // //       break;

// // //     case "response.output_text.delta":
// // //       if (session.elevenLabsReady) {
// // //         sendTextToElevenLabs(sessionId, event.delta);
// // //       } else {
// // //         session.textBuffer.push(event.delta);
// // //       }
// // //       session.onEvent({ type: "transcript-delta", delta: event.delta });
// // //       break;

// // //     case "response.text.delta":
// // //       if (session.elevenLabsReady) {
// // //         sendTextToElevenLabs(sessionId, event.delta);
// // //       } else {
// // //         session.textBuffer.push(event.delta);
// // //       }
// // //       session.onEvent({ type: "transcript-delta", delta: event.delta });
// // //       break;

// // //     case "response.output_text.done":
// // //       flushElevenLabsStream(sessionId);
// // //       session.onEvent({ type: "transcript-done", transcript: event.text });
// // //       break;

// // //     case "response.text.done":
// // //       flushElevenLabsStream(sessionId);
// // //       session.onEvent({ type: "transcript-done", transcript: event.text });
// // //       break;

// // //     case "response.done": {
// // //       session.isResponseActive = false;

// // //       const calls = extractFunctionCallsFromResponse(event.response);
// // //       for (const fc of calls) {
// // //         await handleFunctionCall(sessionId, fc);
// // //       }
// // //       break;
// // //     }

// // //     case "response.output_item.done":
// // //       if (event.item) {
// // //         const fc = toFunctionCallPayload(event.item);
// // //         if (fc) await handleFunctionCall(sessionId, fc);
// // //       }
// // //       break;

// // //     case "response.function_call_arguments.done":
// // //       await handleFunctionCall(sessionId, event);
// // //       break;

// // //     case "input_audio_buffer.speech_started":
// // //       console.log(`[${sessionId}] User interrupted — stopping AI voice`);
// // //       if (session.isResponseActive) {
// // //         sendWsJson(session.ws, { type: "response.cancel" });
// // //       }
// // //       closeElevenLabsWs(sessionId);
// // //       openElevenLabsStream(sessionId, true);
// // //       session.onEvent({ type: "speech-started" });
// // //       break;

// // //     case "conversation.item.input_audio_transcription.completed":
// // //       session.onEvent({ type: "user-transcript", transcript: event.transcript });
// // //       break;

// // //     case "error":
// // //       console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
// // //       session.onEvent({ type: "error", error: event.error });
// // //       break;

// // //     default:
// // //       break;
// // //   }
// // // }

// // // // ─── Close session and save recording ─────────────────────
// // // function closeSession(sessionId) {
// // //   const session = sessions.get(sessionId);
// // //   if (session) {
// // //     try {
// // //       const result = session.recorder.saveToFile();
// // //       console.log(`[${sessionId}] Recording saved: ${result.filename} (${result.sizeMB} MB)`);
// // //       session.onEvent({
// // //         type: "recording-saved",
// // //         data: { filename: result.filename, url: `/recordings/${result.filename}` },
// // //       });
// // //     } catch (err) {
// // //       console.error(`[${sessionId}] Recording save failed:`, err.message);
// // //     }

// // //     closeElevenLabsWs(sessionId);
// // //     try {
// // //       session.ws.close();
// // //     } catch {}
// // //     sessions.delete(sessionId);
// // //     console.log(`[${sessionId}] Session closed`);
// // //   }
// // // }

// // // // ─── Prewarm logic ────────────────────────────────────────
// // // function clearPrewarmState(sessionId) {
// // //   const state = prewarmStates.get(sessionId);
// // //   if (!state) return;
// // //   clearTimeout(state.ttlTimer);
// // //   prewarmStates.delete(sessionId);
// // // }

// // // function startPrewarm(sessionId, eventForwarder) {
// // //   if (prewarmStates.has(sessionId)) {
// // //     return prewarmStates.get(sessionId).promise;
// // //   }

// // //   const state = { promise: null, ready: false, failed: false, ttlTimer: null };

// // //   state.promise = createRealtimeSession(sessionId, eventForwarder)
// // //     .then(() => {
// // //       state.ready = true;
// // //       console.log(`[${sessionId}] Prewarm ready`);
// // //     })
// // //     .catch((err) => {
// // //       state.failed = true;
// // //       console.warn(`[${sessionId}] Prewarm failed: ${err.message}`);
// // //       throw err;
// // //     });

// // //   state.ttlTimer = setTimeout(() => {
// // //     if (!prewarmStates.has(sessionId)) return;
// // //     console.log(`[${sessionId}] Prewarm TTL expired — closing idle session`);
// // //     clearPrewarmState(sessionId);
// // //     closeSession(sessionId);
// // //   }, PREWARM_TTL_MS);

// // //   prewarmStates.set(sessionId, state);
// // //   return state.promise;
// // // }

// // // // ─── Build event forwarder for a socket ───────────────────
// // // function buildEventForwarder(socket) {
// // //   return (event) => {
// // //     switch (event.type) {
// // //       case "audio-delta":
// // //         socket.emit("audio-delta", { delta: event.delta });
// // //         break;
// // //       case "transcript-delta":
// // //         socket.emit("transcript-delta", { delta: event.delta });
// // //         break;
// // //       case "transcript-done":
// // //         socket.emit("transcript-done", { transcript: event.transcript });
// // //         break;
// // //       case "user-transcript":
// // //         socket.emit("user-transcript", { transcript: event.transcript });
// // //         break;
// // //       case "speech-started":
// // //         socket.emit("speech-started", {});
// // //         break;
// // //       case "call-logged":
// // //         socket.emit("call-logged", event.data);
// // //         break;
// // //       case "recording-saved":
// // //         socket.emit("recording-saved", event.data);
// // //         break;
// // //       case "error":
// // //         socket.emit("realtime-error", { error: event.error });
// // //         break;
// // //       case "session-closed":
// // //         socket.emit("session-closed", {});
// // //         break;
// // //       default:
// // //         break;
// // //     }
// // //   };
// // // }

// // // // ============================================================
// // // // SOCKET.IO — Client Connection Handling
// // // // ============================================================
// // // io.on("connection", (socket) => {
// // //   console.log(`Client connected: ${socket.id}`);

// // //   const forwarder = buildEventForwarder(socket);

// // //   startPrewarm(socket.id, forwarder).catch(() => {});

// // //   socket.on("start-session", async () => {
// // //     const sessionId = socket.id;
// // //     console.log(`[${sessionId}] Starting session`);

// // //     try {
// // //       let state = prewarmStates.get(sessionId);

// // //       if (!state) {
// // //         await startPrewarm(sessionId, forwarder);
// // //         state = prewarmStates.get(sessionId);
// // //       }

// // //       if (state) {
// // //         try {
// // //           await state.promise;
// // //           if (state.ready) {
// // //             clearPrewarmState(sessionId);
// // //             socket.emit("session-started", { sessionId });
// // //             triggerGreeting(sessionId);
// // //             return;
// // //           }
// // //         } catch {}
// // //         clearPrewarmState(sessionId);
// // //       }

// // //       await createRealtimeSession(sessionId, forwarder);
// // //       socket.emit("session-started", { sessionId });
// // //       triggerGreeting(sessionId);
// // //     } catch (err) {
// // //       console.error(`[${sessionId}] Session start failed:`, err.message);
// // //       socket.emit("realtime-error", {
// // //         error: { message: "Failed to connect to AI service" },
// // //       });
// // //     }
// // //   });

// // //   socket.on("audio-chunk", (data) => {
// // //     if (data?.audio) {
// // //       sendAudio(socket.id, data.audio);
// // //     }
// // //   });

// // //   socket.on("end-session", () => {
// // //     console.log(`[${socket.id}] End session requested`);
// // //     clearPrewarmState(socket.id);
// // //     closeSession(socket.id);
// // //     socket.emit("session-closed", {});
// // //   });

// // //   socket.on("disconnect", () => {
// // //     console.log(`Client disconnected: ${socket.id}`);
// // //     clearPrewarmState(socket.id);
// // //     closeSession(socket.id);
// // //   });
// // // });

// // // // ─── REST API Endpoints ───────────────────────────────────
// // // app.get("/api/call-logs", async (req, res) => {
// // //   try {
// // //     const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
// // //     res.json(logs);
// // //   } catch (err) {
// // //     console.error("Failed to fetch call logs:", err.message);
// // //     res.status(500).json({ error: "Failed to fetch call logs" });
// // //   }
// // // });

// // // app.get("/api/call-logs/category/:category", async (req, res) => {
// // //   try {
// // //     const logs = await CallLog.find({ intent_category: req.params.category })
// // //       .sort({ createdAt: -1 })
// // //       .lean();
// // //     res.json(logs);
// // //   } catch (err) {
// // //     res.status(500).json({ error: "Failed to fetch call logs" });
// // //   }
// // // });

// // // app.get("/api/recordings", (req, res) => {
// // //   const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".wav"));
// // //   res.json(
// // //     files.map((f) => ({
// // //       filename: f,
// // //       url: `/recordings/${f}`,
// // //       size: (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(2) + " MB",
// // //     }))
// // //   );
// // // });

// // // // ─── Start Server ─────────────────────────────────────────
// // // server.listen(PORT, () => {
// // //   console.log(`
// // // ╔══════════════════════════════════════════════════════════════╗
// // // ║   Ray White Bankstown — AI Receptionist (OmniSuiteAI)        ║
// // // ║   Running on http://localhost:${PORT}                         ║
// // // ║                                                              ║
// // // ║   Flow: Greeting → Value Prop → Agentic Close                ║
// // // ║   Use Cases: Inspect · Appraise · Transfer · Tenant · Info   ║
// // // ║   Escalation: Complaints · Legal · Abusive → Human           ║
// // // ║                                                              ║
// // // ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// // // ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// // // ║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
// // // ║   Recordings Dir:  ${RECORDINGS_DIR}                         ║
// // // ║   MongoDB:         ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
// // // ╚══════════════════════════════════════════════════════════════╝
// // //   `);
// // // });
// // require("dotenv").config();

// // const express = require("express");
// // const http = require("http");
// // const { Server } = require("socket.io");
// // const WebSocket = require("ws");
// // const path = require("path");
// // const fs = require("fs");
// // const { v4: uuidv4 } = require("uuid");
// // const mongoose = require("mongoose");

// // // ─── Config ───────────────────────────────────────────────
// // const PORT = process.env.PORT || 3000;
// // const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// // const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// // const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mkrzcZmzalRKwXdd";
// // const MONGODB_URI = process.env.MONGODB_URI;
// // const PREWARM_TTL_MS = 60_000;

// // // GA Realtime defaults
// // const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
// // const OPENAI_INPUT_SAMPLE_RATE = Number(process.env.OPENAI_INPUT_SAMPLE_RATE || 24000);
// // const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.8);
// // const OPENAI_VAD_PREFIX_PADDING_MS = Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 300);
// // const OPENAI_VAD_SILENCE_DURATION_MS = Number(process.env.OPENAI_VAD_SILENCE_DURATION_MS || 2000);

// // // ─── MongoDB Connection ───────────────────────────────────
// // if (!MONGODB_URI) {
// //   console.error("❌  MONGODB_URI is not set in .env — call logs will NOT be saved.");
// // } else {
// //   mongoose
// //     .connect(MONGODB_URI)
// //     .then(() => console.log("✅  MongoDB connected"))
// //     .catch((err) => console.error("❌  MongoDB connection error:", err.message));
// // }

// // // ─── Call Log Schema / Model ──────────────────────────────
// // const callLogSchema = new mongoose.Schema(
// //   {
// //     id: { type: String, required: true, unique: true },
// //     sessionId: { type: String, required: true },

// //     caller_name: { type: String, default: null },
// //     caller_phone: { type: String, default: null },
// //     caller_email: { type: String, default: null },

// //     property_address: { type: String, default: null },
// //     intent_category: {
// //       type: String,
// //       enum: [
// //         "property_inquiry",
// //         "inspection_booking",
// //         "inspection_reschedule",
// //         "rental_application_followup",
// //         "tenant_inquiry",
// //         "general_enquiry",
// //         "directions_access",
// //         "vendor_strata_partner",
// //         "staff_transfer",
// //         "owner_calling_pm",
// //         "appraisal_booking",
// //         "no_transcript_admin",
// //       ],
// //       required: true,
// //     },

// //     preferred_time: { type: String, default: null },
// //     staff_requested: { type: String, default: null },
// //     outcome: {
// //       type: String,
// //       enum: [
// //         "inspection_booked",
// //         "appraisal_booked",
// //         "transferred",
// //         "callback_scheduled",
// //         "info_provided",
// //         "market_update_sent",
// //         "message_taken",
// //         "escalated",
// //         "sms_sent",
// //       ],
// //       required: true,
// //     },

// //     ai_summary: { type: String, default: null },
// //     sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
// //     confidence_score: { type: Number, default: null },
// //     escalated: { type: Boolean, default: false },
// //   },
// //   { timestamps: true }
// // );

// // const CallLog = mongoose.model("CallLog", callLogSchema);

// // // ─── Ensure recordings directory exists ───────────────────
// // const RECORDINGS_DIR = path.join(__dirname, "recordings");
// // if (!fs.existsSync(RECORDINGS_DIR)) {
// //   fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
// // }

// // // ─── Express + Socket.IO ──────────────────────────────────
// // const app = express();
// // const server = http.createServer(app);
// // const io = new Server(server, { cors: { origin: "*" } });

// // app.use(express.static(path.join(__dirname, "public")));
// // app.use("/recordings", express.static(RECORDINGS_DIR));

// // // ─── Session State ────────────────────────────────────────
// // const sessions = new Map();
// // const prewarmStates = new Map();

// // // ============================================================
// // // SYSTEM PROMPT — Ray White Bankstown AI Receptionist
// // // ============================================================
// // function getSystemPrompt() {
// //   return `
// // =============================================================
// // ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING ELSE.
// // =============================================================
// // You MUST speak and respond in English at all times, no matter what.
// // - If the caller speaks in another language, respond ONLY in English.
// // - Do NOT switch to their language, do NOT mix languages.
// // - If the caller insists on another language, say: "Sorry, I can only assist in English at the moment."
// // =============================================================

// // ### IDENTITY ###
// // You are the AI receptionist for Ray White Bankstown — one of the area's top-performing real estate agencies.
// // This is an inbound call. You answer all routine enquiries, book inspections and appraisals, handle staff transfers, and escalate complex matters gracefully.
// // You sound like a friendly, professional Australian receptionist — warm, helpful, and locally knowledgeable.

// // ### AGENCY DETAILS (use naturally in conversation) ###
// // - Agency: Ray White Bankstown
// // - Office address: 362–364 Chapel Road, Bankstown
// // - Key suburbs served: Bankstown, Georges Hall, Chester Hill, Wiley Park, Sefton, Mount Lewis, Condell Park
// // - Directors: Tony Roumanous, Charlie Sioud
// // - Property Managers: Farah Antone, Michelle Clay, Mary, Matthew Natoli
// // - Sales/Other: Joshua Nassif, Jordon Le Breux, Delita (reception fallback)
// // - Website: raywhitebankstown.com.au

// // ### AI DISCLOSURE RULE ###
// // - Do NOT volunteer that you are AI. Just be the receptionist.
// // - ONLY if someone explicitly asks "are you a robot?", "are you AI?", or "am I talking to a real person?" — then be honest:
// //   "Good question — I'm actually an AI receptionist helping the Ray White Bankstown team manage calls. But I can book inspections, answer your questions, and connect you with the right person just as well. How can I help?"
// // - After admitting it, pivot straight back to helping them.

// // ### PERSONALITY ###
// // - Warm, natural Australian manner — friendly and professional
// // - Locally knowledgeable — sound like you know Bankstown and the surrounding suburbs
// // - Natural filler words: "absolutely", "no worries", "great", "of course", "sure thing"
// // - Never pushy — helpful and genuinely useful
// // - Match the caller's energy: relaxed with relaxed callers, more efficient with busy callers

// // ### HOW YOU TALK ###
// // - SHORT sentences — 1 to 2 sentences per response max
// // - Use contractions: "what's", "we've", "I'll", "you're"
// // - ACKNOWLEDGE what they said before you respond
// // - ONE question at a time — never stack multiple questions
// // - If silence or can't hear: "Still there?" or "Sorry, didn't catch that — could you repeat that?"

// // =============================================================
// // CALL FLOW — HAPPY PATH (Steps 01 → 02 → 03)
// // =============================================================
// // This is the PRIMARY flow for any high-intent caller (selling, renting, inspecting, appraising).
// // For pure transactional calls (just asking for a time / address), answer directly and efficiently — no need for the full sales flow.

// // ─────────────────────────────────────────────
// // STEP 01 — GREETING & INTENT CAPTURE
// // ─────────────────────────────────────────────
// // Always greet first. You do NOT know the caller's name. Ask early and use it naturally.

// // Start with:
// // "Thanks for calling Ray White Bankstown, you're through to the front desk. How can I help you today?"

// // Wait for their response.

// // Then ask for their name if they haven't given it:
// // "Great — and who am I speaking with?"

// // Once you have their name, use it naturally.

// // Then clarify their intent if not already clear:
// // - Property inquiry → "And which property were you interested in?"
// // - Selling → "And whereabouts is the property?"
// // - Renting / Tenant → "And is this about a property you're currently renting, or one you're looking to rent?"
// // - Staff transfer → Proceed immediately to STEP — STAFF TRANSFER

// // ─────────────────────────────────────────────
// // INTENT CLASSIFICATION (internal — determines next steps)
// // ─────────────────────────────────────────────
// // Classify the call into one of these categories internally:
// // - property_inquiry: Asking about listings, property details, or inspection times
// // - inspection_booking: Wants to book or reschedule an inspection
// // - appraisal_booking: Wants to sell — free appraisal
// // - rental_application_followup: Checking on a rental application
// // - tenant_inquiry: Existing tenant with a question or issue
// // - general_enquiry: Office hours, directions, general questions
// // - directions_access: Getting to office or a property
// // - vendor_strata_partner: External partner or strata call
// // - staff_transfer: Wants to speak to a specific staff member
// // - owner_calling_pm: Owner calling about their managed property

// // ─────────────────────────────────────────────
// // STEP 02 — VALUE PROPOSITION
// // ─────────────────────────────────────────────
// // Trigger ONLY for high-intent callers: sellers, serious buyers/renters, or appraisal requests.
// // Skip for transactional callers (just need a time, address, or transfer).

// // [DELIVER THIS NATURAL SCRIPT — adapt as needed]

// // "Great — here at Ray White Bankstown we bring the whole team to every property. Directors Tony Roumanous and Charlie Sioud, plus our full sales and property management crew.
// // Most of our clients are getting strong results right now because of our local knowledge across Bankstown, Georges Hall, Chester Hill, and Wiley Park — plus access to thousands of active buyers and tenants on our database.
// // Whether you want a free appraisal, to book an inspection, or list your home, I can get you sorted right now — no waiting on hold or chasing emails."

// // ─────────────────────────────────────────────
// // STEP 03 — AGENTIC / PROACTIVE CLOSE
// // ─────────────────────────────────────────────
// // Don't end the conversation passively. Always offer specific next steps.

// // For APPRAISAL / SELLING intent:
// // "I've checked our calendar and we've got a couple of great options this week — we can do a free appraisal at your place on Tuesday at 11am or Thursday at 2pm. Which one works better for you?
// // Or if you'd prefer, I can send you a quick market update for your street first so you can see recent sales — would you like that?"

// // For INSPECTION BOOKING intent:
// // "I can lock in a private inspection for you — we've got availability tomorrow at 5:30pm, or Saturday morning at 10am. Would either of those work?"

// // For RENTAL ENQUIRY intent:
// // "We've got several properties in your range opening this Saturday. Want me to shortlist two or three and book inspections for you?"

// // For STAFF TRANSFER intent:
// // "[Staff name] is available — I'll connect you now. One moment."
// // (If unavailable): "They're with a client right now. I can take a message and have them call you back, or I can book a specific callback time — which would you prefer?"

// // ─────────────────────────────────────────────
// // STEP 04 — COLLECT DETAILS (when booking confirmed)
// // ─────────────────────────────────────────────
// // Collect conversationally — NOT like a form. One detail at a time:
// // - Name (may already have it)
// // - Property address (if appraisal) or which property they want to inspect
// // - Preferred contact: phone or email
// // - Best time / confirmed slot
// // - Any specific concerns

// // =============================================================
// // SPECIFIC USE CASES
// // =============================================================

// // ─────────────────────────────────────────────
// // USE CASE: HOME OPEN / INSPECTION TIMES
// // ─────────────────────────────────────────────
// // Caller asks for open home times or property details.
// // Answer directly and efficiently:
// // "Yep, absolutely — for [address] we've got a home open on [day] at [time]. Would you like me to lock in a spot for you, or are you happy to just show up?"

// // Mock inspection schedule (use these in demo):
// // - 67 Jocelyn Street, Chester Hill: Wednesday 5:00–5:30pm, Saturday 10:00–10:30am
// // - 103 Flinders Road: Saturday 10:30–11:00am
// // - 58 Marden Street: Thursday 6:00–6:30pm, Saturday 11:00–11:30am
// // - 23 Mount Lewis Avenue: Saturday 10:00–10:30am

// // ─────────────────────────────────────────────
// // USE CASE: BOOKING OR RESCHEDULING INSPECTIONS
// // ─────────────────────────────────────────────
// // "No worries, I can lock that in for you. Just to confirm — is [address] the right property, and does [time slot] still work?"
// // Collect name + phone/email, confirm, then call save_call_log.

// // ─────────────────────────────────────────────
// // USE CASE: SELLING / FREE APPRAISAL
// // ─────────────────────────────────────────────
// // This is the highest-value use case. Always deliver Step 02 (value prop) before Step 03 (close).
// // Collect: name, property address, preferred appraisal time, best contact.

// // ─────────────────────────────────────────────
// // USE CASE: STAFF TRANSFER
// // ─────────────────────────────────────────────
// // If the caller asks for a specific staff member by name, respond immediately:
// // "Sure, let me put you through to [name] now."
// // If unavailable: offer message + callback. Always log with intent_category: "staff_transfer".

// // ─────────────────────────────────────────────
// // USE CASE: TENANT INQUIRIES / MAINTENANCE
// // ─────────────────────────────────────────────
// // Collect: name, property address, nature of the issue.
// // Route to relevant property manager (Farah, Michelle, Mary, or Matthew).
// // For urgent issues (locked out, emergency): escalate immediately.
// // "I'll get that through to [PM name] right away — they'll be in touch shortly. Is [phone number] the best number for them to reach you?"

// // ─────────────────────────────────────────────
// // USE CASE: RENTAL APPLICATION FOLLOW-UP
// // ─────────────────────────────────────────────
// // "Of course — let me get some details so I can pass this on to the right property manager. Which property did you apply for, and what's your full name?"
// // Log and route to appropriate PM.

// // ─────────────────────────────────────────────
// // USE CASE: PROPERTY LEASING ENQUIRIES (available rental listings)
// // ─────────────────────────────────────────────
// // Callers frequently ask about specific rental listings. Answer using details from
// // raywhitebankstown.com.au for the property in question. NEVER invent or guess a
// // figure or feature you don't actually know — if you don't have the detail on hand,
// // be upfront and offer to have the property manager confirm and call/text them back.

// // Typical questions this covers, all answered directly and efficiently (no need for
// // the full sales flow — these are transactional):
// // - Is the property still available
// // - What is the weekly or monthly rent
// // - How much is the bond / security deposit
// // - How many bedrooms and bathrooms it has
// // - Whether there's a garage, carport, or allocated parking
// // - Whether it has air conditioning, heating, or ceiling fans
// // - Whether there's a yard, balcony, or outdoor space
// // - Whether there are built-in wardrobes or extra storage
// // - Whether there's a dishwasher or laundry
// // - Proximity to public transport
// // - Nearby schools, shops, or parks
// // - When the next inspection is

// // Log these under intent_category: "property_inquiry" (or "inspection_booking" /
// // "inspection_reschedule" if it moves to booking a time).

// // ─────────────────────────────────────────────
// // USE CASE: RENTAL PROCESS / APPLICATION FAQs
// // ─────────────────────────────────────────────
// // Use discretion adapting tone, but keep the substance of these answers accurate:

// // - "Are pets allowed?"
// //   "Any pet request is reviewed as part of the application. If you'd like to apply, head to our website, find the property, and select 'Apply for this Property' — that'll take you through to Snug.com where you can create a login and submit your application."

// // - "What lease lengths are available?"
// //   "Lease terms are usually 6 or 12 months, though it can depend on the application — if a property has a shorter lease available, it'll be noted in the ad."

// // - "Is the lease renewable?"
// //   "In most cases, yes — though that depends on the individual property and the owner's plans when the lease is due to expire."

// // - "Is there flexibility with the move-in date?"
// //   "That can be reviewed as part of the application."

// // - "Do I need to register for an inspection?"
// //   "It's not essential, but it's definitely encouraged. To register, find the property on our website and select 'Apply for this Property' — that'll take you to Snug.com to create a login and register to attend."

// // - "How do I apply?"
// //   "Head to our website, find the property you're after, and select 'Apply for this Property'. You'll be redirected to Snug.com to create a login and submit your application there."

// // - "What documents do I need?"
// //   "That's all listed in Snug once you start your application — find the property on our website, select 'Apply for this Property', and Snug will show you everything required."

// // - "What are the income or reference requirements?"
// //   "That information's in Snug as well — same process: find the property on our website, select 'Apply for this Property', and Snug will list what's needed."

// // - "How long does approval usually take?"
// //   "Typically 1 to 3 days, depending on how many applications we're working through and whether any extra info is needed."

// // Log rental-application FAQ calls under intent_category: "property_inquiry" or
// // "rental_application_followup" as appropriate, with outcome: "info_provided"
// // unless it progresses further (e.g. transferred, callback_scheduled).

// // ─────────────────────────────────────────────
// // USE CASE: REQUESTS THAT GO BACK TO RECEPTION / PM
// // ─────────────────────────────────────────────
// // - "Can I arrange a private viewing?"
// //   Do NOT try to book this yourself — this goes to the relevant Property Manager.
// //   "That's something our property management team can arrange directly for you —
// //   let me take your details and get [PM name] to call you back, or I can put you
// //   through now if they're free." Then follow the STAFF TRANSFER flow (offer
// //   transfer now, or take a message/callback), and log as intent_category:
// //   "staff_transfer" or "tenant_inquiry" with staff_requested set to the relevant PM.

// // ─────────────────────────────────────────────
// // USE CASE: DIRECTIONS / OFFICE ACCESS
// // ─────────────────────────────────────────────
// // "We're at 362–364 Chapel Road, Bankstown — easy to find, right on the main road. Is there anything else I can help with?"

// // =============================================================
// // OBJECTION HANDLERS
// // =============================================================
// // Only use these if the caller explicitly raises the objection.

// // ─────────────────────────────────────────────
// // OBJECTION — "I'm happy with my current agent"
// // ─────────────────────────────────────────────
// // "That's completely fair. We'd only suggest making a switch if the numbers genuinely worked in your favour — we've helped quite a few sellers in [suburb] recently who were in the same position. Would you at least be open to a free appraisal so you can see what the market's doing?"

// // ─────────────────────────────────────────────
// // OBJECTION — "I'll just look online / I don't need help"
// // ─────────────────────────────────────────────
// // "Totally get that. The thing is, a lot of our best opportunities go to buyers on our database before they even hit the website. Happy to keep you posted directly — I just need your email."

// // ─────────────────────────────────────────────
// // OBJECTION — "Not a good time / I'm busy"
// // ─────────────────────────────────────────────
// // "No worries at all. Can I grab your name and number and have someone call you back at a better time? Even 5 minutes is enough to get the ball rolling."

// // ─────────────────────────────────────────────
// // OBJECTION — Caller is not interested
// // ─────────────────────────────────────────────
// // "No dramas — would it be okay if I sent you a quick text with our details? That way you've got a direct line if anything changes."

// // =============================================================
// // ESCALATION — WHEN TO HAND OFF
// // =============================================================
// // ALWAYS escalate (and log escalated: true) for:
// // - Complaints or disputes
// // - Legal or financial questions
// // - Abusive or aggressive callers
// // - Any situation where your confidence is low

// // Escalation script:
// // "I want to make sure you get the best possible help with this — let me connect you with [Tony / the team] right now. Just bear with me one moment."

// // =============================================================
// // STEP 05 — SAVE CALL LOG (MANDATORY after every completed call)
// // =============================================================
// // After every call where intent was established — whether booked, transferred, info given, or escalated — call save_call_log with all details.

// // Required:
// // - caller_name, intent_category, outcome

// // Optional but important:
// // - caller_phone / caller_email
// // - property_address
// // - preferred_time
// // - staff_requested
// // - ai_summary
// // - sentiment
// // - confidence_score
// // - escalated

// // Confirmation after logging (if booking was made):
// // "Perfect, [name] — I've got that locked in for you. You'll hear from the team [at preferred_time / shortly]. Is there anything else I can help with today?"

// // =============================================================
// // HARD RULES — NON-NEGOTIABLE
// // =============================================================
// // - Language: ENGLISH ONLY at all times
// // - ONE question at a time
// // - Responses: 1 to 2 sentences max
// // - NEVER assume the caller's name
// // - ALWAYS call save_call_log after every completed call
// // - Value proposition must be delivered before the close for high-intent callers
// // - For transactional callers, skip the sales flow and answer directly
// // - Never give legal or financial advice
// // - Never make up property details
// // - For rental listing questions, use only known/verified details from raywhitebankstown.com.au — if unsure, say so and offer a callback rather than guessing
// // - Private viewing requests are always routed to Reception / the relevant Property Manager, not booked directly by you
// // `.trim();
// // }

// // // ─── Tool Definition ──────────────────────────────────────
// // function getSaveCallLogTool() {
// //   return {
// //     type: "function",
// //     name: "save_call_log",
// //     description:
// //       "Saves a structured call log entry after every completed call. MUST be called once intent is established and the call has reached a natural conclusion (booking made, info given, transferred, or escalated).",
// //     parameters: {
// //       type: "object",
// //       properties: {
// //         caller_name: { type: "string", description: "Full name of the caller" },
// //         caller_phone: { type: "string", description: "Caller's phone number (if provided)" },
// //         caller_email: { type: "string", description: "Caller's email address (if provided)" },
// //         property_address: { type: "string", description: "Property address they asked about or want appraised/inspected" },
// //         intent_category: {
// //           type: "string",
// //           enum: [
// //             "property_inquiry",
// //             "inspection_booking",
// //             "inspection_reschedule",
// //             "rental_application_followup",
// //             "tenant_inquiry",
// //             "general_enquiry",
// //             "directions_access",
// //             "vendor_strata_partner",
// //             "staff_transfer",
// //             "owner_calling_pm",
// //             "appraisal_booking",
// //             "no_transcript_admin",
// //           ],
// //           description: "Classified intent of the call",
// //         },
// //         preferred_time: {
// //           type: "string",
// //           description: "Agreed appointment slot or preferred callback time — e.g. 'Tuesday at 11am', 'Saturday 10am'",
// //         },
// //         staff_requested: { type: "string", description: "Name of staff member requested" },
// //         outcome: {
// //           type: "string",
// //           enum: [
// //             "inspection_booked",
// //             "appraisal_booked",
// //             "transferred",
// //             "callback_scheduled",
// //             "info_provided",
// //             "market_update_sent",
// //             "message_taken",
// //             "escalated",
// //             "sms_sent",
// //           ],
// //           description: "What happened at the end of the call",
// //         },
// //         ai_summary: { type: "string", description: "1–2 sentence summary of the call" },
// //         sentiment: {
// //           type: "string",
// //           enum: ["positive", "neutral", "negative"],
// //           description: "Overall sentiment of the caller during the call",
// //         },
// //         confidence_score: {
// //           type: "number",
// //           description: "AI confidence score for this call, from 0.0 to 1.0",
// //         },
// //         escalated: { type: "boolean", description: "True if the call was escalated to a human team member" },
// //       },
// //       required: ["caller_name", "intent_category", "outcome"],
// //     },
// //   };
// // }

// // // ─── Recording — WAV file builder for conversation audio ───
// // class ConversationRecorder {
// //   constructor(sessionId) {
// //     this.sessionId = sessionId;
// //     this.userChunks = [];
// //     this.agentChunks = [];
// //     this.startTime = Date.now();
// //     this.events = [];
// //   }

// //   addUserAudio(base64Pcm16) {
// //     const buf = Buffer.from(base64Pcm16, "base64");
// //     this.userChunks.push(buf);
// //     this.events.push({ type: "user", time: Date.now() - this.startTime, bytes: buf.length });
// //   }

// //   addAgentAudio(base64Pcm16) {
// //     const buf = Buffer.from(base64Pcm16, "base64");
// //     this.agentChunks.push(buf);
// //     this.events.push({ type: "agent", time: Date.now() - this.startTime, bytes: buf.length });
// //   }

// //   _resample(pcmBuffer, srcRate, dstRate) {
// //     if (srcRate === dstRate) return pcmBuffer;
// //     const srcSamples = pcmBuffer.length / 2;
// //     const ratio = srcRate / dstRate;
// //     const dstSamples = Math.floor(srcSamples / ratio);
// //     const out = Buffer.alloc(dstSamples * 2);

// //     for (let i = 0; i < dstSamples; i++) {
// //       const srcIdx = i * ratio;
// //       const lo = Math.floor(srcIdx);
// //       const hi = Math.min(lo + 1, srcSamples - 1);
// //       const frac = srcIdx - lo;
// //       const sLo = pcmBuffer.readInt16LE(lo * 2);
// //       const sHi = pcmBuffer.readInt16LE(hi * 2);
// //       const val = Math.round(sLo + (sHi - sLo) * frac);
// //       out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
// //     }
// //     return out;
// //   }

// //   saveToFile() {
// //     const OUTPUT_RATE = 24000;
// //     const userPcm = Buffer.concat(this.userChunks);
// //     const agentPcmRaw = Buffer.concat(this.agentChunks);
// //     const agentPcm = this._resample(agentPcmRaw, 16000, OUTPUT_RATE);

// //     const userSamples = userPcm.length / 2;
// //     const agentSamples = agentPcm.length / 2;
// //     const totalSamples = Math.max(userSamples, agentSamples);
// //     const mixedBuf = Buffer.alloc(totalSamples * 2);

// //     for (let i = 0; i < totalSamples; i++) {
// //       let val = 0;
// //       if (i < userSamples) val += userPcm.readInt16LE(i * 2);
// //       if (i < agentSamples) val += agentPcm.readInt16LE(i * 2);
// //       val = Math.max(-32768, Math.min(32767, val));
// //       mixedBuf.writeInt16LE(val, i * 2);
// //     }

// //     const wavHeader = Buffer.alloc(44);
// //     const dataSize = mixedBuf.length;
// //     const fileSize = 36 + dataSize;

// //     wavHeader.write("RIFF", 0);
// //     wavHeader.writeUInt32LE(fileSize, 4);
// //     wavHeader.write("WAVE", 8);
// //     wavHeader.write("fmt ", 12);
// //     wavHeader.writeUInt32LE(16, 16);
// //     wavHeader.writeUInt16LE(1, 20);
// //     wavHeader.writeUInt16LE(1, 22);
// //     wavHeader.writeUInt32LE(OUTPUT_RATE, 24);
// //     wavHeader.writeUInt32LE(OUTPUT_RATE * 2, 28);
// //     wavHeader.writeUInt16LE(2, 32);
// //     wavHeader.writeUInt16LE(16, 34);
// //     wavHeader.write("data", 36);
// //     wavHeader.writeUInt32LE(dataSize, 40);

// //     const wav = Buffer.concat([wavHeader, mixedBuf]);
// //     const filename = `call_${this.sessionId}_${Date.now()}.wav`;
// //     const filepath = path.join(RECORDINGS_DIR, filename);
// //     fs.writeFileSync(filepath, wav);

// //     console.log(`[Recording] Saved: ${filepath} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`);
// //     return { filename, filepath, sizeMB: (wav.length / 1024 / 1024).toFixed(2) };
// //   }
// // }

// // // ─── Helpers ──────────────────────────────────────────────
// // function sendWsJson(ws, payload) {
// //   if (!ws || ws.readyState !== WebSocket.OPEN) return false;
// //   ws.send(JSON.stringify(payload));
// //   return true;
// // }

// // function safeJsonParse(text) {
// //   try {
// //     return JSON.parse(text);
// //   } catch {
// //     return null;
// //   }
// // }

// // function toFunctionCallPayload(value) {
// //   if (!value || typeof value !== "object") return null;

// //   if (
// //     value.type === "function_call" &&
// //     typeof value.name === "string" &&
// //     typeof value.arguments === "string" &&
// //     typeof value.call_id === "string"
// //   ) {
// //     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
// //   }

// //   if (
// //     typeof value.name === "string" &&
// //     typeof value.arguments === "string" &&
// //     typeof value.call_id === "string"
// //   ) {
// //     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
// //   }

// //   return null;
// // }

// // function extractFunctionCallsFromResponse(response) {
// //   const calls = [];
// //   const output = response?.output;

// //   if (Array.isArray(output)) {
// //     for (const item of output) {
// //       const fc = toFunctionCallPayload(item);
// //       if (fc) calls.push(fc);
// //     }
// //   }

// //   return calls;
// // }

// // // ─── Create OpenAI Realtime Session ───────────────────────
// // function createRealtimeSession(sessionId, onEvent) {
// //   const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
// //   const startMs = Date.now();

// //   return new Promise((resolve, reject) => {
// //     const ws = new WebSocket(url, {
// //       headers: {
// //         Authorization: `Bearer ${OPENAI_API_KEY}`,
// //       },
// //     });

// //     ws.on("open", () => {
// //       console.log(`[${sessionId}] OpenAI connected (${Date.now() - startMs}ms)`);

// //       const sessionUpdate = {
// //         type: "session.update",
// //         session: {
// //           type: "realtime",
// //           model: OPENAI_REALTIME_MODEL,
// //           output_modalities: ["text"],
// //           audio: {
// //             input: {
// //               format: {
// //                 type: "audio/pcm",
// //                 rate: OPENAI_INPUT_SAMPLE_RATE,
// //               },
// //               turn_detection: {
// //                 type: "server_vad",
// //                 threshold: OPENAI_VAD_THRESHOLD,
// //                 prefix_padding_ms: OPENAI_VAD_PREFIX_PADDING_MS,
// //                 silence_duration_ms: OPENAI_VAD_SILENCE_DURATION_MS,
// //               },
// //             },
// //           },
// //           instructions: getSystemPrompt(),
// //           tools: [getSaveCallLogTool()],
// //           tool_choice: "auto",
// //         },
// //       };

// //       sendWsJson(ws, sessionUpdate);

// //       const session = {
// //         ws,
// //         elevenLabsWs: null,
// //         elevenLabsReady: false,
// //         textBuffer: [],
// //         isResponseActive: false,
// //         onEvent,
// //         startMs,
// //         openAiConnectedMs: Date.now(),
// //         elevenLabsConnectedMs: null,
// //         greetingTriggeredMs: null,
// //         firstResponseCreatedMs: null,
// //         firstAudioDeltaLogged: false,
// //         processedCallIds: new Set(),
// //         recorder: new ConversationRecorder(sessionId),
// //         callLogs: [],
// //       };

// //       sessions.set(sessionId, session);
// //       openElevenLabsStream(sessionId);
// //       resolve();
// //     });

// //     ws.on("message", async (data) => {
// //       try {
// //         const event = JSON.parse(data.toString());
// //         await handleRealtimeEvent(sessionId, event);
// //       } catch (err) {
// //         console.error(`[${sessionId}] Parse error:`, err.message);
// //       }
// //     });

// //     ws.on("error", (err) => {
// //       console.error(`[${sessionId}] OpenAI WS error:`, err.message);
// //       onEvent({ type: "error", error: { message: err.message } });
// //       reject(err);
// //     });

// //     ws.on("close", (code) => {
// //       console.log(`[${sessionId}] OpenAI WS closed: ${code}`);
// //       closeElevenLabsWs(sessionId);
// //       sessions.delete(sessionId);
// //       onEvent({ type: "session-closed" });
// //     });
// //   });
// // }

// // // ─── Send user audio to OpenAI ────────────────────────────
// // function sendAudio(sessionId, base64Audio) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   session.recorder.addUserAudio(base64Audio);
// //   sendWsJson(session.ws, { type: "input_audio_buffer.append", audio: base64Audio });
// // }

// // // ─── Trigger greeting ─────────────────────────────────────
// // function triggerGreeting(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   session.greetingTriggeredMs = Date.now();
// //   console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
// //   sendWsJson(session.ws, { type: "response.create" });
// // }

// // // ─── ElevenLabs TTS Stream ────────────────────────────────
// // function openElevenLabsStream(sessionId, force = false) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   if (
// //     !force &&
// //     session.elevenLabsWs &&
// //     (session.elevenLabsWs.readyState === WebSocket.OPEN ||
// //       session.elevenLabsWs.readyState === WebSocket.CONNECTING)
// //   ) {
// //     return;
// //   }

// //   closeElevenLabsWs(sessionId);

// //   const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
// //   const elWs = new WebSocket(wsUrl);

// //   elWs.on("open", () => {
// //     console.log(`[${sessionId}] ElevenLabs connected`);
// //     session.elevenLabsConnectedMs = Date.now();

// //     elWs.send(
// //       JSON.stringify({
// //         text: " ",
// //         voice_settings: {
// //           stability: 0.55,
// //           similarity_boost: 0.78,
// //           style: 0.35,
// //           use_speaker_boost: true,
// //         },
// //         xi_api_key: ELEVENLABS_API_KEY,
// //       })
// //     );

// //     if (session.elevenLabsWs === elWs) {
// //       session.elevenLabsReady = true;
// //       for (const text of session.textBuffer) {
// //         sendTextToElevenLabs(sessionId, text);
// //       }
// //       session.textBuffer = [];
// //     }
// //   });

// //   elWs.on("message", (data) => {
// //     try {
// //       const msg = JSON.parse(data.toString());
// //       if (msg.audio) {
// //         session.recorder.addAgentAudio(msg.audio);
// //         session.onEvent({ type: "audio-delta", delta: msg.audio });
// //       }
// //     } catch {}
// //   });

// //   elWs.on("error", (err) => {
// //     console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`);
// //   });

// //   elWs.on("close", () => {
// //     if (session.elevenLabsWs === elWs) {
// //       session.elevenLabsReady = false;
// //     }
// //   });

// //   session.elevenLabsWs = elWs;
// // }

// // function sendTextToElevenLabs(sessionId, text) {
// //   const session = sessions.get(sessionId);
// //   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
// //     session.elevenLabsWs.send(JSON.stringify({ text, try_trigger_generation: true }));
// //   } else if (session) {
// //     session.textBuffer.push(text);
// //   }
// // }

// // function flushElevenLabsStream(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
// //     session.elevenLabsWs.send(JSON.stringify({ text: "" }));
// //   }
// // }

// // function closeElevenLabsWs(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (session?.elevenLabsWs) {
// //     try {
// //       if (session.elevenLabsWs.readyState === WebSocket.CONNECTING) {
// //         session.elevenLabsWs.terminate();
// //       } else if (session.elevenLabsWs.readyState === WebSocket.OPEN) {
// //         session.elevenLabsWs.close();
// //       }
// //     } catch {}
// //     session.elevenLabsWs = null;
// //     session.elevenLabsReady = false;
// //     session.textBuffer = [];
// //   }
// // }

// // // ─── Handle function calls from OpenAI ────────────────────
// // async function handleFunctionCall(sessionId, eventOrItem) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   const call = toFunctionCallPayload(eventOrItem);
// //   if (!call) return;

// //   if (call.name !== "save_call_log") return;

// //   const callId = typeof call.call_id === "string" ? call.call_id : null;

// //   if (callId && session.processedCallIds.has(callId)) return;
// //   if (callId) session.processedCallIds.add(callId);

// //   try {
// //     const args = JSON.parse(call.arguments);

// //     console.log(
// //       `[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`
// //     );

// //     const logId = uuidv4();

// //     const callLog = new CallLog({
// //       id: logId,
// //       sessionId,
// //       caller_name: args.caller_name || null,
// //       caller_phone: args.caller_phone || null,
// //       caller_email: args.caller_email || null,
// //       property_address: args.property_address || null,
// //       intent_category: args.intent_category,
// //       preferred_time: args.preferred_time || null,
// //       staff_requested: args.staff_requested || null,
// //       outcome: args.outcome,
// //       ai_summary: args.ai_summary || null,
// //       sentiment: args.sentiment || "neutral",
// //       confidence_score: args.confidence_score || null,
// //       escalated: args.escalated || false,
// //     });

// //     await callLog.save();
// //     session.callLogs.push({ id: logId, ...args });

// //     console.log(`[${sessionId}] Call log saved to MongoDB: ${logId}`);

// //     sendWsJson(session.ws, {
// //       type: "conversation.item.create",
// //       item: {
// //         type: "function_call_output",
// //         call_id: call.call_id,
// //         output: JSON.stringify({
// //           success: true,
// //           message: "Call log saved successfully.",
// //           log_id: logId,
// //           outcome: args.outcome,
// //         }),
// //       },
// //     });

// //     sendWsJson(session.ws, { type: "response.create" });
// //     session.onEvent({ type: "call-logged", data: args });
// //   } catch (err) {
// //     if (callId) session.processedCallIds.delete(callId);
// //     console.error(`[${sessionId}] Call log save failed:`, err.message);
// //   }
// // }

// // // ─── Event Hub — Process OpenAI Realtime events ───────────
// // async function handleRealtimeEvent(sessionId, event) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   switch (event.type) {
// //     case "session.created":
// //     case "session.updated":
// //       break;

// //     case "response.created":
// //       session.isResponseActive = true;
// //       if (!session.firstResponseCreatedMs) {
// //         session.firstResponseCreatedMs = Date.now();
// //       }
// //       openElevenLabsStream(sessionId);
// //       break;

// //     case "response.output_text.delta":
// //       if (session.elevenLabsReady) {
// //         sendTextToElevenLabs(sessionId, event.delta);
// //       } else {
// //         session.textBuffer.push(event.delta);
// //       }
// //       session.onEvent({ type: "transcript-delta", delta: event.delta });
// //       break;

// //     case "response.text.delta":
// //       if (session.elevenLabsReady) {
// //         sendTextToElevenLabs(sessionId, event.delta);
// //       } else {
// //         session.textBuffer.push(event.delta);
// //       }
// //       session.onEvent({ type: "transcript-delta", delta: event.delta });
// //       break;

// //     case "response.output_text.done":
// //       flushElevenLabsStream(sessionId);
// //       session.onEvent({ type: "transcript-done", transcript: event.text });
// //       break;

// //     case "response.text.done":
// //       flushElevenLabsStream(sessionId);
// //       session.onEvent({ type: "transcript-done", transcript: event.text });
// //       break;

// //     case "response.done": {
// //       session.isResponseActive = false;

// //       const calls = extractFunctionCallsFromResponse(event.response);
// //       for (const fc of calls) {
// //         await handleFunctionCall(sessionId, fc);
// //       }
// //       break;
// //     }

// //     case "response.output_item.done":
// //       if (event.item) {
// //         const fc = toFunctionCallPayload(event.item);
// //         if (fc) await handleFunctionCall(sessionId, fc);
// //       }
// //       break;

// //     case "response.function_call_arguments.done":
// //       await handleFunctionCall(sessionId, event);
// //       break;

// //     case "input_audio_buffer.speech_started":
// //       console.log(`[${sessionId}] User interrupted — stopping AI voice`);
// //       if (session.isResponseActive) {
// //         sendWsJson(session.ws, { type: "response.cancel" });
// //       }
// //       closeElevenLabsWs(sessionId);
// //       openElevenLabsStream(sessionId, true);
// //       session.onEvent({ type: "speech-started" });
// //       break;

// //     case "conversation.item.input_audio_transcription.completed":
// //       session.onEvent({ type: "user-transcript", transcript: event.transcript });
// //       break;

// //     case "error":
// //       console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
// //       session.onEvent({ type: "error", error: event.error });
// //       break;

// //     default:
// //       break;
// //   }
// // }

// // // ─── Close session and save recording ─────────────────────
// // function closeSession(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (session) {
// //     try {
// //       const result = session.recorder.saveToFile();
// //       console.log(`[${sessionId}] Recording saved: ${result.filename} (${result.sizeMB} MB)`);
// //       session.onEvent({
// //         type: "recording-saved",
// //         data: { filename: result.filename, url: `/recordings/${result.filename}` },
// //       });
// //     } catch (err) {
// //       console.error(`[${sessionId}] Recording save failed:`, err.message);
// //     }

// //     closeElevenLabsWs(sessionId);
// //     try {
// //       session.ws.close();
// //     } catch {}
// //     sessions.delete(sessionId);
// //     console.log(`[${sessionId}] Session closed`);
// //   }
// // }

// // // ─── Prewarm logic ────────────────────────────────────────
// // function clearPrewarmState(sessionId) {
// //   const state = prewarmStates.get(sessionId);
// //   if (!state) return;
// //   clearTimeout(state.ttlTimer);
// //   prewarmStates.delete(sessionId);
// // }

// // function startPrewarm(sessionId, eventForwarder) {
// //   if (prewarmStates.has(sessionId)) {
// //     return prewarmStates.get(sessionId).promise;
// //   }

// //   const state = { promise: null, ready: false, failed: false, ttlTimer: null };

// //   state.promise = createRealtimeSession(sessionId, eventForwarder)
// //     .then(() => {
// //       state.ready = true;
// //       console.log(`[${sessionId}] Prewarm ready`);
// //     })
// //     .catch((err) => {
// //       state.failed = true;
// //       console.warn(`[${sessionId}] Prewarm failed: ${err.message}`);
// //       throw err;
// //     });

// //   state.ttlTimer = setTimeout(() => {
// //     if (!prewarmStates.has(sessionId)) return;
// //     console.log(`[${sessionId}] Prewarm TTL expired — closing idle session`);
// //     clearPrewarmState(sessionId);
// //     closeSession(sessionId);
// //   }, PREWARM_TTL_MS);

// //   prewarmStates.set(sessionId, state);
// //   return state.promise;
// // }

// // // ─── Build event forwarder for a socket ───────────────────
// // function buildEventForwarder(socket) {
// //   return (event) => {
// //     switch (event.type) {
// //       case "audio-delta":
// //         socket.emit("audio-delta", { delta: event.delta });
// //         break;
// //       case "transcript-delta":
// //         socket.emit("transcript-delta", { delta: event.delta });
// //         break;
// //       case "transcript-done":
// //         socket.emit("transcript-done", { transcript: event.transcript });
// //         break;
// //       case "user-transcript":
// //         socket.emit("user-transcript", { transcript: event.transcript });
// //         break;
// //       case "speech-started":
// //         socket.emit("speech-started", {});
// //         break;
// //       case "call-logged":
// //         socket.emit("call-logged", event.data);
// //         break;
// //       case "recording-saved":
// //         socket.emit("recording-saved", event.data);
// //         break;
// //       case "error":
// //         socket.emit("realtime-error", { error: event.error });
// //         break;
// //       case "session-closed":
// //         socket.emit("session-closed", {});
// //         break;
// //       default:
// //         break;
// //     }
// //   };
// // }

// // // ============================================================
// // // SOCKET.IO — Client Connection Handling
// // // ============================================================
// // io.on("connection", (socket) => {
// //   console.log(`Client connected: ${socket.id}`);

// //   const forwarder = buildEventForwarder(socket);

// //   startPrewarm(socket.id, forwarder).catch(() => {});

// //   socket.on("start-session", async () => {
// //     const sessionId = socket.id;
// //     console.log(`[${sessionId}] Starting session`);

// //     try {
// //       let state = prewarmStates.get(sessionId);

// //       if (!state) {
// //         await startPrewarm(sessionId, forwarder);
// //         state = prewarmStates.get(sessionId);
// //       }

// //       if (state) {
// //         try {
// //           await state.promise;
// //           if (state.ready) {
// //             clearPrewarmState(sessionId);
// //             socket.emit("session-started", { sessionId });
// //             triggerGreeting(sessionId);
// //             return;
// //           }
// //         } catch {}
// //         clearPrewarmState(sessionId);
// //       }

// //       await createRealtimeSession(sessionId, forwarder);
// //       socket.emit("session-started", { sessionId });
// //       triggerGreeting(sessionId);
// //     } catch (err) {
// //       console.error(`[${sessionId}] Session start failed:`, err.message);
// //       socket.emit("realtime-error", {
// //         error: { message: "Failed to connect to AI service" },
// //       });
// //     }
// //   });

// //   socket.on("audio-chunk", (data) => {
// //     if (data?.audio) {
// //       sendAudio(socket.id, data.audio);
// //     }
// //   });

// //   socket.on("end-session", () => {
// //     console.log(`[${socket.id}] End session requested`);
// //     clearPrewarmState(socket.id);
// //     closeSession(socket.id);
// //     socket.emit("session-closed", {});
// //   });

// //   socket.on("disconnect", () => {
// //     console.log(`Client disconnected: ${socket.id}`);
// //     clearPrewarmState(socket.id);
// //     closeSession(socket.id);
// //   });
// // });

// // // ─── REST API Endpoints ───────────────────────────────────
// // app.get("/api/call-logs", async (req, res) => {
// //   try {
// //     const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
// //     res.json(logs);
// //   } catch (err) {
// //     console.error("Failed to fetch call logs:", err.message);
// //     res.status(500).json({ error: "Failed to fetch call logs" });
// //   }
// // });

// // app.get("/api/call-logs/category/:category", async (req, res) => {
// //   try {
// //     const logs = await CallLog.find({ intent_category: req.params.category })
// //       .sort({ createdAt: -1 })
// //       .lean();
// //     res.json(logs);
// //   } catch (err) {
// //     res.status(500).json({ error: "Failed to fetch call logs" });
// //   }
// // });

// // app.get("/api/recordings", (req, res) => {
// //   const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".wav"));
// //   res.json(
// //     files.map((f) => ({
// //       filename: f,
// //       url: `/recordings/${f}`,
// //       size: (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(2) + " MB",
// //     }))
// //   );
// // });

// // // ─── Start Server ─────────────────────────────────────────
// // server.listen(PORT, () => {
// //   console.log(`
// // ╔══════════════════════════════════════════════════════════════╗
// // ║   Ray White Bankstown — AI Receptionist (OmniSuiteAI)        ║
// // ║   Running on http://localhost:${PORT}                         ║
// // ║                                                              ║
// // ║   Flow: Greeting → Value Prop → Agentic Close                ║
// // ║   Use Cases: Inspect · Appraise · Transfer · Tenant · Info   ║
// // ║   Escalation: Complaints · Legal · Abusive → Human           ║
// // ║                                                              ║
// // ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// // ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// // ║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
// // ║   Recordings Dir:  ${RECORDINGS_DIR}                         ║
// // ║   MongoDB:         ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
// // ╚══════════════════════════════════════════════════════════════╝
// //   `);
// // });

// require("dotenv").config();

// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const WebSocket = require("ws");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");
// const mongoose = require("mongoose");
// const { startAudioSocketServer } = require("./telephony-bridge"); // ← 3CX/Asterisk bridge

// // ─── Config ───────────────────────────────────────────────
// const PORT = process.env.PORT || 3000;
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mkrzcZmzalRKwXdd";
// const MONGODB_URI = process.env.MONGODB_URI;
// const PREWARM_TTL_MS = 60_000;

// // GA Realtime defaults
// const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
// const OPENAI_INPUT_SAMPLE_RATE = Number(process.env.OPENAI_INPUT_SAMPLE_RATE || 24000);
// const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.8);
// const OPENAI_VAD_PREFIX_PADDING_MS = Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 250);
// const OPENAI_VAD_SILENCE_DURATION_MS = Number(process.env.OPENAI_VAD_SILENCE_DURATION_MS || 1100);
// const BARGE_IN_GRACE_MS = Number(process.env.OPENAI_BARGE_IN_GRACE_MS || 700);

// const AGENCY_WEBSITE_URL = process.env.AGENCY_WEBSITE_URL || "https://raywhitebankstown.com.au";
// const OFFICE_MAIN_NUMBER = process.env.OFFICE_MAIN_NUMBER || null;

// // ─── MongoDB Connection ───────────────────────────────────
// if (!MONGODB_URI) {
//   console.error("❌  MONGODB_URI is not set in .env — call logs will NOT be saved.");
// } else {
//   mongoose
//     .connect(MONGODB_URI)
//     .then(() => console.log("✅  MongoDB connected"))
//     .catch((err) => console.error("❌  MongoDB connection error:", err.message));
// }

// // ─── Twilio (SMS) ──────────────────────────────────────────
// const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
// const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
// let twilioClient = null;

// if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
//   try {
//     // eslint-disable-next-line global-require
//     const twilio = require("twilio");
//     twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
//     console.log("✅  Twilio SMS configured");
//   } catch (err) {
//     console.warn("⚠️  `twilio` package not installed — run `npm install twilio`. SMS will be simulated (logged only).");
//   }
// } else {
//   console.warn("⚠️  TWILIO_* env vars not set — SMS will be simulated (logged only).");
// }

// async function sendSmsLink(toNumber, messageBody) {
//   if (!toNumber) return { success: false, reason: "missing_phone_number" };

//   if (!twilioClient) {
//     console.log(`[SMS-SIMULATED] To: ${toNumber} | "${messageBody}"`);
//     return { success: true, simulated: true };
//   }

//   try {
//     const msg = await twilioClient.messages.create({
//       body: messageBody,
//       from: TWILIO_FROM_NUMBER,
//       to: toNumber,
//     });
//     return { success: true, sid: msg.sid };
//   } catch (err) {
//     console.error("SMS send failed:", err.message);
//     return { success: false, error: err.message };
//   }
// }

// // ─── Call Log Schema / Model ──────────────────────────────
// const callLogSchema = new mongoose.Schema(
//   {
//     id: { type: String, required: true, unique: true },
//     sessionId: { type: String, required: true },

//     caller_name: { type: String, default: null },
//     caller_phone: { type: String, default: null },
//     caller_email: { type: String, default: null },

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
//         "landlord_new_business",
//         "no_transcript_admin",
//       ],
//       required: true,
//     },

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

//     ai_summary: { type: String, default: null },
//     sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
//     confidence_score: { type: Number, default: null },
//     escalated: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// const CallLog = mongoose.model("CallLog", callLogSchema);

// // ─── Ensure recordings directory exists ───────────────────
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
// - Property Managers (existing tenant/landlord matters): Farah Antone, Michelle Clay, Mary, Matthew Natoli
// - Sales Agents (buying/selling properties): Joshua Nassif, Jordon Le Breux
// - Reception / main office fallback: Delita, or the main office line
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
// - VARY your filler words — do NOT default to "great" every single turn. Rotate naturally between
//   "no worries", "absolutely", "of course", "sure thing", "sounds good" — or use none at all if the
//   line doesn't need one. Never use "great" more than once every few responses.
// - USE the caller's name sparingly — once when you first learn it, and once more near the close of
//   the call is plenty. Do NOT open every response with their name; it reads as robotic and repetitive.
// - NEVER say the same sentence, confirmation, or closing line twice in a row. Once you've told the
//   caller something (e.g. "I'll transfer you to Farah now"), move on — don't restate it again unless
//   they ask you to repeat it.

// =============================================================
// TRANSFER ROUTING LOGIC (applies across all use cases below)
// =============================================================
// This agency has three distinct groups of staff, and callers must be routed to the right one:
// - Property Managers → existing tenants, existing owners/landlords already under management
// - Sales Agents → buyers, or sellers already dealing with a specific agent
// - Reception / main office → anyone new, unknown, or where you can't confidently identify a person

// Golden rule: only ever offer a transfer to a NAMED person if you can reasonably identify who that
// person is (the caller tells you, or the property/context makes it clear). If you can't identify a
// specific person, don't guess — transfer to the main office instead.

// When transferring to a specific person, always say it this way:
// "I'll transfer your call to [name], please make sure to leave a message if [name] isn't available."

// When transferring to the main office (no specific person identified), say it this way:
// "I'll transfer you to our main office now — one moment."

// Do NOT send an email or text message to a property manager or sales agent as a substitute for or
// alongside a transfer — at this stage transfers are voice-only. (SMS is only ever used for the
// "text me the website link" use case below, never to notify staff.)

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

// Once you have their name, use it naturally (see HOW YOU TALK — don't overuse it).

// Then clarify their intent if not already clear:
// - Property inquiry → "And which property were you interested in?"
// - Selling → "And whereabouts is the property?"
// - Renting / Tenant → "And is this about a property you're currently renting, or one you're looking to rent?"
// - Buying an existing listing → go straight to USE CASE: BUYER / SALES ENQUIRY below
// - New landlord wanting property management → go straight to USE CASE: NEW LANDLORD ENQUIRY below
// - Staff transfer → Proceed immediately to STEP — STAFF TRANSFER

// ─────────────────────────────────────────────
// INTENT CLASSIFICATION (internal — determines next steps)
// ─────────────────────────────────────────────
// Classify the call into one of these categories internally:
// - property_inquiry: Asking about listings, property details, or inspection times
// - inspection_booking: Wants to book or reschedule an inspection
// - appraisal_booking: Wants to sell — free appraisal
// - rental_application_followup: Checking on the status of a rental application already submitted
// - tenant_inquiry: Existing tenant with a question or issue
// - general_enquiry: Office hours, directions, general questions
// - directions_access: Getting to office or a property
// - vendor_strata_partner: External partner or strata call
// - staff_transfer: Wants to speak to a specific staff member
// - owner_calling_pm: Existing owner calling about their currently-managed property
// - landlord_new_business: A NEW landlord (not yet a client) asking about property management services
// - no_transcript_admin: admin/no transcript

// ─────────────────────────────────────────────
// STEP 02 — VALUE PROPOSITION
// ─────────────────────────────────────────────
// Trigger ONLY for high-intent callers: sellers, serious buyers/renters, or appraisal requests.
// Skip for transactional callers (just need a time, address, or transfer).

// [DELIVER THIS NATURAL SCRIPT — adapt as needed]

// "Here at Ray White Bankstown we bring the whole team to every property. Directors Tony Roumanous and Charlie Sioud, plus our full sales and property management crew.
// Most of our clients are getting strong results right now because of our local knowledge across Bankstown, Georges Hall, Chester Hill, and Wiley Park — plus access to thousands of active buyers and tenants on our database.
// Whether you want a free appraisal, to book an inspection, or list your home, I can get you sorted right now — no waiting on hold or chasing emails."

// ─────────────────────────────────────────────
// STEP 03 — AGENTIC / PROACTIVE CLOSE
// ─────────────────────────────────────────────
// Don't end the conversation passively. Always offer specific next steps.

// For APPRAISAL / SELLING intent (an existing seller wanting a free appraisal — not a general new
// landlord enquiry, see USE CASE: NEW LANDLORD ENQUIRY for that):
// "I've checked our calendar and we've got a couple of great options this week — we can do a free appraisal at your place on Tuesday at 11am or Thursday at 2pm. Which one works better for you?
// Or if you'd prefer, I can send you a quick market update for your street first so you can see recent sales — would you like that?"

// For INSPECTION BOOKING intent:
// "I can lock in a private inspection for you — we've got availability tomorrow at 5:30pm, or Saturday morning at 10am. Would either of those work?"

// For RENTAL ENQUIRY intent:
// "We've got several properties in your range opening this Saturday. Want me to shortlist two or three and book inspections for you?"

// For STAFF TRANSFER intent:
// Follow TRANSFER ROUTING LOGIC above. If a specific, identifiable staff member is being asked for:
// "I'll transfer your call to [name], please make sure to leave a message if [name] isn't available."
// If no specific person can be identified, transfer to the main office instead — see TRANSFER ROUTING LOGIC.

// ─────────────────────────────────────────────
// STEP 04 — COLLECT DETAILS (when booking confirmed)
// ─────────────────────────────────────────────
// Collect conversationally — NOT like a form. One detail at a time:
// - Name (may already have it)
// - Property address (if appraisal) or which property they want to inspect
// - Preferred contact: phone or email
// - Best time / confirmed slot
// - Any specific concerns

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
// USE CASE: BUYER / SALES ENQUIRY
// ─────────────────────────────────────────────
// Covers buyers asking about a property that's for sale, and any general sales enquiry that isn't
// about the caller's own property. Do NOT try to answer detailed sales questions yourself or book
// anything — this always goes to a Sales Agent.

// First ask: "No worries — do you happen to know which of our sales agents you've been dealing with,
// or was working this listing?"

// - If they name a known Sales Agent (Joshua Nassif or Jordon Le Breux) or a Director:
//   "I'll transfer your call to [name], please make sure to leave a message if [name] isn't available."
// - If they don't know, or it's a general sales enquiry with no specific agent:
//   "No worries — I'll transfer you to our main office now, one moment."

// Log as intent_category: "staff_transfer" if a named agent was identified, otherwise
// "property_inquiry". Set staff_requested to the agent's name if known. outcome: "transferred".

// ─────────────────────────────────────────────
// USE CASE: NEW LANDLORD ENQUIRY (property management)
// ─────────────────────────────────────────────
// A landlord who is NOT yet a client, asking about having Ray White Bankstown manage their rental
// property. This is new business — do not try to run the full appraisal/close flow, and do not
// guess which Property Manager should take it since none has been assigned yet.

// "That's great to hear — our property management team would love to help with that. I'll transfer
// you to our main office now so they can get the details from you directly, one moment."

// Log as intent_category: "landlord_new_business", outcome: "transferred".
// (If the office is unreachable/caller prefers a callback: take name, phone, and property address,
// and log outcome: "callback_scheduled" instead.)

// ─────────────────────────────────────────────
// USE CASE: STAFF TRANSFER
// ─────────────────────────────────────────────
// If the caller asks for a specific staff member by name, respond immediately:
// "I'll transfer your call to [name], please make sure to leave a message if [name] isn't available."
// If you cannot identify who they mean, don't guess — follow TRANSFER ROUTING LOGIC and transfer to
// the main office instead. Always log with intent_category: "staff_transfer".

// ─────────────────────────────────────────────
// USE CASE: TENANT INQUIRIES / MAINTENANCE
// ─────────────────────────────────────────────
// An existing tenant with a question or maintenance issue. Keep it simple — your job is to work out
// who their Property Manager is and get them transferred, not to log the issue with the PM yourself.

// 1. Collect: name, property address, and (briefly) the nature of the issue — just enough to route
//    the call, not a full maintenance report.
// 2. Try to identify the Property Manager for that property (ask the caller if they know who they've
//    been dealing with — Farah, Michelle, Mary, or Matthew — or use context if it's clear).
// 3. If a Property Manager can be identified:
//    "I'll transfer your call to [PM name], please make sure to leave a message if [PM name] isn't available."
// 4. If you can't determine who the Property Manager is:
//    "No worries — I'll transfer you to our main office now so someone can help, one moment."

// Do NOT email or text the property manager on the caller's behalf at this stage — this is a
// transfer-only flow. For genuinely urgent issues (locked out, emergency, safety risk), still follow
// this same routing but flag it as urgent verbally when you hand off, and log escalated: true.

// Log intent_category: "tenant_inquiry", outcome: "transferred" (or "escalated" for urgent/safety
// issues), staff_requested set to the PM's name if identified.

// ─────────────────────────────────────────────
// USE CASE: RENTAL APPLICATION FOLLOW-UP
// ─────────────────────────────────────────────
// This is for someone checking the status of an application they've ALREADY submitted (not someone
// wanting to apply for the first time — see USE CASE: PROPERTY LEASING ENQUIRIES for new applicants,
// who should be pointed to the website).

// "Of course — let me get some details so I can pass this on to the right property manager. Which property did you apply for, and what's your full name?"
// Collect details, then log intent_category: "rental_application_followup", outcome:
// "callback_scheduled" (a PM will follow up) unless you're able to identify and transfer to their PM
// directly, in which case follow the same transfer wording as TENANT INQUIRIES above.

// ─────────────────────────────────────────────
// USE CASE: PROPERTY LEASING ENQUIRIES (available rental listings)
// ─────────────────────────────────────────────
// Callers frequently ask about specific rental listings. Answer using details from
// raywhitebankstown.com.au for the property in question. NEVER invent or guess a
// figure or feature you don't actually know — if you don't have the detail on hand,
// be upfront and offer to have the property manager confirm and call/text them back.

// Typical questions this covers, all answered directly and efficiently (no need for
// the full sales flow — these are transactional):
// - Is the property still available
// - What is the weekly or monthly rent
// - How much is the bond / security deposit
// - How many bedrooms and bathrooms it has
// - Whether there's a garage, carport, or allocated parking
// - Whether it has air conditioning, heating, or ceiling fans
// - Whether there's a yard, balcony, or outdoor space
// - Whether there are built-in wardrobes or extra storage
// - Whether there's a dishwasher or laundry
// - Proximity to public transport
// - Nearby schools, shops, or parks
// - When the next inspection is

// If the caller wants to apply, or is a brand-new applicant (not a follow-up on an existing
// application), always point them to the website rather than trying to take the application
// yourself — see the "How do I apply?" script below. You can also offer to text them the link (see
// USE CASE: TEXT WEBSITE LINK).

// Log these under intent_category: "property_inquiry" (or "inspection_booking" /
// "inspection_reschedule" if it moves to booking a time).

// ─────────────────────────────────────────────
// USE CASE: TEXT WEBSITE LINK
// ─────────────────────────────────────────────
// For any new enquiry — especially rental or sales listing questions — you can offer to text the
// caller a link to the website instead of/as well as talking them through everything verbally.

// "Would you like me to text you a link to our website so you've got it handy?"

// If they say yes:
// 1. Confirm their mobile number (use caller_phone if you already have it).
// 2. Call the send_website_link tool with that number and a short note (e.g. the property address
//    or topic discussed).
// 3. Confirm briefly: "All done — that link's on its way to you now."

// Log intent_category: whatever the underlying enquiry was (usually "property_inquiry" or
// "general_enquiry"), outcome: "sms_sent".

// ─────────────────────────────────────────────
// USE CASE: RENTAL PROCESS / APPLICATION FAQs
// ─────────────────────────────────────────────
// Use discretion adapting tone, but keep the substance of these answers accurate. When referring to
// our applications platform, say "Snug" out loud — not "snug dot com" — it reads more naturally in
// speech. Only mention the actual "snug.com" address if the caller specifically asks for the web
// address, or in a text (see USE CASE: TEXT WEBSITE LINK).

// - "Are pets allowed?"
//   "Any pet request is reviewed as part of the application. If you'd like to apply, head to our website, find the property, and select 'Apply for this Property' — that'll take you through to Snug, where you can create a login and submit your application."

// - "What lease lengths are available?"
//   "Lease terms are usually 6 or 12 months, though it can depend on the application — if a property has a shorter lease available, it'll be noted in the ad."

// - "Is the lease renewable?"
//   "In most cases, yes — though that depends on the individual property and the owner's plans when the lease is due to expire."

// - "Is there flexibility with the move-in date?"
//   "That can be reviewed as part of the application."

// - "Do I need to register for an inspection?"
//   "It's not essential, but it's definitely encouraged. To register, find the property on our website and select 'Apply for this Property' — that'll take you to Snug to create a login and register to attend."

// - "How do I apply?"
//   "Head to our website, find the property you're after, and select 'Apply for this Property'. You'll be redirected to Snug to create a login and submit your application there."

// - "What documents do I need?"
//   "That's all listed in Snug once you start your application — find the property on our website, select 'Apply for this Property', and Snug will show you everything required."

// - "What are the income or reference requirements?"
//   "That information's in Snug as well — same process: find the property on our website, select 'Apply for this Property', and Snug will list what's needed."

// - "How long does approval usually take?"
//   "Typically 1 to 3 days, depending on how many applications we're working through and whether any extra info is needed."

// Log rental-application FAQ calls under intent_category: "property_inquiry" or
// "rental_application_followup" as appropriate, with outcome: "info_provided"
// unless it progresses further (e.g. transferred, callback_scheduled, sms_sent).

// ─────────────────────────────────────────────
// USE CASE: REQUESTS THAT GO BACK TO RECEPTION / PM
// ─────────────────────────────────────────────
// - "Can I arrange a private viewing?"
//   Do NOT try to book this yourself — this goes to the relevant Property Manager.
//   Try to identify the PM first (as in TENANT INQUIRIES / MAINTENANCE above). If identified:
//   "I'll transfer your call to [PM name], please make sure to leave a message if [PM name] isn't available."
//   If not identified: "No worries — I'll transfer you to our main office now, one moment."
//   Log as intent_category: "staff_transfer" or "tenant_inquiry" with staff_requested set to the
//   relevant PM if known.

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
// "No dramas — would it be okay if I sent you a quick text with our details? That way you've got a direct line if anything changes."

// =============================================================
// ESCALATION — WHEN TO HAND OFF
// =============================================================
// ALWAYS escalate (and log escalated: true) for:
// - Complaints or disputes
// - Legal or financial questions
// - Abusive or aggressive callers
// - Urgent tenant safety/emergency issues
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
// - ai_summary
// - sentiment
// - confidence_score
// - escalated

// Confirmation after logging (if booking was made):
// "Perfect, [name] — I've got that locked in for you. You'll hear from the team [at preferred_time / shortly]. Is there anything else I can help with today?"

// =============================================================
// HARD RULES — NON-NEGOTIABLE
// =============================================================
// - Language: ENGLISH ONLY at all times
// - ONE question at a time
// - Responses: 1 to 2 sentences max
// - NEVER assume the caller's name
// - NEVER repeat the same sentence or confirmation twice in a row
// - Don't overuse "great" or the caller's name — vary language naturally (see HOW YOU TALK)
// - ALWAYS call save_call_log after every completed call
// - Value proposition must be delivered before the close for high-intent callers
// - For transactional callers, skip the sales flow and answer directly
// - Never give legal or financial advice
// - Never make up property details
// - For rental listing questions, use only known/verified details from raywhitebankstown.com.au — if unsure, say so and offer a callback rather than guessing
// - Private viewing requests, tenant/maintenance issues, buyer/sales enquiries, and new landlord
//   enquiries are always ROUTED per TRANSFER ROUTING LOGIC — never booked, emailed, or texted to
//   staff directly by you
// - Never send an email or SMS to staff on the caller's behalf — transfers are voice-only; SMS is
//   only ever used to text the caller the website link
// `.trim();
// }

// // ─── Tool Definitions ─────────────────────────────────────
// function getSaveCallLogTool() {
//   return {
//     type: "function",
//     name: "save_call_log",
//     description:
//       "Saves a structured call log entry after every completed call. MUST be called once intent is established and the call has reached a natural conclusion (booking made, info given, transferred, or escalated).",
//     parameters: {
//       type: "object",
//       properties: {
//         caller_name: { type: "string", description: "Full name of the caller" },
//         caller_phone: { type: "string", description: "Caller's phone number (if provided)" },
//         caller_email: { type: "string", description: "Caller's email address (if provided)" },
//         property_address: { type: "string", description: "Property address they asked about or want appraised/inspected" },
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
//             "landlord_new_business",
//             "no_transcript_admin",
//           ],
//           description: "Classified intent of the call",
//         },
//         preferred_time: {
//           type: "string",
//           description: "Agreed appointment slot or preferred callback time — e.g. 'Tuesday at 11am', 'Saturday 10am'",
//         },
//         staff_requested: { type: "string", description: "Name of staff member requested / identified for transfer" },
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
//         ai_summary: { type: "string", description: "1–2 sentence summary of the call" },
//         sentiment: {
//           type: "string",
//           enum: ["positive", "neutral", "negative"],
//           description: "Overall sentiment of the caller during the call",
//         },
//         confidence_score: {
//           type: "number",
//           description: "AI confidence score for this call, from 0.0 to 1.0",
//         },
//         escalated: { type: "boolean", description: "True if the call was escalated to a human team member" },
//       },
//       required: ["caller_name", "intent_category", "outcome"],
//     },
//   };
// }

// function getSendWebsiteLinkTool() {
//   return {
//     type: "function",
//     name: "send_website_link",
//     description:
//       "Texts the caller a link to the Ray White Bankstown website via SMS. Use when a caller agrees to be sent a link (e.g. for a new enquiry, a rental listing, or the application process).",
//     parameters: {
//       type: "object",
//       properties: {
//         caller_phone: {
//           type: "string",
//           description: "Mobile number to send the text to, in a callable format e.g. +614XXXXXXXX",
//         },
//         note: {
//           type: "string",
//           description: "Optional short context to include, e.g. a property address or topic discussed",
//         },
//       },
//       required: ["caller_phone"],
//     },
//   };
// }

// // ─── Recording — WAV file builder for conversation audio ───
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

// // ─── Helpers ──────────────────────────────────────────────
// function sendWsJson(ws, payload) {
//   if (!ws || ws.readyState !== WebSocket.OPEN) return false;
//   ws.send(JSON.stringify(payload));
//   return true;
// }

// function safeJsonParse(text) {
//   try {
//     return JSON.parse(text);
//   } catch {
//     return null;
//   }
// }

// function toFunctionCallPayload(value) {
//   if (!value || typeof value !== "object") return null;

//   if (
//     value.type === "function_call" &&
//     typeof value.name === "string" &&
//     typeof value.arguments === "string" &&
//     typeof value.call_id === "string"
//   ) {
//     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
//   }

//   if (
//     typeof value.name === "string" &&
//     typeof value.arguments === "string" &&
//     typeof value.call_id === "string"
//   ) {
//     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
//   }

//   return null;
// }

// function extractFunctionCallsFromResponse(response) {
//   const calls = [];
//   const output = response?.output;

//   if (Array.isArray(output)) {
//     for (const item of output) {
//       const fc = toFunctionCallPayload(item);
//       if (fc) calls.push(fc);
//     }
//   }

//   return calls;
// }

// // ─── Create OpenAI Realtime Session ───────────────────────
// function createRealtimeSession(sessionId, onEvent, extraInstructions = "") {
//   const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
//   const startMs = Date.now();

//   return new Promise((resolve, reject) => {
//     const ws = new WebSocket(url, {
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//       },
//     });

//     ws.on("open", () => {
//       console.log(`[${sessionId}] OpenAI connected (${Date.now() - startMs}ms)`);

//       const sessionUpdate = {
//         type: "session.update",
//         session: {
//           type: "realtime",
//           model: OPENAI_REALTIME_MODEL,
//           output_modalities: ["text"],
//           audio: {
//             input: {
//               format: {
//                 type: "audio/pcm",
//                 rate: OPENAI_INPUT_SAMPLE_RATE,
//               },
//               turn_detection: {
//                 type: "server_vad",
//                 threshold: OPENAI_VAD_THRESHOLD,
//                 prefix_padding_ms: OPENAI_VAD_PREFIX_PADDING_MS,
//                 silence_duration_ms: OPENAI_VAD_SILENCE_DURATION_MS,
//               },
//             },
//           },
//           instructions: getSystemPrompt() + (extraInstructions ? `\n\n${extraInstructions}` : ""),
//           tools: [getSaveCallLogTool(), getSendWebsiteLinkTool()],
//           tool_choice: "auto",
//         },
//       };

//       sendWsJson(ws, sessionUpdate);

//       const session = {
//         ws,
//         elevenLabsWs: null,
//         elevenLabsReady: false,
//         textBuffer: [],
//         isResponseActive: false,
//         textDeltaEventType: null,
//         currentResponseStartedAt: null,
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

//     ws.on("close", (code) => {
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
//   sendWsJson(session.ws, { type: "input_audio_buffer.append", audio: base64Audio });
// }

// // ─── Trigger greeting ─────────────────────────────────────
// function triggerGreeting(sessionId) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   session.greetingTriggeredMs = Date.now();
//   console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
//   sendWsJson(session.ws, { type: "response.create" });
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
//     } catch {}
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
//     session.elevenLabsWs.send(JSON.stringify({ text, try_trigger_generation: true }));
//   } else if (session) {
//     session.textBuffer.push(text);
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
//     } catch {}
//     session.elevenLabsWs = null;
//     session.elevenLabsReady = false;
//     session.textBuffer = [];
//   }
// }

// // ─── Handle function calls from OpenAI ────────────────────
// async function handleFunctionCall(sessionId, eventOrItem) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   const call = toFunctionCallPayload(eventOrItem);
//   if (!call) return;

//   if (call.name === "save_call_log") {
//     await handleSaveCallLog(sessionId, call);
//   } else if (call.name === "send_website_link") {
//     await handleSendWebsiteLink(sessionId, call);
//   }
// }

// async function handleSaveCallLog(sessionId, call) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   const callId = typeof call.call_id === "string" ? call.call_id : null;

//   if (callId && session.processedCallIds.has(callId)) return;
//   if (callId) session.processedCallIds.add(callId);

//   try {
//     const args = JSON.parse(call.arguments);

//     console.log(
//       `[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`
//     );

//     const logId = uuidv4();

//     const callLog = new CallLog({
//       id: logId,
//       sessionId,
//       caller_name: args.caller_name || null,
//       caller_phone: args.caller_phone || null,
//       caller_email: args.caller_email || null,
//       property_address: args.property_address || null,
//       intent_category: args.intent_category,
//       preferred_time: args.preferred_time || null,
//       staff_requested: args.staff_requested || null,
//       outcome: args.outcome,
//       ai_summary: args.ai_summary || null,
//       sentiment: args.sentiment || "neutral",
//       confidence_score: args.confidence_score || null,
//       escalated: args.escalated || false,
//     });

//     await callLog.save();
//     session.callLogs.push({ id: logId, ...args });

//     console.log(`[${sessionId}] Call log saved to MongoDB: ${logId}`);

//     sendWsJson(session.ws, {
//       type: "conversation.item.create",
//       item: {
//         type: "function_call_output",
//         call_id: call.call_id,
//         output: JSON.stringify({
//           success: true,
//           message: "Call log saved successfully.",
//           log_id: logId,
//           outcome: args.outcome,
//         }),
//       },
//     });

//     sendWsJson(session.ws, { type: "response.create" });
//     session.onEvent({ type: "call-logged", data: args });
//   } catch (err) {
//     if (callId) session.processedCallIds.delete(callId);
//     console.error(`[${sessionId}] Call log save failed:`, err.message);
//   }
// }

// async function handleSendWebsiteLink(sessionId, call) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   const callId = typeof call.call_id === "string" ? call.call_id : null;

//   if (callId && session.processedCallIds.has(callId)) return;
//   if (callId) session.processedCallIds.add(callId);

//   try {
//     const args = JSON.parse(call.arguments);
//     const note = args.note ? ` (${args.note})` : "";
//     const messageBody = `Ray White Bankstown${note}: ${AGENCY_WEBSITE_URL}`;

//     console.log(`[${sessionId}] Sending website link SMS to ${args.caller_phone}`);

//     const result = await sendSmsLink(args.caller_phone, messageBody);

//     sendWsJson(session.ws, {
//       type: "conversation.item.create",
//       item: {
//         type: "function_call_output",
//         call_id: call.call_id,
//         output: JSON.stringify(
//           result.success
//             ? { success: true, message: "Website link texted to caller." }
//             : { success: false, message: "Could not send the text — let the caller know and offer another way to help." }
//         ),
//       },
//     });

//     sendWsJson(session.ws, { type: "response.create" });
//     session.onEvent({ type: "sms-sent", data: { caller_phone: args.caller_phone, success: result.success } });
//   } catch (err) {
//     if (callId) session.processedCallIds.delete(callId);
//     console.error(`[${sessionId}] send_website_link failed:`, err.message);
//   }
// }

// // ─── Event Hub — Process OpenAI Realtime events ───────────
// async function handleTextDelta(sessionId, event) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   if (!session.textDeltaEventType) {
//     session.textDeltaEventType = event.type;
//   } else if (session.textDeltaEventType !== event.type) {
//     return;
//   }

//   if (session.elevenLabsReady) {
//     sendTextToElevenLabs(sessionId, event.delta);
//   } else {
//     session.textBuffer.push(event.delta);
//   }
//   session.onEvent({ type: "transcript-delta", delta: event.delta });
// }

// async function handleTextDone(sessionId, event) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   if (session.textDeltaEventType && session.textDeltaEventType !== event.type) {
//     return;
//   }

//   flushElevenLabsStream(sessionId);
//   session.onEvent({ type: "transcript-done", transcript: event.text });
// }

// async function handleRealtimeEvent(sessionId, event) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   switch (event.type) {
//     case "session.created":
//     case "session.updated":
//       break;

//     case "response.created":
//       session.isResponseActive = true;
//       session.currentResponseStartedAt = Date.now();
//       if (!session.firstResponseCreatedMs) {
//         session.firstResponseCreatedMs = Date.now();
//       }
//       openElevenLabsStream(sessionId);
//       break;

//     case "response.output_text.delta":
//     case "response.text.delta":
//       await handleTextDelta(sessionId, event);
//       break;

//     case "response.output_text.done":
//     case "response.text.done":
//       await handleTextDone(sessionId, event);
//       break;

//     case "response.done": {
//       session.isResponseActive = false;
//       session.currentResponseStartedAt = null;

//       const calls = extractFunctionCallsFromResponse(event.response);
//       for (const fc of calls) {
//         await handleFunctionCall(sessionId, fc);
//       }
//       break;
//     }

//     case "response.output_item.done":
//       if (event.item) {
//         const fc = toFunctionCallPayload(event.item);
//         if (fc) await handleFunctionCall(sessionId, fc);
//       }
//       break;

//     case "response.function_call_arguments.done":
//       await handleFunctionCall(sessionId, event);
//       break;

//     case "input_audio_buffer.speech_started": {
//       const elapsedSinceResponseStart = session.currentResponseStartedAt
//         ? Date.now() - session.currentResponseStartedAt
//         : Infinity;

//       if (session.isResponseActive && elapsedSinceResponseStart < BARGE_IN_GRACE_MS) {
//         console.log(
//           `[${sessionId}] Ignoring likely-echo speech_started (${elapsedSinceResponseStart}ms into response)`
//         );
//         break;
//       }

//       console.log(`[${sessionId}] User interrupted — stopping AI voice`);
//       if (session.isResponseActive) {
//         sendWsJson(session.ws, { type: "response.cancel" });
//       }
//       closeElevenLabsWs(sessionId);
//       openElevenLabsStream(sessionId, true);
//       session.onEvent({ type: "speech-started" });
//       break;
//     }

//     case "conversation.item.input_audio_transcription.completed":
//       session.onEvent({ type: "user-transcript", transcript: event.transcript });
//       break;

//     case "error":
//       console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
//       session.onEvent({ type: "error", error: event.error });
//       break;

//     default:
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
//     try {
//       session.ws.close();
//     } catch {}
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
//       case "sms-sent":
//         socket.emit("sms-sent", event.data);
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
//       default:
//         break;
//     }
//   };
// }

// // ============================================================
// // SOCKET.IO — Client Connection Handling (browser/softphone testing)
// // ============================================================
// io.on("connection", (socket) => {
//   console.log(`Client connected: ${socket.id}`);

//   const forwarder = buildEventForwarder(socket);

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
//     if (data?.audio) {
//       sendAudio(socket.id, data.audio);
//     }
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

// // ============================================================
// // TELEPHONY — 3CX (via Asterisk AudioSocket) Call Handling
// // ============================================================
// // Dialplan (extensions_raywhite.conf) hits this BEFORE calling
// // AudioSocket(), so by the time onCallStart fires below, the context
// // for this call (which DID/line it came in on) is already available.
// const callContexts = new Map(); // callId (uuid) -> { did, label, extension, callerid }

// app.get("/api/telephony/register-call", (req, res) => {
//   const { uuid, did, label, extension, callerid } = req.query;
//   if (!uuid) {
//     return res.status(400).json({ success: false, error: "uuid is required" });
//   }
//   callContexts.set(uuid, {
//     did: did || null,
//     label: label || null,
//     extension: extension || null,
//     callerid: callerid || null,
//     registeredAt: Date.now(),
//   });
//   console.log(
//     `[Telephony] Registered call ${uuid} — line "${label || "unknown"}" (DID ${did || "n/a"}, ext ${extension || "n/a"}), caller ${callerid || "unknown"}`
//   );
//   res.json({ success: true });
// });

// const telephonyCalls = new Map(); // callId -> { ctx, sessionId }

// startAudioSocketServer({
//   onCallStart: (callId, ctx) => {
//     const sessionId = `tel-${callId}`;
//     const callContext = callContexts.get(callId) || {};
//     telephonyCalls.set(callId, { ctx, sessionId, callContext });

//     // Give the AI a heads-up about which line this call landed on. It's
//     // appended to the standard system prompt, not a replacement for it —
//     // the call flow, tools, and hard rules above still apply as-is.
//     const extraInstructions = callContext.label
//       ? `=============================================================
// CALL CONTEXT — TELEPHONY LINE INFO
// =============================================================
// This call arrived via 3CX/Asterisk on the "${callContext.label}" line` +
//         (callContext.extension ? ` (internal extension ${callContext.extension})` : "") +
//         (callContext.did ? `, DID ${callContext.did}` : "") +
//         `. Treat this the same as any inbound call to the front desk unless
// you're told otherwise for this specific line — this is currently just
// routing metadata for logging/testing, not a behavioural instruction.`
//       : "";

//     const forwarder = (event) => {
//       switch (event.type) {
//         case "audio-delta": {
//           // event.delta is base64 PCM16 @ 16kHz from ElevenLabs
//           const pcm16k = Buffer.from(event.delta, "base64");
//           ctx.pushOutboundPcm16k(pcm16k);
//           break;
//         }
//         case "speech-started":
//           // Caller barged in — drop whatever TTS audio is still queued
//           ctx.clearOutbound();
//           break;
//         case "session-closed":
//         case "error":
//           ctx.hangup();
//           break;
//         default:
//           // call-logged, sms-sent, transcript-*, user-transcript, recording-saved
//           // all still fire — useful if you want to pipe these to a dashboard too.
//           break;
//       }
//     };

//     createRealtimeSession(sessionId, forwarder, extraInstructions)
//       .then(() => triggerGreeting(sessionId))
//       .catch((err) => {
//         console.error(`[${sessionId}] Telephony session failed:`, err.message);
//         ctx.hangup();
//       });
//   },

//   onAudio: (callId, base64Pcm24k) => {
//     const entry = telephonyCalls.get(callId);
//     if (!entry) return;
//     sendAudio(entry.sessionId, base64Pcm24k);
//   },

//   onCallEnd: (callId) => {
//     const entry = telephonyCalls.get(callId);
//     if (!entry) return;
//     closeSession(entry.sessionId);
//     telephonyCalls.delete(callId);
//     callContexts.delete(callId);
//   },
// });

// // ─── REST API Endpoints ───────────────────────────────────
// app.get("/api/call-logs", async (req, res) => {
//   try {
//     const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
//     res.json(logs);
//   } catch (err) {
//     console.error("Failed to fetch call logs:", err.message);
//     res.status(500).json({ error: "Failed to fetch call logs" });
//   }
// });

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
// ║   Running on http://localhost:${PORT}                         ║
// ║                                                              ║
// ║   Flow: Greeting → Value Prop → Agentic Close                ║
// ║   Use Cases: Inspect · Appraise · Transfer · Tenant · Info   ║
// ║   Routing: Tenant→PM · Buyer/Sales→Agent · New Landlord→Office║
// ║   Escalation: Complaints · Legal · Abusive → Human            ║
// ║                                                              ║
// ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
// ║   Recordings Dir:  ${RECORDINGS_DIR}                         ║
// ║   MongoDB:         ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
// ║   Twilio SMS:      ${twilioClient ? "✓ Set" : "✗ Simulated (log only)"}                ║
// ║   Office Number:   ${OFFICE_MAIN_NUMBER || "not configured"}                          ║
// ║   Telephony:       AudioSocket bridge on 127.0.0.1:8090       ║
// ╚══════════════════════════════════════════════════════════════╝
//   `);
// });

// // require("dotenv").config();

// // const express = require("express");
// // const http = require("http");
// // const { Server } = require("socket.io");
// // const WebSocket = require("ws");
// // const path = require("path");
// // const fs = require("fs");
// // const { v4: uuidv4 } = require("uuid");
// // const mongoose = require("mongoose");

// // // ─── Config ───────────────────────────────────────────────
// // const PORT = process.env.PORT || 3000;
// // const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// // const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// // const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mkrzcZmzalRKwXdd";
// // const MONGODB_URI = process.env.MONGODB_URI;
// // const PREWARM_TTL_MS = 60_000;

// // // GA Realtime defaults
// // const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
// // const OPENAI_INPUT_SAMPLE_RATE = Number(process.env.OPENAI_INPUT_SAMPLE_RATE || 24000);
// // const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.8);
// // const OPENAI_VAD_PREFIX_PADDING_MS = Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 300);
// // const OPENAI_VAD_SILENCE_DURATION_MS = Number(process.env.OPENAI_VAD_SILENCE_DURATION_MS || 2000);

// // // ─── MongoDB Connection ───────────────────────────────────
// // if (!MONGODB_URI) {
// //   console.error("❌  MONGODB_URI is not set in .env — call logs will NOT be saved.");
// // } else {
// //   mongoose
// //     .connect(MONGODB_URI)
// //     .then(() => console.log("✅  MongoDB connected"))
// //     .catch((err) => console.error("❌  MongoDB connection error:", err.message));
// // }

// // // ─── Call Log Schema / Model ──────────────────────────────
// // const callLogSchema = new mongoose.Schema(
// //   {
// //     id: { type: String, required: true, unique: true },
// //     sessionId: { type: String, required: true },

// //     caller_name: { type: String, default: null },
// //     caller_phone: { type: String, default: null },
// //     caller_email: { type: String, default: null },

// //     property_address: { type: String, default: null },
// //     intent_category: {
// //       type: String,
// //       enum: [
// //         "property_inquiry",
// //         "inspection_booking",
// //         "inspection_reschedule",
// //         "rental_application_followup",
// //         "tenant_inquiry",
// //         "general_enquiry",
// //         "directions_access",
// //         "vendor_strata_partner",
// //         "staff_transfer",
// //         "owner_calling_pm",
// //         "appraisal_booking",
// //         "no_transcript_admin",
// //       ],
// //       required: true,
// //     },

// //     preferred_time: { type: String, default: null },
// //     staff_requested: { type: String, default: null },
// //     outcome: {
// //       type: String,
// //       enum: [
// //         "inspection_booked",
// //         "appraisal_booked",
// //         "transferred",
// //         "callback_scheduled",
// //         "info_provided",
// //         "market_update_sent",
// //         "message_taken",
// //         "escalated",
// //         "sms_sent",
// //       ],
// //       required: true,
// //     },

// //     ai_summary: { type: String, default: null },
// //     sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
// //     confidence_score: { type: Number, default: null },
// //     escalated: { type: Boolean, default: false },
// //   },
// //   { timestamps: true }
// // );

// // const CallLog = mongoose.model("CallLog", callLogSchema);

// // // ─── Ensure recordings directory exists ───────────────────
// // const RECORDINGS_DIR = path.join(__dirname, "recordings");
// // if (!fs.existsSync(RECORDINGS_DIR)) {
// //   fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
// // }

// // // ─── Express + Socket.IO ──────────────────────────────────
// // const app = express();
// // const server = http.createServer(app);
// // const io = new Server(server, { cors: { origin: "*" } });

// // app.use(express.static(path.join(__dirname, "public")));
// // app.use("/recordings", express.static(RECORDINGS_DIR));

// // // ─── Session State ────────────────────────────────────────
// // const sessions = new Map();
// // const prewarmStates = new Map();

// // // ============================================================
// // // SYSTEM PROMPT — Ray White Bankstown AI Receptionist
// // // ============================================================
// // function getSystemPrompt() {
// //   return `
// // =============================================================
// // ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING ELSE.
// // =============================================================
// // You MUST speak and respond in English at all times, no matter what.
// // - If the caller speaks in another language, respond ONLY in English.
// // - Do NOT switch to their language, do NOT mix languages.
// // - If the caller insists on another language, say: "Sorry, I can only assist in English at the moment."
// // =============================================================

// // ### IDENTITY ###
// // You are the AI receptionist for Ray White Bankstown — one of the area's top-performing real estate agencies.
// // This is an inbound call. You answer all routine enquiries, book inspections and appraisals, handle staff transfers, and escalate complex matters gracefully.
// // You sound like a friendly, professional Australian receptionist — warm, helpful, and locally knowledgeable.

// // ### AGENCY DETAILS (use naturally in conversation) ###
// // - Agency: Ray White Bankstown
// // - Office address: 362–364 Chapel Road, Bankstown
// // - Key suburbs served: Bankstown, Georges Hall, Chester Hill, Wiley Park, Sefton, Mount Lewis, Condell Park
// // - Directors: Tony Roumanous, Charlie Sioud
// // - Property Managers: Farah Antone, Michelle Clay, Mary, Matthew Natoli
// // - Sales/Other: Joshua Nassif, Jordon Le Breux, Delita (reception fallback)
// // - Website: raywhitebankstown.com.au

// // ### AI DISCLOSURE RULE ###
// // - Do NOT volunteer that you are AI. Just be the receptionist.
// // - ONLY if someone explicitly asks "are you a robot?", "are you AI?", or "am I talking to a real person?" — then be honest:
// //   "Good question — I'm actually an AI receptionist helping the Ray White Bankstown team manage calls. But I can book inspections, answer your questions, and connect you with the right person just as well. How can I help?"
// // - After admitting it, pivot straight back to helping them.

// // ### PERSONALITY ###
// // - Warm, natural Australian manner — friendly and professional
// // - Locally knowledgeable — sound like you know Bankstown and the surrounding suburbs
// // - Natural filler words: "absolutely", "no worries", "great", "of course", "sure thing"
// // - Never pushy — helpful and genuinely useful
// // - Match the caller's energy: relaxed with relaxed callers, more efficient with busy callers

// // ### HOW YOU TALK ###
// // - SHORT sentences — 1 to 2 sentences per response max
// // - Use contractions: "what's", "we've", "I'll", "you're"
// // - ACKNOWLEDGE what they said before you respond
// // - ONE question at a time — never stack multiple questions
// // - If silence or can't hear: "Still there?" or "Sorry, didn't catch that — could you repeat that?"

// // =============================================================
// // CALL FLOW — HAPPY PATH (Steps 01 → 02 → 03)
// // =============================================================
// // This is the PRIMARY flow for any high-intent caller (selling, renting, inspecting, appraising).
// // For pure transactional calls (just asking for a time / address), answer directly and efficiently — no need for the full sales flow.

// // ─────────────────────────────────────────────
// // STEP 01 — GREETING & INTENT CAPTURE
// // ─────────────────────────────────────────────
// // Always greet first. You do NOT know the caller's name. Ask early and use it naturally.

// // Start with:
// // "Thanks for calling Ray White Bankstown, you're through to the front desk. How can I help you today?"

// // Wait for their response.

// // Then ask for their name if they haven't given it:
// // "Great — and who am I speaking with?"

// // Once you have their name, use it naturally.

// // Then clarify their intent if not already clear:
// // - Property inquiry → "And which property were you interested in?"
// // - Selling → "And whereabouts is the property?"
// // - Renting / Tenant → "And is this about a property you're currently renting, or one you're looking to rent?"
// // - Staff transfer → Proceed immediately to STEP — STAFF TRANSFER

// // ─────────────────────────────────────────────
// // INTENT CLASSIFICATION (internal — determines next steps)
// // ─────────────────────────────────────────────
// // Classify the call into one of these categories internally:
// // - property_inquiry: Asking about listings, property details, or inspection times
// // - inspection_booking: Wants to book or reschedule an inspection
// // - appraisal_booking: Wants to sell — free appraisal
// // - rental_application_followup: Checking on a rental application
// // - tenant_inquiry: Existing tenant with a question or issue
// // - general_enquiry: Office hours, directions, general questions
// // - directions_access: Getting to office or a property
// // - vendor_strata_partner: External partner or strata call
// // - staff_transfer: Wants to speak to a specific staff member
// // - owner_calling_pm: Owner calling about their managed property

// // ─────────────────────────────────────────────
// // STEP 02 — VALUE PROPOSITION
// // ─────────────────────────────────────────────
// // Trigger ONLY for high-intent callers: sellers, serious buyers/renters, or appraisal requests.
// // Skip for transactional callers (just need a time, address, or transfer).

// // [DELIVER THIS NATURAL SCRIPT — adapt as needed]

// // "Great — here at Ray White Bankstown we bring the whole team to every property. Directors Tony Roumanous and Charlie Sioud, plus our full sales and property management crew.
// // Most of our clients are getting strong results right now because of our local knowledge across Bankstown, Georges Hall, Chester Hill, and Wiley Park — plus access to thousands of active buyers and tenants on our database.
// // Whether you want a free appraisal, to book an inspection, or list your home, I can get you sorted right now — no waiting on hold or chasing emails."

// // ─────────────────────────────────────────────
// // STEP 03 — AGENTIC / PROACTIVE CLOSE
// // ─────────────────────────────────────────────
// // Don't end the conversation passively. Always offer specific next steps.

// // For APPRAISAL / SELLING intent:
// // "I've checked our calendar and we've got a couple of great options this week — we can do a free appraisal at your place on Tuesday at 11am or Thursday at 2pm. Which one works better for you?
// // Or if you'd prefer, I can send you a quick market update for your street first so you can see recent sales — would you like that?"

// // For INSPECTION BOOKING intent:
// // "I can lock in a private inspection for you — we've got availability tomorrow at 5:30pm, or Saturday morning at 10am. Would either of those work?"

// // For RENTAL ENQUIRY intent:
// // "We've got several properties in your range opening this Saturday. Want me to shortlist two or three and book inspections for you?"

// // For STAFF TRANSFER intent:
// // "[Staff name] is available — I'll connect you now. One moment."
// // (If unavailable): "They're with a client right now. I can take a message and have them call you back, or I can book a specific callback time — which would you prefer?"

// // ─────────────────────────────────────────────
// // STEP 04 — COLLECT DETAILS (when booking confirmed)
// // ─────────────────────────────────────────────
// // Collect conversationally — NOT like a form. One detail at a time:
// // - Name (may already have it)
// // - Property address (if appraisal) or which property they want to inspect
// // - Preferred contact: phone or email
// // - Best time / confirmed slot
// // - Any specific concerns

// // =============================================================
// // SPECIFIC USE CASES
// // =============================================================

// // ─────────────────────────────────────────────
// // USE CASE: HOME OPEN / INSPECTION TIMES
// // ─────────────────────────────────────────────
// // Caller asks for open home times or property details.
// // Answer directly and efficiently:
// // "Yep, absolutely — for [address] we've got a home open on [day] at [time]. Would you like me to lock in a spot for you, or are you happy to just show up?"

// // Mock inspection schedule (use these in demo):
// // - 67 Jocelyn Street, Chester Hill: Wednesday 5:00–5:30pm, Saturday 10:00–10:30am
// // - 103 Flinders Road: Saturday 10:30–11:00am
// // - 58 Marden Street: Thursday 6:00–6:30pm, Saturday 11:00–11:30am
// // - 23 Mount Lewis Avenue: Saturday 10:00–10:30am

// // ─────────────────────────────────────────────
// // USE CASE: BOOKING OR RESCHEDULING INSPECTIONS
// // ─────────────────────────────────────────────
// // "No worries, I can lock that in for you. Just to confirm — is [address] the right property, and does [time slot] still work?"
// // Collect name + phone/email, confirm, then call save_call_log.

// // ─────────────────────────────────────────────
// // USE CASE: SELLING / FREE APPRAISAL
// // ─────────────────────────────────────────────
// // This is the highest-value use case. Always deliver Step 02 (value prop) before Step 03 (close).
// // Collect: name, property address, preferred appraisal time, best contact.

// // ─────────────────────────────────────────────
// // USE CASE: STAFF TRANSFER
// // ─────────────────────────────────────────────
// // If the caller asks for a specific staff member by name, respond immediately:
// // "Sure, let me put you through to [name] now."
// // If unavailable: offer message + callback. Always log with intent_category: "staff_transfer".

// // ─────────────────────────────────────────────
// // USE CASE: TENANT INQUIRIES / MAINTENANCE
// // ─────────────────────────────────────────────
// // Collect: name, property address, nature of the issue.
// // Route to relevant property manager (Farah, Michelle, Mary, or Matthew).
// // For urgent issues (locked out, emergency): escalate immediately.
// // "I'll get that through to [PM name] right away — they'll be in touch shortly. Is [phone number] the best number for them to reach you?"

// // ─────────────────────────────────────────────
// // USE CASE: RENTAL APPLICATION FOLLOW-UP
// // ─────────────────────────────────────────────
// // "Of course — let me get some details so I can pass this on to the right property manager. Which property did you apply for, and what's your full name?"
// // Log and route to appropriate PM.

// // ─────────────────────────────────────────────
// // USE CASE: DIRECTIONS / OFFICE ACCESS
// // ─────────────────────────────────────────────
// // "We're at 362–364 Chapel Road, Bankstown — easy to find, right on the main road. Is there anything else I can help with?"

// // =============================================================
// // OBJECTION HANDLERS
// // =============================================================
// // Only use these if the caller explicitly raises the objection.

// // ─────────────────────────────────────────────
// // OBJECTION — "I'm happy with my current agent"
// // ─────────────────────────────────────────────
// // "That's completely fair. We'd only suggest making a switch if the numbers genuinely worked in your favour — we've helped quite a few sellers in [suburb] recently who were in the same position. Would you at least be open to a free appraisal so you can see what the market's doing?"

// // ─────────────────────────────────────────────
// // OBJECTION — "I'll just look online / I don't need help"
// // ─────────────────────────────────────────────
// // "Totally get that. The thing is, a lot of our best opportunities go to buyers on our database before they even hit the website. Happy to keep you posted directly — I just need your email."

// // ─────────────────────────────────────────────
// // OBJECTION — "Not a good time / I'm busy"
// // ─────────────────────────────────────────────
// // "No worries at all. Can I grab your name and number and have someone call you back at a better time? Even 5 minutes is enough to get the ball rolling."

// // ─────────────────────────────────────────────
// // OBJECTION — Caller is not interested
// // ─────────────────────────────────────────────
// // "No dramas — would it be okay if I sent you a quick text with our details? That way you've got a direct line if anything changes."

// // =============================================================
// // ESCALATION — WHEN TO HAND OFF
// // =============================================================
// // ALWAYS escalate (and log escalated: true) for:
// // - Complaints or disputes
// // - Legal or financial questions
// // - Abusive or aggressive callers
// // - Any situation where your confidence is low

// // Escalation script:
// // "I want to make sure you get the best possible help with this — let me connect you with [Tony / the team] right now. Just bear with me one moment."

// // =============================================================
// // STEP 05 — SAVE CALL LOG (MANDATORY after every completed call)
// // =============================================================
// // After every call where intent was established — whether booked, transferred, info given, or escalated — call save_call_log with all details.

// // Required:
// // - caller_name, intent_category, outcome

// // Optional but important:
// // - caller_phone / caller_email
// // - property_address
// // - preferred_time
// // - staff_requested
// // - ai_summary
// // - sentiment
// // - confidence_score
// // - escalated

// // Confirmation after logging (if booking was made):
// // "Perfect, [name] — I've got that locked in for you. You'll hear from the team [at preferred_time / shortly]. Is there anything else I can help with today?"

// // =============================================================
// // HARD RULES — NON-NEGOTIABLE
// // =============================================================
// // - Language: ENGLISH ONLY at all times
// // - ONE question at a time
// // - Responses: 1 to 2 sentences max
// // - NEVER assume the caller's name
// // - ALWAYS call save_call_log after every completed call
// // - Value proposition must be delivered before the close for high-intent callers
// // - For transactional callers, skip the sales flow and answer directly
// // - Never give legal or financial advice
// // - Never make up property details
// // `.trim();
// // }

// // // ─── Tool Definition ──────────────────────────────────────
// // function getSaveCallLogTool() {
// //   return {
// //     type: "function",
// //     name: "save_call_log",
// //     description:
// //       "Saves a structured call log entry after every completed call. MUST be called once intent is established and the call has reached a natural conclusion (booking made, info given, transferred, or escalated).",
// //     parameters: {
// //       type: "object",
// //       properties: {
// //         caller_name: { type: "string", description: "Full name of the caller" },
// //         caller_phone: { type: "string", description: "Caller's phone number (if provided)" },
// //         caller_email: { type: "string", description: "Caller's email address (if provided)" },
// //         property_address: { type: "string", description: "Property address they asked about or want appraised/inspected" },
// //         intent_category: {
// //           type: "string",
// //           enum: [
// //             "property_inquiry",
// //             "inspection_booking",
// //             "inspection_reschedule",
// //             "rental_application_followup",
// //             "tenant_inquiry",
// //             "general_enquiry",
// //             "directions_access",
// //             "vendor_strata_partner",
// //             "staff_transfer",
// //             "owner_calling_pm",
// //             "appraisal_booking",
// //             "no_transcript_admin",
// //           ],
// //           description: "Classified intent of the call",
// //         },
// //         preferred_time: {
// //           type: "string",
// //           description: "Agreed appointment slot or preferred callback time — e.g. 'Tuesday at 11am', 'Saturday 10am'",
// //         },
// //         staff_requested: { type: "string", description: "Name of staff member requested" },
// //         outcome: {
// //           type: "string",
// //           enum: [
// //             "inspection_booked",
// //             "appraisal_booked",
// //             "transferred",
// //             "callback_scheduled",
// //             "info_provided",
// //             "market_update_sent",
// //             "message_taken",
// //             "escalated",
// //             "sms_sent",
// //           ],
// //           description: "What happened at the end of the call",
// //         },
// //         ai_summary: { type: "string", description: "1–2 sentence summary of the call" },
// //         sentiment: {
// //           type: "string",
// //           enum: ["positive", "neutral", "negative"],
// //           description: "Overall sentiment of the caller during the call",
// //         },
// //         confidence_score: {
// //           type: "number",
// //           description: "AI confidence score for this call, from 0.0 to 1.0",
// //         },
// //         escalated: { type: "boolean", description: "True if the call was escalated to a human team member" },
// //       },
// //       required: ["caller_name", "intent_category", "outcome"],
// //     },
// //   };
// // }

// // // ─── Recording — WAV file builder for conversation audio ───
// // class ConversationRecorder {
// //   constructor(sessionId) {
// //     this.sessionId = sessionId;
// //     this.userChunks = [];
// //     this.agentChunks = [];
// //     this.startTime = Date.now();
// //     this.events = [];
// //   }

// //   addUserAudio(base64Pcm16) {
// //     const buf = Buffer.from(base64Pcm16, "base64");
// //     this.userChunks.push(buf);
// //     this.events.push({ type: "user", time: Date.now() - this.startTime, bytes: buf.length });
// //   }

// //   addAgentAudio(base64Pcm16) {
// //     const buf = Buffer.from(base64Pcm16, "base64");
// //     this.agentChunks.push(buf);
// //     this.events.push({ type: "agent", time: Date.now() - this.startTime, bytes: buf.length });
// //   }

// //   _resample(pcmBuffer, srcRate, dstRate) {
// //     if (srcRate === dstRate) return pcmBuffer;
// //     const srcSamples = pcmBuffer.length / 2;
// //     const ratio = srcRate / dstRate;
// //     const dstSamples = Math.floor(srcSamples / ratio);
// //     const out = Buffer.alloc(dstSamples * 2);

// //     for (let i = 0; i < dstSamples; i++) {
// //       const srcIdx = i * ratio;
// //       const lo = Math.floor(srcIdx);
// //       const hi = Math.min(lo + 1, srcSamples - 1);
// //       const frac = srcIdx - lo;
// //       const sLo = pcmBuffer.readInt16LE(lo * 2);
// //       const sHi = pcmBuffer.readInt16LE(hi * 2);
// //       const val = Math.round(sLo + (sHi - sLo) * frac);
// //       out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
// //     }
// //     return out;
// //   }

// //   saveToFile() {
// //     const OUTPUT_RATE = 24000;
// //     const userPcm = Buffer.concat(this.userChunks);
// //     const agentPcmRaw = Buffer.concat(this.agentChunks);
// //     const agentPcm = this._resample(agentPcmRaw, 16000, OUTPUT_RATE);

// //     const userSamples = userPcm.length / 2;
// //     const agentSamples = agentPcm.length / 2;
// //     const totalSamples = Math.max(userSamples, agentSamples);
// //     const mixedBuf = Buffer.alloc(totalSamples * 2);

// //     for (let i = 0; i < totalSamples; i++) {
// //       let val = 0;
// //       if (i < userSamples) val += userPcm.readInt16LE(i * 2);
// //       if (i < agentSamples) val += agentPcm.readInt16LE(i * 2);
// //       val = Math.max(-32768, Math.min(32767, val));
// //       mixedBuf.writeInt16LE(val, i * 2);
// //     }

// //     const wavHeader = Buffer.alloc(44);
// //     const dataSize = mixedBuf.length;
// //     const fileSize = 36 + dataSize;

// //     wavHeader.write("RIFF", 0);
// //     wavHeader.writeUInt32LE(fileSize, 4);
// //     wavHeader.write("WAVE", 8);
// //     wavHeader.write("fmt ", 12);
// //     wavHeader.writeUInt32LE(16, 16);
// //     wavHeader.writeUInt16LE(1, 20);
// //     wavHeader.writeUInt16LE(1, 22);
// //     wavHeader.writeUInt32LE(OUTPUT_RATE, 24);
// //     wavHeader.writeUInt32LE(OUTPUT_RATE * 2, 28);
// //     wavHeader.writeUInt16LE(2, 32);
// //     wavHeader.writeUInt16LE(16, 34);
// //     wavHeader.write("data", 36);
// //     wavHeader.writeUInt32LE(dataSize, 40);

// //     const wav = Buffer.concat([wavHeader, mixedBuf]);
// //     const filename = `call_${this.sessionId}_${Date.now()}.wav`;
// //     const filepath = path.join(RECORDINGS_DIR, filename);
// //     fs.writeFileSync(filepath, wav);

// //     console.log(`[Recording] Saved: ${filepath} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`);
// //     return { filename, filepath, sizeMB: (wav.length / 1024 / 1024).toFixed(2) };
// //   }
// // }

// // // ─── Helpers ──────────────────────────────────────────────
// // function sendWsJson(ws, payload) {
// //   if (!ws || ws.readyState !== WebSocket.OPEN) return false;
// //   ws.send(JSON.stringify(payload));
// //   return true;
// // }

// // function safeJsonParse(text) {
// //   try {
// //     return JSON.parse(text);
// //   } catch {
// //     return null;
// //   }
// // }

// // function toFunctionCallPayload(value) {
// //   if (!value || typeof value !== "object") return null;

// //   if (
// //     value.type === "function_call" &&
// //     typeof value.name === "string" &&
// //     typeof value.arguments === "string" &&
// //     typeof value.call_id === "string"
// //   ) {
// //     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
// //   }

// //   if (
// //     typeof value.name === "string" &&
// //     typeof value.arguments === "string" &&
// //     typeof value.call_id === "string"
// //   ) {
// //     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
// //   }

// //   return null;
// // }

// // function extractFunctionCallsFromResponse(response) {
// //   const calls = [];
// //   const output = response?.output;

// //   if (Array.isArray(output)) {
// //     for (const item of output) {
// //       const fc = toFunctionCallPayload(item);
// //       if (fc) calls.push(fc);
// //     }
// //   }

// //   return calls;
// // }

// // // ─── Create OpenAI Realtime Session ───────────────────────
// // function createRealtimeSession(sessionId, onEvent) {
// //   const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
// //   const startMs = Date.now();

// //   return new Promise((resolve, reject) => {
// //     const ws = new WebSocket(url, {
// //       headers: {
// //         Authorization: `Bearer ${OPENAI_API_KEY}`,
// //       },
// //     });

// //     ws.on("open", () => {
// //       console.log(`[${sessionId}] OpenAI connected (${Date.now() - startMs}ms)`);

// //       const sessionUpdate = {
// //         type: "session.update",
// //         session: {
// //           type: "realtime",
// //           model: OPENAI_REALTIME_MODEL,
// //           output_modalities: ["text"],
// //           audio: {
// //             input: {
// //               format: {
// //                 type: "audio/pcm",
// //                 rate: OPENAI_INPUT_SAMPLE_RATE,
// //               },
// //               turn_detection: {
// //                 type: "server_vad",
// //                 threshold: OPENAI_VAD_THRESHOLD,
// //                 prefix_padding_ms: OPENAI_VAD_PREFIX_PADDING_MS,
// //                 silence_duration_ms: OPENAI_VAD_SILENCE_DURATION_MS,
// //               },
// //             },
// //           },
// //           instructions: getSystemPrompt(),
// //           tools: [getSaveCallLogTool()],
// //           tool_choice: "auto",
// //         },
// //       };

// //       sendWsJson(ws, sessionUpdate);

// //       const session = {
// //         ws,
// //         elevenLabsWs: null,
// //         elevenLabsReady: false,
// //         textBuffer: [],
// //         isResponseActive: false,
// //         onEvent,
// //         startMs,
// //         openAiConnectedMs: Date.now(),
// //         elevenLabsConnectedMs: null,
// //         greetingTriggeredMs: null,
// //         firstResponseCreatedMs: null,
// //         firstAudioDeltaLogged: false,
// //         processedCallIds: new Set(),
// //         recorder: new ConversationRecorder(sessionId),
// //         callLogs: [],
// //       };

// //       sessions.set(sessionId, session);
// //       openElevenLabsStream(sessionId);
// //       resolve();
// //     });

// //     ws.on("message", async (data) => {
// //       try {
// //         const event = JSON.parse(data.toString());
// //         await handleRealtimeEvent(sessionId, event);
// //       } catch (err) {
// //         console.error(`[${sessionId}] Parse error:`, err.message);
// //       }
// //     });

// //     ws.on("error", (err) => {
// //       console.error(`[${sessionId}] OpenAI WS error:`, err.message);
// //       onEvent({ type: "error", error: { message: err.message } });
// //       reject(err);
// //     });

// //     ws.on("close", (code) => {
// //       console.log(`[${sessionId}] OpenAI WS closed: ${code}`);
// //       closeElevenLabsWs(sessionId);
// //       sessions.delete(sessionId);
// //       onEvent({ type: "session-closed" });
// //     });
// //   });
// // }

// // // ─── Send user audio to OpenAI ────────────────────────────
// // function sendAudio(sessionId, base64Audio) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   session.recorder.addUserAudio(base64Audio);
// //   sendWsJson(session.ws, { type: "input_audio_buffer.append", audio: base64Audio });
// // }

// // // ─── Trigger greeting ─────────────────────────────────────
// // function triggerGreeting(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   session.greetingTriggeredMs = Date.now();
// //   console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
// //   sendWsJson(session.ws, { type: "response.create" });
// // }

// // // ─── ElevenLabs TTS Stream ────────────────────────────────
// // function openElevenLabsStream(sessionId, force = false) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   if (
// //     !force &&
// //     session.elevenLabsWs &&
// //     (session.elevenLabsWs.readyState === WebSocket.OPEN ||
// //       session.elevenLabsWs.readyState === WebSocket.CONNECTING)
// //   ) {
// //     return;
// //   }

// //   closeElevenLabsWs(sessionId);

// //   const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
// //   const elWs = new WebSocket(wsUrl);

// //   elWs.on("open", () => {
// //     console.log(`[${sessionId}] ElevenLabs connected`);
// //     session.elevenLabsConnectedMs = Date.now();

// //     elWs.send(
// //       JSON.stringify({
// //         text: " ",
// //         voice_settings: {
// //           stability: 0.55,
// //           similarity_boost: 0.78,
// //           style: 0.35,
// //           use_speaker_boost: true,
// //         },
// //         xi_api_key: ELEVENLABS_API_KEY,
// //       })
// //     );

// //     if (session.elevenLabsWs === elWs) {
// //       session.elevenLabsReady = true;
// //       for (const text of session.textBuffer) {
// //         sendTextToElevenLabs(sessionId, text);
// //       }
// //       session.textBuffer = [];
// //     }
// //   });

// //   elWs.on("message", (data) => {
// //     try {
// //       const msg = JSON.parse(data.toString());
// //       if (msg.audio) {
// //         session.recorder.addAgentAudio(msg.audio);
// //         session.onEvent({ type: "audio-delta", delta: msg.audio });
// //       }
// //     } catch {}
// //   });

// //   elWs.on("error", (err) => {
// //     console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`);
// //   });

// //   elWs.on("close", () => {
// //     if (session.elevenLabsWs === elWs) {
// //       session.elevenLabsReady = false;
// //     }
// //   });

// //   session.elevenLabsWs = elWs;
// // }

// // function sendTextToElevenLabs(sessionId, text) {
// //   const session = sessions.get(sessionId);
// //   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
// //     session.elevenLabsWs.send(JSON.stringify({ text, try_trigger_generation: true }));
// //   } else if (session) {
// //     session.textBuffer.push(text);
// //   }
// // }

// // function flushElevenLabsStream(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
// //     session.elevenLabsWs.send(JSON.stringify({ text: "" }));
// //   }
// // }

// // function closeElevenLabsWs(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (session?.elevenLabsWs) {
// //     try {
// //       if (session.elevenLabsWs.readyState === WebSocket.CONNECTING) {
// //         session.elevenLabsWs.terminate();
// //       } else if (session.elevenLabsWs.readyState === WebSocket.OPEN) {
// //         session.elevenLabsWs.close();
// //       }
// //     } catch {}
// //     session.elevenLabsWs = null;
// //     session.elevenLabsReady = false;
// //     session.textBuffer = [];
// //   }
// // }

// // // ─── Handle function calls from OpenAI ────────────────────
// // async function handleFunctionCall(sessionId, eventOrItem) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   const call = toFunctionCallPayload(eventOrItem);
// //   if (!call) return;

// //   if (call.name !== "save_call_log") return;

// //   const callId = typeof call.call_id === "string" ? call.call_id : null;

// //   if (callId && session.processedCallIds.has(callId)) return;
// //   if (callId) session.processedCallIds.add(callId);

// //   try {
// //     const args = JSON.parse(call.arguments);

// //     console.log(
// //       `[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`
// //     );

// //     const logId = uuidv4();

// //     const callLog = new CallLog({
// //       id: logId,
// //       sessionId,
// //       caller_name: args.caller_name || null,
// //       caller_phone: args.caller_phone || null,
// //       caller_email: args.caller_email || null,
// //       property_address: args.property_address || null,
// //       intent_category: args.intent_category,
// //       preferred_time: args.preferred_time || null,
// //       staff_requested: args.staff_requested || null,
// //       outcome: args.outcome,
// //       ai_summary: args.ai_summary || null,
// //       sentiment: args.sentiment || "neutral",
// //       confidence_score: args.confidence_score || null,
// //       escalated: args.escalated || false,
// //     });

// //     await callLog.save();
// //     session.callLogs.push({ id: logId, ...args });

// //     console.log(`[${sessionId}] Call log saved to MongoDB: ${logId}`);

// //     sendWsJson(session.ws, {
// //       type: "conversation.item.create",
// //       item: {
// //         type: "function_call_output",
// //         call_id: call.call_id,
// //         output: JSON.stringify({
// //           success: true,
// //           message: "Call log saved successfully.",
// //           log_id: logId,
// //           outcome: args.outcome,
// //         }),
// //       },
// //     });

// //     sendWsJson(session.ws, { type: "response.create" });
// //     session.onEvent({ type: "call-logged", data: args });
// //   } catch (err) {
// //     if (callId) session.processedCallIds.delete(callId);
// //     console.error(`[${sessionId}] Call log save failed:`, err.message);
// //   }
// // }

// // // ─── Event Hub — Process OpenAI Realtime events ───────────
// // async function handleRealtimeEvent(sessionId, event) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   switch (event.type) {
// //     case "session.created":
// //     case "session.updated":
// //       break;

// //     case "response.created":
// //       session.isResponseActive = true;
// //       if (!session.firstResponseCreatedMs) {
// //         session.firstResponseCreatedMs = Date.now();
// //       }
// //       openElevenLabsStream(sessionId);
// //       break;

// //     case "response.output_text.delta":
// //       if (session.elevenLabsReady) {
// //         sendTextToElevenLabs(sessionId, event.delta);
// //       } else {
// //         session.textBuffer.push(event.delta);
// //       }
// //       session.onEvent({ type: "transcript-delta", delta: event.delta });
// //       break;

// //     case "response.text.delta":
// //       if (session.elevenLabsReady) {
// //         sendTextToElevenLabs(sessionId, event.delta);
// //       } else {
// //         session.textBuffer.push(event.delta);
// //       }
// //       session.onEvent({ type: "transcript-delta", delta: event.delta });
// //       break;

// //     case "response.output_text.done":
// //       flushElevenLabsStream(sessionId);
// //       session.onEvent({ type: "transcript-done", transcript: event.text });
// //       break;

// //     case "response.text.done":
// //       flushElevenLabsStream(sessionId);
// //       session.onEvent({ type: "transcript-done", transcript: event.text });
// //       break;

// //     case "response.done": {
// //       session.isResponseActive = false;

// //       const calls = extractFunctionCallsFromResponse(event.response);
// //       for (const fc of calls) {
// //         await handleFunctionCall(sessionId, fc);
// //       }
// //       break;
// //     }

// //     case "response.output_item.done":
// //       if (event.item) {
// //         const fc = toFunctionCallPayload(event.item);
// //         if (fc) await handleFunctionCall(sessionId, fc);
// //       }
// //       break;

// //     case "response.function_call_arguments.done":
// //       await handleFunctionCall(sessionId, event);
// //       break;

// //     case "input_audio_buffer.speech_started":
// //       console.log(`[${sessionId}] User interrupted — stopping AI voice`);
// //       if (session.isResponseActive) {
// //         sendWsJson(session.ws, { type: "response.cancel" });
// //       }
// //       closeElevenLabsWs(sessionId);
// //       openElevenLabsStream(sessionId, true);
// //       session.onEvent({ type: "speech-started" });
// //       break;

// //     case "conversation.item.input_audio_transcription.completed":
// //       session.onEvent({ type: "user-transcript", transcript: event.transcript });
// //       break;

// //     case "error":
// //       console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
// //       session.onEvent({ type: "error", error: event.error });
// //       break;

// //     default:
// //       break;
// //   }
// // }

// // // ─── Close session and save recording ─────────────────────
// // function closeSession(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (session) {
// //     try {
// //       const result = session.recorder.saveToFile();
// //       console.log(`[${sessionId}] Recording saved: ${result.filename} (${result.sizeMB} MB)`);
// //       session.onEvent({
// //         type: "recording-saved",
// //         data: { filename: result.filename, url: `/recordings/${result.filename}` },
// //       });
// //     } catch (err) {
// //       console.error(`[${sessionId}] Recording save failed:`, err.message);
// //     }

// //     closeElevenLabsWs(sessionId);
// //     try {
// //       session.ws.close();
// //     } catch {}
// //     sessions.delete(sessionId);
// //     console.log(`[${sessionId}] Session closed`);
// //   }
// // }

// // // ─── Prewarm logic ────────────────────────────────────────
// // function clearPrewarmState(sessionId) {
// //   const state = prewarmStates.get(sessionId);
// //   if (!state) return;
// //   clearTimeout(state.ttlTimer);
// //   prewarmStates.delete(sessionId);
// // }

// // function startPrewarm(sessionId, eventForwarder) {
// //   if (prewarmStates.has(sessionId)) {
// //     return prewarmStates.get(sessionId).promise;
// //   }

// //   const state = { promise: null, ready: false, failed: false, ttlTimer: null };

// //   state.promise = createRealtimeSession(sessionId, eventForwarder)
// //     .then(() => {
// //       state.ready = true;
// //       console.log(`[${sessionId}] Prewarm ready`);
// //     })
// //     .catch((err) => {
// //       state.failed = true;
// //       console.warn(`[${sessionId}] Prewarm failed: ${err.message}`);
// //       throw err;
// //     });

// //   state.ttlTimer = setTimeout(() => {
// //     if (!prewarmStates.has(sessionId)) return;
// //     console.log(`[${sessionId}] Prewarm TTL expired — closing idle session`);
// //     clearPrewarmState(sessionId);
// //     closeSession(sessionId);
// //   }, PREWARM_TTL_MS);

// //   prewarmStates.set(sessionId, state);
// //   return state.promise;
// // }

// // // ─── Build event forwarder for a socket ───────────────────
// // function buildEventForwarder(socket) {
// //   return (event) => {
// //     switch (event.type) {
// //       case "audio-delta":
// //         socket.emit("audio-delta", { delta: event.delta });
// //         break;
// //       case "transcript-delta":
// //         socket.emit("transcript-delta", { delta: event.delta });
// //         break;
// //       case "transcript-done":
// //         socket.emit("transcript-done", { transcript: event.transcript });
// //         break;
// //       case "user-transcript":
// //         socket.emit("user-transcript", { transcript: event.transcript });
// //         break;
// //       case "speech-started":
// //         socket.emit("speech-started", {});
// //         break;
// //       case "call-logged":
// //         socket.emit("call-logged", event.data);
// //         break;
// //       case "recording-saved":
// //         socket.emit("recording-saved", event.data);
// //         break;
// //       case "error":
// //         socket.emit("realtime-error", { error: event.error });
// //         break;
// //       case "session-closed":
// //         socket.emit("session-closed", {});
// //         break;
// //       default:
// //         break;
// //     }
// //   };
// // }

// // // ============================================================
// // // SOCKET.IO — Client Connection Handling
// // // ============================================================
// // io.on("connection", (socket) => {
// //   console.log(`Client connected: ${socket.id}`);

// //   const forwarder = buildEventForwarder(socket);

// //   startPrewarm(socket.id, forwarder).catch(() => {});

// //   socket.on("start-session", async () => {
// //     const sessionId = socket.id;
// //     console.log(`[${sessionId}] Starting session`);

// //     try {
// //       let state = prewarmStates.get(sessionId);

// //       if (!state) {
// //         await startPrewarm(sessionId, forwarder);
// //         state = prewarmStates.get(sessionId);
// //       }

// //       if (state) {
// //         try {
// //           await state.promise;
// //           if (state.ready) {
// //             clearPrewarmState(sessionId);
// //             socket.emit("session-started", { sessionId });
// //             triggerGreeting(sessionId);
// //             return;
// //           }
// //         } catch {}
// //         clearPrewarmState(sessionId);
// //       }

// //       await createRealtimeSession(sessionId, forwarder);
// //       socket.emit("session-started", { sessionId });
// //       triggerGreeting(sessionId);
// //     } catch (err) {
// //       console.error(`[${sessionId}] Session start failed:`, err.message);
// //       socket.emit("realtime-error", {
// //         error: { message: "Failed to connect to AI service" },
// //       });
// //     }
// //   });

// //   socket.on("audio-chunk", (data) => {
// //     if (data?.audio) {
// //       sendAudio(socket.id, data.audio);
// //     }
// //   });

// //   socket.on("end-session", () => {
// //     console.log(`[${socket.id}] End session requested`);
// //     clearPrewarmState(socket.id);
// //     closeSession(socket.id);
// //     socket.emit("session-closed", {});
// //   });

// //   socket.on("disconnect", () => {
// //     console.log(`Client disconnected: ${socket.id}`);
// //     clearPrewarmState(socket.id);
// //     closeSession(socket.id);
// //   });
// // });

// // // ─── REST API Endpoints ───────────────────────────────────
// // app.get("/api/call-logs", async (req, res) => {
// //   try {
// //     const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
// //     res.json(logs);
// //   } catch (err) {
// //     console.error("Failed to fetch call logs:", err.message);
// //     res.status(500).json({ error: "Failed to fetch call logs" });
// //   }
// // });

// // app.get("/api/call-logs/category/:category", async (req, res) => {
// //   try {
// //     const logs = await CallLog.find({ intent_category: req.params.category })
// //       .sort({ createdAt: -1 })
// //       .lean();
// //     res.json(logs);
// //   } catch (err) {
// //     res.status(500).json({ error: "Failed to fetch call logs" });
// //   }
// // });

// // app.get("/api/recordings", (req, res) => {
// //   const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".wav"));
// //   res.json(
// //     files.map((f) => ({
// //       filename: f,
// //       url: `/recordings/${f}`,
// //       size: (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(2) + " MB",
// //     }))
// //   );
// // });

// // // ─── Start Server ─────────────────────────────────────────
// // server.listen(PORT, () => {
// //   console.log(`
// // ╔══════════════════════════════════════════════════════════════╗
// // ║   Ray White Bankstown — AI Receptionist (OmniSuiteAI)        ║
// // ║   Running on http://localhost:${PORT}                         ║
// // ║                                                              ║
// // ║   Flow: Greeting → Value Prop → Agentic Close                ║
// // ║   Use Cases: Inspect · Appraise · Transfer · Tenant · Info   ║
// // ║   Escalation: Complaints · Legal · Abusive → Human           ║
// // ║                                                              ║
// // ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// // ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// // ║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
// // ║   Recordings Dir:  ${RECORDINGS_DIR}                         ║
// // ║   MongoDB:         ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
// // ╚══════════════════════════════════════════════════════════════╝
// //   `);
// // });
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

// // GA Realtime defaults
// const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
// const OPENAI_INPUT_SAMPLE_RATE = Number(process.env.OPENAI_INPUT_SAMPLE_RATE || 24000);
// const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.8);
// const OPENAI_VAD_PREFIX_PADDING_MS = Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 300);
// const OPENAI_VAD_SILENCE_DURATION_MS = Number(process.env.OPENAI_VAD_SILENCE_DURATION_MS || 2000);

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
// const callLogSchema = new mongoose.Schema(
//   {
//     id: { type: String, required: true, unique: true },
//     sessionId: { type: String, required: true },

//     caller_name: { type: String, default: null },
//     caller_phone: { type: String, default: null },
//     caller_email: { type: String, default: null },

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

//     ai_summary: { type: String, default: null },
//     sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
//     confidence_score: { type: Number, default: null },
//     escalated: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// const CallLog = mongoose.model("CallLog", callLogSchema);

// // ─── Ensure recordings directory exists ───────────────────
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

// ─────────────────────────────────────────────
// STEP 04 — COLLECT DETAILS (when booking confirmed)
// ─────────────────────────────────────────────
// Collect conversationally — NOT like a form. One detail at a time:
// - Name (may already have it)
// - Property address (if appraisal) or which property they want to inspect
// - Preferred contact: phone or email
// - Best time / confirmed slot
// - Any specific concerns

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
// USE CASE: PROPERTY LEASING ENQUIRIES (available rental listings)
// ─────────────────────────────────────────────
// Callers frequently ask about specific rental listings. Answer using details from
// raywhitebankstown.com.au for the property in question. NEVER invent or guess a
// figure or feature you don't actually know — if you don't have the detail on hand,
// be upfront and offer to have the property manager confirm and call/text them back.

// Typical questions this covers, all answered directly and efficiently (no need for
// the full sales flow — these are transactional):
// - Is the property still available
// - What is the weekly or monthly rent
// - How much is the bond / security deposit
// - How many bedrooms and bathrooms it has
// - Whether there's a garage, carport, or allocated parking
// - Whether it has air conditioning, heating, or ceiling fans
// - Whether there's a yard, balcony, or outdoor space
// - Whether there are built-in wardrobes or extra storage
// - Whether there's a dishwasher or laundry
// - Proximity to public transport
// - Nearby schools, shops, or parks
// - When the next inspection is

// Log these under intent_category: "property_inquiry" (or "inspection_booking" /
// "inspection_reschedule" if it moves to booking a time).

// ─────────────────────────────────────────────
// USE CASE: RENTAL PROCESS / APPLICATION FAQs
// ─────────────────────────────────────────────
// Use discretion adapting tone, but keep the substance of these answers accurate:

// - "Are pets allowed?"
//   "Any pet request is reviewed as part of the application. If you'd like to apply, head to our website, find the property, and select 'Apply for this Property' — that'll take you through to Snug.com where you can create a login and submit your application."

// - "What lease lengths are available?"
//   "Lease terms are usually 6 or 12 months, though it can depend on the application — if a property has a shorter lease available, it'll be noted in the ad."

// - "Is the lease renewable?"
//   "In most cases, yes — though that depends on the individual property and the owner's plans when the lease is due to expire."

// - "Is there flexibility with the move-in date?"
//   "That can be reviewed as part of the application."

// - "Do I need to register for an inspection?"
//   "It's not essential, but it's definitely encouraged. To register, find the property on our website and select 'Apply for this Property' — that'll take you to Snug.com to create a login and register to attend."

// - "How do I apply?"
//   "Head to our website, find the property you're after, and select 'Apply for this Property'. You'll be redirected to Snug.com to create a login and submit your application there."

// - "What documents do I need?"
//   "That's all listed in Snug once you start your application — find the property on our website, select 'Apply for this Property', and Snug will show you everything required."

// - "What are the income or reference requirements?"
//   "That information's in Snug as well — same process: find the property on our website, select 'Apply for this Property', and Snug will list what's needed."

// - "How long does approval usually take?"
//   "Typically 1 to 3 days, depending on how many applications we're working through and whether any extra info is needed."

// Log rental-application FAQ calls under intent_category: "property_inquiry" or
// "rental_application_followup" as appropriate, with outcome: "info_provided"
// unless it progresses further (e.g. transferred, callback_scheduled).

// ─────────────────────────────────────────────
// USE CASE: REQUESTS THAT GO BACK TO RECEPTION / PM
// ─────────────────────────────────────────────
// - "Can I arrange a private viewing?"
//   Do NOT try to book this yourself — this goes to the relevant Property Manager.
//   "That's something our property management team can arrange directly for you —
//   let me take your details and get [PM name] to call you back, or I can put you
//   through now if they're free." Then follow the STAFF TRANSFER flow (offer
//   transfer now, or take a message/callback), and log as intent_category:
//   "staff_transfer" or "tenant_inquiry" with staff_requested set to the relevant PM.

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
// "No dramas — would it be okay if I sent you a quick text with our details? That way you've got a direct line if anything changes."

// =============================================================
// ESCALATION — WHEN TO HAND OFF
// =============================================================
// ALWAYS escalate (and log escalated: true) for:
// - Complaints or disputes
// - Legal or financial questions
// - Abusive or aggressive callers
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
// - ai_summary
// - sentiment
// - confidence_score
// - escalated

// Confirmation after logging (if booking was made):
// "Perfect, [name] — I've got that locked in for you. You'll hear from the team [at preferred_time / shortly]. Is there anything else I can help with today?"

// =============================================================
// HARD RULES — NON-NEGOTIABLE
// =============================================================
// - Language: ENGLISH ONLY at all times
// - ONE question at a time
// - Responses: 1 to 2 sentences max
// - NEVER assume the caller's name
// - ALWAYS call save_call_log after every completed call
// - Value proposition must be delivered before the close for high-intent callers
// - For transactional callers, skip the sales flow and answer directly
// - Never give legal or financial advice
// - Never make up property details
// - For rental listing questions, use only known/verified details from raywhitebankstown.com.au — if unsure, say so and offer a callback rather than guessing
// - Private viewing requests are always routed to Reception / the relevant Property Manager, not booked directly by you
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
//         caller_name: { type: "string", description: "Full name of the caller" },
//         caller_phone: { type: "string", description: "Caller's phone number (if provided)" },
//         caller_email: { type: "string", description: "Caller's email address (if provided)" },
//         property_address: { type: "string", description: "Property address they asked about or want appraised/inspected" },
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
//         staff_requested: { type: "string", description: "Name of staff member requested" },
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
//         ai_summary: { type: "string", description: "1–2 sentence summary of the call" },
//         sentiment: {
//           type: "string",
//           enum: ["positive", "neutral", "negative"],
//           description: "Overall sentiment of the caller during the call",
//         },
//         confidence_score: {
//           type: "number",
//           description: "AI confidence score for this call, from 0.0 to 1.0",
//         },
//         escalated: { type: "boolean", description: "True if the call was escalated to a human team member" },
//       },
//       required: ["caller_name", "intent_category", "outcome"],
//     },
//   };
// }

// // ─── Recording — WAV file builder for conversation audio ───
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

// // ─── Helpers ──────────────────────────────────────────────
// function sendWsJson(ws, payload) {
//   if (!ws || ws.readyState !== WebSocket.OPEN) return false;
//   ws.send(JSON.stringify(payload));
//   return true;
// }

// function safeJsonParse(text) {
//   try {
//     return JSON.parse(text);
//   } catch {
//     return null;
//   }
// }

// function toFunctionCallPayload(value) {
//   if (!value || typeof value !== "object") return null;

//   if (
//     value.type === "function_call" &&
//     typeof value.name === "string" &&
//     typeof value.arguments === "string" &&
//     typeof value.call_id === "string"
//   ) {
//     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
//   }

//   if (
//     typeof value.name === "string" &&
//     typeof value.arguments === "string" &&
//     typeof value.call_id === "string"
//   ) {
//     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
//   }

//   return null;
// }

// function extractFunctionCallsFromResponse(response) {
//   const calls = [];
//   const output = response?.output;

//   if (Array.isArray(output)) {
//     for (const item of output) {
//       const fc = toFunctionCallPayload(item);
//       if (fc) calls.push(fc);
//     }
//   }

//   return calls;
// }

// // ─── Create OpenAI Realtime Session ───────────────────────
// function createRealtimeSession(sessionId, onEvent) {
//   const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
//   const startMs = Date.now();

//   return new Promise((resolve, reject) => {
//     const ws = new WebSocket(url, {
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//       },
//     });

//     ws.on("open", () => {
//       console.log(`[${sessionId}] OpenAI connected (${Date.now() - startMs}ms)`);

//       const sessionUpdate = {
//         type: "session.update",
//         session: {
//           type: "realtime",
//           model: OPENAI_REALTIME_MODEL,
//           output_modalities: ["text"],
//           audio: {
//             input: {
//               format: {
//                 type: "audio/pcm",
//                 rate: OPENAI_INPUT_SAMPLE_RATE,
//               },
//               turn_detection: {
//                 type: "server_vad",
//                 threshold: OPENAI_VAD_THRESHOLD,
//                 prefix_padding_ms: OPENAI_VAD_PREFIX_PADDING_MS,
//                 silence_duration_ms: OPENAI_VAD_SILENCE_DURATION_MS,
//               },
//             },
//           },
//           instructions: getSystemPrompt(),
//           tools: [getSaveCallLogTool()],
//           tool_choice: "auto",
//         },
//       };

//       sendWsJson(ws, sessionUpdate);

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

//     ws.on("close", (code) => {
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
//   sendWsJson(session.ws, { type: "input_audio_buffer.append", audio: base64Audio });
// }

// // ─── Trigger greeting ─────────────────────────────────────
// function triggerGreeting(sessionId) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   session.greetingTriggeredMs = Date.now();
//   console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
//   sendWsJson(session.ws, { type: "response.create" });
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
//     } catch {}
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
//     session.elevenLabsWs.send(JSON.stringify({ text, try_trigger_generation: true }));
//   } else if (session) {
//     session.textBuffer.push(text);
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
//     } catch {}
//     session.elevenLabsWs = null;
//     session.elevenLabsReady = false;
//     session.textBuffer = [];
//   }
// }

// // ─── Handle function calls from OpenAI ────────────────────
// async function handleFunctionCall(sessionId, eventOrItem) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   const call = toFunctionCallPayload(eventOrItem);
//   if (!call) return;

//   if (call.name !== "save_call_log") return;

//   const callId = typeof call.call_id === "string" ? call.call_id : null;

//   if (callId && session.processedCallIds.has(callId)) return;
//   if (callId) session.processedCallIds.add(callId);

//   try {
//     const args = JSON.parse(call.arguments);

//     console.log(
//       `[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`
//     );

//     const logId = uuidv4();

//     const callLog = new CallLog({
//       id: logId,
//       sessionId,
//       caller_name: args.caller_name || null,
//       caller_phone: args.caller_phone || null,
//       caller_email: args.caller_email || null,
//       property_address: args.property_address || null,
//       intent_category: args.intent_category,
//       preferred_time: args.preferred_time || null,
//       staff_requested: args.staff_requested || null,
//       outcome: args.outcome,
//       ai_summary: args.ai_summary || null,
//       sentiment: args.sentiment || "neutral",
//       confidence_score: args.confidence_score || null,
//       escalated: args.escalated || false,
//     });

//     await callLog.save();
//     session.callLogs.push({ id: logId, ...args });

//     console.log(`[${sessionId}] Call log saved to MongoDB: ${logId}`);

//     sendWsJson(session.ws, {
//       type: "conversation.item.create",
//       item: {
//         type: "function_call_output",
//         call_id: call.call_id,
//         output: JSON.stringify({
//           success: true,
//           message: "Call log saved successfully.",
//           log_id: logId,
//           outcome: args.outcome,
//         }),
//       },
//     });

//     sendWsJson(session.ws, { type: "response.create" });
//     session.onEvent({ type: "call-logged", data: args });
//   } catch (err) {
//     if (callId) session.processedCallIds.delete(callId);
//     console.error(`[${sessionId}] Call log save failed:`, err.message);
//   }
// }

// // ─── Event Hub — Process OpenAI Realtime events ───────────
// async function handleRealtimeEvent(sessionId, event) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   switch (event.type) {
//     case "session.created":
//     case "session.updated":
//       break;

//     case "response.created":
//       session.isResponseActive = true;
//       if (!session.firstResponseCreatedMs) {
//         session.firstResponseCreatedMs = Date.now();
//       }
//       openElevenLabsStream(sessionId);
//       break;

//     case "response.output_text.delta":
//       if (session.elevenLabsReady) {
//         sendTextToElevenLabs(sessionId, event.delta);
//       } else {
//         session.textBuffer.push(event.delta);
//       }
//       session.onEvent({ type: "transcript-delta", delta: event.delta });
//       break;

//     case "response.text.delta":
//       if (session.elevenLabsReady) {
//         sendTextToElevenLabs(sessionId, event.delta);
//       } else {
//         session.textBuffer.push(event.delta);
//       }
//       session.onEvent({ type: "transcript-delta", delta: event.delta });
//       break;

//     case "response.output_text.done":
//       flushElevenLabsStream(sessionId);
//       session.onEvent({ type: "transcript-done", transcript: event.text });
//       break;

//     case "response.text.done":
//       flushElevenLabsStream(sessionId);
//       session.onEvent({ type: "transcript-done", transcript: event.text });
//       break;

//     case "response.done": {
//       session.isResponseActive = false;

//       const calls = extractFunctionCallsFromResponse(event.response);
//       for (const fc of calls) {
//         await handleFunctionCall(sessionId, fc);
//       }
//       break;
//     }

//     case "response.output_item.done":
//       if (event.item) {
//         const fc = toFunctionCallPayload(event.item);
//         if (fc) await handleFunctionCall(sessionId, fc);
//       }
//       break;

//     case "response.function_call_arguments.done":
//       await handleFunctionCall(sessionId, event);
//       break;

//     case "input_audio_buffer.speech_started":
//       console.log(`[${sessionId}] User interrupted — stopping AI voice`);
//       if (session.isResponseActive) {
//         sendWsJson(session.ws, { type: "response.cancel" });
//       }
//       closeElevenLabsWs(sessionId);
//       openElevenLabsStream(sessionId, true);
//       session.onEvent({ type: "speech-started" });
//       break;

//     case "conversation.item.input_audio_transcription.completed":
//       session.onEvent({ type: "user-transcript", transcript: event.transcript });
//       break;

//     case "error":
//       console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
//       session.onEvent({ type: "error", error: event.error });
//       break;

//     default:
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
//     try {
//       session.ws.close();
//     } catch {}
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
//       default:
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
//     if (data?.audio) {
//       sendAudio(socket.id, data.audio);
//     }
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
// app.get("/api/call-logs", async (req, res) => {
//   try {
//     const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
//     res.json(logs);
//   } catch (err) {
//     console.error("Failed to fetch call logs:", err.message);
//     res.status(500).json({ error: "Failed to fetch call logs" });
//   }
// });

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
// ║   Running on http://localhost:${PORT}                         ║
// ║                                                              ║
// ║   Flow: Greeting → Value Prop → Agentic Close                ║
// ║   Use Cases: Inspect · Appraise · Transfer · Tenant · Info   ║
// ║   Escalation: Complaints · Legal · Abusive → Human           ║
// ║                                                              ║
// ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
// ║   Recordings Dir:  ${RECORDINGS_DIR}                         ║
// ║   MongoDB:         ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
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
const { startAudioSocketServer } = require("./telephony-bridge"); // ← 3CX/Asterisk bridge

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
const OPENAI_VAD_PREFIX_PADDING_MS = Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 250);
const OPENAI_VAD_SILENCE_DURATION_MS = Number(process.env.OPENAI_VAD_SILENCE_DURATION_MS || 1100);
const BARGE_IN_GRACE_MS = Number(process.env.OPENAI_BARGE_IN_GRACE_MS || 700);

const AGENCY_WEBSITE_URL = process.env.AGENCY_WEBSITE_URL || "https://raywhitebankstown.com.au";
const OFFICE_MAIN_NUMBER = process.env.OFFICE_MAIN_NUMBER || null;

// ─── MongoDB Connection ───────────────────────────────────
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env — call logs will NOT be saved.");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅  MongoDB connected"))
    .catch((err) => console.error("❌  MongoDB connection error:", err.message));
}

// ─── MobileMessage (SMS) ──────────────────────────────────────────
const MOBILEMESSAGE_USERNAME = process.env.MOBILEMESSAGE_USERNAME;
const MOBILEMESSAGE_PASSWORD = process.env.MOBILEMESSAGE_PASSWORD;
const MOBILEMESSAGE_FROM = process.env.MOBILEMESSAGE_FROM;

if (MOBILEMESSAGE_USERNAME && MOBILEMESSAGE_PASSWORD && MOBILEMESSAGE_FROM) {
  console.log("✅  MobileMessage SMS configured");
} else {
  console.warn("⚠️  MOBILEMESSAGE_* env vars not set — SMS will be simulated (logged only).");
}

async function sendSms(toNumber, messageBody) {
  if (!toNumber) {
    console.warn("[SMS] ❌ Aborted — no phone number provided.");
    return { success: false, reason: "missing_phone_number" };
  }

  // MobileMessage API expects E.164 format WITH the leading +
  // e.g. +61412345678
  let cleanStr = String(toNumber).replace(/\s+/g, "").replace(/^\+/, "");
  if (cleanStr.startsWith("0")) {
    cleanStr = "61" + cleanStr.substring(1);
  }
  const normalizedNumber = "+" + cleanStr;

  console.log(`[SMS] 📤 Attempting to send SMS`);
  console.log(`[SMS]    ➤ To:      ${normalizedNumber} (raw: ${toNumber})`);
  console.log(`[SMS]    ➤ From:    ${MOBILEMESSAGE_FROM}`);
  console.log(`[SMS]    ➤ Message: ${messageBody}`);

  if (!MOBILEMESSAGE_USERNAME || !MOBILEMESSAGE_PASSWORD || !MOBILEMESSAGE_FROM) {
    console.log(`[SMS] ⚠️  SIMULATED (credentials not set) — message NOT actually sent to ${normalizedNumber}.`);
    return { success: true, simulated: true };
  }

  try {
    const authString = Buffer.from(`${MOBILEMESSAGE_USERNAME}:${MOBILEMESSAGE_PASSWORD}`).toString("base64");
    const response = await fetch("https://api.mobilemessage.com.au/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify({
        messages: [
          {
            to: normalizedNumber,
            message: messageBody,
            sender: MOBILEMESSAGE_FROM
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`MobileMessage API Error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      // response might be empty or not json
    }

    console.log(`[SMS] ✅ Successfully sent to ${normalizedNumber}`);
    if (responseData) console.log(`[SMS]    ➤ API Response:`, JSON.stringify(responseData));
    return { success: true, response: responseData };
  } catch (err) {
    console.error(`[SMS] ❌ Failed to send to ${normalizedNumber} — ${err.message}`);
    return { success: false, error: err.message };
  }
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
        "landlord_new_business",
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
- Property Managers (existing tenant/landlord matters): Farah Antone, Michelle Clay, Mary, Matthew Natoli
- Sales Agents (buying/selling properties): Joshua Nassif, Jordon Le Breux
- Reception / main office fallback: Delita, or the main office line
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
- VARY your filler words — do NOT default to "great" every single turn. Rotate naturally between
  "no worries", "absolutely", "of course", "sure thing", "sounds good" — or use none at all if the
  line doesn't need one. Never use "great" more than once every few responses.
- USE the caller's name sparingly — once when you first learn it, and once more near the close of
  the call is plenty. Do NOT open every response with their name; it reads as robotic and repetitive.
- NEVER say the same sentence, confirmation, or closing line twice in a row. Once you've told the
  caller something (e.g. "I'll transfer you to Farah now"), move on — don't restate it again unless
  they ask you to repeat it.

=============================================================
TRANSFER ROUTING LOGIC (applies across all use cases below)
=============================================================
This agency has three distinct groups of staff, and callers must be routed to the right one:
- Property Managers → existing tenants, existing owners/landlords already under management
- Sales Agents → buyers, or sellers already dealing with a specific agent
- Reception / main office → anyone new, unknown, or where you can't confidently identify a person

Golden rule: only ever offer a transfer to a NAMED person if you can reasonably identify who that
person is (the caller tells you, or the property/context makes it clear). If you can't identify a
specific person, don't guess — transfer to the main office instead.

Before transferring ANY call, always verbally acknowledge first — never transfer silently. Say something warm and natural like:

When transferring to a specific person, always say it this way:
"Sure! Let me transfer you to [name] right now, one moment please!"

When transferring to the main office (no specific person identified), say it this way:
"Let me put you through to our reception team right now, one moment!"

When transferring to after hours (out of hours / property management), say it this way:
"Let me put you through to our after hours team right now, one moment please!"

CRITICAL INSTRUCTION: You MUST output this verbal acknowledgment AND call the transfer_call tool in the EXACT SAME RESPONSE. Do NOT pause or wait for the caller to reply. Speak the phrase, then immediately trigger the transfer. Always use the person's name if transferring to a specific person.

Do NOT send an email or text message to a property manager or sales agent as a substitute for or
alongside a transfer — at this stage transfers are voice-only. (SMS is only ever used for the
"text me the website link" use case below, never to notify staff.)

=============================================================
TRANSFER TOOL — HOW TO USE transfer_call
=============================================================
When you decide to transfer a call, you MUST call the transfer_call 
tool with the correct destination value. Here is the exact mapping:

destination: "reception"
→ Use for: main office, general enquiries, buying, selling, 
  new landlords, application status, anyone you can't identify,
  or any staff member you cannot identify

destination: "john"  
→ Use ONLY when: caller explicitly asks for John or John Agent
  (This is a demo staff member for testing purposes)

destination: "afterhours"
→ Use ONLY as a last resort when a PM is needed but you cannot identify which one

destination: "charlie"
→ Use when: caller asks for Charlie Sioud or Charlie

destination: "anessa"
→ Use when: caller asks for Anessa McGrath, or lookupPropertyManager returns "Anessa McGrath"

destination: "chelsea"
→ Use when: caller asks for Chelsea Moussa

destination: "eleena"
→ Use when: caller asks for Eleena Bassam El-Sous, or lookupPropertyManager returns "Eleena Bassam El-Sous"

destination: "ethan"
→ Use when: caller asks for Ethan Tran

destination: "farah"
→ Use when: caller asks for Farah Antown, or lookupPropertyManager returns "Farah Antown"

destination: "jessie"
→ Use when: caller asks for Jessie Hodkinson, or lookupPropertyManager returns "Jessie Hodkinson"

destination: "mary"
→ Use when: caller asks for Mary Azzi, or lookupPropertyManager returns "Mary Azzi"

destination: "matthew"
→ Use when: caller asks for Matthew Natoli, or lookupPropertyManager returns "Matthew Natoli"

destination: "michelle"
→ Use when: caller asks for Michelle Clay, or lookupPropertyManager returns "Michelle Clay"

destination: "noa"
→ Use when: caller asks for Noa Callus

destination: "zena"
→ Use when: caller asks for Zena Issa

IMPORTANT RULES:
- CRITICAL: You MUST generate the verbal acknowledgment AND call the transfer_call tool IN THE EXACT SAME TURN.
- DO NOT say the phrase and then stop to wait for the user's reply.
- NEVER say you will transfer and then keep talking — trigger the 
  tool RIGHT AFTER the transfer sentence
- If caller asks for "John", use destination: "john" immediately
- If caller asks for any Property Manager by name, use their specific destination key (e.g., "noa" for Noa Callus).
- When announcing a transfer to a staff member, ALWAYS speak their FULL name (e.g., "Noa Callus", not just "Noa").
- If caller asks for reception, main office, or any Sales Agent, 
  use destination: "reception"
- Only use destination: "afterhours" when a PM is needed but cannot be identified
- After calling transfer_call, say nothing further — the call will 
  be handed off

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

Once you have their name, use it naturally (see HOW YOU TALK — don't overuse it).

Then clarify their intent if not already clear:
- Property inquiry → "And which property were you interested in?"
- Selling → "And whereabouts is the property?"
- Renting / Tenant → "And is this about a property you're currently renting, or one you're looking to rent?"
- Buying an existing listing → go straight to USE CASE: BUYER / SALES ENQUIRY below
- New landlord wanting property management → go straight to USE CASE: NEW LANDLORD ENQUIRY below
- Staff transfer → Proceed immediately to STEP — STAFF TRANSFER

─────────────────────────────────────────────
INTENT CLASSIFICATION (internal — determines next steps)
─────────────────────────────────────────────
Classify the call into one of these categories internally:
- property_inquiry: Asking about listings, property details, or inspection times
- inspection_booking: Wants to book or reschedule an inspection
- appraisal_booking: Wants to sell — free appraisal
- rental_application_followup: Checking on the status of a rental application already submitted
- tenant_inquiry: Existing tenant with a question or issue
- general_enquiry: Office hours, directions, general questions
- directions_access: Getting to office or a property
- vendor_strata_partner: External partner or strata call
- staff_transfer: Wants to speak to a specific staff member
- owner_calling_pm: Existing owner calling about their currently-managed property
- landlord_new_business: A NEW landlord (not yet a client) asking about property management services
- no_transcript_admin: admin/no transcript

─────────────────────────────────────────────
STEP 02 — VALUE PROPOSITION
─────────────────────────────────────────────
Trigger ONLY for high-intent callers: serious renters looking to book an inspection.
Skip for transactional callers (just need a time, address, or transfer).

[DELIVER THIS NATURAL SCRIPT — adapt as needed]

"Here at Ray White Bankstown we bring the whole team to every property. Directors Tony Roumanous and Charlie Sioud, plus our full sales and property management crew.
Most of our clients are getting strong results right now because of our local knowledge across Bankstown, Georges Hall, Chester Hill, and Wiley Park — plus access to thousands of active buyers and tenants on our database.
Whether you want to book an inspection, or check rental listings, I can get you sorted right now — no waiting on hold or chasing emails."

─────────────────────────────────────────────
STEP 03 — AGENTIC / PROACTIVE CLOSE
─────────────────────────────────────────────
Don't end the conversation passively. Always offer specific next steps.

For INSPECTION BOOKING intent:
"I can lock in a private inspection for you — we've got availability tomorrow at 5:30pm, or Saturday morning at 10am. Would either of those work?"

For RENTAL ENQUIRY intent:
"We've got several properties in your range opening this Saturday. Want me to shortlist two or three and book inspections for you?"

For STAFF TRANSFER intent:
Follow TRANSFER ROUTING LOGIC above. If a specific, identifiable staff member is being asked for:
"I'll transfer your call to [name], please make sure to leave a message if [name] isn't available."
If no specific person can be identified, transfer to the main office instead — see TRANSFER ROUTING LOGIC.

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
## Collecting Phone Numbers

STEP 1 — CHECK METADATA FIRST
You may have been given the caller's number from the telephone network in the
CALL CONTEXT block above. If you have it:
- Do NOT ask them to recite a number unprompted.
- When the moment comes to collect a number, ask:
  "Would you like me to send that to the number you're calling from?"
- YES → use that number immediately, skip to confirmation.
- NO → proceed to STEP 2 below.

STEP 2 — COLLECT MANUALLY (only if metadata missing or caller said no)
1. Ask the caller to say their number digit by digit, or in groups — however
   feels natural to them.
2. As you receive the number, mentally reconstruct it.
3. ALWAYS read the number back to the caller exactly as they gave it —
   in local format (e.g. "0412 345 678"), NOT with a country code or plus sign.
4. Wait for explicit confirmation ("yes", "that's right", "correct") before proceeding.
5. If they say no or correct you, ask them to repeat the full number from the start.

## Number Format Rules
- Australian mobile numbers start with 04 and are 10 digits total (e.g. 0412 345 678).
- NEVER say "+61" or "plus" out loud — always read back in local format.
- When reading back an Australian number, group as: 04XX XXX XXX.
- If the caller says "61" at the start, drop it and prepend 0 instead.
- International numbers from metadata (e.g. +923092836265) — read back digit by
  digit in natural groups, never announce the plus or country code label.

## Confirmation Script
After collecting or confirming the number, say:
"Just to confirm, I'll send that to [number as spoken naturally] — is that right?"

Do not move on until you receive a clear "yes" or equivalent confirmation.

=============================================================
SPECIFIC USE CASES
=============================================================

─────────────────────────────────────────────
USE CASE: OPENING HOURS
─────────────────────────────────────────────
If anyone asks about opening hours, always answer directly without transferring or escalating:
"We're open Monday to Friday 9am to 5:30pm, and Saturday 9am to 4pm. We're closed on Sundays!"

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
Do NOT deliver a pitch or try to book an appraisal yourself.
Treat this exactly like a general sales enquiry.
Ask for their name, then transfer straight to reception.
"No worries — I'll transfer you to our main office now so they can assist you with that, one moment."
Log as intent_category: "staff_transfer", outcome: "transferred".

─────────────────────────────────────────────
USE CASE: BUYER / SALES ENQUIRY
─────────────────────────────────────────────
Covers buyers asking about a property that's for sale, and any general sales enquiry that isn't
about the caller's own property. Do NOT try to answer detailed sales questions yourself or book
anything — this always goes to a Sales Agent.

First ask: "No worries — could you give me the name of the sales agent you've been dealing with, or who you'd like to speak to?"
(CRITICAL: Always ask this question first, even if they just ask for "sales" or "the sales team". Do not skip straight to reception.)
- Wait for them to provide a name. Do NOT offer names as options unless they say they can't remember.
- If they say "yes I know" but don't give the name, follow up: "Great — what's their name?"

- If they name a known Sales Agent (e.g. Joshua Nassif, Jordon Le Breux, Patrick Sioud) or a Director:
  (CRITICAL: Before transferring, check your transfer list. If the caller provides only a first name and there are multiple staff members with that name — e.g., James, Patrick, Anthony — you MUST ask them to clarify the last name or department. Do not guess or assume.)
  "I'll transfer your call to [name] now, one moment."
  (CRITICAL: Ensure you say their exact correct name — do not mix up similar names like Patrick Sioud, Charlie Sioud, and Charbel Elias).
- If they explicitly say they don't know the name, or if it's a general sales enquiry and they have no specific agent:
  "No worries — I'll transfer you to our main office now, one moment."

Log as intent_category: "staff_transfer" if a named agent was identified, otherwise
"property_inquiry". Set staff_requested to the agent's name if known. outcome: "transferred".

─────────────────────────────────────────────
USE CASE: NEW LANDLORD ENQUIRY (property management)
─────────────────────────────────────────────
A landlord who is NOT yet a client, asking about having Ray White Bankstown manage their rental
property. This is new business — do not try to run the full appraisal/close flow, and do not
guess which Property Manager should take it since none has been assigned yet.

"That's great to hear — our property management team would love to help with that. I'll transfer
you to our main office now so they can get the details from you directly, one moment."

Log as intent_category: "landlord_new_business", outcome: "transferred".
(If the office is unreachable/caller prefers a callback: take name, phone, and property address,
and log outcome: "callback_scheduled" instead.)

─────────────────────────────────────────────
USE CASE: STAFF TRANSFER
─────────────────────────────────────────────
If the caller asks for a specific staff member by name, respond immediately:
(CRITICAL: Before transferring, check your transfer list. If the caller provides only a first name and there are multiple staff members with that name — e.g., James, Patrick, Anthony — you MUST ask them to clarify the last name or department. Do not guess or assume.)
"I'll transfer your call to [name] now, one moment."
(CRITICAL: Use the exact correct name. Do not hallucinate or mix up names like Sioud or Elias).
If the caller asks for a department (e.g. "sales team") or "a staff member" but doesn't give a name, ALWAYS ask: "Could you give me the name of the person you'd like to speak to?" before transferring.
If you cannot identify who they mean after asking, don't guess — follow TRANSFER ROUTING LOGIC and transfer to
the main office instead. Always log with intent_category: "staff_transfer".

─────────────────────────────────────────────
USE CASE: TENANT INQUIRIES / MAINTENANCE
─────────────────────────────────────────────
An existing tenant with a question or maintenance issue. Your job is to
identify the Property Manager and transfer — nothing else.

1. Collect: name, property address, and briefly the nature of the issue.
2. Try BOTH methods to identify the PM — in this order:
   a. Ask the caller: "Do you know the name of your property manager?"
      - If they give a name → use that, go to step 3.
   b. If they don't know → call lookupPropertyManager with the property address.
      - If found → go to step 3.
      - If not found → transfer to reception.
3. Once PM is identified by either method, you MUST ask for permission to transfer:
   "Your property manager is [PM full name]. Would you like me to transfer you to them now?"
   - Wait for their confirmation.
   - If they say yes: "I'll transfer your call to [PM full name] now, one moment."
   - Then call transfer_call with the correct destination.
   - If they say no, ask how else you can help them.

For urgent issues (locked out, no hot water, safety risk):
- Still follow steps 1–3 above, do NOT skip straight to reception.
- Flag it verbally: "I can see this is urgent — let me get you straight
  through to your property manager."
- Log escalated: true.

Do NOT email or text the PM — this is a transfer-only flow.
Do NOT skip to reception without trying both identification methods first.

Log intent_category: "tenant_inquiry", outcome: "transferred" (or "escalated"
for urgent/safety issues), staff_requested set to the PM's name if identified.

─────────────────────────────────────────────
USE CASE: RENTAL APPLICATION FOLLOW-UP
─────────────────────────────────────────────
This is for someone checking the status of an application they've ALREADY submitted.
Do NOT take a message or schedule a callback.
Ask for their name, then transfer straight to reception.
"No worries — I'll transfer you to our main office now so they can check that for you, one moment."
Log as intent_category: "staff_transfer", outcome: "transferred".

─────────────────────────────────────────────
USE CASE: PROPERTY LEASING ENQUIRIES (available rental listings)
─────────────────────────────────────────────
Callers frequently ask about specific rental listings. Answer using details from
raywhitebankstown.com.au for the property in question. NEVER invent or guess a
figure or feature you don't actually know.
Never send rental enquiries to voicemail. Always:
- Send the caller the website link via SMS.
- If further help is needed, transfer to reception.

Typical questions this covers, all answered directly and efficiently (no need for
the full sales flow — these are transactional):
- Is the property still available
- What is the weekly or monthly rent
- How much is the bond / security deposit
- How many bedrooms and bathrooms it has
- Whether there's a garage, carport, or allocated parking
- Whether it has air conditioning, heating, or ceiling fans
- Whether there's a yard, balcony, or outdoor space
- Whether there are built-in wardrobes or extra storage
- Whether there's a dishwasher or laundry
- Proximity to public transport
- Nearby schools, shops, or parks
- When the next inspection is

If the caller wants to apply, or is a brand-new applicant (not a follow-up on an existing
application), always point them to the website rather than trying to take the application
yourself — see the "How do I apply?" script below. You can also offer to text them the link (see
USE CASE: TEXT WEBSITE LINK).

Log these under intent_category: "property_inquiry" (or "inspection_booking" /
"inspection_reschedule" if it moves to booking a time).

─────────────────────────────────────────────
USE CASE: TEXT WEBSITE LINK
─────────────────────────────────────────────
For any new enquiry — especially rental or sales listing questions — you can offer to text the
caller a link to the website instead of/as well as talking them through everything verbally.

"Would you like me to text you a link to our website so you've got it handy?"

If they say yes:
1. Confirm their mobile number (use caller_phone if you already have it).
2. Call the send_sms tool with that number, message_type (e.g., rental_listing, application_process, general_enquiry), and a short note (e.g. the property address or topic discussed).
3. Confirm briefly and ask if they need a transfer: "All done — that link's on its way to you now. Would you like me to transfer you to the reception for any further assistance?"
   - If they say yes: "No worries, I'll transfer you now." (Follow the transfer routing logic to reception).
   - If they say no: Ask, "Is there anything else you'd like to know?"
     - If they ask something else: Answer their question and continue to assist them.
     - If they say no: Close the call warmly, e.g., "Alright, thank you for calling Ray White Bankstown. Have a great day!" and then end the call.

Log intent_category: whatever the underlying enquiry was (usually "property_inquiry" or
"general_enquiry"), outcome: "sms_sent", or "transferred" if they choose to transfer.

─────────────────────────────────────────────
USE CASE: RENTAL PROCESS / APPLICATION FAQs
─────────────────────────────────────────────
Use discretion adapting tone, but keep the substance of these answers accurate. When referring to
our applications platform, say "Snug" out loud — not "snug dot com" — it reads more naturally in
speech. Only mention the actual "snug.com" address if the caller specifically asks for the web
address, or in a text (see USE CASE: TEXT WEBSITE LINK).

- "Are pets allowed?"
  "Any pet request is reviewed as part of the application. If you'd like to apply, head to our website, find the property, and select 'Apply for this Property' — that'll take you through to Snug, where you can create a login and submit your application."

- "What lease lengths are available?"
  "Lease terms are usually 6 or 12 months, though it can depend on the application — if a property has a shorter lease available, it'll be noted in the ad."

- "Is the lease renewable?"
  "In most cases, yes — though that depends on the individual property and the owner's plans when the lease is due to expire."

- "Is there flexibility with the move-in date?"
  "That can be reviewed as part of the application."

- "Do I need to register for an inspection?"
  "It's not essential, but it's definitely encouraged. To register, find the property on our website and select 'Apply for this Property' — that'll take you to Snug to create a login and register to attend."

- "How do I apply?"
  "Head to our website, find the property you're after, and select 'Apply for this Property'. You'll be redirected to Snug to create a login and submit your application there."

- "What documents do I need?"
  "That's all listed in Snug once you start your application — find the property on our website, select 'Apply for this Property', and Snug will show you everything required."

- "What are the income or reference requirements?"
  "That information's in Snug as well — same process: find the property on our website, select 'Apply for this Property', and Snug will list what's needed."

- "How long does approval usually take?"
  "Typically 1 to 3 days, depending on how many applications we're working through and whether any extra info is needed."

Log rental-application FAQ calls under intent_category: "property_inquiry" or
"rental_application_followup" as appropriate, with outcome: "info_provided"
unless it progresses further (e.g. transferred, callback_scheduled, sms_sent).

─────────────────────────────────────────────
USE CASE: REQUESTS THAT GO BACK TO RECEPTION / PM
─────────────────────────────────────────────
- "Can I arrange a private viewing?"
  Do NOT try to book this yourself — this goes to the relevant Property Manager.
  Try to identify the PM first (as in TENANT INQUIRIES / MAINTENANCE above). If identified:
  "I'll transfer your call to [PM name], please make sure to leave a message if [PM name] isn't available."
  If not identified: "No worries — I'll transfer you to our main office now, one moment."
  Log as intent_category: "staff_transfer" or "tenant_inquiry" with staff_requested set to the
  relevant PM if known.

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
- Urgent tenant safety/emergency issues
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
PROPERTY MANAGER LOOKUP TOOL
=============================================================
Use the lookupPropertyManager tool when:
- Caller mentions a property address and wants their PM
- Caller asks to speak to a PM by name
- Caller has a maintenance issue and doesn't know their PM

HOW TO USE:
- Pass whatever the caller said (address OR name) as the query
- If found: You MUST first speak EXACTLY this phrase out loud: "Your property manager is [pmName]. I am transferring you to them now, one moment." THEN, in the EXACT SAME TURN, call transfer_call with the destination set to the PM's first name (e.g., "anessa", "noa").
- If not found: You MUST first speak EXACTLY this phrase out loud: "I wasn't able to find that property. I am transferring you to our team now." THEN, in the EXACT SAME TURN, call transfer_call(destination: "afterhours").

=============================================================
AMBIGUOUS NAMES — ALWAYS CLARIFY BEFORE TRANSFERRING
=============================================================
The following first names have multiple staff members. ALWAYS ask for
the last name or department before transferring — never assume:

- Anthony: could be Anthony Roumanous (ext 120), Anthony Jaja (ext 126), or Anthony Cham (ext 146)
  → Ask: "We have a few people named Anthony — could you give me their last name or tell me which department?"

- Patrick: could be Patrick Sioud (ext 136) or Patrick Liu (ext 133)
  → Ask: "We have two Patricks — is that Patrick Sioud or Patrick Liu?"

- James: could be James Huang (ext 137) or James Duong (ext 138)
  → Ask: "We have two people named James — is that James Huang or James Duong?"

NEVER transfer to reception as a fallback for an ambiguous name —
always ask the clarifying question first.

=============================================================
HARD RULES — NON-NEGOTIABLE
=============================================================
- Language: ENGLISH ONLY at all times
- ONE question at a time
- Responses: 1 to 2 sentences max
- NEVER assume the caller's name
- NEVER repeat the same sentence or confirmation twice in a row
- Don't overuse "great" or the caller's name — vary language naturally (see HOW YOU TALK)
- ALWAYS call save_call_log after every completed call
- Value proposition must be delivered before the close for high-intent callers
- For transactional callers, skip the sales flow and answer directly
- Never give legal or financial advice
- Never make up property details
- For rental listing questions, use only known/verified details from raywhitebankstown.com.au — if unsure, say so and offer a callback rather than guessing
- Private viewing requests, tenant/maintenance issues, buyer/sales enquiries, and new landlord
  enquiries are always ROUTED per TRANSFER ROUTING LOGIC — never booked, emailed, or texted to
  staff directly by you
- Never send an email or SMS to staff on the caller's behalf — transfers are voice-only; SMS is
  only ever used to text the caller the website link
`.trim();
}

// ─── Tool Definitions ─────────────────────────────────────
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
            "landlord_new_business",
            "no_transcript_admin",
          ],
          description: "Classified intent of the call",
        },
        preferred_time: {
          type: "string",
          description: "Agreed appointment slot or preferred callback time — e.g. 'Tuesday at 11am', 'Saturday 10am'",
        },
        staff_requested: { type: "string", description: "Name of staff member requested / identified for transfer" },
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

function getSendSmsTool() {
  return {
    type: "function",
    name: "send_sms",
    description:
      "Texts the caller a professional SMS message containing a link to the Ray White Bankstown website. Use when a caller agrees to be sent a link (e.g. for a new enquiry, a rental listing, or the application process).",
    parameters: {
      type: "object",
      properties: {
        caller_phone: {
          type: "string",
          description: "Mobile number the caller gives you to send the text to. Use Australian format e.g. 0412345678 or +61412345678 — the system will normalise it automatically.",
        },
        message_type: {
          type: "string",
          enum: ["rental_listing", "application_process", "general_enquiry"],
          description: "The type of SMS message to send based on the caller's inquiry.",
        },
        note: {
          type: "string",
          description: "Optional short context to include, e.g. a property address or topic discussed",
        },
      },
      required: ["caller_phone", "message_type"],
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
function createRealtimeSession(sessionId, onEvent, extraInstructions = "") {
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
          instructions: getSystemPrompt() + (extraInstructions ? `\n\n${extraInstructions}` : ""),
          tools: [getSaveCallLogTool(), getSendSmsTool(), getTransferCallTool(), getLookupPropertyManagerTool()],
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
        textDeltaEventType: null,
        currentResponseStartedAt: null,
        onEvent,
        startMs,
        openAiConnectedMs: Date.now(),
        elevenLabsConnectedMs: null,
        greetingTriggeredMs: null,
        firstResponseCreatedMs: null,
        firstAudioDeltaLogged: false,
        callId: sessionId.startsWith("tel-") ? sessionId.replace("tel-", "") : null,
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
    } catch { }
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
    } catch { }
    session.elevenLabsWs = null;
    session.elevenLabsReady = false;
    session.textBuffer = [];
  }
}

// ─── Property Manager Lookup Tool ─────────────────────────
let pmCache = {
  data: null,
  timestamp: null,
  expiryMs: 5 * 60 * 1000
};

const pmFallbackData = [
  { "pmName": "Eleena Bassam El-Sous", "address": "25A Ambon Road, Holsworthy, NSW 2173" },
  { "pmName": "Mary Azzi", "address": "4/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "1/265 Miller Road, Bass Hill, NSW 2197" },
  { "pmName": "Mary Azzi", "address": "18 Rabaul Road, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "6/199 Auburn Road, Yagoona, NSW 2199" },
  { "pmName": "Farah Antown", "address": "1E Fenwick Street, Yagoona, NSW 2199" },
  { "pmName": "Mary Azzi", "address": "2/3 Ellis Street, Condell Park, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "45 Glassop Street, Yagoona, NSW 2199" },
  { "pmName": "Farah Antown", "address": "72 Military Road, Merrylands, NSW 2160" },
  { "pmName": "Farah Antown", "address": "8A Leighdon Street, Bass Hill, NSW 2197" },
  { "pmName": "Farah Antown", "address": "11A Conway Road, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "148 Marion Street, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "28/57 Bellevue Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "134A Waterloo Road, Greenacre, NSW 2190" },
  { "pmName": "Mary Azzi", "address": "1/243 Canterbury Road, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "58 Jocelyn Street, Chester Hill, NSW 2162" },
  { "pmName": "Anessa McGrath", "address": "10/13-15 Gordon Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "37/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "407/36 Kitchener Parade, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "28/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "32 Verbena Avenue, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "39 Jocelyn Street, Chester Hill, NSW 2162" },
  { "pmName": "Michelle Clay", "address": "60 Jacaranda Drive, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "15 Bulwarra Avenue, Sefton, NSW 2162" },
  { "pmName": "Farah Antown", "address": "89 Oak Drive, Georges Hall, NSW 2198" },
  { "pmName": "Jessie Hodkinson", "address": "2 Olympic Parade, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "11/122 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "2/73 Denman Avenue, Wiley Park, NSW 2195" },
  { "pmName": "Eleena Bassam El-Sous", "address": "73C Clarence Street, Condell Park, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "20 Beale Street, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "16 Dredge Avenue, Moorebank, NSW 2170" },
  { "pmName": "Eleena Bassam El-Sous", "address": "87 Townsend Street, Condell Park, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "58 Marden Street, Georges Hall, NSW 2198" },
  { "pmName": "Eleena Bassam El-Sous", "address": "15/24 Brandon Avenue, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "74A Cantrell Street, Yagoona, NSW 2199" },
  { "pmName": "Mary Azzi", "address": "30 Lowana Street, Villawood, NSW 2163" },
  { "pmName": "Michelle Clay", "address": "19 Donington Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Eleena Bassam El-Sous", "address": "35 Chertsey Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "7/299 Lakemba Street, Wiley Park, NSW 2195" },
  { "pmName": "Jessie Hodkinson", "address": "5A Tyalgum Avenue, Panania, NSW 2213" },
  { "pmName": "Eleena Bassam El-Sous", "address": "45 Campbell Hill Road, Guildford, NSW 2161" },
  { "pmName": "Jessie Hodkinson", "address": "88/169 Horsley Road, Panania, NSW 2213" },
  { "pmName": "Michelle Clay", "address": "26A Yarran Street, Punchbowl, NSW 2196" },
  { "pmName": "Mary Azzi", "address": "1/114 Taylor Street, Condell Park, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "357A Marion Street, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "35 Brodie Street, Yagoona, NSW 2199" },
  { "pmName": "Mary Azzi", "address": "302/106 Brancourt Avenue, Yagoona, NSW 2199" },
  { "pmName": "Jessie Hodkinson", "address": "13/14 Conway Road, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "10/73-75 Reynolds Avenue, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "50 Dutton Street, Bankstown, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "61A Denman Road, Georges Hall, NSW 2198" },
  { "pmName": "Michelle Clay", "address": "28 Rex Road, Georges Hall, NSW 2198" },
  { "pmName": "Michelle Clay", "address": "18B Vista Crescent, Chester Hill, NSW 2162" },
  { "pmName": "Michelle Clay", "address": "136 Johnston Road, Bass Hill, NSW 2197" },
  { "pmName": "Farah Antown", "address": "1/1 Eldon Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "44 Cann Street, Bass Hill, NSW 2197" },
  { "pmName": "Michelle Clay", "address": "91A Taylor Street, Condell Park, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "6/32-34 Sixth Avenue, Campsie, NSW 2194" },
  { "pmName": "Michelle Clay", "address": "21/36 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "16A Dredge Avenue, Moorebank, NSW 2170" },
  { "pmName": "Eleena Bassam El-Sous", "address": "45 Chertsey Avenue, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "223 Henry Lawson Drive, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "14 Nyora Street, Chester Hill, NSW 2162" },
  { "pmName": "Michelle Clay", "address": "34 Virtue Street, Condell Park, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "499 Marion Street, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "48A Larien Crescent, Birrong, NSW 2143" },
  { "pmName": "Jessie Hodkinson", "address": "307/465 Chapel Road, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "14 Wilkins Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "88 Yanderra Street, Condell Park, NSW 2200" },
  { "pmName": "Farah Antown", "address": "100 Hunter Street, Condell Park, NSW 2200" },
  { "pmName": "Farah Antown", "address": "22 Spicer Avenue, Hammondville, NSW 2170" },
  { "pmName": "Jessie Hodkinson", "address": "302/21-25 Leonard Street, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "232A Marion Street, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "712/16-20 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "14/11 Milton Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "1/133 Hector Street, Sefton, NSW 2162" },
  { "pmName": "Michelle Clay", "address": "29/22-24 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "8A Australia Street, Bass Hill, NSW 2197" },
  { "pmName": "Mary Azzi", "address": "5/49-55 Jacobs Street, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "15 Edgar Street, Yagoona, NSW 2199" },
  { "pmName": "Michelle Clay", "address": "14 Gail Place, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "6 Beryl Place, Greenacre, NSW 2190" },
  { "pmName": "Jessie Hodkinson", "address": "B502/75 Rickard Road, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "5/22 Marlene Crescent, Chullora, NSW 2190" },
  { "pmName": "Mary Azzi", "address": "B302/17 Hanna Street, Potts Hill, NSW 2145" },
  { "pmName": "Eleena Bassam El-Sous", "address": "73B Clarence Street, Condell Park, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "808/16 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "58A Allum Street, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "1/76 Cantrell Street, Yagoona, NSW 2199" },
  { "pmName": "Jessie Hodkinson", "address": "12/33 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "26 Lucinda Avenue, Bass Hill, NSW 2197" },
  { "pmName": "Mary Azzi", "address": "12/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "3/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "3/10-12 Myee Street, Lakemba, NSW 2195" },
  { "pmName": "Michelle Clay", "address": "2B Ashby Avenue, Yagoona, NSW 2199" },
  { "pmName": "Farah Antown", "address": "10/10 Milton Street, Bankstown, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "1 Minmai Road, Chester Hill, NSW 2162" },
  { "pmName": "Michelle Clay", "address": "2/67A Taylor Street, Condell Park, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "66A Smith Road, Yagoona, NSW 2199" },
  { "pmName": "Farah Antown", "address": "210/351C Hume Highway, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "1/57 Dutton Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "19/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "13 Winifred Street, Condell Park, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "1249 Canterbury Road, Punchbowl, NSW 2196" },
  { "pmName": "Mary Azzi", "address": "16 Petunia Avenue, Bankstown, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "47/159 Chapel Road, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "204/106 Brancourt Avenue, Yagoona, NSW 2199" },
  { "pmName": "Michelle Clay", "address": "104 Simmat Avenue, Condell Park, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "1 Suva Crescent, Greenacre, NSW 2190" },
  { "pmName": "Michelle Clay", "address": "19A Donington Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "36/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "11A King Georges Road, Wiley Park, NSW 2195" },
  { "pmName": "Farah Antown", "address": "115 Macquarie Street, Greenacre, NSW 2190" },
  { "pmName": "Farah Antown", "address": "207 Wattle Street, Bankstown, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "19 Virtue Street, Condell Park, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "107/37 Leonard Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "12/24 Brandon Avenue, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "79A Townsend Street, Condell Park, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "64 Townsend Street, Condell Park, NSW 2200" },
  { "pmName": "Farah Antown", "address": "34 Haig Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "48 Larien Crescent, Birrong, NSW 2143" },
  { "pmName": "Jessie Hodkinson", "address": "19/6 Myrtle Road, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "953 Hume Highway, Bass Hill, NSW 2197" },
  { "pmName": "Mary Azzi", "address": "16A Petunia Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "33A Kurrajong Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "1/13 Newman Street, Bass Hill, NSW 2197" },
  { "pmName": "Farah Antown", "address": "6/94-96 Brancourt Avenue, Yagoona, NSW 2199" },
  { "pmName": "Michelle Clay", "address": "10 Emery Avenue, Yagoona, NSW 2199" },
  { "pmName": "Michelle Clay", "address": "72 Old Kent Road, Mount Lewis, NSW 2190" },
  { "pmName": "Michelle Clay", "address": "22/14 Melanie Street, Yagoona, NSW 2199" },
  { "pmName": "Farah Antown", "address": "125 Birdwood Road, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "B202/40 Hoskins Avenue, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "60 Renown Avenue, Wiley Park, NSW 2195" },
  { "pmName": "Eleena Bassam El-Sous", "address": "46A Johnston Road, Bass Hill, NSW 2197" },
  { "pmName": "Farah Antown", "address": "40 Market Street, Condell Park, NSW 2200" },
  { "pmName": "Farah Antown", "address": "39 Saric Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "27 Ely Street, Revesby, NSW 2212" },
  { "pmName": "Farah Antown", "address": "147 The River Road, Revesby, NSW 2212" },
  { "pmName": "Farah Antown", "address": "4 Townsend Street, Condell Park, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "12 York Street, Condell Park, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "4/279 Miller Road, Bass Hill, NSW 2197" },
  { "pmName": "Farah Antown", "address": "27 Jacaranda Drive, Georges Hall, NSW 2198" },
  { "pmName": "Michelle Clay", "address": "25 Lancelot Street, Condell Park, NSW 2200" },
  { "pmName": "Farah Antown", "address": "22/38 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "6 Amber Place, Bass Hill, NSW 2197" },
  { "pmName": "Farah Antown", "address": "23 Jocelyn Street, Chester Hill, NSW 2162" },
  { "pmName": "Michelle Clay", "address": "3/279 Miller Road, Bass Hill, NSW 2197" },
  { "pmName": "Mary Azzi", "address": "19 Verbena Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "17A Lumeah Avenue, Punchbowl, NSW 2196" },
  { "pmName": "Farah Antown", "address": "5/23 Pringle Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "18/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "38 Universal Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "20 Norman Street, Condell Park, NSW 2200" },
  { "pmName": "Farah Antown", "address": "46A Colechin Street, Yagoona, NSW 2199" },
  { "pmName": "Mary Azzi", "address": "17/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "28/6 Myrtle Road, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "7 Lille Place, Milperra, NSW 2214" },
  { "pmName": "Mary Azzi", "address": "104/106 Brancourt Avenue, Yagoona, NSW 2199" },
  { "pmName": "Mary Azzi", "address": "17/15-25 Jacobs Street, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "8/45 Jacobs Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "14 Carnegie Road, Chester Hill, NSW 2162" },
  { "pmName": "Anessa McGrath", "address": "5A Wright Close, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "13/30-34 Sir Joseph Banks Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "4/11-13 Resthaven Road, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "19 Rose Street, Punchbowl, NSW 2196" },
  { "pmName": "Michelle Clay", "address": "43 Horsley Road, Revesby, NSW 2212" },
  { "pmName": "Mary Azzi", "address": "27/4-6 Dellwood Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "803/61 Rickard Road, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "2/36 Robinson Street, Wiley Park, NSW 2195" },
  { "pmName": "Mary Azzi", "address": "14 Greater Circuit, Bass Hill, NSW 2197" },
  { "pmName": "Jessie Hodkinson", "address": "302/465 Chapel Road, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "1/48 Avoca Street, Yagoona, NSW 2199" },
  { "pmName": "Mary Azzi", "address": "35/91-95 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "21 Irvine Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "73A Clarence Street, Condell Park, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "46 Johnston Road, Bass Hill, NSW 2197" },
  { "pmName": "Eleena Bassam El-Sous", "address": "6/2-4 Myrtle Road, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "5 Talinga Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Michelle Clay", "address": "47 Baxter Road, Bass Hill, NSW 2197" },
  { "pmName": "Michelle Clay", "address": "55 Rose Street, Sefton, NSW 2162" },
  { "pmName": "Michelle Clay", "address": "22 Wentworth Street, Birrong, NSW 2143" },
  { "pmName": "Michelle Clay", "address": "1/8 Lee Street, Condell Park, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "11/13-15 Cairds Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "292 Miller Road, Bass Hill, NSW 2197" },
  { "pmName": "Michelle Clay", "address": "58 Alamein Road, Revesby Heights, NSW 2212" },
  { "pmName": "Michelle Clay", "address": "65 Little Road, Yagoona, NSW 2199" },
  { "pmName": "Eleena Bassam El-Sous", "address": "8/3 Fetherstone Street, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "709/16-20 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "3/73 Denman Avenue, Wiley Park, NSW 2195" },
  { "pmName": "Jessie Hodkinson", "address": "3 Saric Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "22/146 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "21 Townsend Street, Condell Park, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "4 Savoy Crescent, Chester Hill, NSW 2162" },
  { "pmName": "Farah Antown", "address": "10B Frank Street, Mount Lewis, NSW 2190" },
  { "pmName": "Eleena Bassam El-Sous", "address": "3/43 Taylor Street, Condell Park, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "5/3 Shenton Avenue, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "18/85-87 Chapel Road, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "229 Marion Street, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "25 Curtis Road, Chester Hill, NSW 2162" },
  { "pmName": "Jessie Hodkinson", "address": "187A Rex Road, Georges Hall, NSW 2198" },
  { "pmName": "Eleena Bassam El-Sous", "address": "3/1-3 Carmen Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "22 Hinkler Avenue, Condell Park, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "2/8 Hixson Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "1/5 Denman Avenue, Wiley Park, NSW 2195" },
  { "pmName": "Farah Antown", "address": "9 Saltash Street, Yagoona, NSW 2199" },
  { "pmName": "Michelle Clay", "address": "2/8-10 Revesby Place, Revesby, NSW 2212" },
  { "pmName": "Farah Antown", "address": "29/2A Mulla Road, Yagoona, NSW 2199" },
  { "pmName": "Michelle Clay", "address": "22a Wynyard Avenue, Bass Hill, NSW 2197" },
  { "pmName": "Anessa McGrath", "address": "1/72-74 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "93B Simmat Avenue, Condell Park, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "24/1-5 Bungalow Crescent, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "55 The Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "12/17-27 Rickard Road, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "12/45 De Witt Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "148 Boronia Road, Greenacre, NSW 2190" },
  { "pmName": "Anessa McGrath", "address": "17 Sturt Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "69A Wattle Street, Punchbowl, NSW 2196" },
  { "pmName": "Anessa McGrath", "address": "5/7-9 Mulla Road, Yagoona, NSW 2199" },
  { "pmName": "Mary Azzi", "address": "40 Haig Avenue, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "48 Norfolk Road, Greenacre, NSW 2190" },
  { "pmName": "Anessa McGrath", "address": "6/13 Cairds Avenue, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "8 Caldwell Parade, Yagoona, NSW 2199" },
  { "pmName": "Farah Antown", "address": "6 Barlow Place, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "6/34-36 Weigand Avenue, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "93 Stansfield Avenue, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "32A Gleeson Avenue, Condell Park, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "22/7-13 Melanie Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "2/114 Taylor Street, Condell Park, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "2/40 Carnavon Crescent, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "5/40-44 Chertsey Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "2/4 Campbell Street, Punchbowl, NSW 2196" },
  { "pmName": "Jessie Hodkinson", "address": "25a Acacia Avenue, Punchbowl, NSW 2196" },
  { "pmName": "Michelle Clay", "address": "5/14 Melanie Street, Yagoona, NSW 2199" },
  { "pmName": "Jessie Hodkinson", "address": "605/465 Chapel Road, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "19A Verbena Avenue, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "6/133 Chester Hill Road, Bass Hill, NSW 2197" },
  { "pmName": "Michelle Clay", "address": "7 Grevillea Road, Chester Hill, NSW 2162" },
  { "pmName": "Anessa McGrath", "address": "3/19 Highland Avenue, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "1/61 Broad Street, Bass Hill, NSW 2197" },
  { "pmName": "Mary Azzi", "address": "114B Acacia Avenue, Greenacre, NSW 2190" },
  { "pmName": "Mary Azzi", "address": "601/16-20 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "21 Caldwell Parade, Yagoona, NSW 2199" },
  { "pmName": "Jessie Hodkinson", "address": "103 Wilkins Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "20/27 Raymond Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "7/19-21 Milton Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "37 Chertsey Avenue, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "11/7-13 Melanie Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "20/55 Reynolds Avenue, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "9/10-14 Milton Street, Bankstown, NSW 2200" },
  { "pmName": "Eleena Bassam El-Sous", "address": "10/85 Cairds Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "10 Talbot Road, Yagoona, NSW 2199" },
  { "pmName": "Michelle Clay", "address": "74 Rowe Drive, Potts Hill, NSW 2145" },
  { "pmName": "Anessa McGrath", "address": "61B Denman Road, Georges Hall, NSW 2198" },
  { "pmName": "Farah Antown", "address": "12B Maclaurin Avenue, East Hills, NSW 2213" },
  { "pmName": "Jessie Hodkinson", "address": "40/33-35 Sir Joseph Banks St, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "44 Denman Road, Georges Hall, NSW 2198" },
  { "pmName": "Mary Azzi", "address": "2/11-13 Resthaven Road, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "7/19 Etela Street, Belmore, NSW 2192" },
  { "pmName": "Jessie Hodkinson", "address": "706/61 Rickard Road, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "5/32-34 Fifth Avenue, Campsie, NSW 2194" },
  { "pmName": "Eleena Bassam El-Sous", "address": "36 Munro Street, Sefton, NSW 2162" },
  { "pmName": "Mary Azzi", "address": "G03/106 Brancourt Avenue, Yagoona, NSW 2199" },
  { "pmName": "Farah Antown", "address": "42A Flinders Road, Georges Hall, NSW 2198" },
  { "pmName": "Eleena Bassam El-Sous", "address": "7/85-87 Chapel Road, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "15/31-33 Myrtle Road, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "7/32-34 Sixth Avenue, Campsie, NSW 2194" },
  { "pmName": "Anessa McGrath", "address": "303/11 Jacobs Street, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "29/14 Melanie Street, Yagoona, NSW 2199" },
  { "pmName": "Mary Azzi", "address": "102/37 Leonard Street, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "B204/40 Hoskins Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "90 Queen Street, Revesby, NSW 2212" },
  { "pmName": "Michelle Clay", "address": "666 Hume Highway, Yagoona, NSW 2199" },
  { "pmName": "Jessie Hodkinson", "address": "6/2-4 Mary Street, Wiley Park, NSW 2195" },
  { "pmName": "Jessie Hodkinson", "address": "33 Purvis Avenue, Potts Hill, NSW 2145" },
  { "pmName": "Mary Azzi", "address": "52/4 West Terrace, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "514/38 Kitchener Parade, Bankstown, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "9 Conjola Cres, Leumeah, NSW 2560" },
  { "pmName": "Jessie Hodkinson", "address": "17 Edward Street, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "3/8-10 Revesby Place, Revesby, NSW 2212" },
  { "pmName": "Eleena Bassam El-Sous", "address": "22 Polo Street, Revesby, NSW 2212" },
  { "pmName": "Eleena Bassam El-Sous", "address": "38 Yanderra Street, Condell Park, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "58/8 Myrtle Road, Bankstown, NSW 2200" },
  { "pmName": "Michelle Clay", "address": "407/25 Meredith Street, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "98 Campbell Hill Road, Chester Hill, NSW 2162" },
  { "pmName": "Mary Azzi", "address": "G02/106 Brancourt Avenue, Yagoona, NSW 2199" },
  { "pmName": "Anessa McGrath", "address": "7/2-4 Myrtle Road, Bankstown, NSW 2200" },
  { "pmName": "Jessie Hodkinson", "address": "A301/4 French Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "31 Brancourt Avenue, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "11 King Georges Road, Wiley Park, NSW 2195" },
  { "pmName": "Mary Azzi", "address": "4/14-16 Gordon Street, Bankstown, NSW 2200" },
  { "pmName": "Anessa McGrath", "address": "49 Lough Avenue, Guildford, NSW 2161" },
  { "pmName": "Mary Azzi", "address": "3 Hargreaves Street, Condell Park, NSW 2200" },
  { "pmName": "Farah Antown", "address": "12 Georges River Road, Croydon Park, NSW 2133" },
  { "pmName": "Farah Antown", "address": "59A Australia Street, Bass Hill, NSW 2197" },
  { "pmName": "Farah Antown", "address": "107 Auburn Road, Birrong, NSW 2143" },
  { "pmName": "Mary Azzi", "address": "35A Myall Street, Punchbowl, NSW 2196" },
  { "pmName": "Anessa McGrath", "address": "13 Stephenson Street, Birrong, NSW 2143" },
  { "pmName": "Farah Antown", "address": "23 Cairds Avenue, Bankstown, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "6/110 Lakemba Street, Lakemba, NSW 2195" },
  { "pmName": "Eleena Bassam El-Sous", "address": "2 Lambert Street, Yagoona, NSW 2199" },
  { "pmName": "Anessa McGrath", "address": "15a Gallipoli Street, Condell Park, NSW 2200" },
  { "pmName": "Mary Azzi", "address": "14/94 Brancourt Avenue, Yagoona, NSW 2199" },
  { "pmName": "Mary Azzi", "address": "205/106 Brancourt Avenue, Yagoona, NSW 2199" },
  { "pmName": "Jessie Hodkinson", "address": "A503/443 Chapel Road, Bankstown, NSW 2200" },
  { "pmName": "Farah Antown", "address": "12A Frank Street, Mount Lewis, NSW 2190" },
  { "pmName": "Michelle Clay", "address": "4/324 Hector Street, Bass Hill, NSW 2197" },
  { "pmName": "Eleena Bassam El-Sous", "address": "3 Cassia Place, Bass Hill, NSW 2197" },
  { "pmName": "Farah Antown", "address": "3A English Street, Revesby, NSW 2212" },
  { "pmName": "Jessie Hodkinson", "address": "10 Edgar St, Yagoona, NSW 2199" },
  { "pmName": "Matthew Natoli", "address": "32 Swan Circuit, Green Valley, NSW 2168" },
  { "pmName": "Farah Antown", "address": "18 Ridgeway Close, West Hoxton, NSW 2171" },
  { "pmName": "Matthew Natoli", "address": "374 Chapel Road, Bankstown, NSW 2200" },
];

async function lookupPropertyManager(query) {
  const q = (query || "").toLowerCase();

  const tokens = q.split(/[\s,]+/).filter(t => t.length > 1);

  let bestMatch = null;
  let bestScore = 0;

  for (const d of pmFallbackData) {
    const addressLower = (d.address || "").toLowerCase();
    const nameLower = (d.pmName || "").toLowerCase();

    // Exact substring match — highest priority, stop immediately
    if (addressLower.includes(q) || nameLower.includes(q)) {
      bestMatch = d;
      bestScore = 999;
      break;
    }

    // Token scoring — count how many query words appear in the address
    let score = 0;
    for (const token of tokens) {
      if (addressLower.includes(token)) score++;
    }

    // Require at least 2 matching tokens (or all tokens if query is only 1 word)
    if (score > bestScore && score >= Math.min(2, tokens.length)) {
      bestScore = score;
      bestMatch = d;
    }
  }

  if (bestMatch) {
    return {
      found: true,
      pmName: bestMatch.pmName,
      propertyAddress: bestMatch.address,
      source: "fallback"
    };
  } else {
    return {
      found: false,
      source: "fallback"
    };
  }
}

function getLookupPropertyManagerTool() {
  return {
    type: "function",
    name: "lookupPropertyManager",
    description: "Look up a property manager's name and property address by providing either a partial property address or property manager name.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The partial address or property manager name mentioned by the caller."
        }
      },
      required: ["query"]
    }
  };
}

async function handleLookupPropertyManager(sessionId, call) {
  const session = sessions.get(sessionId);
  if (!session) return;
  const callId = typeof call.call_id === "string" ? call.call_id : null;
  if (callId && session.processedCallIds.has(callId)) return;
  if (callId) session.processedCallIds.add(callId);

  try {
    const args = typeof call.arguments === "string" ? JSON.parse(call.arguments) : call.arguments;
    console.log(`[${sessionId}] Looking up property manager | query: ${args.query}`);

    const result = await lookupPropertyManager(args.query);
    console.log(`[${sessionId}] Lookup result:`, result);

    sendWsJson(session.ws, {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(result)
      }
    });
    session.isResponseActive = true;
    sendWsJson(session.ws, { type: "response.create" });
  } catch (err) {
    if (callId) session.processedCallIds.delete(callId);
    console.error(`[${sessionId}] Error looking up property manager:`, err);
  }
}

// ─── Transfer Call Tool ───────────────────────────────────
function getTransferCallTool() {
  return {
    type: "function",
    name: "transfer_call",
    description:
      "Transfer the current call to a human agent or department. Use this when the caller wants to speak to reception, a specific person, or needs assistance beyond what the AI can provide.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          enum: [
            "reception",
            "john",
            "afterhours",
            "anessa",
            "chelsea",
            "eleena",
            "ethan",
            "farah",
            "jessie",
            "mary",
            "matthew",
            "michelle",
            "noa",
            "zena",
            "charlie",
            "tony",
            "lynette",
            "guilda",
            "samantha",
            "codey",
            "anthony_r",
            "domenic",
            "brendon",
            "craig",
            "allan",
            "nikolas",
            "anthony_j",
            "johnny",
            "graeme",
            "tiago",
            "jordon",
            "joshua",
            "patrick_l",
            "charbel",
            "lillian",
            "patrick_s",
            "james_h",
            "james_d",
            "scott",
            "bill",
            "eli",
            "jeremiah",
            "anthony_c",
            "david",
            "christian"
          ],
          description:
            "Where to transfer the call. Use 'reception' for general enquiries, buying, selling, new landlords, application status, Directors, Sales Agents. " +
            "Use 'afterhours' ONLY for genuine out-of-hours emergencies (locked out, no hot water at night, safety risk). " +
            "If a PM cannot be identified during normal business hours, use 'reception' instead — never 'afterhours'. " +
            "Use the person's first name key when caller names a specific staff member or lookupPropertyManager returns their name. " +
            "CRITICAL: If a caller gives only a first name that belongs to multiple staff, ALWAYS ask for last name or department before transferring — never assume. " +
            "Multiple Anthonys: anthony_r=Anthony Roumanous, anthony_j=Anthony Jaja, anthony_c=Anthony Cham — ask which one before transferring. " +
            "Multiple Patricks: patrick_s=Patrick Sioud, patrick_l=Patrick Liu — ask which one before transferring. (Do not confuse Patrick Sioud with Charlie Sioud or Charbel Elias). " +
            "Multiple James: james_h=James Huang, james_d=James Duong — ask which one before transferring. " +
            "Key mapping — Property Managers: anessa=Anessa McGrath, chelsea=Chelsea Moussa, eleena=Eleena Bassam El-Sous, " +
            "ethan=Ethan Tran, farah=Farah Antown, jessie=Jessie Hodkinson, mary=Mary Azzi, " +
            "matthew=Matthew Natoli, michelle=Michelle Clay, noa=Noa Callus, zena=Zena Issa. " +
            "Key mapping — Sales & Directors: charlie=Charlie Sioud, tony=Tony Roumanous, jordon=Jordon Le Breux, joshua=Joshua Nassif. " +
            "Key mapping — Other Staff: lynette=Lynette Vazquez, guilda=Guilda Slan, samantha=Samantha Hanna, " +
            "codey=Codey Camilleri, anthony_r=Anthony Roumanous, domenic=Domenic Boustani, brendon=Brendon Abouchrouche, " +
            "craig=Craig Stephenson, allan=Allan Zeino, nikolas=Nikolas Papadopoulos, anthony_j=Anthony Jaja, " +
            "johnny=Johnny Nguyen, graeme=Graeme Rudder, tiago=Tiago Armaelo, patrick_l=Patrick Liu, " +
            "charbel=Charbel Elias, lillian=Lillian Bashir, patrick_s=Patrick Sioud, james_h=James Huang, " +
            "james_d=James Duong, scott=Scott Johansen-James, bill=Bill Hanna, eli=Eli Eid, " +
            "jeremiah=Jeremiah Shashati, anthony_c=Anthony Cham, david=David Avni, christian=Christian Alha. " +
            "Use 'john' only when caller explicitly asks for John.",
        },
        reason: {
          type: "string",
          description: "Brief reason for the transfer e.g. 'caller wants to buy property'",
        },
      },
      required: ["destination", "reason"],
    },
  };
}

async function handleTransferCall(sessionId, call) {
  const session = sessions.get(sessionId);
  if (!session) return;

  let args;
  try {
    args = typeof call.arguments === "string" ? JSON.parse(call.arguments) : call.arguments;
  } catch (e) {
    console.error("[Transfer] Failed to parse arguments", e);
    return;
  }

  const { destination, reason } = args;
  const callId = session.callId;

  console.log(
    `[Transfer] Initiating transfer | session=${sessionId} | destination=${destination} | reason=${reason}`
  );

  // Delay the transfer by 7 seconds to allow the AI's verbal acknowledgment to play over the audio socket before Asterisk redirects the call
  await new Promise((resolve) => setTimeout(resolve, 7000));

  try {
    const ariBase = process.env.ASTERISK_ARI_URL || "http://127.0.0.1:8088";
    const ariAuth =
      "Basic " +
      Buffer.from(`${process.env.ASTERISK_ARI_USER}:${process.env.ASTERISK_ARI_PASS}`).toString(
        "base64"
      );

    // Step 1 — Find the active Asterisk channel by matching AUDIOSOCKET_UUID
    const channelsRes = await fetch(`${ariBase}/ari/channels`, {
      headers: { Authorization: ariAuth },
    });
    const channels = await channelsRes.json();
    console.log("[Transfer] ARI channels response:", JSON.stringify(channels));

    if (!Array.isArray(channels)) {
      console.error("[Transfer] ARI did not return an array:", channels);
      return;
    }

    let targetChannel = null;
    for (const ch of channels) {
      // The UUID is embedded in app_data as "<UUID>,127.0.0.1:8090"
      const appData = ch?.dialplan?.app_data || "";
      if (appData.startsWith(callId)) {
        targetChannel = ch;
        break;
      }
    }

    if (!targetChannel) {
      console.error(`[Transfer] Could not find Asterisk channel for callId=${callId}`);
      return;
    }

    console.log(`[Transfer] Found channel: ${targetChannel.id}`);

    // Use AMI redirect — works on dialplan channels (AudioSocket is not Stasis)
    const net = require("net");

    const amiHost = "127.0.0.1";
    const amiPort = 5038;
    const amiUser = process.env.ASTERISK_AMI_USER || "tradie";
    const amiPass = process.env.ASTERISK_AMI_PASS || "change-me-now";

    await new Promise((resolve, reject) => {
      const client = net.createConnection(amiPort, amiHost);
      let buffer = "";
      let loggedIn = false;
      let redirectSent = false;

      client.on("data", (data) => {
        buffer += data.toString();

        if (!loggedIn && buffer.includes("Authentication accepted")) {
          loggedIn = true;
          buffer = "";
          const redirect = [
            "Action: Redirect",
            `Channel: ${targetChannel.name}`,
            `Context: raywhite-transfer`,
            `Exten: ${destination}`,
            `Priority: 1`,
            `ActionID: transfer-${Date.now()}`,
            "",
            ""
          ].join("\r\n");
          client.write(redirect);
          redirectSent = true;
        }

        if (redirectSent && buffer.includes("Response:")) {
          console.log(`[Transfer] AMI redirect response: ${buffer.trim()}`);
          client.end();
          resolve();
        }
      });

      client.on("connect", () => {
        const login = [
          "Action: Login",
          `Username: ${amiUser}`,
          `Secret: ${amiPass}`,
          "",
          ""
        ].join("\r\n");
        client.write(login);
      });

      client.on("error", (err) => {
        console.error("[Transfer] AMI connection error:", err);
        reject(err);
      });

      setTimeout(() => {
        client.destroy();
        resolve();
      }, 5000);
    });

    // Hang up AudioSocket so Asterisk proceeds to Dial after redirect
    const callEntry = telephonyCalls.get(callId);
    if (callEntry && callEntry.ctx) {
      console.log(`[Transfer] Hanging up AudioSocket for callId=${callId}`);
      callEntry.ctx.hangup();
    }
  } catch (err) {
    console.error("[Transfer] ARI call failed:", err);
  }
}

// ─── Handle function calls from OpenAI ────────────────────
async function handleFunctionCall(sessionId, eventOrItem) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const call = toFunctionCallPayload(eventOrItem);
  if (!call) return;

  if (call.name === "save_call_log") {
    await handleSaveCallLog(sessionId, call);
  } else if (call.name === "send_sms") {
    await handleSendSms(sessionId, call);
  } else if (call.name === "lookupPropertyManager") {
    await handleLookupPropertyManager(sessionId, call);
  } else if (call.name === "transfer_call") {
    const transferKey = `transfer_call`;
    if (session.processedCallIds.has(transferKey)) {
      console.log("[Transfer] Duplicate transfer ignored");
      return;
    }
    session.processedCallIds.add(transferKey);
    await handleTransferCall(sessionId, call);
  }
}

async function handleSaveCallLog(sessionId, call) {
  const session = sessions.get(sessionId);
  if (!session) return;

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

    if (!session.isResponseActive) {
      session.isResponseActive = true;
      sendWsJson(session.ws, { type: "response.create" });
    }
    session.onEvent({ type: "call-logged", data: args });
  } catch (err) {
    if (callId) session.processedCallIds.delete(callId);
    console.error(`[${sessionId}] Call log save failed:`, err.message);
  }
}

async function handleSendSms(sessionId, call) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const callId = typeof call.call_id === "string" ? call.call_id : null;

  if (callId && session.processedCallIds.has(callId)) return;
  if (callId) session.processedCallIds.add(callId);

  try {
    const args = JSON.parse(call.arguments);
    const note = args.note ? ` (${args.note})` : "";

    // Website URL is taken from AGENCY_WEBSITE_URL
    const websiteUrl = AGENCY_WEBSITE_URL;
    let messageBody = "";

    switch (args.message_type) {
      case "rental_listing":
        messageBody = `Hi from Ray White Bankstown. For details, photos, and to book an inspection${note}, please visit: ${websiteUrl}`;
        break;
      case "application_process":
        messageBody = `Hi from Ray White Bankstown. You can submit your rental application online through our secure portal here: ${websiteUrl}`;
        break;
      case "general_enquiry":
      default:
        messageBody = `Hi from Ray White Bankstown. For more information, please visit our website: ${websiteUrl}`;
        break;
    }

    console.log(`[${sessionId}] Sending SMS (${args.message_type}) to ${args.caller_phone}`);

    const result = await sendSms(args.caller_phone, messageBody);

    sendWsJson(session.ws, {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(
          result.success
            ? { success: true, message: "SMS texted to caller." }
            : { success: false, message: "Could not send the text — let the caller know and offer another way to help." }
        ),
      },
    });

    if (!session.isResponseActive) {
      session.isResponseActive = true;
      sendWsJson(session.ws, { type: "response.create" });
    }
    session.onEvent({ type: "sms-sent", data: { caller_phone: args.caller_phone, success: result.success } });
  } catch (err) {
    if (callId) session.processedCallIds.delete(callId);
    console.error(`[${sessionId}] send_sms failed:`, err.message);
  }
}

// ─── Event Hub — Process OpenAI Realtime events ───────────
async function handleTextDelta(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return;

  if (!session.textDeltaEventType) {
    session.textDeltaEventType = event.type;
  } else if (session.textDeltaEventType !== event.type) {
    return;
  }

  if (session.elevenLabsReady) {
    sendTextToElevenLabs(sessionId, event.delta);
  } else {
    session.textBuffer.push(event.delta);
  }
  session.onEvent({ type: "transcript-delta", delta: event.delta });
}

async function handleTextDone(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return;

  if (session.textDeltaEventType) {
    const expectedDoneType = session.textDeltaEventType.replace(".delta", ".done");
    if (expectedDoneType !== event.type) {
      return;
    }
  }

  flushElevenLabsStream(sessionId);
  session.onEvent({ type: "transcript-done", transcript: event.text });
}

async function handleRealtimeEvent(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return;

  switch (event.type) {
    case "session.created":
    case "session.updated":
      break;

    case "response.created":
      session.isResponseActive = true;
      session.currentResponseStartedAt = Date.now();
      if (!session.firstResponseCreatedMs) {
        session.firstResponseCreatedMs = Date.now();
      }
      openElevenLabsStream(sessionId);
      break;

    case "response.output_text.delta":
    case "response.text.delta":
      await handleTextDelta(sessionId, event);
      break;

    case "response.output_text.done":
    case "response.text.done":
      await handleTextDone(sessionId, event);
      break;

    case "response.done": {
      session.isResponseActive = false;
      session.currentResponseStartedAt = null;

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

    case "input_audio_buffer.speech_started": {
      const elapsedSinceResponseStart = session.currentResponseStartedAt
        ? Date.now() - session.currentResponseStartedAt
        : Infinity;

      if (session.isResponseActive && elapsedSinceResponseStart < BARGE_IN_GRACE_MS) {
        console.log(
          `[${sessionId}] Ignoring likely-echo speech_started (${elapsedSinceResponseStart}ms into response)`
        );
        break;
      }

      console.log(`[${sessionId}] User interrupted — stopping AI voice`);
      if (session.isResponseActive) {
        sendWsJson(session.ws, { type: "response.cancel" });
      }
      closeElevenLabsWs(sessionId);
      openElevenLabsStream(sessionId, true);
      session.onEvent({ type: "speech-started" });
      break;
    }

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
    } catch { }
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
      case "sms-sent":
        socket.emit("sms-sent", event.data);
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
// SOCKET.IO — Client Connection Handling (browser/softphone testing)
// ============================================================
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  const forwarder = buildEventForwarder(socket);

  startPrewarm(socket.id, forwarder).catch(() => { });

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
        } catch { }
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

// ============================================================
// TELEPHONY — 3CX (via Asterisk AudioSocket) Call Handling
// ============================================================
// Dialplan (extensions_raywhite.conf) hits this BEFORE calling
// AudioSocket(), so by the time onCallStart fires below, the context
// for this call (which DID/line it came in on) is already available.
const callContexts = new Map(); // callId (uuid) -> { did, label, extension, callerid }

app.get("/api/telephony/register-call", (req, res) => {
  const { uuid, did, label, extension, callerid } = req.query;
  if (!uuid) {
    return res.status(400).json({ success: false, error: "uuid is required" });
  }
  // Normalise callerid: ensure it always has a leading +
  // Asterisk/3CX sends numbers like 923092836265 (no +)
  let normalisedCallerid = null;
  if (callerid) {
    const digits = String(callerid).replace(/\s+/g, "").replace(/^\+/, "");
    normalisedCallerid = "+" + digits;
  }

  callContexts.set(uuid, {
    did: did || null,
    label: label || null,
    extension: extension || null,
    callerid: normalisedCallerid,
    registeredAt: Date.now(),
  });
  console.log(
    `[Telephony] Registered call ${uuid} — line "${label || "unknown"}" (DID ${did || "n/a"}, ext ${extension || "n/a"}), caller ${callerid || "unknown"}`
  );
  res.json({ success: true });
});

const telephonyCalls = new Map(); // callId -> { ctx, sessionId }

startAudioSocketServer({
  onCallStart: (callId, ctx) => {
    const sessionId = `tel-${callId}`;
    const callContext = callContexts.get(callId) || {};
    telephonyCalls.set(callId, { ctx, sessionId, callContext });

    // Give the AI a heads-up about which line this call landed on. It's
    // appended to the standard system prompt, not a replacement for it —
    // the call flow, tools, and hard rules above still apply as-is.

    // const extraInstructions = callContext.label
    //   ? `=============================================================
    // CALL CONTEXT — TELEPHONY LINE INFO
    // =============================================================
    // This call arrived via 3CX/Asterisk on the "${callContext.label}" line` +
    //   (callContext.extension ? ` (internal extension ${callContext.extension})` : "") +
    //   (callContext.did ? `, DID ${callContext.did}` : "") +
    //   `. Treat this the same as any inbound call to the front desk unless
    // you're told otherwise for this specific line — this is currently just
    // routing metadata for logging/testing, not a behavioural instruction.`
    //   : "";

    const extraInstructions = `=============================================================
CALL CONTEXT — TELEPHONY LINE INFO
=============================================================
This call arrived via 3CX/Asterisk on the "${callContext.label || "unknown"}" line` +
      (callContext.extension ? ` (internal extension ${callContext.extension})` : "") +
      (callContext.did ? `, DID ${callContext.did}` : "") +
      `.` +
      (callContext.callerid ? `

=============================================================
CALLER METADATA — PHONE NUMBER FROM NETWORK
=============================================================
The telephone network has identified the caller's number as: ${callContext.callerid}
This is the number they are physically calling FROM.

IMPORTANT — USE THIS NUMBER SMARTLY:
- When the conversation reaches the point of collecting a phone number for SMS,
  do NOT ask them to recite their number first.
- Instead, ask: "Would you like me to send that to the number you're calling from?"
- If they say YES: use ${callContext.callerid} as caller_phone in send_sms — no further
  number collection needed.
- If they say NO or want a different number: THEN ask them to provide a number,
  and follow the existing number collection flow (read back, confirm, etc.).
- When reading the number back to confirm, say it naturally digit by digit —
  do NOT say "plus" or announce the country code prefix robotically.
  e.g. for +61404838242 say: "six one four, zero four zero, four eight three, eight two four two."
- The sendSms function already handles the + prefix, so pass ${callContext.callerid} as-is.
` : `

No caller ID was passed by the network for this call. Follow the standard number
collection flow — ask them to provide their number, read it back, and confirm.
`);

    const forwarder = (event) => {
      switch (event.type) {
        case "audio-delta": {
          // event.delta is base64 PCM16 @ 16kHz from ElevenLabs
          const pcm16k = Buffer.from(event.delta, "base64");
          ctx.pushOutboundPcm16k(pcm16k);
          break;
        }
        case "speech-started":
          // Caller barged in — drop whatever TTS audio is still queued
          ctx.clearOutbound();
          break;
        case "session-closed":
        case "error":
          ctx.hangup();
          break;
        default:
          // call-logged, sms-sent, transcript-*, user-transcript, recording-saved
          // all still fire — useful if you want to pipe these to a dashboard too.
          break;
      }
    };

    createRealtimeSession(sessionId, forwarder, extraInstructions)
      .then(() => triggerGreeting(sessionId))
      .catch((err) => {
        console.error(`[${sessionId}] Telephony session failed:`, err.message);
        ctx.hangup();
      });
  },

  onAudio: (callId, base64Pcm24k) => {
    const entry = telephonyCalls.get(callId);
    if (!entry) return;
    sendAudio(entry.sessionId, base64Pcm24k);
  },

  onCallEnd: (callId) => {
    const entry = telephonyCalls.get(callId);
    if (!entry) return;
    closeSession(entry.sessionId);
    telephonyCalls.delete(callId);
    callContexts.delete(callId);
  },
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
║   Routing: Tenant→PM · Buyer/Sales→Agent · New Landlord→Office║
║   Escalation: Complaints · Legal · Abusive → Human            ║
║                                                              ║
║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
║   Recordings Dir:  ${RECORDINGS_DIR}                         ║
║   MongoDB:         ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
║   MobileMessage:   ${MOBILEMESSAGE_USERNAME && MOBILEMESSAGE_PASSWORD ? "✓ Set" : "✗ Simulated (log only)"}                ║
║   Office Number:   ${OFFICE_MAIN_NUMBER || "not configured"}                          ║
║   Telephony:       AudioSocket bridge on 127.0.0.1:8090       ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
