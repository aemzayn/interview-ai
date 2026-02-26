# AGENTS.md — Codebase Guide for AI Agents

This file describes the architecture, conventions, and critical patterns for AI agents working on this codebase. Read it before making any changes.

---

## Repository Layout

```
interview-ai/
├── backend/        Python FastAPI — all AI logic, CV parsing, session management
└── frontend/       Next.js 14 App Router — UI, voice, state management
```

Both services are developed and run independently. The frontend proxies `/api/*` to the backend via Next.js rewrites (configured in `frontend/next.config.mjs`).

---

## Running the Project

```bash
# Install deps
make install

# Start both services (backend :8000, frontend :3000)
make dev

# Verify backend is alive
make health          # → {"status": "ok", "ai_provider": "claude", ...}

# Test CV parsing end-to-end
make test-cv CV_PATH=path/to/cv.pdf
```

The backend requires a `.env` file at `backend/.env` (or the project root `.env`). Copy from `.env.example` and fill in your API key before running.

---

## Backend Architecture

### Entry point
`backend/main.py` — creates the FastAPI app, registers CORS middleware, mounts all four routers.

### Configuration
`backend/app/config.py` — pydantic-settings `Settings` class with `extra="ignore"` so frontend-only env vars (e.g. `NEXT_PUBLIC_*`) are silently skipped.

### AI Provider Layer
The AI abstraction is the most important architectural element:

```
app/ai/base.py          — AIProvider ABC (4 async methods)
app/ai/claude_provider.py
app/ai/openai_provider.py
app/ai/factory.py       — get_ai_provider() lru_cache singleton
```

**Never call Anthropic/OpenAI SDKs directly outside this layer.** All AI calls go through `get_ai_provider()`. Switch providers with `AI_PROVIDER=openai` env var.

The four provider methods:
| Method | Input | Output |
|---|---|---|
| `extract_cv_profile(raw_text)` | str | `CVProfile` |
| `generate_questions(cv_profile, mode, difficulty, count)` | — | `list[Question]` |
| `evaluate_answer(question, answer, mode, cv_profile)` | — | `AnswerScore` |
| `generate_overall_feedback(answer_scores, cv_profile, mode, session_id)` | — | `InterviewResults` |

All provider methods return structured Pydantic models by parsing JSON responses from the LLM. All prompts instruct the model to return **only valid JSON with no markdown fences**.

### Prompts
`backend/app/prompts/question_prompts.py` — question generation and per-answer evaluation prompts
`backend/app/prompts/evaluation_prompts.py` — overall feedback, CV extraction, and AI overview prompts

When modifying prompts: always end with `"Return ONLY valid JSON. No markdown fences."` The providers parse responses with `json.loads()` — any non-JSON output will raise.

### Data Stores (in-memory)
Both stores are module-level singletons with no external database.

**SessionStore** (`app/services/session_store.py`)
- CV profiles: 30-minute TTL (keyed by UUID token)
- Interview sessions: 2-hour TTL
- Interview results: no TTL (needed for results page polling)

**UserStore** (`app/services/user_store.py`)
- Users: no TTL (persists for process lifetime)
- Interview history per user: no TTL
- Data is lost on process restart — acceptable for a prototype

### CV Session Token Pattern
`POST /api/cv/upload` stores the `CVProfile` and returns a short UUID token.
`POST /api/interview/start` exchanges the token for the stored profile.
This avoids re-sending the full CV JSON on every start request.

### Background Evaluation
`POST /api/interview/end` immediately returns 200 and schedules `_run_evaluation` as a FastAPI `BackgroundTask`. The frontend polls `GET /api/interview/{id}/results` every 2 seconds; the endpoint returns 202 while evaluating and 200 once done.

### Auth
`app/auth/jwt_utils.py` — HS256 JWT creation and decoding
`app/routers/auth.py` — register, login, me
`app/routers/users.py` — history, overview (requires Bearer token)
`app/services/user_store.py` — bcrypt password hashing

Auth is **optional** — all interview endpoints work without a token. When a valid JWT is present in `Authorization: Bearer <token>` on `POST /api/interview/start`, the session is linked to the user and results are saved to `UserStore` after evaluation.

---

## Frontend Architecture

### State Management
Single Zustand store in `src/context/InterviewContext.tsx`. All interview state lives here. There is **no local component state** for interview data — always read from and write to the store.

Key state fields:
- `thinkingPhase: boolean` — true after AI finishes speaking, before user starts answering
- `liveTranscript: string` — single string display (see STT design below)
- `isAISpeaking / isUserSpeaking` — control UI phase indicators

### STT Transcript Design (critical — read before touching)
The browser's Web Speech API sends events continuously. A naive implementation causes word duplication. The correct design:

