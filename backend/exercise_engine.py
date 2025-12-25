import json
from typing import Dict, List, Tuple
import numpy as np
from pose_detector import PoseDetector

class ExerciseEngine:
    """Handles exercise logic with posture detection and rep counting"""
    
    def __init__(self, exercise_config: Dict):
        self.config = exercise_config
        self.rep_count = 0
        self.state = "down"
        self.landmarks_history = []
        self.rom_values = []
        self.speeds = []
        self.detector = PoseDetector()
        self.frame_count = 0
        self.last_rep_time = 0
        
        self.coco_points = {
            "nose": 0,
            "left_shoulder": 11,
            "right_shoulder": 12,
            "left_elbow": 13,
            "right_elbow": 14,
            "left_wrist": 15,
            "right_wrist": 16,
            "left_hip": 23,
            "right_hip": 24,
            "left_knee": 25,
            "right_knee": 26,
            "left_ankle": 27,
            "right_ankle": 28,
        }
    
    def process_frame(self, frame, results) -> Tuple[Dict, List]:
        """Process frame and return metrics + posture errors"""
        landmarks = self.detector.get_landmarks(results)
        posture_errors = []
        
        if not landmarks:
            return self._get_metrics(), posture_errors
        
        self.landmarks_history.append(landmarks)
        if len(self.landmarks_history) > 100:
            self.landmarks_history.pop(0)
        
        self.frame_count += 1
        
        keypoints = self.config.get("keypoints", {}).get("right", [0, 1, 2])
        if len(keypoints) == 3 and len(landmarks) > max(keypoints):
            p1 = (landmarks[keypoints[0]][0], landmarks[keypoints[0]][1])
            p2 = (landmarks[keypoints[1]][0], landmarks[keypoints[1]][1])
            p3 = (landmarks[keypoints[2]][0], landmarks[keypoints[2]][1])
            
            angle = self.detector.calculate_angle(p1, p2, p3)
            self.rom_values.append(angle)
            
            down_threshold = self.config.get("down_angle", 120)
            up_threshold = self.config.get("up_angle", 170)
            
            if self.state == "down" and angle > up_threshold:
                self.state = "up"
                self.rep_count += 1
                self.last_rep_time = self.frame_count
            elif self.state == "up" and angle < down_threshold:
                self.state = "down"
        
        if len(self.landmarks_history) >= 5:
            diffs = []
            for i in range(len(self.landmarks_history) - 1):
                diff = np.linalg.norm(np.array(self.landmarks_history[i]) - np.array(self.landmarks_history[i+1]))
                diffs.append(diff)
            if diffs:
                speed = np.mean(diffs)
                self.speeds.append(speed)
        
        posture_errors = self._check_posture(landmarks)
        
        return self._get_metrics(), posture_errors
    
    def _check_posture(self, landmarks: List) -> List[str]:
        """Check posture based on COCO keypoint positions"""
        errors = []
        
        if len(landmarks) < 29:
            return errors
        
        # Check if shoulders are level (y-coordinate should be similar)
        left_shoulder = landmarks[self.coco_points["left_shoulder"]]
        right_shoulder = landmarks[self.coco_points["right_shoulder"]]
        shoulder_diff = abs(left_shoulder[1] - right_shoulder[1])
        if shoulder_diff > 0.1:  # Significant height difference
            errors.append("shoulders_uneven")
        
        # Check if back is straight (nose over hips)
        nose = landmarks[self.coco_points["nose"]]
        left_hip = landmarks[self.coco_points["left_hip"]]
        right_hip = landmarks[self.coco_points["right_hip"]]
        hip_center_x = (left_hip[0] + right_hip[0]) / 2
        if abs(nose[0] - hip_center_x) > 0.15:
            errors.append("back_not_straight")
        
        # Check hip alignment
        hip_diff = abs(left_hip[1] - right_hip[1])
        if hip_diff > 0.1:
            errors.append("hip_misaligned")
        
        # Check knee alignment (for lower body exercises)
        left_knee = landmarks[self.coco_points["left_knee"]]
        right_knee = landmarks[self.coco_points["right_knee"]]
        knee_y_diff = abs(left_knee[1] - right_knee[1])
        if knee_y_diff > 0.12:
            errors.append("knee_not_aligned")
        
        # Check neck position (nose should be forward, not tilted down)
        if nose[1] < 0.1:  # Head too far back
            errors.append("neck_position")
        
        return errors
    
    def _get_metrics(self) -> Dict:
        """Calculate current session metrics"""
        avg_rom = np.mean(self.rom_values) if self.rom_values else 0
        rom_reduction = self._calculate_rom_reduction()
        avg_speed = np.mean(self.speeds) if self.speeds else 0
        fatigue = rom_reduction > 15 or avg_speed < 0.01
        
        return {
            "reps": self.rep_count,
            "avg_rom": float(avg_rom),
            "avg_speed": float(avg_speed),
            "fatigue_detected": fatigue,
            "rom_reduction": float(rom_reduction),
            "frame_count": self.frame_count
        }
    
    def _calculate_rom_reduction(self) -> float:
        """Detect fatigue by ROM reduction"""
        if len(self.rom_values) < 20:
            return 0
        
        first_half = np.mean(self.rom_values[:len(self.rom_values)//2])
        second_half = np.mean(self.rom_values[len(self.rom_values)//2:])
        
        reduction = ((first_half - second_half) / first_half * 100) if first_half > 0 else 0
        return max(0, reduction)
    
    def reset(self):
        """Reset session state"""
        self.rep_count = 0
        self.state = "down"
        self.landmarks_history = []
        self.rom_values = []
        self.speeds = []
        self.frame_count = 0
