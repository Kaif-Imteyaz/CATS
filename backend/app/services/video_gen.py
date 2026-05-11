import fal_client
from app.db.client import get_db

PAIN_PROMPTS: dict[str, str] = {
    "lower_back": "South Asian physiotherapist demonstrating lower back rehabilitation stretch, slow controlled movement, clinic with warm lighting",
    "knee": "South Asian physiotherapist demonstrating knee rehabilitation exercise, gentle range of motion, clean clinical room",
    "shoulder": "South Asian physiotherapist demonstrating shoulder mobility rehabilitation, slow movement, professional outpatient setting",
    "neck": "South Asian physiotherapist demonstrating neck stretching and cervical mobilization, gentle controlled pace",
    "posture": "South Asian person performing posture correction exercises standing tall, instructional rehabilitation demonstration",
    "breathing": "South Asian person performing diaphragmatic breathing rehabilitation, seated, calm clinical setting, salwar kameez or casual attire",
    "hip": "South Asian physiotherapist demonstrating hip mobility and stretching exercises, floor mat, home rehabilitation setting",
    "ankle": "South Asian physiotherapist demonstrating ankle rehabilitation exercises, seated on chair, clinical room",
}

def _age_context(age: int) -> str:
    if age >= 70:
        return "elderly South Asian patient, very gentle seated pace, chair support visible, traditional home setting"
    if age >= 60:
        return "senior South Asian patient in their 60s, slow deliberate movements, chair nearby for support"
    if age >= 50:
        return "South Asian patient in their mid-50s, moderate controlled pace, standing or seated"
    if age >= 40:
        return "South Asian patient in their early 40s, steady pace, home or clinic environment"
    return "South Asian adult patient, active steady rehabilitation pace"

def _lang_context(lang: str) -> str:
    if lang == "hi":
        return "Hindi-speaking Indian patient, North Indian setting, warm tones"
    if lang == "ur":
        return "Urdu-speaking Pakistani patient, South Asian clinic, neutral warm tones"
    return "South Asian English-speaking patient, modern clinic"


async def generate_video_background(
    video_id: str,
    pain_area: str,
    age: int,
    lang: str = "en",
    region: str = "",
) -> None:
    db = get_db()
    try:
        base = PAIN_PROMPTS.get(pain_area, "South Asian physiotherapist demonstrating rehabilitation exercise, clinical setting")
        age_ctx = _age_context(age)
        lang_ctx = _lang_context(lang)
        region_note = f"setting: {region}," if region else ""
        prompt = (
            f"{base}, {age_ctx}, {lang_ctx}, {region_note} "
            "professional quality, clear instructional demonstration, realistic, cinematic lighting, "
            "no text overlay, no subtitles"
        )

        result = await fal_client.run_async(
            "fal-ai/kling-video/v1.6/standard/text-to-video",
            arguments={
                "prompt": prompt,
                "duration": "5",
                "aspect_ratio": "9:16",
                "negative_prompt": "cartoon, animation, text, watermark, blurry, low quality, Western, Caucasian",
            },
        )
        url: str = (result.get("video") or {}).get("url", "")
        status = "ready" if url else "failed"
        db.table("exercise_videos").update({"status": status, "url": url}).eq("id", video_id).execute()
    except Exception:
        db.table("exercise_videos").update({"status": "failed"}).eq("id", video_id).execute()
