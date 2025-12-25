import pyttsx3
import threading
from typing import Dict
from datetime import datetime
from collections import deque

class VoiceCoach:
    """Advanced voice feedback system with rep counting, posture correction, and motivation"""
    
    def __init__(self):
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 150)
        self.last_feedback_time = datetime.now()
        self.feedback_throttle_ms = 2000
        self.last_rep_count = 0
        self.rep_announcement_threshold = 1  # Announce every rep
        self.rest_suggestion_cooldown = {}
        self.session_start_time = None
        self.rep_times = deque(maxlen=10)  # Track last 10 rep times
        self.motivation_milestones = {5: "Great start!", 10: "Halfway there!", 15: "Almost done!", 20: "Excellent work!"}
        self.last_posture_warning = 0
        self.posture_warning_cooldown = 5000  # ms
        
        self.session_phase = "start"
        self.total_reps_target = 15  # Default
    
    def set_session_target(self, target_reps: int):
        """Set the target for motivation tracking"""
        self.total_reps_target = target_reps
        self.session_start_time = datetime.now()
        self.speak_async(f"Starting exercise. Target is {target_reps} reps. Let's go!")
    
    def should_speak(self) -> bool:
        """Throttle voice feedback to avoid spam"""
        elapsed = (datetime.now() - self.last_feedback_time).total_seconds() * 1000
        if elapsed > self.feedback_throttle_ms:
            self.last_feedback_time = datetime.now()
            return True
        return False
    
    def speak_async(self, text: str):
        """Speak in background thread"""
        if not text or text.strip() == "":
            return
        
        def _speak():
            try:
                self.engine.say(text)
                self.engine.runAndWait()
            except Exception as e:
                print(f"[v0] Speech error: {e}")
        
        thread = threading.Thread(target=_speak, daemon=True)
        thread.start()
    
    def give_rep_feedback(self, current_reps: int, current_time: float = None):
        """Announce rep count and motivational milestones"""
        if current_reps > self.last_rep_count:
            # New rep detected
            if current_time:
                self.rep_times.append(current_time)
            
            self.last_rep_count = current_reps
            
            # Announce rep number every rep
            self.speak_async(f"Rep {current_reps}")
            
            # Motivation on milestones
            if current_reps in self.motivation_milestones:
                self.speak_async(self.motivation_milestones[current_reps])
    
    def give_posture_feedback(self, posture_errors: list, metrics: Dict):
        """Provide posture-specific corrections based on detected errors"""
        current_time = (datetime.now() - self.last_feedback_time).total_seconds() * 1000
        
        if current_time - self.last_posture_warning < self.posture_warning_cooldown:
            return  # Cooldown to avoid spam
        
        if not posture_errors:
            return
        
        posture_messages = {
            "back_not_straight": "Keep your back straight. No slouching.",
            "shoulders_uneven": "Level your shoulders. Avoid leaning to one side.",
            "knee_bent": "Straighten your knee fully at the top of the movement.",
            "knee_not_bent": "Bend your knee more at the bottom position.",
            "hip_misaligned": "Align your hips properly. Keep them stable.",
            "elbow_position": "Check your elbow position. Keep it tucked.",
            "wrist_not_aligned": "Keep your wrist straight. Avoid bending it.",
            "neck_position": "Keep your head neutral. Don't look down.",
            "core_not_engaged": "Engage your core. Tighten your abs.",
        }
        
        # Give feedback for first error detected
        for error in posture_errors:
            if error in posture_messages:
                self.speak_async(posture_messages[error])
                self.last_posture_warning = current_time
                break
    
    def give_rest_suggestion(self, metrics: Dict):
        """Suggest rest if time gap between reps is too large"""
        if len(self.rep_times) < 2:
            return
        
        # Check time gap between last two reps
        time_gaps = []
        for i in range(len(self.rep_times) - 1, max(0, len(self.rep_times) - 4), -1):
            gap = self.rep_times[i] - self.rep_times[i-1] if i > 0 else 0
            time_gaps.append(gap)
        
        if not time_gaps:
            return
        
        avg_gap = sum(time_gaps[:-1]) / len(time_gaps[:-1]) if len(time_gaps) > 1 else time_gaps[0]
        current_gap = time_gaps[-1]
        
        # If current gap is 50% larger than average, suggest rest
        if current_gap > avg_gap * 1.5 and avg_gap > 0:
            self.speak_async("Taking longer between reps? Take a quick breather if needed.")
            
            # Reset cooldown to avoid repeating
            self.rest_suggestion_cooldown['rest'] = datetime.now()
    
    def give_session_feedback(self, metrics: Dict):
        """Comprehensive real-time feedback"""
        if metrics.get('fatigue_detected'):
            self.speak_async("You're tiring. Focus on form over quantity. Breathe steadily.")
        
        if metrics.get('avg_rom', 0) < 30:
            self.speak_async("Extend your range of motion more.")
        
        if metrics.get('rom_reduction', 0) > 20:
            self.speak_async("Your range is decreasing. Take a rest if needed.")
