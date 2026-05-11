import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException
from app.db.client import get_db
from app.middleware.auth import get_current_user, require_role
from app.services.video_gen import generate_video_background

router = APIRouter()


def _age_bucket(age: int) -> tuple[int, int]:
    if age < 40: return 0, 39
    if age < 50: return 40, 49
    if age < 60: return 50, 59
    if age < 70: return 60, 69
    return 70, 999


@router.get("/exercise")
async def get_exercise_video(
    pain_area: str,
    age: int,
    background_tasks: BackgroundTasks,
    lang: str = "en",
    region: str = "",
    user: dict = Depends(get_current_user),
):
    db = get_db()

    ready = (
        db.table("exercise_videos")
        .select("id, status, url, title, pain_area, age_min, age_max, source")
        .eq("pain_area", pain_area)
        .lte("age_min", age)
        .gte("age_max", age)
        .eq("status", "ready")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if ready.data:
        return ready.data[0]

    pending = (
        db.table("exercise_videos")
        .select("id, status")
        .eq("pain_area", pain_area)
        .lte("age_min", age)
        .gte("age_max", age)
        .eq("status", "pending")
        .limit(1)
        .execute()
    )
    if pending.data:
        return pending.data[0]

    age_min, age_max = _age_bucket(age)
    video_id = str(uuid.uuid4())
    label = f"{pain_area.replace('_', ' ').title()} Exercises ({age_min}–{age_max} yrs)"
    db.table("exercise_videos").insert({
        "id": video_id,
        "pain_area": pain_area,
        "age_min": age_min,
        "age_max": age_max,
        "title": label,
        "url": "",
        "source": "ai",
        "status": "pending",
    }).execute()

    background_tasks.add_task(generate_video_background, video_id, pain_area, age, lang, region)
    return {"id": video_id, "status": "pending", "pain_area": pain_area, "title": label}


@router.get("/status/{video_id}")
async def video_status(video_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    res = db.table("exercise_videos").select("id, status, url, title").eq("id", video_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return res.data


@router.get("/list")
async def list_videos(user: dict = Depends(get_current_user)):
    db = get_db()
    res = (
        db.table("exercise_videos")
        .select("id, pain_area, age_min, age_max, title, url, source, status, physio_id, created_at")
        .eq("status", "ready")
        .order("pain_area")
        .order("age_min")
        .execute()
    )
    return res.data or []


@router.post("/upload")
async def upload_video(
    pain_area: str = Form(...),
    age_min: int = Form(...),
    age_max: int = Form(...),
    title: str = Form(...),
    url: str = Form(...),
    user: dict = Depends(require_role("physio")),
):
    db = get_db()
    res = db.table("exercise_videos").insert({
        "pain_area": pain_area,
        "age_min": age_min,
        "age_max": age_max,
        "title": title,
        "url": url,
        "source": "physio",
        "physio_id": user["sub"],
        "status": "ready",
    }).execute()
    return res.data[0] if res.data else {}


@router.delete("/{video_id}")
async def delete_video(video_id: str, user: dict = Depends(require_role("physio"))):
    db = get_db()
    db.table("exercise_videos").delete().eq("id", video_id).execute()
    return {"message": "deleted"}
