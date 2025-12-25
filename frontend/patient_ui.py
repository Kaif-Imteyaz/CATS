import tkinter as tk
from tkinter import ttk, messagebox
import cv2
from PIL import Image, ImageTk
import requests
import json
from pose_session import PoseSession
from voice_coach import VoiceCoach
import threading
from datetime import datetime

class PatientUI:
    """Patient interface with live exercise, camera toggle, and voice coach"""
    
    def __init__(self, user_id: int, name: str, backend_url: str = "http://localhost:8000"):
        self.user_id = user_id
        self.name = name
        self.backend_url = backend_url
        self.voice_coach = VoiceCoach()
        self.current_session = None
        self.cap = None
        self.is_running = False
        self.camera_enabled = True  # Camera toggle state
        self.session_start_time = None
        self.last_rep_time = None
        
        # Main window
        self.root = tk.Tk()
        self.root.title(f"CATS - Patient Portal ({name})")
        self.root.geometry("1400x900")
        self.root.configure(bg="#f0f8f5")
        
        self.current_screen = None
        self.show_home_screen()
    
    def show_home_screen(self):
        """Patient home/today's session screen"""
        if self.current_screen:
            self.current_screen.destroy()
        
        self.current_screen = ttk.Frame(self.root)
        self.current_screen.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        ttk.Label(self.current_screen, text="Today's Session", font=("Arial", 24, "bold"), foreground="#2d7d6d").pack(pady=20)
        
        privacy_frame = ttk.Frame(self.current_screen)
        privacy_frame.pack(fill=tk.X, padx=10, pady=10)
        ttk.Label(privacy_frame, text="🔒 Privacy Protected - All processing local", font=("Arial", 10), foreground="#1abc9c").pack(side=tk.LEFT)
        
        ttk.Label(self.current_screen, text="Select Exercise:", font=("Arial", 12)).pack(anchor=tk.W, padx=20, pady=10)
        
        try:
            resp = requests.get(f"{self.backend_url}/exercises")
            exercises = resp.json().get("exercises", [])
        except:
            exercises = []
        
        self.exercise_var = tk.StringVar()
        exercise_dropdown = ttk.Combobox(
            self.current_screen,
            textvariable=self.exercise_var,
            values=[e['name'] for e in exercises],
            state='readonly',
            width=30,
            font=("Arial", 11)
        )
        exercise_dropdown.pack(pady=10, padx=20)
        self.exercises = {e['name']: e for e in exercises}
        
        start_btn = tk.Button(
            self.current_screen,
            text="Start Exercise",
            command=self.start_exercise,
            bg="#1abc9c",
            fg="white",
            font=("Arial", 12, "bold"),
            padx=20,
            pady=10
        )
        start_btn.pack(pady=30)
        
        history_btn = tk.Button(
            self.current_screen,
            text="View Progress History",
            command=self.show_history_screen,
            bg="#3498db",
            fg="white",
            font=("Arial", 11),
            padx=20,
            pady=8
        )
        history_btn.pack(pady=10)
    
    def start_exercise(self):
        """Start live exercise session"""
        if not self.exercise_var.get():
            messagebox.showwarning("Select Exercise", "Please select an exercise")
            return
        
        exercise_name = self.exercise_var.get()
        exercise = self.exercises[exercise_name]
        
        self.show_exercise_screen(exercise)
    
    def show_exercise_screen(self, exercise: dict):
        """Live exercise screen with camera toggle and enhanced voice coach"""
        if self.current_screen:
            self.current_screen.destroy()
        
        self.current_screen = ttk.Frame(self.root)
        self.current_screen.pack(fill=tk.BOTH, expand=True)
        
        # Top bar
        top_frame = ttk.Frame(self.current_screen)
        top_frame.pack(fill=tk.X, padx=10, pady=10)
        ttk.Label(top_frame, text=f"Exercise: {exercise['name']}", font=("Arial", 14, "bold")).pack(side=tk.LEFT)
        ttk.Label(top_frame, text="🔒 Local Processing", font=("Arial", 9), foreground="#1abc9c").pack(side=tk.RIGHT)
        
        content = ttk.Frame(self.current_screen)
        content.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left: Camera feed
        left_panel = ttk.Frame(content)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10)
        
        ttk.Label(left_panel, text="Camera Feed", font=("Arial", 11, "bold")).pack()
        self.camera_label = ttk.Label(left_panel, background="#000000")
        self.camera_label.pack(fill=tk.BOTH, expand=True, pady=10)
        
        camera_btn_frame = ttk.Frame(left_panel)
        camera_btn_frame.pack(fill=tk.X, pady=5)
        self.camera_btn = tk.Button(
            camera_btn_frame,
            text="📷 Camera ON",
            command=self.toggle_camera,
            bg="#27ae60",
            fg="white",
            font=("Arial", 10, "bold")
        )
        self.camera_btn.pack(fill=tk.X)
        
        # Right: Metrics panel
        right_panel = ttk.Frame(content)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, padx=10)
        
        ttk.Label(right_panel, text="Session Metrics", font=("Arial", 11, "bold")).pack(pady=10)
        
        self.metrics_labels = {}
        metrics_to_show = ["Reps", "Speed", "ROM", "Fatigue", "Posture"]
        
        for metric in metrics_to_show:
            frame = ttk.Frame(right_panel)
            frame.pack(fill=tk.X, pady=8, padx=10)
            ttk.Label(frame, text=f"{metric}:", font=("Arial", 10)).pack(side=tk.LEFT)
            label = ttk.Label(frame, text="--", font=("Arial", 11, "bold"), foreground="#1abc9c")
            label.pack(side=tk.RIGHT)
            self.metrics_labels[metric] = label
        
        # Motivation text display
        self.motivation_label = ttk.Label(right_panel, text="", font=("Arial", 10, "italic"), foreground="#e74c3c")
        self.motivation_label.pack(pady=15)
        
        # Control buttons
        btn_frame = ttk.Frame(right_panel)
        btn_frame.pack(fill=tk.X, pady=20, padx=10)
        
        self.stop_btn = tk.Button(
            btn_frame,
            text="Stop Exercise",
            command=self.stop_exercise,
            bg="#e74c3c",
            fg="white",
            font=("Arial", 10, "bold"),
            padx=15,
            pady=8
        )
        self.stop_btn.pack(fill=tk.X, pady=5)
        
        # Initialize
        try:
            config = exercise.get('config_json', {})
            if isinstance(config, str):
                config = json.loads(config)
        except:
            config = {"down_angle": 120, "up_angle": 170}
        
        self.current_session = PoseSession(self.user_id, exercise['id'], config, self.backend_url)
        self.voice_coach.set_session_target(config.get("target_reps", 15))
        
        self.is_running = True
        self.camera_enabled = True
        self.session_start_time = datetime.now()
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        threading.Thread(target=self._camera_thread, daemon=True).start()
    
    def toggle_camera(self):
        """Toggle camera feed"""
        self.camera_enabled = not self.camera_enabled
        if self.camera_enabled:
            self.camera_btn.config(text="📷 Camera ON", bg="#27ae60")
            self.voice_coach.speak_async("Camera enabled")
        else:
            self.camera_btn.config(text="📷 Camera OFF", bg="#95a5a6")
            self.voice_coach.speak_async("Camera disabled")
            self.camera_label.config(image='')
            self.camera_label.image = None
    
    def _camera_thread(self):
        """Background camera processing with advanced voice feedback"""
        while self.is_running and self.cap:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame = cv2.flip(frame, 1)
            annotated_frame, metrics, posture_errors = self.current_session.process_frame(frame)
            
            # Update camera display
            if self.camera_enabled:
                rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
                img = Image.fromarray(rgb)
                img.thumbnail((450, 400))
                photo = ImageTk.PhotoImage(img)
                
                self.camera_label.config(image=photo)
                self.camera_label.image = photo
            
            self.metrics_labels["Reps"].config(text=str(metrics['reps']))
            self.metrics_labels["Speed"].config(text=f"{metrics['avg_speed']:.3f}")
            self.metrics_labels["ROM"].config(text=f"{metrics['avg_rom']:.1f}°")
            self.metrics_labels["Fatigue"].config(text="YES" if metrics['fatigue_detected'] else "NO")
            posture_status = "✓" if not posture_errors else "✗ " + posture_errors[0]
            self.metrics_labels["Posture"].config(text=posture_status)
            
            # Rep counting
            if metrics['reps'] > (self.last_rep_time or 0):
                elapsed = (datetime.now() - self.session_start_time).total_seconds()
                self.voice_coach.give_rep_feedback(metrics['reps'], elapsed)
                self.last_rep_time = metrics['reps']
                
                # Motivation text
                if metrics['reps'] % 5 == 0:
                    self.motivation_label.config(text=f"🎯 {metrics['reps']} reps completed! Keep going!")
            
            # Posture feedback
            if posture_errors:
                self.voice_coach.give_posture_feedback(posture_errors, metrics)
            
            # Rest suggestion
            self.voice_coach.give_rest_suggestion(metrics)
            
            # General session feedback
            self.voice_coach.give_session_feedback(metrics)
            
            self.root.update()
    
    def stop_exercise(self):
        """End session and show summary"""
        self.is_running = False
        if self.cap:
            self.cap.release()
        
        if self.current_session:
            summary = self.current_session.end_session()
            self.show_summary_screen(summary)
    
    def show_summary_screen(self, summary: dict):
        """Session complete summary with motivation"""
        if self.current_screen:
            self.current_screen.destroy()
        
        self.current_screen = ttk.Frame(self.root)
        self.current_screen.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        ttk.Label(self.current_screen, text="Session Complete!", font=("Arial", 24, "bold"), foreground="#1abc9c").pack(pady=20)
        
        self.voice_coach.speak_async("Session complete! Excellent work today. Rest well.")
        
        stats_frame = ttk.Frame(self.current_screen)
        stats_frame.pack(fill=tk.X, padx=20, pady=20)
        
        for key, val in summary.items():
            if isinstance(val, float):
                val = f"{val:.2f}"
            ttk.Label(stats_frame, text=f"{key.replace('_', ' ').title()}: {val}", font=("Arial", 12)).pack(anchor=tk.W, pady=5)
        
        ttk.Button(self.current_screen, text="Back to Home", command=self.show_home_screen).pack(pady=20)
    
    def show_history_screen(self):
        """Progress history view"""
        if self.current_screen:
            self.current_screen.destroy()
        
        self.current_screen = ttk.Frame(self.root)
        self.current_screen.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        ttk.Label(self.current_screen, text="Progress History", font=("Arial", 20, "bold")).pack(pady=10)
        
        try:
            resp = requests.get(f"{self.backend_url}/sessions/history/{self.user_id}")
            sessions = resp.json().get("sessions", [])
        except:
            sessions = []
        
        for session in sessions[:10]:
            frame = ttk.Frame(self.current_screen, relief=tk.SUNKEN, borderwidth=1)
            frame.pack(fill=tk.X, pady=5, padx=10)
            ttk.Label(frame, text=f"Date: {session.get('created_at', 'N/A')} | Reps: {session.get('session_summary', {}).get('reps', 0)}", font=("Arial", 10)).pack(anchor=tk.W, padx=10, pady=5)
        
        ttk.Button(self.current_screen, text="Back", command=self.show_home_screen).pack(pady=10)
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    ui = PatientUI(1, "John Doe")
    ui.run()
