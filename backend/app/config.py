from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # silently ignore NEXT_PUBLIC_* and other non-backend vars
    )

    ai_provider: Literal["claude", "openai"] = "claude"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    claude_model: str = "claude-sonnet-4-6"
    openai_model: str = "gpt-4o"
    cv_session_ttl_seconds: int = 1800  # 30 minutes
    interview_session_ttl_seconds: int = 7200  # 2 hours
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    jwt_secret_key: str = "dev-secret-change-in-production-please"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 168  # 7 days


@lru_cache
def get_settings() -> Settings:
    return Settings()
