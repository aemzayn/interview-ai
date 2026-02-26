from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from fastapi import Request

from app.config import get_settings


def create_access_token(user_id: str, email: str) -> str:
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiry_hours)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[dict]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


def get_optional_user_id(request: Request) -> Optional[str]:
    """FastAPI dependency — returns user_id from Bearer token, or None if missing/invalid."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    payload = decode_token(auth[7:])
    return payload.get("sub") if payload else None
