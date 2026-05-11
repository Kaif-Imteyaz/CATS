import structlog
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.schemas import PostureAnalyzeRequest, PostureResult
from app.middleware.auth import get_current_user
from app.services.posture import analyze_landmarks

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
log = structlog.get_logger()


@router.post("/analyze", response_model=PostureResult)
@limiter.limit("60/minute")
async def analyze(
    request: Request,
    body: PostureAnalyzeRequest,
    user: dict = Depends(get_current_user),
):
    result = analyze_landmarks(body.landmarks, body.exercise_tag)

    if body.patient_id and body.session_id:
        from app.db.client import get_db
        get_db().table("sessions").update({
            "posture_data": result.model_dump(),
            "score": result.score,
        }).eq("id", body.session_id).execute()

    log.info("posture.analyze", exercise=body.exercise_tag, score=result.score)
    return result
