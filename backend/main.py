from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import cv, interview
from app.routers import auth, users

settings = get_settings()

app = FastAPI(
    title="Interview AI API",
    description="AI-powered interview training platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cv.router, prefix="/api/cv", tags=["CV"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "ai_provider": settings.ai_provider,
        "model": settings.claude_model if settings.ai_provider == "claude" else settings.openai_model,
    }
