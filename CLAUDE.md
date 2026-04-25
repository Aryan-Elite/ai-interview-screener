# Cuemath Build Challenge — AI Tutor Screener

## What this is
An AI voice interviewer that screens tutor candidates for Cuemath.
Candidate speaks answers → AI asks follow-up questions → generates structured assessment report.

## Architecture
- Backend: Express + TypeScript → runs on port 5000 → deploys to Render
- Frontend: Next.js + TypeScript → runs on port 3000 → deploys to Vercel
- Frontend calls backend via NEXT_PUBLIC_API_URL env variable

## Backend endpoints
- POST /api/interview → creates a new interview session, returns interview ID
- POST /api/chat → takes conversation messages → returns AI response + audio
- POST /api/assess → takes full transcript → returns structured assessment JSON
- GET /api/report/:id → fetches stored interview + assessment by ID

## Rules
- OPENAI_API_KEY lives only in backend/.env — never in frontend
- All OpenAI API calls go through backend controllers only — never from browser
- Keep code simple, no over-engineering
- No hardcoded API keys anywhere in code

## Function Size Rules
- No function should exceed 20 lines — hard rule
- If a function exceeds 20 lines, break it into sub-functions
- Sub-functions must not exceed 25 lines — absolute maximum
- One function = one job. If you find yourself writing "and" to describe what a function does, split it

## Decoupling Rules (Critical)
The app must be wired so that swapping any model or service requires changing ONLY ONE file:
- All Claude/LLM calls → isolated in `backend/src/services/llm.ts`
- All STT calls → isolated in `backend/src/services/stt.ts`
- All TTS calls (if any) → isolated in `backend/src/services/tts.ts`
- Controllers never call external APIs directly — always go through services/
- If tomorrow we swap Speechmatics for Whisper → only stt.ts changes, nothing else
- If tomorrow we swap Claude for Gemini → only llm.ts changes, nothing else

## Code Quality Standards
- Write clean, readable code — variable and function names must be self-explanatory
- Every Express route must have proper error handling (try/catch + meaningful error response)
- Use structured logging throughout the backend:
  - Log every incoming request (method, path, timestamp)
  - Log every Claude API call (prompt summary, response time)
  - Log every error with full context (route, input, error message)
  - Use a consistent log format: { timestamp, level, message, data }
- Return consistent error response shapes from all API routes:
  { success: false, error: string, code?: string }
- Return consistent success response shapes:
  { success: true, data: any }
- Validate all incoming request bodies before processing — return 400 for bad input
- Never let an unhandled error crash the Express server

## Keeping Docs in Sync
Whenever a design decision changes from the currently implemented approach — timer logic, API shape, prompt strategy, file structure, anything — update ALL relevant .md files in the codebase before considering the task done:
- `CLAUDE.md` — if architecture, rules, or behavior changes
- `context/decisions.md` — log the new decision and why the old approach was replaced
- `context/project-brief.md` — if the overall feature set or flow changes
- `context/submission.md` — if a checklist item is affected

Do not leave any .md file describing behavior that no longer matches the code.

## Context Folder — Keep It Updated
Whenever something important happens during this project, update the context/ folder:
- Made a new decision? Add a row to context/decisions.md
- Hit an interesting bug or challenge? Note it in context/decisions.md
- Architecture changed? Update CLAUDE.md and context/project-brief.md
- Completed a submission checklist item? Tick it in context/submission.md

The context folder is the project's living memory. Keep it current.

## Tech
- OpenAI model: read from process.env.OPENAI_MODEL_CHAT / OPENAI_MODEL_ASSESS (never hardcode)
- OpenAI SDK: openai
- STT: Speechmatics streaming WebSocket API
- TTS: OpenAI TTS (backend service, returns base64 MP3 → frontend plays via Audio API)
- Database: MongoDB Atlas (mongoose)

## Cuemath's Current UI — Reference (from actual screenshots)
Build your UI to match this structure and beat it on features:

### Pipeline header (show at top of screen)
Signup ✓ → Application ✓ → AI Screening (current) → Math Test → Interview → Shortlisting

### Pre-interview screen (show before starting)
- Title: "AI Voice Screening"
- "What to Expect" section:
  - A 6-minute voice conversation
  - Evaluated on fluency, pronunciation, grammar, vocabulary, communication
  - Results available immediately after the call
- "Best Practices" section:
  - Quiet environment, no background noise
  - Use headphones for best audio quality
  - Speak clearly and at a natural pace
  - Allow microphone access when prompted
- "Start Screening" button

