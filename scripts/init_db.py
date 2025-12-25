import sqlite3
import json

DB_PATH = "cats.db"

def init_database():
    """Initialize database with default exercises"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Load exercises from config
    with open("config/exercises.json", "r") as f:
        exercises = json.load(f)
    
    # Insert default exercises
    for exercise_key, exercise_data in exercises.items():
        c.execute(
            "INSERT OR IGNORE INTO exercises (name, category, description, target_reps, config_json) VALUES (?, ?, ?, ?, ?)",
            (
                exercise_data['name'],
                exercise_data['category'],
                exercise_data['description'],
                exercise_data['target_reps'],
                json.dumps(exercise_data)
            )
        )
    
    # Create default test users
    test_users = [
        ("patient@test.com", "pass123", "Test Patient", "patient"),
        ("doctor@test.com", "pass123", "Test Doctor", "doctor")
    ]
    
    for email, password, name, role in test_users:
        c.execute(
            "INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
            (email, password, name, role)
        )
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_database()
