import json
import structlog
from datetime import date, timedelta
import anthropic
from app.config import get_settings
from app.db.client import get_db
from app.models.schemas import WeeklyReport, WeeklyStats

log = structlog.get_logger()


async def generate_weekly_report(patient_id: str) -> WeeklyReport:
    db = get_db()
    week_start = date.today() - timedelta(days=date.today().weekday())

    try:
        sessions = db.table("sessions") \
            .select("*") \
            .eq("patient_id", patient_id) \
            .gte("completed_at", week_start.isoformat()) \
            .execute().data or []
    except Exception as e:
        log.error("sessions.fetch.error", patient_id=patient_id, error=str(e))
        sessions = []

    try:
        pain_logs = db.table("pain_logs") \
            .select("level") \
            .eq("patient_id", patient_id) \
            .gte("logged_at", week_start.isoformat()) \
            .execute().data or []
    except Exception as e:
        log.error("pain_logs.fetch.error", patient_id=patient_id, error=str(e))
        pain_logs = []

    # Filter for meaningful sessions (reps >= 5 or score > 0)
    filtered_sessions = [s for s in sessions if (s.get("reps", 0) >= 5 or s.get("score", 0) > 0)]
    
    total = len(filtered_sessions)
    avg_score = round(sum(s["score"] for s in filtered_sessions) / total, 1) if total else 0.0
    total_reps = sum(s.get("reps", 0) for s in filtered_sessions)
    avg_pain = round(sum(p["level"] for p in pain_logs) / len(pain_logs), 1) if pain_logs else 0.0
    completion_rate = round(min(total / 5, 1.0) * 100, 1) if total > 0 else 0.0
    posture_trend = [round(s.get("score", 0), 1) for s in filtered_sessions[-7:]]

    stats = WeeklyStats(
        avg_score=avg_score,
        total_sessions=total,
        total_reps=total_reps,
        avg_pain=avg_pain,
        completion_rate=completion_rate,
        posture_trend=posture_trend,
    )

    ai_summary = f"Week summary: {total} sessions completed. Average posture score {avg_score}%. Pain level {avg_pain}/10."
    recommendations: list[str] = []

    if total > 0:  # Only call AI if there's data
        try:
            client = anthropic.Anthropic(api_key=get_settings().anthropic_api_key)
            prompt = (
                f"Weekly physio data: {json.dumps(stats.model_dump())}. "
                'Return JSON: {"summary": "...", "recommendations": ["...", "..."]}'
            )
            msg = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=256,
                system="You are a physiotherapy AI. Output only valid JSON.",
                messages=[{"role": "user", "content": prompt}],
            )
            data = json.loads(msg.content[0].text)
            ai_summary = data.get("summary", ai_summary)
            recommendations = data.get("recommendations", [])
            log.info("report.ai.ok", patient_id=patient_id)
        except Exception as e:
            log.error("report.ai.error", patient_id=patient_id, error=str(e))

    try:
        db.table("reports").upsert({
            "patient_id": patient_id,
            "week_start": week_start.isoformat(),
            "summary": stats.model_dump(),
        }, on_conflict="patient_id,week_start").execute()
        log.info("report.saved", patient_id=patient_id, week_start=week_start.isoformat())
    except Exception as e:
        log.error("report.save.error", patient_id=patient_id, error=str(e))

    return WeeklyReport(
        patient_id=patient_id,
        week_start=week_start.isoformat(),
        stats=stats,
        ai_summary=ai_summary,
        recommendations=recommendations,
    )
