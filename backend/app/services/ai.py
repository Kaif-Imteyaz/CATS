import json
import uuid
from typing import AsyncGenerator
import anthropic
from app.config import get_settings
from app.models.schemas import TherapyRequest, TherapyPlan, ExercisePlan
from app.db.client import get_db

EXERCISE_TEMPLATES: dict[str, list[dict]] = {
    "Knee": [
        {"name": "Assisted Knee Raise", "tag": "knee-raise", "duration_min": 10, "difficulty": "Gentle", "target": "Knee", "instructions": "Sit upright, slowly raise knee to hip level, hold 3 sec, lower."},
        {"name": "Slow Seated Leg Lift", "tag": "knee-raise", "duration_min": 8, "difficulty": "Gentle", "target": "Knee", "instructions": "Extend leg straight, lift 45°, hold 2 sec, return slowly."},
        {"name": "Chair-Supported Stand", "tag": "default", "duration_min": 7, "difficulty": "Moderate", "target": "Knee", "instructions": "Use chair arms, stand fully, pause, lower slowly."},
    ],
    "Shoulder": [
        {"name": "Pendulum Swing", "tag": "shoulder-raise", "duration_min": 5, "difficulty": "Gentle", "target": "Shoulder", "instructions": "Lean forward, let arm hang, swing in small circles."},
        {"name": "Wall Climb", "tag": "shoulder-raise", "duration_min": 8, "difficulty": "Moderate", "target": "Shoulder", "instructions": "Walk fingers up wall to tolerance, hold, lower."},
    ],
    "Lower Back": [
        {"name": "Pelvic Tilt", "tag": "hip-flex", "duration_min": 5, "difficulty": "Easy", "target": "Lower Back", "instructions": "Lie flat, press lower back into floor, hold 5 sec."},
        {"name": "Knee-to-Chest", "tag": "hip-flex", "duration_min": 6, "difficulty": "Easy", "target": "Lower Back", "instructions": "Pull one knee to chest, hold 15 sec, alternate."},
    ],
    "Hip": [
        {"name": "Hip Flexor Stretch", "tag": "hip-flex", "duration_min": 6, "difficulty": "Gentle", "target": "Hip", "instructions": "Kneel, push hips forward, hold 20 sec each side."},
    ],
    "Full Body": [
        {"name": "Breathing Warm-up", "tag": "default", "duration_min": 5, "difficulty": "Easy", "target": "Full Body", "instructions": "Deep belly breaths, 4 sec in, hold 2, 6 sec out."},
        {"name": "Cool-down Stretch", "tag": "default", "duration_min": 5, "difficulty": "Easy", "target": "Full Body", "instructions": "Gentle full-body stretch sequence, hold each 15 sec."},
    ],
}


def _build_exercises(pain_areas: list[str], mobility: str) -> list[ExercisePlan]:
    exercises: list[dict] = [EXERCISE_TEMPLATES["Full Body"][0]]
    for area in pain_areas:
        exercises.extend(EXERCISE_TEMPLATES.get(area, []))
    exercises.append(EXERCISE_TEMPLATES["Full Body"][-1])
    return [ExercisePlan(**e) for e in exercises[:8]]


async def generate_therapy_plan(req: TherapyRequest) -> TherapyPlan:
    client = anthropic.Anthropic(api_key=get_settings().anthropic_api_key)

    prompt = (
        f"Patient: {req.name}, age {req.age}, lang={req.lang}. "
        f"Pain areas: {', '.join(req.pain_areas)}. "
        f"Mobility: {req.mobility_level}. "
        f"Notes: {req.lifestyle_notes or 'none'}. "
        "Respond ONLY with valid JSON: "
        '{"notes": "...", "goals": ["...", "..."]}'
    )

    ai_data = {"notes": "Personalized recovery plan generated.", "goals": ["Reduce pain", "Restore mobility"]}
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system="You are a physiotherapy AI. Output only valid JSON.",
            messages=[{"role": "user", "content": prompt}],
        )
        ai_data = json.loads(msg.content[0].text)
    except Exception:
        pass

    exercises = _build_exercises(req.pain_areas, req.mobility_level)
    plan_id = str(uuid.uuid4())

    try:
        db = get_db()
        db.table("plans").insert({
            "id": plan_id,
            "patient_id": req.patient_id,
            "pain_areas": req.pain_areas,
            "mobility_level": req.mobility_level,
            "exercises": [e.model_dump() for e in exercises],
            "ai_notes": ai_data.get("notes", ""),
            "ai_goals": ai_data.get("goals", []),
        }).execute()
    except Exception:
        pass

    return TherapyPlan(
        patient_id=req.patient_id,
        plan_id=plan_id,
        exercises=exercises,
        notes=ai_data.get("notes", ""),
        goals=ai_data.get("goals", []),
    )


async def stream_therapy_plan(req: TherapyRequest) -> AsyncGenerator[dict, None]:
    client = anthropic.Anthropic(api_key=get_settings().anthropic_api_key)

    prompt = (
        f"Patient: {req.name}, age {req.age}, lang={req.lang}. "
        f"Pain areas: {', '.join(req.pain_areas)}. "
        f"Mobility: {req.mobility_level}. "
        f"Notes: {req.lifestyle_notes or 'none'}. "
        "Write a 2-3 sentence personalised recovery plan overview. "
        "Then on a new line write JSON: "
        '{"goals": ["...", "..."]}'
    )

    exercises = _build_exercises(req.pain_areas, req.mobility_level)
    plan_id = str(uuid.uuid4())
    notes_buf: list[str] = []

    try:
        with client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system="You are a physiotherapy AI assistant. Be warm and concise.",
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text in stream.text_stream:
                notes_buf.append(text)
                yield {"type": "delta", "text": text}
    except Exception:
        yield {"type": "delta", "text": "Personalised plan ready."}

    full_text = "".join(notes_buf)
    ai_notes = full_text.split("{")[0].strip() or "Personalized recovery plan generated."
    ai_goals = ["Reduce pain", "Restore mobility"]
    try:
        json_start = full_text.index("{")
        ai_data = json.loads(full_text[json_start:])
        ai_goals = ai_data.get("goals", ai_goals)
    except Exception:
        pass

    try:
        db = get_db()
        db.table("plans").upsert({
            "id": plan_id,
            "patient_id": req.patient_id,
            "pain_areas": req.pain_areas,
            "mobility_level": req.mobility_level,
            "exercises": [e.model_dump() for e in exercises],
            "ai_notes": ai_notes,
            "ai_goals": ai_goals,
            "active": True,
        }).execute()
    except Exception:
        pass

    yield {
        "type": "done",
        "plan": {
            "patient_id": req.patient_id,
            "plan_id": plan_id,
            "exercises": [e.model_dump() for e in exercises],
            "notes": ai_notes,
            "goals": ai_goals,
        },
    }
