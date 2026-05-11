from pydantic import BaseModel, Field
from typing import Any


class Joint(BaseModel):
    x: float
    y: float
    z: float = 0.0
    visibility: float = 1.0


class PostureMetrics(BaseModel):
    shoulder_angle: float
    knee_angle: float
    hip_alignment: float
    symmetry: float


class PostureResult(BaseModel):
    score: float
    feedback: list[str]
    type: str  # correct | warning | error
    metrics: PostureMetrics


class PostureAnalyzeRequest(BaseModel):
    landmarks: dict[int, Joint]
    exercise_tag: str = "default"
    patient_id: str | None = None
    session_id: str | None = None


class TherapyRequest(BaseModel):
    patient_id: str
    name: str
    age: int
    pain_areas: list[str]
    mobility_level: str
    lifestyle_notes: str = ""
    lang: str = "en"


class ExercisePlan(BaseModel):
    name: str
    tag: str
    duration_min: int
    difficulty: str
    target: str
    instructions: str


class TherapyPlan(BaseModel):
    patient_id: str
    plan_id: str
    exercises: list[ExercisePlan]
    notes: str
    goals: list[str]


class SessionSaveRequest(BaseModel):
    patient_id: str
    plan_id: str | None = None
    exercise_tag: str
    reps: int
    score: float
    posture_data: dict[str, Any] = Field(default_factory=dict)
    duration_seconds: int


class SessionSaveResponse(BaseModel):
    id: str
    message: str


class PainLogRequest(BaseModel):
    patient_id: str
    level: int = Field(ge=0, le=10)
    session_id: str | None = None
    note: str = ""


class WeeklyStats(BaseModel):
    avg_score: float
    total_sessions: int
    total_reps: int
    avg_pain: float
    completion_rate: float
    posture_trend: list[float]


class WeeklyReport(BaseModel):
    patient_id: str
    week_start: str
    stats: WeeklyStats
    ai_summary: str
    recommendations: list[str]
