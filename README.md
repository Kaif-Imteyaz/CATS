# CATS: Culturally Adaptive Therapeutic System

A privacy-first physiotherapy platform that provides real-time AI-driven posture analysis, automated exercise monitoring, and intelligent voice coaching. Uses MediaPipe BlazePose for pose detection with local-only processing to ensure patient data privacy.

## Core Features

### Pose Detection and Analysis
### Exercise Monitoring
### Posture Assessment
### Fatigue Detection
### Intelligent Voice Coaching
### Session Management
### Privacy and Data Management


## System Architecture

```
backend/
  main.py                 - FastAPI REST API server with JSON storage abstraction
  pose_detector.py        - MediaPipe BlazePose wrapper for pose estimation
  exercise_engine.py      - Core exercise logic with rep counting and posture validation
  pose_session.py         - Session management and frame processing orchestration
  voice_coach.py          - Advanced voice feedback engine with throttling
  requirements.txt        - Python package dependencies

frontend/
  patient_ui.py           - Patient interface for exercise execution and real-time feedback
  doctor_ui.py            - Clinician dashboard for patient management
  login.py                - Authentication interface
  requirements.txt        - Python package dependencies

config/
  exercise.json           - Exercise definitions and keypoint configurations

scripts/
  init_data.py            - Data initialization utility
  init_db.py              - Database schema initialization

data/                     - Runtime data directory (auto-created)
  users.json              - User account records
  exercises.json          - Exercise library
  sessions.json           - Session history and metrics
```

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- Webcam for pose detection
- Windows, macOS, or Linux operating system

### Backend Installation
```bash
cd backend
pip install -r requirements.txt
python main.py
```
The backend server will be accessible at http://localhost:8000

### Data Initialization
### Initializing Exercise Data
```bash
python scripts/init_data.py
```
This utility creates the necessary data directory structure and initializes test user accounts along with pre-configured exercises.

### Patient Interface Execution
```bash
cd frontend
pip install -r requirements.txt
python patient_ui.py
```

### Default Test Credentials
- Patient Account: patient@test.com / pass123
- Clinician Account: doctor@test.com / pass123

## Exercise Library

The system includes 10 pre-configured exercises across multiple categories:

### Upper Body Exercises
- Push-ups (target: 15 reps) - Chest, shoulders, and triceps
- Shoulder Raises (target: 12 reps) - Shoulder muscle isolation
- Bicep Curls (target: 12 reps) - Arm flexion strength
- Tricep Dips (target: 10 reps) - Upper arm extension
- Lateral Raises (target: 12 reps) - Lateral shoulder mobility

### Lower Body Exercises
- Squats (target: 20 reps) - Leg and glute strength
- Lunges (target: 10 reps) - Unilateral leg strength
- Leg Raises (target: 15 reps) - Hip flexor and core strength
- Glute Bridges (target: 15 reps) - Posterior chain activation
- Calf Raises (target: 20 reps) - Ankle plantarflexor strength

Each exercise utilizes MediaPipe COCO keypoints for robust pose detection and is configured with specific angle thresholds appropriate for the movement pattern.

## Data Persistence Architecture

The system implements a file-based storage approach requiring no external database infrastructure:

### Data Files
- `data/users.json` - User account records including authentication credentials and user profiles
- `data/exercises.json` - Complete exercise library with configuration parameters
- `data/sessions.json` - Session history containing aggregated metrics and performance data

All data files are automatically created during initial system startup with appropriate default values.

## Component Reference

### PoseDetector Module
The PoseDetector class provides a wrapper around MediaPipe BlazePose with the following capabilities:
- Real-time pose estimation using the BlazePose 33-keypoint model
- Geometric angle calculation from keypoint triplets
- Visual skeleton rendering with keypoint overlay

### ExerciseEngine Module
The ExerciseEngine class implements the core exercise logic:
- State machine-based repetition counting with up/down position transitions
- Range of motion tracking for fatigue assessment
- COCO-keypoint-based posture validation with configurable thresholds
- Movement velocity calculation derived from landmark displacement

### VoiceCoach Module
The VoiceCoach class manages all audio feedback:
- Configurable feedback throttling with 2000 millisecond minimum intervals
- Repetition announcements with dynamic milestone-based motivation
- Posture-specific corrective messages with topic-specific audio cues
- Rest interval analysis with suggestion logic
- Session initialization and completion announcements

### PoseSession Module
The PoseSession class orchestrates the overall session workflow:
- Integration of pose detection and exercise analysis components
- Per-frame metrics extraction and aggregation
- Session summary generation and backend persistence

### PatientUI Module
The PatientUI class implements the patient-facing interface:
- Tkinter-based graphical user interface
- Real-time video stream display with toggle capability
- Dynamic metrics visualization including repetition count, movement speed, ROM, and fatigue indicators
- Post-session performance summary display
- Historical session data navigation

## Security and Privacy Architecture

### Local Processing
The following operations remain entirely local to the patient device:
- Camera input and video capture
- Pose landmark computation and analysis
- Exercise state machine and rep counting logic
- Posture analysis and form validation
- Voice coaching synthesis and delivery

### Data Transmission Policy
The system explicitly does not transmit:
- Raw video frames
- Detailed pose landmark coordinates
- Intermediate computational results
- Visual information of any type

### Server-Side Data
Only aggregated session summaries are transmitted to the backend containing:
- Session metadata including date and duration
- Total repetitions completed
- Aggregate statistics for movement speed and ROM
- Fatigue detection indicators
- Count of posture validation failures
- Overall session completion percentage

## System Requirements

### Backend Requirements
- Python 3.8 or higher
- FastAPI and Uvicorn web frameworks
- MediaPipe 0.10.0 or higher
- OpenCV computer vision library
- NumPy and SciPy for numerical computations
- pyttsx3 text-to-speech library

### Frontend Requirements
- Python 3.8 or higher
- Tkinter graphical framework (typically bundled with Python)
- OpenCV computer vision library
- Pillow image processing library
- Requests HTTP client library

### Hardware Requirements
- Webcam or integrated camera with minimum 720p resolution
- Processor supporting real-time pose detection (recommended: Intel i5 or equivalent)
- Minimum 4GB RAM
- Stable internet connection for backend communication

## Troubleshooting

**Camera not detected:**
```bash
# Check if camera is already in use
# Try different camera index in code: cv2.VideoCapture(1)
```

**Voice feedback not working:**
```bash
# Reinstall pyttsx3
pip install --upgrade pyttsx3
```

**Backend not responding:**
```bash
# Ensure http://localhost:8000 is accessible
# Check firewall settings
curl http://localhost:8000/health
```

**No exercises loaded:**
```bash
# Run init script
python scripts/init_data.py
```
