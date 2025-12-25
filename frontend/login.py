import tkinter as tk
from tkinter import ttk, messagebox
import requests
from patient_ui import PatientUI
from doctor_ui import DoctorUI

class LoginUI:
    """Main login screen"""
    
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        
        self.root = tk.Tk()
        self.root.title("CATS - Clinical AI Training System")
        self.root.geometry("600x500")
        self.root.configure(bg="#f0f8f5")
        
        self.show_login_screen()
    
    def show_login_screen(self):
        """Main login screen"""
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=40, pady=40)
        
        # Header
        ttk.Label(main_frame, text="CATS", font=("Arial", 28, "bold"), foreground="#1abc9c").pack(pady=20)
        ttk.Label(main_frame, text="Clinical AI Training System", font=("Arial", 12), foreground="#7f8c8d").pack()
        
        # Login form
        ttk.Label(main_frame, text="Email:", font=("Arial", 11)).pack(anchor=tk.W, pady=(30, 5))
        email_entry = ttk.Entry(main_frame, width=35)
        email_entry.pack(pady=5)
        
        ttk.Label(main_frame, text="Password:", font=("Arial", 11)).pack(anchor=tk.W, pady=(15, 5))
        password_entry = ttk.Entry(main_frame, width=35, show="*")
        password_entry.pack(pady=5)
        
        # Role selection
        ttk.Label(main_frame, text="Role:", font=("Arial", 11)).pack(anchor=tk.W, pady=(15, 5))
        role_var = tk.StringVar(value="patient")
        ttk.Radiobutton(main_frame, text="Patient", variable=role_var, value="patient").pack(anchor=tk.W, pady=3)
        ttk.Radiobutton(main_frame, text="Doctor", variable=role_var, value="doctor").pack(anchor=tk.W, pady=3)
        
        # Login button
        def login():
            email = email_entry.get()
            password = password_entry.get()
            role = role_var.get()
            
            if not email or not password:
                messagebox.showwarning("Input Error", "Enter email and password")
                return
            
            try:
                resp = requests.post(f"{self.backend_url}/auth/login", json={"email": email, "password": password})
                if resp.status_code == 200:
                    user = resp.json()
                    self.root.destroy()
                    
                    if role == "patient":
                        ui = PatientUI(user['id'], user['name'], self.backend_url)
                    else:
                        ui = DoctorUI(user['id'], user['name'], self.backend_url)
                    ui.run()
                else:
                    messagebox.showerror("Error", "Invalid credentials")
            except:
                messagebox.showerror("Error", "Backend connection failed")
        
        login_btn = tk.Button(
            main_frame,
            text="Login",
            command=login,
            bg="#1abc9c",
            fg="white",
            font=("Arial", 11, "bold"),
            padx=20,
            pady=10
        )
        login_btn.pack(pady=30)
        
        # Register link
        ttk.Label(main_frame, text="New user? Click here to register", font=("Arial", 9), foreground="#3498db", cursor="hand2").pack(pady=10)
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    login = LoginUI()
    login.run()
