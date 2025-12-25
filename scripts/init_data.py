#!/usr/bin/env python
"""Initialize CATS system with default exercises and test users"""

import json
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from main import USERS_FILE, EXERCISES_FILE, load_json, save_json

def init_exercises():
    """Load default exercises"""
    exercises_path = Path(__file__).parent.parent / "data" / "exercises.json"
    
    if exercises_path.exists():
        with open(exercises_path, 'r') as f:
            exercises = json.load(f)
        save_json(EXERCISES_FILE, exercises)
        print(f"Loaded {len(exercises)} exercises")
    else:
        print("exercises.json not found")

def init_test_users():
    """Create test users"""
    users = load_json(USERS_FILE)
    
    test_users = {
        "patient@test.com": {
            "id": "1",
            "email": "patient@test.com",
            "password": "pass123",
            "name": "Patient John",
            "role": "patient"
        },
        "doctor@test.com": {
            "id": "2",
            "email": "doctor@test.com",
            "password": "pass123",
            "name": "Dr. Sarah",
            "role": "doctor"
        }
    }
    
    users.update(test_users)
    save_json(USERS_FILE, users)
    print("Created test users")
    print("  Patient: patient@test.com / pass123")
    print("  Doctor: doctor@test.com / pass123")

if __name__ == "__main__":
    print("Initializing CATS system...\n")
    init_exercises()
    init_test_users()
    print("\n CATS system initialized successfully!")
