import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.middleware.auth import get_current_user
from app.db.client import get_db

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
log = structlog.get_logger()


class MessageSendRequest(BaseModel):
    patient_id: str
    physio_id: str
    content: str
    sender_role: str  # "patient" | "physio"


@router.get("/{patient_id}")
@limiter.limit("60/minute")
async def get_messages(
    request: Request,
    patient_id: str,
    user: dict = Depends(get_current_user),
):
    uid = user.get("sub")
    if uid != patient_id and uid != user.get("physio_id"):
        result = get_db().table("messages") \
            .select("*") \
            .or_(f"patient_id.eq.{patient_id},physio_id.eq.{patient_id}") \
            .order("created_at") \
            .execute()
        if not any(m["patient_id"] == patient_id or m["physio_id"] == uid for m in (result.data or [])):
            raise HTTPException(status_code=403, detail="Forbidden")

    result = get_db().table("messages") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .order("created_at") \
        .execute()

    return result.data or []


@router.post("/send")
@limiter.limit("30/minute")
async def send_message(
    request: Request,
    body: MessageSendRequest,
    user: dict = Depends(get_current_user),
):
    uid = user.get("sub")
    if uid != body.patient_id and uid != body.physio_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = get_db().table("messages").insert({
        "patient_id": body.patient_id,
        "physio_id": body.physio_id,
        "sender_role": body.sender_role,
        "content": body.content,
        "read": False,
    }).execute()

    log.info("message.sent", patient_id=body.patient_id, role=body.sender_role)
    return result.data[0]


@router.patch("/{patient_id}/read")
@limiter.limit("30/minute")
async def mark_read(
    request: Request,
    patient_id: str,
    physio_id: str,
    user: dict = Depends(get_current_user),
):
    uid = user.get("sub")
    reader_role = "patient" if uid == patient_id else "physio"
    sender_role = "physio" if reader_role == "patient" else "patient"

    get_db().table("messages") \
        .update({"read": True}) \
        .eq("patient_id", patient_id) \
        .eq("physio_id", physio_id) \
        .eq("sender_role", sender_role) \
        .execute()

    return {"message": "Marked read"}
