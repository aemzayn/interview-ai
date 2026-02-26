.PHONY: dev dev-backend dev-frontend install install-backend install-frontend \
        docker-up docker-down health test-cv

# ── Development ──────────────────────────────────────────────────────────────

dev: ## Start both backend and frontend in dev mode
	@make -j2 dev-backend dev-frontend

dev-backend: ## Start FastAPI backend
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start Next.js frontend
	cd frontend && npm run dev

# ── Install ───────────────────────────────────────────────────────────────────

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install Python dependencies
	cd backend && pip install -r requirements.txt

install-frontend: ## Install Node dependencies
	cd frontend && npm install

# ── Docker ────────────────────────────────────────────────────────────────────

docker-up: ## Start all services with Docker Compose
	docker compose up --build

docker-down: ## Stop all Docker services
	docker compose down

# ── Verify ────────────────────────────────────────────────────────────────────

health: ## Check backend health
	curl -s http://localhost:8000/health | python3 -m json.tool

test-cv: ## Upload sample CV (set CV_PATH=path/to/cv.pdf)
	curl -s -F "file=@$(CV_PATH)" http://localhost:8000/api/cv/upload | python3 -m json.tool

setup-env: ## Copy .env.example to .env (won't overwrite existing)
	cp -n .env.example .env || true
	cp -n .env.example backend/.env || true
	cp -n .env.example frontend/.env.local || true
	@echo "✓ .env files created. Edit them with your API keys."
