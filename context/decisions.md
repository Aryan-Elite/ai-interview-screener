# Key Decisions

| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-24 | Chose Problem 3 (AI Tutor Screener) | Solves Cuemath's own pain, impressive voice demo, backend-heavy |
| 2026-04-24 | Separate Express backend + Next.js frontend | Aryan more familiar with Express, cleaner separation |
| 2026-04-24 | Browser Web Speech API over Whisper | Free, no extra API key, sufficient for MVP |
| 2026-04-24 | claude-sonnet-4-6 for both chat + assessment | Best balance of speed and quality |
| 2026-04-24 | Deploy backend to Render, frontend to Vercel | Both free tiers, Vercel is Next.js native |
| 2026-04-24 | Database: MongoDB Atlas | Document-based, perfect fit for interview sessions + conversation history as JSON, free tier |
| 2026-04-24 | LLM: OpenAI API | Pay-as-you-go, model read from OPENAI_MODEL_CHAT / OPENAI_MODEL_ASSESS env vars so we can swap without code changes |
| 2026-04-24 | STT: Speechmatics | Cross-browser support, 500ms-1.5s latency, 8hrs free/month |
| 2026-04-25 | TTS: OpenAI TTS (backend) | Browser SpeechSynthesis was inconsistent across devices. Backend calls OpenAI TTS, returns base64 MP3, frontend plays via Audio API |
| 2026-04-25 | No SSE — plain JSON responses | SSE added complexity with no real benefit for this use case; full response arrives fast enough as JSON |
| 2026-04-24 | Timer: no hard cutoff, natural close after 5 min | Candidate sees a 6-min countdown (visual only). At 5 min elapsed: if candidate's next response arrives, AI closes naturally via dedicated wrap-up call. No hard stop at any point — session ends when AI finishes its closing. No banner shown to candidate. |
| 2026-04-25 | Wrap-up is a separate LLM call, not a suffix on getChatReply | Appending a suffix caused the model to still ask questions (hallucination). Dedicated getWrapUpMessage() with focused prompt and candidate's name — cleaner, more reliable. |
| 2026-04-25 | overall score computed in code, not by OpenAI | OpenAI hallucinated overall: 9 when individual scores averaged 1.8. Now we compute average of 5 dimension scores ourselves in assessController.ts — deterministic and correct. |
| 2026-04-25 | Pre-interview mic setup screen added | getUserMedia failures were silent — candidate stuck in infinite listening state. Now: device selection + real voice detection (AnalyserNode) before interview starts. Session only begins with verified mic. |
| 2026-04-25 | Prompts extracted to backend/src/prompts/ directory | Prompts were embedded in llm.ts mixed with API logic. Now each prompt lives in its own file named by purpose: interviewer.ts, assessment.ts. |
| 2026-04-25 | Separate Assessment Mongoose model (decoupled from Interview) | Storing assessment results in a dedicated model makes it easier to query, release, and vote on results independently from the conversation history. |
| 2026-04-25 | Candidate auth added (signup/login, JWT) | Candidates need a persistent account to view their own result after it is released by an admin. Auth prevents one candidate from seeing another's report. |
| 2026-04-25 | Admin dashboard + voting system added | Admins need to review AI-generated assessments before releasing results. Voting UI lets multiple admins weigh in; release toggle controls when the candidate can see the outcome. |
| 2026-04-25 | Template system added (custom instructions + criteria per gradeRange) | Admins can tailor the interview prompt and assessment criteria per grade range (1-5, 3-8, 9-12) through the UI without any code changes. |
| 2026-04-29 | "Hold" renamed to "Rejected" throughout (DB schema, prompts, frontend) | Clearer language — no ambiguity about candidate outcome. Both enum values and display labels updated. |
| 2026-04-29 | `adminDecision` field added to Assessment | Admin vote now sets `adminDecision` and overrides AI recommendation for dashboard tab placement. AI's original `recommendation` stays untouched as audit trail. |
| 2026-04-29 | Retake flow: rejected candidates can retake once | Single retry improves fairness. `retakeCount` on Candidate model enforces the limit. Retake creates a fresh Interview doc; old assessment stays orphaned. |
| 2026-04-29 | Rejected candidates see scores + AI improvement tips | Transparency — candidates know why they weren't selected. `recommendations[]` added to Assessment model and returned by `/api/candidate/result` when released + Rejected. |
| 2026-04-29 | AI greets candidate by name and asks for intro first | More natural conversation opening. `candidateName` passed into `getFirstQuestion()` and injected into the opening prompt. |
| 2026-04-29 | Project renamed VoiceScreen → CueTalent | More on-brand for a Cuemath hiring product. Updated across all frontend UI files and browser tab title. |
