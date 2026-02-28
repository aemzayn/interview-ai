from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.cv import CVUploadResponse
from app.services.cv_parser import extract_raw_text
from app.services.session_store import get_session_store
from app.ai.factory import get_ai_provider

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/upload", response_model=CVUploadResponse)
async def upload_cv(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5 MB.")
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        raw_text = extract_raw_text(filename, file_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse file: {e}")

    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from the uploaded file.")

    provider = get_ai_provider()
    try:
        cv_profile = await provider.extract_cv_profile(raw_text)
        cv_profile.raw_text = raw_text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI CV extraction failed: {e}")

    store = get_session_store()
    token = await store.store_cv_profile(cv_profile)

    return CVUploadResponse(cv_session_token=token, cv_profile=cv_profile)
