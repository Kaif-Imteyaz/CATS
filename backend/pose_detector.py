import cv2
import mediapipe as mp
import numpy as np
from typing import List, Tuple

class PoseDetector:
    """MediaPipe BlazePose detector for real-time pose estimation"""
    
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.mp_drawing = mp.solutions.drawing_utils
    
    def detect(self, frame):
        """Detect pose landmarks in frame"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)
        return results
    
    def get_landmarks(self, results) -> List[Tuple[float, float, float]]:
        """Extract landmarks as (x, y, confidence) tuples"""
        if not results.pose_landmarks:
            return []
        
        landmarks = []
        for landmark in results.pose_landmarks.landmark:
            landmarks.append((landmark.x, landmark.y, landmark.visibility))
        return landmarks
    
    def calculate_angle(self, p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]) -> float:
        """Calculate angle between three points"""
        a = np.array(p1)
        b = np.array(p2)
        c = np.array(p3)
        
        ba = a - b
        bc = c - b
        
        cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
        angle = np.arccos(np.clip(cos_angle, -1, 1))
        return np.degrees(angle)
    
    def draw_skeleton(self, frame, results):
        """Draw pose skeleton on frame"""
        if results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                frame,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS
            )
        return frame
