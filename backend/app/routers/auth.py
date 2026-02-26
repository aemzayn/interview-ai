from fastapi import APIRouter, HTTPException, Depends, Request

from app.models.user import UserCreate, UserLogin, TokenResponse, UserPublic
from app.services.user_store import get_user_store
from app.auth.jwt_utils import create_access_token, get_optional_user_id

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(body: UserCreate):
    store = get_user_store()
    try:
        user = store.create_user(
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
    store = get_user_store()
    user = store.authenticate(body.email.lower().strip(), body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user.user_id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserPublic(user_id=user.user_id, email=user.email, display_name=user.display_name),
    )


@router.get("/me", response_model=UserPublic)
async def me(request: Request):
    user_id = get_optional_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user = get_user_store().get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserPublic(user_id=user.user_id, email=user.email, display_name=user.display_name)