```
finalizedRef (useRef<string>)   — all committed (isFinal=true) text, space-joined
interimRef   (useRef<string>)   — latest interim segment (replaced, never appended)

Display string = [finalizedRef.current, interimRef.current].filter(Boolean).join(" ")
→ store.setLiveTranscript(display)
```

Refs are used (not state) so STT callbacks do not cause re-renders. Only `liveTranscript` triggers a re-render, and it updates as a single string.

`useSpeechRecognition` auto-restarts on unexpected `onend` events (silence timeout etc.) via an `isListeningRef` flag. Only setting `isListeningRef = false` (done by `stopListening()`) prevents the restart.

### Interview Flow
```
startSession()
  └─ POST /api/interview/start
  └─ TTS speaks question → onTTSDone: store.setThinkingPhase(true)

ThinkingCountdown shown (2 min)
  └─ user clicks "I'm ready" OR timer hits 0
  └─ startAnswering() → STT starts

User speaks → liveTranscript updates live

submitAnswer()
  └─ stopListening()
  └─ POST /api/interview/respond
  └─ if next question: TTS speaks it → thinkingPhase(true) again
  └─ if is_final: POST /end → poll GET /results → navigate to /results/[id]
```

### API Client
`src/lib/api.ts` — all backend calls go through this module. It automatically reads the JWT from `localStorage.getItem("iait")` and injects `Authorization: Bearer` headers. Never call `fetch()` directly in components or hooks.

### Auth
`src/context/AuthContext.tsx` — provides `user`, `login`, `register`, `logout`. The `AuthProvider` wraps the root layout. Use `useAuth()` to access auth state anywhere.

The JWT token is stored under the key `"iait"` in localStorage.

---

## Key Conventions

### Backend
- All Pydantic models use `Field(default_factory=...)` for mutable defaults (lists, UUIDs, datetimes)
- Router files import from `app.services.*` and `app.ai.factory` — never import services directly from routers of other domains
- All AI methods are `async` — use `await` and do not call them from sync contexts
- `evaluate_session()` evaluates all answers **concurrently** with `asyncio.gather()`

### Frontend
- All pages under `app/` that use browser APIs must be `"use client"` components
- Hooks that use `useRef` / `useEffect` / browser APIs must be `"use client"`
- Use `cn()` from `src/lib/utils.ts` for conditional Tailwind classes
- Use `formatDuration(seconds)` from `src/lib/utils.ts` for timer display
- Never import from `@/lib/constants` in server components (contains `InterviewMode` type — fine; but verify before use)

### Styling
- Dark theme only — base is `bg-gray-950`, cards are `bg-gray-900`
- Use `glass` prop on `<Card>` for frosted-glass panels (`bg-white/5 backdrop-blur`)
- Score colours: `scoreToColor(score)` returns Tailwind class (green/amber/red)
- No emojis in code unless the UI explicitly requires them (e.g. mode icons in constants)

---

## Adding a New Interview Mode

1. **Backend** — add value to `InterviewMode` enum in `app/models/interview.py`
2. **Backend** — add guidance string to `MODE_GUIDANCE` dict in `app/prompts/question_prompts.py`
3. **Frontend** — add entry to `INTERVIEW_MODES` in `src/lib/constants.ts`

No other changes needed — the UI and API are data-driven from these two dictionaries.

---

## Adding a New AI Provider

1. Create `backend/app/ai/your_provider.py` implementing all 4 methods of `AIProvider` ABC
2. Add a branch in `backend/app/ai/factory.py` `get_ai_provider()`
3. Add the new provider's API key field to `backend/app/config.py`
4. Document the new `AI_PROVIDER` value in `.env.example`

---

## Common Pitfalls

| Pitfall | Correct approach |
|---|---|
| Appending interim STT text to an array | Replace `interimRef.current`, never append |
| Calling `stopListening()` inside STT `onResult` | Only call from `submitAnswer()` or `endSessionEarly()` |
| Reading Zustand state inside an async callback | Capture values in local variables before the `await` |
| Modifying `InterviewSession` without calling `store.update_session()` | Always persist mutations back to the store |
| Running `get_ai_provider()` before settings are loaded | It's lru_cached — safe to call anywhere; settings load on first call |
| Storing secrets in `frontend/` | All secrets belong in `backend/.env` only |
| Using `class Config` in pydantic-settings | Use `model_config = SettingsConfigDict(...)` (v2 API) |

---

## Verification Checklist

After making changes, verify:

```bash
# Backend starts and health check passes
make health     # → {"status": "ok", ...}

# Frontend compiles without type errors
cd frontend && npm run type-check

# CV upload works
make test-cv CV_PATH=some_cv.pdf

# Full flow: upload → start → respond × N → end → results (202 → 200)
# Do this manually or via curl/Postman against localhost:8000
```
