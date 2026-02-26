from functools import lru_cache
from app.ai.base import AIProvider
from app.config import get_settings


@lru_cache(maxsize=1)
def get_ai_provider() -> AIProvider:
    settings = get_settings()
    provider = settings.ai_provider.lower()

    if provider == "claude":
        from app.ai.claude_provider import ClaudeProvider
        return ClaudeProvider()
    elif provider == "openai":
        from app.ai.openai_provider import OpenAIProvider
        return OpenAIProvider()
    else:
        raise ValueError(f"Unknown AI_PROVIDER: {provider!r}. Must be 'claude' or 'openai'.")