### Interview screen
- Timer: 06:00 countdown (visual reference only — no hard cutoff)
- Large microphone button (circular, centered)
- Live transcript shown below mic (YOUR ADDITION — they don't have this)
- Current question shown clearly above mic button
- Grade range shown (collected before interview starts)

### What YOUR build adds over theirs
- Live transcript visible on screen as candidate speaks
- Grade-adaptive questions (different for 1-5, 3-8, 9-12)
- Natural AI follow-ups based on answers
- Richer assessment: 5 dimensions with quotes as evidence

## Interview Design (Critical — read carefully)
This is NOT a math knowledge test. It evaluates soft skills only:
- Communication clarity
- Patience and warmth
- Ability to simplify complex ideas
- Right temperament for teaching kids
- English fluency

### The conversation must feel natural, not robotic
- Listen, respond, adapt based on the answer
- Follow up on vague or one-word answers
- Keep it flowing like a real conversation

### Sample questions that reveal tutoring ability
- "Explain fractions to a 9-year-old"
- "A student says they don't understand — they've been staring at the problem for 5 minutes. What do you do?"
- "How do you keep a distracted child engaged?"
- "A parent complains their child isn't improving. How do you respond?"

### Assessment rubric (after conversation ends)
Evaluate on 5 dimensions, each with a score + specific quotes as evidence:
1. Clarity — does the candidate explain things simply and precisely?
2. Warmth — do they sound encouraging and kind?
3. Simplicity — can they break down complex ideas for a child?
4. Patience — how do they handle confusion or frustration?
5. Fluency — is their English clear and confident?
Final output: score per dimension + recommendation (Move Forward / Hold)

### Timer Logic (Critical — implement exactly this)
- Candidate sees: 06:00 timer counting down. Nothing else.
- At 5 min elapsed: backend silently shifts AI to wrap-up mode. No banner. No visual change.
- AI captures the next candidate response as the LAST response (candidate may finish speaking slightly past 5 min — that's fine, we wait for them to finish)
- AI closes naturally: "Thank you so much, it was great speaking with you..."
- Backend signals `isClosing: true` in the chat response when wrap-up is triggered
- Frontend shows "Wrapping up your session..." while closing audio plays — no abrupt cutoff
- Session ends naturally when closing audio finishes, then report is generated
- No hard time cutoffs — session length is driven by the AI's natural closing, not a timer kill switch

### Edge cases to handle
- One-word answers → follow up, ask them to elaborate
- Long tangents → gently redirect back to the question
- Choppy audio / unclear transcript → ask them to repeat
- Silence → prompt them to take their time and respond

### Candidate experience
This may be the candidate's first interaction with Cuemath.
The tone must be professional, welcoming, and fair at all times.

## Frontend API Convention
All backend API calls in the frontend must go through a single file: `frontend/lib/api.ts`

- This file is the only place where `NEXT_PUBLIC_API_URL` is referenced
- Every backend endpoint gets its own exported async function in this file
- Components never call `fetch` directly — they always import from `lib/api.ts`
- Example structure:

```ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function sendMessage(messages: Message[]) {
  const res = await fetch(`${BASE_URL}/api/chat`, { ... })
  return res.json()
}

export async function getAssessment(transcript: string) {
  const res = await fetch(`${BASE_URL}/api/assess`, { ... })
  return res.json()
}
```

- When a new backend endpoint is added, its corresponding function must be added to `lib/api.ts` first before using it anywhere in the UI

## Key files
- backend/src/index.ts — Express app entry point
- backend/src/routes/interview.ts — POST /api/interview
- backend/src/routes/chat.ts — POST /api/chat
- backend/src/routes/assess.ts — POST /api/assess
- backend/src/routes/report.ts — GET /api/report/:id
- backend/src/controllers/interviewController.ts — interview session creation
- backend/src/controllers/chatController.ts — conversation logic (no direct API calls)
- backend/src/controllers/assessController.ts — assessment logic (no direct API calls)
- backend/src/services/llm.ts — ALL OpenAI chat/assessment calls live here only
- backend/src/services/tts.ts — ALL OpenAI TTS calls live here only
- backend/src/services/stt.ts — ALL Speechmatics/STT calls live here only
- backend/src/models/Interview.ts — MongoDB schema
- backend/src/prompts/interviewer.ts — interviewer & wrap-up prompts
- backend/src/prompts/assessment.ts — assessment evaluation prompt
- frontend/lib/api.ts — ALL backend API calls from frontend live here only
- frontend/lib/stt/speechmatics.ts — Speechmatics STT WebSocket client
- frontend/app/page.tsx — landing page (name + grade selection)
- frontend/app/interview/[id]/page.tsx — interview UI (voice + live transcript)
- frontend/app/report/[id]/page.tsx — report display UI
