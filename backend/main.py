from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import json
import os
from pathlib import Path

app = FastAPI(title="CATS - Clinical AI Training System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JSON Storage paths
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
USERS_FILE = DATA_DIR / "users.json"
EXERCISES_FILE = DATA_DIR / "exercises.json"
SESSIONS_FILE = DATA_DIR / "sessions.json"

def load_json(file_path: Path) -> dict | list:
    """Load JSON file, create if not exists"""
    if not file_path.exists():
        return {} if file_path.name == "users.json" else []
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except:
        return {} if file_path.name == "users.json" else []

def save_json(file_path: Path, data):
    """Save data to JSON file"""
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

# Pydantic models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str

class SessionData(BaseModel):
    patient_id: str
    exercise_id: str
    completion_percentage: float
    avg_speed: float
    fatigue_detected: bool
    form_errors: int
    session_summary: dict

class ExerciseConfig(BaseModel):
    name: str
    category: str
    description: str
    target_reps: int
    config_json: dict

# Routes
@app.post("/auth/register")
def register(user: UserCreate):
    users = load_json(USERS_FILE)
    
    if user.email in users:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_id = str(len(users) + 1)
    users[user.email] = {
        "id": user_id,
        "email": user.email,
        "password": user.password,
        "name": user.name,
        "role": user.role,
        "created_at": datetime.now().isoformat()
    }
    save_json(USERS_FILE, users)
    return {"message": "User created", "email": user.email, "id": user_id}

@app.post("/auth/login")
def login(email: str, password: str):
    users = load_json(USERS_FILE)
    
    if email not in users or users[email]["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users[email]
    return {"id": user["id"], "name": user["name"], "role": user["role"]}

@app.post("/sessions/save")
def save_session(session_data: SessionData):
    sessions = load_json(SESSIONS_FILE)
    
    session_id = str(len(sessions) + 1)
    sessions.append({
        "id": session_id,
        "patient_id": session_data.patient_id,
        "exercise_id": session_data.exercise_id,
        "completion_percentage": session_data.completion_percentage,
        "avg_speed": session_data.avg_speed,
        "fatigue_detected": session_data.fatigue_detected,
        "form_errors": session_data.form_errors,
        "session_summary": session_data.session_summary,
        "created_at": datetime.now().isoformat()
    })
    save_json(SESSIONS_FILE, sessions)
    return {"message": "Session saved", "session_id": session_id}

@app.get("/sessions/history/{patient_id}")
def get_session_history(patient_id: str):
    sessions = load_json(SESSIONS_FILE)
    patient_sessions = [s for s in sessions if s.get("patient_id") == patient_id]
    return {"sessions": sorted(patient_sessions, key=lambda x: x.get("created_at", ""), reverse=True)}

@app.post("/exercises/add")
def add_exercise(exercise: ExerciseConfig):
    exercises = load_json(EXERCISES_FILE)
    
    exercise_id = str(len(exercises) + 1)
    exercises.append({
        "id": exercise_id,
        "name": exercise.name,
        "category": exercise.category,
        "description": exercise.description,
        "target_reps": exercise.target_reps,
        "config_json": exercise.config_json
    })
    save_json(EXERCISES_FILE, exercises)
    return {"message": "Exercise added", "id": exercise_id}

@app.get("/exercises")
def get_exercises():
    exercises = load_json(EXERCISES_FILE)
    return {"exercises": exercises}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
