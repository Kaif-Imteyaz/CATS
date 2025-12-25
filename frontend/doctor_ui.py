import tkinter as tk
from tkinter import ttk, messagebox
import requests
import json

class DoctorUI:
    """Doctor dashboard for managing patients and exercise plans"""
    
    def __init__(self, doctor_id: int, name: str, backend_url: str = "http://localhost:8000"):
        self.doctor_id = doctor_id
        self.name = name
        self.backend_url = backend_url
        
        self.root = tk.Tk()
        self.root.title(f"CATS - Doctor Dashboard ({name})")
        self.root.geometry("1200x800")
        self.root.configure(bg="#f0f8f5")
        
        self.current_screen = None
        self.show_patients_list()
    
    def show_patients_list(self):
        """List all assigned patients"""
        if self.current_screen:
            self.current_screen.destroy()
        
        self.current_screen = ttk.Frame(self.root)
        self.current_screen.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        ttk.Label(self.current_screen, text="My Patients", font=("Arial", 24, "bold"), foreground="#2d7d6d").pack(pady=20)
        
        # Mock patient data
        patients = [
            {"id": 1, "name": "Alice Johnson", "status": "Active", "progress": 85},
            {"id": 2, "name": "Bob Smith", "status": "Active", "progress": 60},
            {"id": 3, "name": "Carol White", "status": "Rest Day", "progress": 45}
        ]
        
        # Patient list
        list_frame = ttk.Frame(self.current_screen)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        for patient in patients:
            pat_frame = ttk.Frame(list_frame, relief=tk.SUNKEN, borderwidth=1)
            pat_frame.pack(fill=tk.X, pady=5, padx=5)
            
            info_frame = ttk.Frame(pat_frame)
            info_frame.pack(fill=tk.X, padx=10, pady=10, side=tk.LEFT)
            
            ttk.Label(info_frame, text=patient['name'], font=("Arial", 12, "bold")).pack(anchor=tk.W)
            ttk.Label(info_frame, text=f"Status: {patient['status']} | Progress: {patient['progress']}%", font=("Arial", 10)).pack(anchor=tk.W)
            
            # Buttons
            btn_frame = ttk.Frame(pat_frame)
            btn_frame.pack(side=tk.RIGHT, padx=10, pady=10)
            
            ttk.Button(btn_frame, text="View Summary", command=lambda pid=patient['id']: self.show_patient_summary(pid)).pack(side=tk.LEFT, padx=5)
            ttk.Button(btn_frame, text="Assign Plan", command=lambda pid=patient['id']: self.show_exercise_plan(pid)).pack(side=tk.LEFT, padx=5)
        
        # Add new exercise
        ttk.Button(self.current_screen, text="Manage Exercises", command=self.show_exercise_library).pack(pady=10)
    
    def show_patient_summary(self, patient_id: int):
        """View patient progress and session history"""
        if self.current_screen:
            self.current_screen.destroy()
        
        self.current_screen = ttk.Frame(self.root)
        self.current_screen.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        ttk.Label(self.current_screen, text="Patient Summary", font=("Arial", 20, "bold")).pack(pady=10)
        
        # Fetch patient sessions
        try:
            resp = requests.get(f"{self.backend_url}/sessions/history/{patient_id}")
            sessions = resp.json().get("sessions", [])
        except:
            sessions = []
        
        # Summary stats
        if sessions:
            avg_completion = sum(s.get('completion', 0) for s in sessions) / len(sessions)
            total_sessions = len(sessions)
            
            stats = [
                f"Total Sessions: {total_sessions}",
                f"Avg Completion: {avg_completion:.1f}%",
                f"Fatigue Events: {sum(1 for s in sessions if s.get('fatigue'))}",
                f"Last Session: {sessions[0].get('date', 'N/A')}"
            ]
            
            for stat in stats:
                ttk.Label(self.current_screen, text=stat, font=("Arial", 11)).pack(anchor=tk.W, pady=5, padx=20)
        
        # Session details table
        ttk.Label(self.current_screen, text="Recent Sessions:", font=("Arial", 12, "bold")).pack(anchor=tk.W, pady=(20, 10), padx=20)
        
        for session in sessions[:5]:
            frame = ttk.Frame(self.current_screen)
            frame.pack(fill=tk.X, pady=3, padx=20)
            ttk.Label(frame, text=f"Date: {session.get('date')} | Completion: {session.get('completion', 0):.1f}% | Speed: {session.get('speed', 0):.3f}", font=("Arial", 10)).pack(anchor=tk.W)
        
        ttk.Button(self.current_screen, text="Back", command=self.show_patients_list).pack(pady=20)
    
    def show_exercise_plan(self, patient_id: int):
        """Create/update exercise plan for patient"""
        if self.current_screen:
            self.current_screen.destroy()
        
        self.current_screen = ttk.Frame(self.root)
        self.current_screen.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        ttk.Label(self.current_screen, text="Create Exercise Plan", font=("Arial", 20, "bold")).pack(pady=10)
        
        # Fetch available exercises
        try:
            resp = requests.get(f"{self.backend_url}/exercises")
            exercises = resp.json().get("exercises", [])
        except:
            exercises = []
        
        ttk.Label(self.current_screen, text="Select Exercises:", font=("Arial", 11)).pack(anchor=tk.W, padx=20, pady=10)
        
        # Checkboxes for exercises
        self.selected_exercises = {}
        for exercise in exercises:
            var = tk.BooleanVar()
            ttk.Checkbutton(self.current_screen, text=f"{exercise['name']} ({exercise['target_reps']} reps)", variable=var).pack(anchor=tk.W, padx=40, pady=3)
            self.selected_exercises[exercise['id']] = var
        
        # Additional options
        ttk.Label(self.current_screen, text="Frequency:", font=("Arial", 11)).pack(anchor=tk.W, padx=20, pady=(20, 10))
        freq_var = tk.StringVar()
        for freq in ["Daily", "3x Per Week", "2x Per Week"]:
            ttk.Radiobutton(self.current_screen, text=freq, variable=freq_var, value=freq).pack(anchor=tk.W, padx=40, pady=3)
        
        def save_plan():
            selected_ids = [eid for eid, var in self.selected_exercises.items() if var.get()]
            if not selected_ids:
                messagebox.showwarning("No Selection", "Select at least one exercise")
                return
            
            # Save to backend
            try:
                requests.post(f"{self.backend_url}/exercise-plans/create", json={
                    "doctor_id": self.doctor_id,
                    "patient_id": patient_id,
                    "exercises": selected_ids,
                    "frequency": freq_var.get()
                })
                messagebox.showinfo("Success", "Exercise plan assigned!")
                self.show_patients_list()
            except:
                messagebox.showerror("Error", "Failed to save plan")
        
        ttk.Button(self.current_screen, text="Save Plan", command=save_plan).pack(pady=20)
        ttk.Button(self.current_screen, text="Back", command=self.show_patients_list).pack(pady=5)
    
    def show_exercise_library(self):
        """Manage exercise database"""
        if self.current_screen:
            self.current_screen.destroy()
        
        self.current_screen = ttk.Frame(self.root)
        self.current_screen.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        ttk.Label(self.current_screen, text="Exercise Library", font=("Arial", 20, "bold")).pack(pady=10)
        
        # Fetch exercises
        try:
            resp = requests.get(f"{self.backend_url}/exercises")
            exercises = resp.json().get("exercises", [])
        except:
            exercises = []
        
        # Display exercises
        for exercise in exercises:
            frame = ttk.Frame(self.current_screen, relief=tk.SUNKEN, borderwidth=1)
            frame.pack(fill=tk.X, pady=5, padx=10)
            
            ttk.Label(frame, text=f"{exercise['name']} ({exercise['category']})", font=("Arial", 11, "bold")).pack(anchor=tk.W, padx=10, pady=5)
            ttk.Label(frame, text=f"Target: {exercise['target_reps']} reps | {exercise['description']}", font=("Arial", 9)).pack(anchor=tk.W, padx=10, pady=2)
        
        # Add new exercise
        ttk.Label(self.current_screen, text="Add New Exercise:", font=("Arial", 12, "bold")).pack(anchor=tk.W, pady=(20, 10), padx=10)
        
        form_frame = ttk.Frame(self.current_screen)
        form_frame.pack(fill=tk.X, padx=20, pady=10)
        
        ttk.Label(form_frame, text="Name:").pack(anchor=tk.W, pady=5)
        name_entry = ttk.Entry(form_frame, width=30)
        name_entry.pack(anchor=tk.W, pady=5)
        
        ttk.Label(form_frame, text="Category:").pack(anchor=tk.W, pady=5)
        category_entry = ttk.Entry(form_frame, width=30)
        category_entry.pack(anchor=tk.W, pady=5)
        
        ttk.Label(form_frame, text="Target Reps:").pack(anchor=tk.W, pady=5)
        reps_entry = ttk.Entry(form_frame, width=30)
        reps_entry.pack(anchor=tk.W, pady=5)
        
        def add_exercise():
            try:
                requests.post(f"{self.backend_url}/exercises/add", json={
                    "name": name_entry.get(),
                    "category": category_entry.get(),
                    "description": "",
                    "target_reps": int(reps_entry.get()),
                    "config_json": json.dumps({"down_angle": 120, "up_angle": 170})
                })
                messagebox.showinfo("Success", "Exercise added!")
                self.show_exercise_library()
            except:
                messagebox.showerror("Error", "Failed to add exercise")
        
        ttk.Button(form_frame, text="Add Exercise", command=add_exercise).pack(pady=20)
        ttk.Button(self.current_screen, text="Back", command=self.show_patients_list).pack(pady=10)
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    ui = DoctorUI(1, "Dr. Sarah")
    ui.run()
