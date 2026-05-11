import structlog
import random
import string
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.middleware.auth import get_current_user
from app.db.client import get_db

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
log = structlog.get_logger()


class ScheduleCreateRequest(BaseModel):
    physio_id: str
    patient_id: str
    datetime: str  # ISO string
    type: str  # "video" | "in-person" | "phone"
    notes: str = ""


def _room_code() -> str:
    prefix = random.choice(["KN", "SH", "HI", "AN", "BA"])
    suffix = "".join(random.choices(string.digits, k=4))
    return f"{prefix}-{suffix}"


@router.get("/physio/{physio_id}")
@limiter.limit("60/minute")
async def get_physio_sessions(
    request: Request,
    physio_id: str,
    user: dict = Depends(get_current_user),
):
    if user.get("sub") != physio_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = get_db().table("scheduled_sessions") \
        .select("*, profiles!patient_id(name)") \
        .eq("physio_id", physio_id) \
        .order("datetime") \
        .execute()

    return result.data or []


@router.get("/patient/{patient_id}")
@limiter.limit("60/minute")
async def get_patient_sessions(
    request: Request,
    patient_id: str,
    user: dict = Depends(get_current_user),
):
    if user.get("sub") != patient_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = get_db().table("scheduled_sessions") \
        .select("*, profiles!physio_id(name)") \
        .eq("patient_id", patient_id) \
        .eq("status", "scheduled") \
        .order("datetime") \
        .execute()

    return result.data or []


@router.post("/create")
@limiter.limit("20/minute")
async def create_session(
    request: Request,
    body: ScheduleCreateRequest,
    user: dict = Depends(get_current_user),
):
    if user.get("sub") != body.physio_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    room_code = _room_code() if body.type == "video" else None

    result = get_db().table("scheduled_sessions").insert({
        "physio_id": body.physio_id,
        "patient_id": body.patient_id,
        "datetime": body.datetime,
        "type": body.type,
        "status": "scheduled",
        "room_code": room_code,
        "notes": body.notes,
    }).execute()

    log.info("session.scheduled", physio_id=body.physio_id, patient_id=body.patient_id, type=body.type)
    return result.data[0]


@router.patch("/{session_id}/cancel")
@limiter.limit("20/minute")
async def cancel_session(
    request: Request,
    session_id: str,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    row = db.table("scheduled_sessions").select("physio_id, patient_id").eq("id", session_id).single().execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Not found")

    uid = user.get("sub")
    if uid not in (row.data["physio_id"], row.data["patient_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    db.table("scheduled_sessions").update({"status": "cancelled"}).eq("id", session_id).execute()
    log.info("session.cancelled", session_id=session_id)
    return {"message": "Cancelled"}
