import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.schemas import SessionSaveRequest, SessionSaveResponse, PainLogRequest
from app.middleware.auth import get_current_user
from app.db.client import get_db

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
log = structlog.get_logger()


@router.post("/save", response_model=SessionSaveResponse)
@limiter.limit("30/minute")
async def save_session(
    request: Request,
    body: SessionSaveRequest,
    user: dict = Depends(get_current_user),
):
    if user.get("sub") != body.patient_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    db = get_db()
    result = db.table("sessions").insert({
        "patient_id": body.patient_id,
        "plan_id": body.plan_id,
        "exercise_tag": body.exercise_tag,
        "reps": body.reps,
        "score": body.score,
        "posture_data": body.posture_data,
        "duration_seconds": body.duration_seconds,
    }).execute()

    log.info("session.save", patient_id=body.patient_id, score=body.score)
    return SessionSaveResponse(id=result.data[0]["id"], message="Session saved")


@router.post("/pain-log")
@limiter.limit("30/minute")
async def log_pain(
    request: Request,
    body: PainLogRequest,
    user: dict = Depends(get_current_user),
):
    if user.get("sub") != body.patient_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    db = get_db()
    db.table("pain_logs").insert({
        "patient_id": body.patient_id,
        "level": body.level,
        "session_id": body.session_id,
        "note": body.note,
    }).execute()

    log.info("pain.log", patient_id=body.patient_id, level=body.level)
    return {"message": "Pain logged"}
