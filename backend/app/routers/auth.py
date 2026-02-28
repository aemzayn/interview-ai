from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request

from app.models.user import UserCreate, UserLogin, TokenResponse, UserPublic, GoogleExchangeRequest
from app.services.user_store import get_user_store
from app.auth.jwt_utils import create_access_token, get_optional_user_id
from app.config import get_settings

router = APIRouter()

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def _require_email_auth() -> None:
    """Raise 403 if email/password auth is disabled in the current environment."""
    if get_settings().app_env == "production":
        raise HTTPException(
            status_code=403,
            detail="Email/password authentication is disabled. Please sign in with Google.",
        )


# ── Email / password ──────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(body: UserCreate):
    _require_email_auth()
    store = get_user_store()
    try:
        user = await store.create_user(
            email=body.email.lower().strip(),
            password=body.password,
            display_name=body.display_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    token = create_access_token(user.user_id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserPublic(user_id=user.user_id, email=user.email, display_name=user.display_name),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    _require_email_auth()
    store = get_user_store()
    user = await store.authenticate(body.email.lower().strip(), body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user.user_id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserPublic(user_id=user.user_id, email=user.email, display_name=user.display_name),
    )


# ── Google OAuth ───────────────────────────────────────────────────────────────

@router.get("/google")
async def google_auth_url():
    """Return the Google OAuth authorization URL for the frontend to redirect to."""
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured.")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return {"url": f"{_GOOGLE_AUTH_URL}?{urlencode(params)}"}


@router.post("/google/exchange", response_model=TokenResponse)
async def google_exchange(body: GoogleExchangeRequest):
    """Exchange an OAuth authorization code for an app JWT."""
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured.")

    async with httpx.AsyncClient() as client:
        # Exchange code → Google access token
        token_resp = await client.post(
            _GOOGLE_TOKEN_URL,
            data={
                "code": body.code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google auth code.")

        google_access_token = token_resp.json().get("access_token")
        if not google_access_token:
            raise HTTPException(status_code=400, detail="No access token returned by Google.")

        # Fetch user profile from Google
        info_resp = await client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {google_access_token}"},
        )
        if info_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info.")

    userinfo = info_resp.json()
    google_id = userinfo.get("id")
    email = userinfo.get("email")
    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Incomplete profile returned by Google.")

    user = await get_user_store().find_or_create_google_user(
        google_id=google_id,
        email=email,
        display_name=userinfo.get("name"),
    )

    token = create_access_token(user.user_id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserPublic(user_id=user.user_id, email=user.email, display_name=user.display_name),
    )


# ── Current user ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserPublic)
async def me(request: Request):
    user_id = get_optional_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user = await get_user_store().get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserPublic(user_id=user.user_id, email=user.email, display_name=user.display_name)
