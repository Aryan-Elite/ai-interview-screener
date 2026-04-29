# CueTalent — AI Tutor Screener

Replaces the first-round human screening call for tutor hiring. A candidate has a ~6-minute voice conversation with an AI, and the system produces a scored report. Admins review, optionally override, and release results — no human needed in the first pass.

## How It Works

1. Candidate signs up, picks a grade range (1–5 / 3–8 / 9–12), and completes the voice interview
2. AI scores the conversation across 5 dimensions and generates a recommendation
3. Admin reviews the transcript + scores, can override the AI decision
4. Admin releases the result; candidate logs in to see their scores and feedback

---

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 15, Tailwind CSS 4, shadcn/ui |
| Backend | Express.js + TypeScript, MongoDB + Mongoose, JWT |
| AI / Audio | OpenAI GPT-4o-mini (chat), GPT-4o (assessment), OpenAI TTS + STT, Speechmatics WebSocket STT |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas |

---

## Project Structure

```
backend/src/
├── controllers/     # Route handlers (admin, assess, auth, chat, interview, template)
├── middleware/      # errorHandler, requireAdmin, requireCandidate
├── models/          # Admin, Assessment, Candidate, Interview, Template
├── prompts/         # interviewer.ts, assessment.ts
├── routes/          # One file per feature
└── index.ts         # Express app entry point

frontend/
├── app/
│   ├── page.tsx                  # Landing / signup
│   ├── interview/[id]/           # Live interview UI
│   ├── report/[id]/              # Post-interview screen
│   ├── candidate/                # login, result
│   └── admin/                   # login, dashboard, candidate/[id], templates
└── lib/api.ts                    # All backend calls (single source of truth for API URL)
```

---

## Local Setup

**Prerequisites:** Node.js 18+

```bash
git clone <repo-url>
```

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
OPENAI_API_KEY=
OPENAI_MODEL_CHAT=gpt-4o-mini
OPENAI_MODEL_ASSESS=gpt-4o
OPENAI_MODEL_STT=gpt-4o-transcribe
OPENAI_MODEL_TTS=gpt-4o-mini-tts
SPEECHMATICS_API_KEY=
MONGODB_URI=
PORT=5000
JWT_SECRET=
```

```bash
npm run dev     # ts-node-dev, hot reload
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
npm run dev     # http://localhost:3000
```

---

## Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL_CHAT` | Model for interview chat (default: `gpt-4o-mini`) |
| `OPENAI_MODEL_ASSESS` | Model for assessment generation (default: `gpt-4o`) |
| `OPENAI_MODEL_STT` | Model for speech-to-text |
| `OPENAI_MODEL_TTS` | Model for text-to-speech |
| `SPEECHMATICS_API_KEY` | Speechmatics key for browser-side WebSocket STT |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PORT` | Server port (default: 5000) |
| `JWT_SECRET` | Secret for signing JWTs (generate a random 64-char hex string) |

### Frontend

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (`http://localhost:5000` for dev, deployed URL for prod) |

---

## API Endpoints

All routes are prefixed with `/api`.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/admin/login` | Admin login — accepts `{ email }`, creates account on first login (must be `@cuemath.com`) |
| `POST` | `/auth/candidate/signup` | Candidate registration — `{ name, email, password }` |
| `POST` | `/auth/candidate/login` | Candidate login |

### Interview

| Method | Path | Description |
|---|---|---|
| `POST` | `/interview` | Create interview session, returns first question + TTS audio |
| `POST` | `/chat` | Send candidate transcript, get AI reply + audio. Pass `elapsedSeconds`; at 300s AI shifts to wrap-up |
| `POST` | `/assess` | Generate final assessment from completed interview |
| `GET` | `/report/:id` | Fetch stored interview + assessment |
| `GET` | `/stt-token` | Get Speechmatics JWT for browser-side STT |

### Candidate (requires candidate JWT)

| Method | Path | Description |
|---|---|---|
| `GET` | `/candidate/result` | Get own assessment result (only if admin has released it) |
| `POST` | `/candidate/retake` | Create fresh interview (allowed once, only if rejected) |

### Admin (requires admin JWT)

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/assessments` | List all assessments; filter by `?recommendation=` |
| `GET` | `/admin/assessments/:id` | Get assessment detail + full transcript |
| `POST` | `/admin/assessments/:id/release` | Toggle result visibility to candidate |
| `POST` | `/admin/assessments/:id/vote` | Cast vote — `{ vote: "move_forward" \| "rejected" }` |
| `DELETE` | `/admin/assessments/:id` | Delete assessment + associated interview |

### Templates (requires admin JWT)

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/templates` | List all grade-range templates |
| `POST` | `/admin/templates/:range` | Create/update template for a grade range (`1-5`, `3-8`, `9-12`) |
| `POST` | `/admin/templates/:range/toggle` | Activate/deactivate a template |

---

## Key Design Decisions

- **Speechmatics over Whisper for STT:** Speechmatics WebSocket streams partial transcripts in real time (~500ms latency). Whisper is batch-only; unacceptable for a live conversation loop.
- **Wrap-up as a separate LLM call:** At 5-minute mark the backend makes a dedicated wrap-up prompt call instead of appending a suffix to the main prompt. Cleaner and more reliable closing behavior.
- **Prompts in separate files** (`src/prompts/`): Keeps controllers thin and makes prompt iteration easy without touching business logic.
- **Service layer** (`src/services/llm.ts`, `tts.ts`, `stt.ts`): All external provider calls are isolated so any provider can be swapped without touching controllers.
- **Overall score computed in code:** Each dimension score comes from the LLM; the overall is a weighted average computed in the controller, not asked of the LLM.

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Backend | Render (free tier) | Set all `backend/.env` vars in Render dashboard |
| Frontend | Vercel | Set `NEXT_PUBLIC_API_URL` to the Render backend URL |
| Database | MongoDB Atlas | Free tier sufficient for dev/demo |
