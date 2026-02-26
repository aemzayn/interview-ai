# Interview AI

AI-powered interview training platform. Upload your CV, choose an interview mode, and practice with a personalised AI interviewer via camera and microphone. Receive a scored report with detailed feedback after every session.

---

## Features

- **CV-personalised questions** — AI parses your CV and generates questions specific to your experience and skills
- **5 interview modes** — Behavioral, Technical, System Design, Mixed, HR
- **Live voice interview** — AI reads questions aloud (TTS); you answer with your microphone (STT)
- **2-minute thinking timer** — After each question you get thinking time before the mic opens
- **Real-time transcript** — Your spoken answer appears on screen as you speak
- **Scored report** — Overall score (0–100), grade, per-category breakdown, per-answer feedback
- **Optional accounts** — Sign up to save all past sessions and get an AI coaching overview on your dashboard
- **Dual AI provider** — Switch between Claude (default) and GPT-4o with one env var

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand |
| Backend | Python 3.12+, FastAPI, pydantic-settings |
| AI (Claude) | `claude-sonnet-4-6` via Anthropic SDK |
| AI (OpenAI) | `gpt-4o` via OpenAI SDK |
| CV Parsing | pdfminer.six (PDF), python-docx (DOCX) |
| Voice | Web Speech API (STT), SpeechSynthesis API (TTS) — browser-native |
| Auth | JWT (python-jose) + bcrypt |

---

## Project Structure

```
interview-ai/
├── .env.example
├── docker-compose.yml
├── Makefile
├── frontend/                        # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Landing
│       │   ├── setup/               # 3-step setup (CV upload → mode → launch)
│       │   ├── interview/[sessionId]/
│       │   ├── results/[sessionId]/
│       │   └── dashboard/           # User history + AI coaching overview
│       ├── components/
│       │   ├── ui/                  # Button, Card, Badge, Modal, Progress, Spinner
│       │   ├── auth/                # AuthModal
│       │   ├── layout/              # Header
│       │   ├── interview/           # CameraFeed, AIAvatar, TranscriptPanel,
│       │   │                        #   ThinkingCountdown, MicButton, QuestionDisplay
│       │   └── results/             # ScoreRing, CategoryBreakdown, AnswerReview,
│       │                            #   ImprovementTips
│       ├── context/
│       │   ├── InterviewContext.tsx # Zustand store
│       │   └── AuthContext.tsx      # Auth state + JWT management
│       ├── hooks/
│       │   ├── useCamera.ts
│       │   ├── useSpeechRecognition.ts
│       │   ├── useTTS.ts
│       │   └── useInterviewSession.ts
│       └── lib/
│           ├── api.ts               # Typed fetch client
│           ├── constants.ts
│           └── utils.ts
└── backend/                         # FastAPI
    ├── main.py
    └── app/
        ├── config.py
        ├── auth/jwt_utils.py
        ├── routers/                 # cv, interview, auth, users
        ├── services/                # cv_parser, session_store, user_store, evaluator
        ├── ai/                      # base, claude_provider, openai_provider, factory
        ├── models/                  # cv, interview, results, user
        └── prompts/                 # question_prompts, evaluation_prompts
```

---

## Quick Start

### 1. Clone and configure

```bash
git clone <repo-url>
cd interview-ai
make setup-env        # copies .env.example → .env, backend/.env, frontend/.env.local
```

Edit `.env` and set your API key:

```env
AI_PROVIDER=claude          # or "openai"
ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...     # if using openai
```

### 2. Install dependencies

```bash
make install          # pip install + npm install
```

### 3. Run in development

```bash
make dev              # starts backend :8000 and frontend :3000 in parallel
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AI_PROVIDER` | `claude` | `claude` or `openai` |
| `ANTHROPIC_API_KEY` | — | Required when `AI_PROVIDER=claude` |
| `OPENAI_API_KEY` | — | Required when `AI_PROVIDER=openai` |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | Claude model ID |
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model ID |
| `JWT_SECRET_KEY` | *(dev default)* | Change in production |
| `NEXT_PUBLIC_API_URL` | *(empty)* | Set in prod if backend is on a different domain |
| `BACKEND_URL` | `http://localhost:8000` | Next.js rewrite target (server-side only) |

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{status, ai_provider, model}` |
| `POST` | `/api/cv/upload` | Multipart CV upload → `CVUploadResponse` |
| `POST` | `/api/interview/start` | Start session → first question + session_id |
| `POST` | `/api/interview/respond` | Submit answer → next question or `is_final: true` |
| `POST` | `/api/interview/end` | Trigger async evaluation |
| `GET` | `/api/interview/{id}/results` | 202 while evaluating; 200 with results when ready |
| `POST` | `/api/auth/register` | Register → JWT + user |
| `POST` | `/api/auth/login` | Login → JWT + user |
| `GET` | `/api/auth/me` | Current user (requires Bearer token) |
| `GET` | `/api/users/me/history` | Past session summaries |
| `GET` | `/api/users/me/overview` | Stats + AI coaching recommendation |

---

## Make Commands

```bash
make dev             # start both services
make dev-backend     # backend only
make dev-frontend    # frontend only
make install         # install all deps
make docker-up       # run with Docker Compose
make health          # curl /health and pretty-print
make test-cv CV_PATH=my_cv.pdf   # test CV parsing
make setup-env       # create .env files from example
```

---

## Docker

```bash
make docker-up       # builds and starts both containers
make docker-down     # stop
```

---

## How It Works

1. **CV Upload** — PDF/DOCX is parsed to text; AI extracts a structured profile (name, role, skills, experience). A short-lived token is returned instead of embedding the full profile in every request.

2. **Question Generation** — On session start, the AI generates a personalised question bank tailored to the CV and selected mode/difficulty.

3. **Live Interview Loop**
   - AI reads the question aloud via browser TTS
   - A 2-minute thinking countdown runs (mic is off)
   - User clicks "I'm ready" (or timer ends) → mic opens
   - Browser STT streams text in real time; final segments are committed to the answer buffer
   - User clicks submit → answer POSTed to backend → next question spoken, or session ends

4. **Evaluation** — All answers are evaluated concurrently by the AI. An overall report is generated with scores, grade, category breakdown, strengths, and improvement tips.

5. **Dashboard** — Authenticated users see all past results and an AI-generated coaching summary across their full history.

---

## Browser Requirements

Voice features require a modern Chromium-based browser (Chrome, Edge, Arc). Firefox has limited Web Speech API support. Safari requires enabling the feature flag.

Camera access requires HTTPS in production (localhost is exempt).
