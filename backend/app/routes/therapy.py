import json
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.schemas import TherapyRequest, TherapyPlan
from app.middleware.auth import get_current_user
from app.services.ai import generate_therapy_plan, stream_therapy_plan

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
log = structlog.get_logger()


@router.post("/generate", response_model=TherapyPlan)
@limiter.limit("5/minute")
async def generate(
    request: Request,
    body: TherapyRequest,
    user: dict = Depends(get_current_user),
):
    if user.get("sub") != body.patient_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    log.info("therapy.generate", patient_id=body.patient_id)
    return await generate_therapy_plan(body)


@router.post("/stream")
@limiter.limit("5/minute")
async def stream(
    request: Request,
    body: TherapyRequest,
    user: dict = Depends(get_current_user),
):
    if user.get("sub") != body.patient_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    log.info("therapy.stream", patient_id=body.patient_id)

    async def event_generator():
        async for chunk in stream_therapy_plan(body):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
