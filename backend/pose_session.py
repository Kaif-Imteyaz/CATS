import cv2
import json
from datetime import datetime
from typing import Dict, Tuple, List
from pose_detector import PoseDetector
from exercise_engine import ExerciseEngine
import requests

class PoseSession:
    """Manages real-time pose detection session with posture tracking"""
    
    def __init__(self, user_id: int, exercise_id: int, exercise_config: Dict, backend_url: str = "http://localhost:8000"):
        self.user_id = user_id
        self.exercise_id = exercise_id
        self.detector = PoseDetector()
        self.engine = ExerciseEngine(exercise_config)
        self.backend_url = backend_url
        self.start_time = datetime.now()
        self.frame_count = 0
        self.all_metrics = []
        self.all_posture_errors = []
    
    def process_frame(self, frame) -> Tuple[any, Dict, List[str]]:
        """Process single frame, return annotated frame, metrics, and posture errors"""
        results = self.detector.detect(frame)
        metrics, posture_errors = self.engine.process_frame(frame, results)
        
        self.all_metrics.append(metrics)
        self.all_posture_errors.append(posture_errors)
        self.frame_count += 1
        
        # Draw visualization
        annotated_frame = self.detector.draw_skeleton(frame.copy(), results)
        self._draw_metrics(annotated_frame, metrics, posture_errors)
        
        return annotated_frame, metrics, posture_errors
    
    def _draw_metrics(self, frame, metrics: Dict, posture_errors: List[str]):
        """Draw metrics overlay on frame"""
        h, w, _ = frame.shape
        
        # Rep count (large, prominent)
        cv2.putText(frame, f"Reps: {metrics['reps']}", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
        
        # Speed and ROM
        cv2.putText(frame, f"Speed: {metrics['avg_speed']:.3f}", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(frame, f"ROM: {metrics['avg_rom']:.1f}°", (10, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Fatigue indicator
        if metrics['fatigue_detected']:
            cv2.putText(frame, "⚠ FATIGUE DETECTED", (10, 160), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Posture status
        if posture_errors:
            posture_text = "✗ " + posture_errors[0].replace("_", " ").title()
            cv2.putText(frame, posture_text, (10, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
        else:
            cv2.putText(frame, "✓ Posture OK", (10, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    def end_session(self) -> Dict:
        """End session and save to backend"""
        duration = (datetime.now() - self.start_time).total_seconds()
        
        # Calculate averages
        avg_speed = sum(m['avg_speed'] for m in self.all_metrics) / len(self.all_metrics) if self.all_metrics else 0
        avg_rom = sum(m['avg_rom'] for m in self.all_metrics) / len(self.all_metrics) if self.all_metrics else 0
        fatigue_detected = any(m['fatigue_detected'] for m in self.all_metrics)
        
        # Count total posture errors
        posture_error_count = sum(1 for errors in self.all_posture_errors if errors)
        
        # Completion percentage (based on rep target)
        completion = (self.engine.rep_count / 15) * 100  # Target is typically 15 reps
        
        summary = {
            "total_reps": self.engine.rep_count,
            "avg_speed": float(avg_speed),
            "avg_rom": float(avg_rom),
            "duration_seconds": float(duration),
            "fatigue_detected": fatigue_detected,
            "posture_errors": posture_error_count,
            "completion_percentage": float(min(completion, 100))
        }
        
        try:
            requests.post(f"{self.backend_url}/sessions/save", json={
                "patient_id": str(self.user_id),
                "exercise_id": str(self.exercise_id),
                "completion_percentage": summary['completion_percentage'],
                "avg_speed": summary['avg_speed'],
                "fatigue_detected": fatigue_detected,
                "form_errors": posture_error_count,
                "session_summary": summary
            })
        except Exception as e:
            print(f"[v0] Session save error: {e}")  # Handle offline gracefully
        
        return summary
