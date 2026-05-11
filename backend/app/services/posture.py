import math
from app.models.schemas import Joint, PostureResult, PostureMetrics

ROM_CONFIGS: dict[str, dict[str, float]] = {
    "knee-raise":        {"min": 60,  "max": 120},
    "seated-leg-lift":   {"min": 140, "max": 175},
    "knee-extension":    {"min": 5,   "max": 45},
    "squat":             {"min": 85,  "max": 140},
    "lunge":             {"min": 85,  "max": 140},
    "shoulder-raise":    {"min": 70,  "max": 160},
    "shoulder-abduction":{"min": 70,  "max": 160},
    "shoulder-press":    {"min": 80,  "max": 175},
    "shoulder-internal": {"min": 30,  "max": 95},
    "elbow-flex":        {"min": 35,  "max": 160},
    "hip-flex":          {"min": 75,  "max": 125},
    "hip-abduction":     {"min": 125, "max": 170},
    "pelvic-tilt":       {"min": 80,  "max": 130},
    "tricep-stretch":    {"min": 35,  "max": 160},
    "bicep-stretch":     {"min": 75,  "max": 165},
    "chest-stretch":     {"min": 25,  "max": 135},
    "seated-row":        {"min": 80,  "max": 160},
    "default":           {"min": 45,  "max": 135},
}

LOWER_BODY = {
    "knee-raise", "seated-leg-lift", "knee-extension",
    "squat", "lunge", "hip-flex", "hip-abduction", "pelvic-tilt",
    "ankle-rotation", "calf-raise",
}
UPPER_BODY = {
    "shoulder-raise", "shoulder-abduction", "shoulder-press",
    "shoulder-internal", "wall-climb", "pendulum",
    "chest-stretch", "seated-row", "tricep-stretch", "bicep-stretch",
    "elbow-flex", "neck-rotation", "wrist-circle", "forearm-pronation",
}

EXERCISE_FEEDBACK: dict[str, dict[str, str]] = {
    "knee-raise":         {"too_low": "Lift your knee higher.", "too_high": "Hold — don't overextend.", "good": "Good — hold and lower slowly."},
    "seated-leg-lift":    {"too_low": "Extend your leg more.", "too_high": "Don't hyperextend the knee.", "good": "Great leg extension. Hold steady."},
    "knee-extension":     {"too_low": "Straighten your knee fully.", "too_high": "Don't lock the knee out.", "good": "Good extension. Hold 5 seconds."},
    "squat":              {"too_low": "Bend deeper — aim for 90°.", "too_high": "Good depth. Hold and rise.", "good": "Perfect squat depth. Rise slowly."},
    "lunge":              {"too_low": "Lower your back knee further.", "too_high": "Good depth. Hold position.", "good": "Good lunge. Keep torso upright."},
    "shoulder-raise":     {"too_low": "Raise your arm to shoulder height.", "too_high": "Slow down — control the movement.", "good": "Good shoulder height. Hold 2 seconds."},
    "shoulder-abduction": {"too_low": "Lift your arm higher to the side.", "too_high": "Don't go above shoulder level.", "good": "Good lateral raise. Lower slowly."},
    "shoulder-press":     {"too_low": "Press higher — extend your elbow.", "too_high": "Slow down at the top.", "good": "Full press. Lower with control."},
    "shoulder-internal":  {"too_low": "Rotate your arm inward further.", "too_high": "Don't force past your range.", "good": "Good rotation. Hold gently."},
    "elbow-flex":         {"too_low": "Curl your arm up further.", "too_high": "Lower slowly — control the weight.", "good": "Good curl. Lower with control."},
    "hip-flex":           {"too_low": "Push your hip forward more.", "too_high": "Hold — you've reached good range.", "good": "Good stretch. Hold 20 seconds."},
    "hip-abduction":      {"too_low": "Raise your leg higher.", "too_high": "Don't over-raise — keep hips level.", "good": "Good leg raise. Hold 3 seconds."},
    "chest-stretch":      {"too_low": "Open your chest wider.", "too_high": "Ease back — don't strain.", "good": "Good chest expansion. Breathe deeply."},
    "seated-row":         {"too_low": "Pull further back — squeeze shoulders.", "too_high": "Hold — good range.", "good": "Good row. Release slowly."},
    "tricep-stretch":     {"too_low": "Reach your elbow higher.", "too_high": "Hold gently — don't force.", "good": "Good stretch. Hold and breathe."},
    "bicep-stretch":      {"too_low": "Open your chest and arm more.", "too_high": "Hold — good stretch.", "good": "Good bicep stretch. Hold steady."},
    "pelvic-tilt":        {"too_low": "Tilt your pelvis further.", "too_high": "Hold — good range.", "good": "Good pelvic tilt. Engage your core."},
}


def _angle(a: Joint, b: Joint, c: Joint) -> float:
    rad = math.atan2(c.y - b.y, c.x - b.x) - math.atan2(a.y - b.y, a.x - b.x)
    deg = abs(rad * 180 / math.pi)
    return 360 - deg if deg > 180 else deg


def analyze_landmarks(
    landmarks: dict[int, Joint],
    exercise_tag: str = "default",
) -> PostureResult:
    rom = ROM_CONFIGS.get(exercise_tag, ROM_CONFIGS["default"])
    cues = EXERCISE_FEEDBACK.get(exercise_tag, {})
    feedback: list[str] = []
    score = 100.0

    is_lower = exercise_tag in LOWER_BODY
    is_upper = exercise_tag in UPPER_BODY

    ls = landmarks.get(11)
    rs = landmarks.get(12)
    lh = landmarks.get(23)
    rh = landmarks.get(24)
    lk = landmarks.get(25)
    la = landmarks.get(27)

    if not ls or not rs or not lh or not rh:
        return PostureResult(
            score=0,
            feedback=["Position yourself in frame."],
            type="warning",
            metrics=PostureMetrics(shoulder_angle=0, knee_angle=0, hip_alignment=0, symmetry=0),
        )

    shoulder_tilt = abs(ls.y - rs.y) * 100
    hip_tilt = abs(lh.y - rh.y) * 100

    if is_upper and shoulder_tilt > 5:
        feedback.append("Straighten your shoulders.")
        score -= 15

    if hip_tilt > 8:
        feedback.append("Keep your hips level.")
        score -= 10

    knee_angle = 0.0
    if lk and la:
        knee_angle = _angle(lh, lk, la)
        if knee_angle < rom["min"]:
            feedback.append(cues.get("too_low", "Extend your range of motion."))
            score -= 20
        elif knee_angle > rom["max"]:
            feedback.append(cues.get("too_high", "Slow down — don't overextend."))
            score -= 15

    symmetry = max(0.0, 100 - shoulder_tilt * 2)
    if is_upper and symmetry < 80:
        score -= 10

    if not feedback:
        feedback.append(cues.get("good", "Good posture. Continue slowly."))

    final = max(0.0, score)
    kind = "correct" if final >= 80 else "warning" if final >= 60 else "error"

    return PostureResult(
        score=final,
        feedback=feedback,
        type=kind,
        metrics=PostureMetrics(
            shoulder_angle=180 - shoulder_tilt * 2,
            knee_angle=knee_angle,
            hip_alignment=100 - hip_tilt * 2,
            symmetry=symmetry,
        ),
    )
