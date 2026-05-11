import structlog
from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import WeeklyReport
from app.middleware.auth import get_current_user
from app.services.report import generate_weekly_report

router = APIRouter()
log = structlog.get_logger()


@router.get("/weekly/{patient_id}", response_model=WeeklyReport)
async def weekly_report(
    patient_id: str,
    user: dict = Depends(get_current_user),
):
    uid = user.get("sub")
    role = user.get("user_metadata", {}).get("role")
    if uid != patient_id and role != "physio":
        raise HTTPException(status_code=403, detail="Forbidden")

    log.info("report.fetch", patient_id=patient_id)
    try:
        result = await generate_weekly_report(patient_id)
        log.info("report.ok", patient_id=patient_id)
        return result
    except Exception as e:
        log.error("report.error", patient_id=patient_id, error=str(e))
        raise
