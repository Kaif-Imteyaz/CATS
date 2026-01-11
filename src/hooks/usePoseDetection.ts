import { useRef, useEffect, useState, useCallback } from 'react';
import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export interface PoseData {
  landmarks: Results['poseLandmarks'];
  worldLandmarks: Results['poseWorldLandmarks'];
}

export interface PoseAnalysis {
  isVisible: boolean;
  formScore: number;
  feedback: { type: 'good' | 'warning' | 'error'; message: string }[];
  angles: {
    leftShoulder?: number;
    rightShoulder?: number;
    leftElbow?: number;
    rightElbow?: number;
    leftSpineAngle?: number;
    rightSpineAngle?: number;
    leftKnee?: number;
    rightKnee?: number;
    leftHip?: number;
    rightHip?: number;
  };
  shoulderAngle?: number;
  elbowAngle?: number;
  postureScore?: number;
}

interface UsePoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onPoseDetected?: (data: PoseData, analysis: PoseAnalysis) => void;
  enabled?: boolean;
  mirrored?: boolean;
  exerciseType?: string;
  onVoiceFeedback?: (message: string) => void;
}

// Calculate angle between three points
function calculateAngle(
  a: { x: number; y: number; z?: number },
  b: { x: number; y: number; z?: number },
  c: { x: number; y: number; z?: number }
): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Speak text using Web Speech API
function speakText(text: string) {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking === false) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
}

// Analyze overhead press form specifically
function analyzeOverheadPress(landmarks: Results['poseLandmarks'], shouldSpeak: boolean = false): PoseAnalysis {
  if (!landmarks || landmarks.length === 0) {
    return {
      isVisible: false,
      formScore: 0,
      feedback: [{ type: 'warning', message: 'Please make sure you are visible in the camera' }],
      angles: {},
    };
  }

  const feedback: PoseAnalysis['feedback'] = [];
  let formScore = 100;
  const angles: PoseAnalysis['angles'] = {};
  let shoulderAngle = 0;
  let elbowAngle = 0;
  let postureScore = 100;

  // Calculate shoulder angles (between hip, shoulder, and elbow)
  if (landmarks[23] && landmarks[11] && landmarks[13]) {
    angles.leftShoulder = calculateAngle(landmarks[23], landmarks[11], landmarks[13]);
  }
  if (landmarks[24] && landmarks[12] && landmarks[14]) {
    angles.rightShoulder = calculateAngle(landmarks[24], landmarks[12], landmarks[14]);
  }

  // Calculate elbow angles (shoulder, elbow, wrist)
  if (landmarks[11] && landmarks[13] && landmarks[15]) {
    angles.leftElbow = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
  }
  if (landmarks[12] && landmarks[14] && landmarks[16]) {
    angles.rightElbow = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
  }

  // Calculate spine angles (neck, shoulder, hip)
  if (landmarks[0] && landmarks[11] && landmarks[23]) {
    angles.leftSpineAngle = calculateAngle(landmarks[0], landmarks[11], landmarks[23]);
  }
  if (landmarks[0] && landmarks[12] && landmarks[24]) {
    angles.rightSpineAngle = calculateAngle(landmarks[0], landmarks[12], landmarks[24]);
  }

  // Calculate average shoulder and elbow angles
  if (angles.leftShoulder && angles.rightShoulder) {
    shoulderAngle = (angles.leftShoulder + angles.rightShoulder) / 2;
  }
  if (angles.leftElbow && angles.rightElbow) {
    elbowAngle = (angles.leftElbow + angles.rightElbow) / 2;
  }

  // Analyze overhead press form
  if (elbowAngle > 160) {
    feedback.push({ type: 'good', message: 'Excellent extension!' });
  } else if (elbowAngle > 140) {
    feedback.push({ type: 'good', message: 'Almost there, push a little higher' });
  } else if (elbowAngle > 120) {
    feedback.push({ type: 'warning', message: 'Push higher for full extension' });
    formScore -= 10;
  }

  return {
    isVisible: true,
    formScore: Math.max(0, Math.min(100, formScore)),
    feedback,
    angles,
    shoulderAngle,
    elbowAngle,
    postureScore,
  };
}

// Analyze squat form specifically
function analyzeSquat(landmarks: Results['poseLandmarks'], shouldSpeak: boolean = false): PoseAnalysis {
  if (!landmarks || landmarks.length === 0) {
    return {
      isVisible: false,
      formScore: 0,
      feedback: [{ type: 'warning', message: 'Please make sure you are visible in the camera' }],
      angles: {},
    };
  }

  const feedback: PoseAnalysis['feedback'] = [];
  let formScore = 100;
  const angles: PoseAnalysis['angles'] = {};

  // Calculate knee angles
  if (landmarks[23] && landmarks[25] && landmarks[27]) {
    angles.leftKnee = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
  }
  if (landmarks[24] && landmarks[26] && landmarks[28]) {
    angles.rightKnee = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
  }

  // Analyze squat depth
  const avgKneeAngle = ((angles.leftKnee || 180) + (angles.rightKnee || 180)) / 2;
  
  if (avgKneeAngle < 100) {
    feedback.push({ type: 'good', message: 'Excellent depth!' });
  } else if (avgKneeAngle < 120) {
    feedback.push({ type: 'good', message: 'Good form, keep going!' });
  } else if (avgKneeAngle < 140) {
    feedback.push({ type: 'warning', message: 'Try to go a bit deeper' });
    formScore -= 10;
  }

  return {
    isVisible: true,
    formScore: Math.max(0, Math.min(100, formScore)),
    feedback,
    angles,
  };
}

// Analyze pose based on exercise type
function analyzePose(landmarks: Results['poseLandmarks'], exerciseType?: string, shouldSpeak: boolean = false): PoseAnalysis {
  if (exerciseType === 'squat') {
    return analyzeSquat(landmarks, shouldSpeak);
  } else if (exerciseType === 'overhead-press') {
    return analyzeOverheadPress(landmarks, shouldSpeak);
  }
  
  // Fallback to overhead press analysis
  return analyzeOverheadPress(landmarks, shouldSpeak);
}

export function usePoseDetection({
  videoRef,
  canvasRef,
  onPoseDetected,
  enabled = true,
  mirrored = true,
  exerciseType = 'overhead-press',
  onVoiceFeedback,
}: UsePoseDetectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const onPoseDetectedRef = useRef(onPoseDetected);
  const onVoiceFeedbackRef = useRef(onVoiceFeedback);
  const initializedRef = useRef(false);
  const lastVoiceTimeRef = useRef<number>(0);
  const lastFeedbackRef = useRef<string>('');
  const animationFrameRef = useRef<number>(0);
  const lastAnalysisTimeRef = useRef<number>(0);

  // Keep callback refs updated
  useEffect(() => {
    onPoseDetectedRef.current = onPoseDetected;
    onVoiceFeedbackRef.current = onVoiceFeedback;
  }, [onPoseDetected, onVoiceFeedback]);

  const drawResults = useCallback((results: Results, canvas: HTMLCanvasElement, video: HTMLVideoElement, mirror: boolean) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use requestAnimationFrame for smooth rendering
    cancelAnimationFrame(animationFrameRef.current);
    
    animationFrameRef.current = requestAnimationFrame(() => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.save();
      if (mirror) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
      }
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      if (results.poseLandmarks) {
        ctx.save();
        if (mirror) {
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
        }

        // Draw pose connections with reduced line width
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: '#6BDFB8',
          lineWidth: 2,
        });

        // Draw landmarks with reduced size
        drawLandmarks(ctx, results.poseLandmarks, {
          color: '#4A6FA5',
          fillColor: '#6BDFB8',
          lineWidth: 1,
          radius: 4,
        });

        // Draw angle measurements based on exercise type (simplified)
        if (results.poseLandmarks.length >= 16) {
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          
          if (exerciseType === 'overhead-press' && results.poseLandmarks[13] && results.poseLandmarks[11] && results.poseLandmarks[15]) {
            const elbowAngle = calculateAngle(
              results.poseLandmarks[11],
              results.poseLandmarks[13],
              results.poseLandmarks[15]
            );
            
            const elbowX = results.poseLandmarks[13].x * canvas.width;
            const elbowY = results.poseLandmarks[13].y * canvas.height;
            
            ctx.fillText(`${Math.round(elbowAngle)}°`, elbowX, elbowY - 10);
          }

          if (exerciseType === 'squat' && results.poseLandmarks[23] && results.poseLandmarks[25] && results.poseLandmarks[27]) {
            const kneeAngle = calculateAngle(
              results.poseLandmarks[23],
              results.poseLandmarks[25],
              results.poseLandmarks[27]
            );
            
            const kneeX = results.poseLandmarks[25].x * canvas.width;
            const kneeY = results.poseLandmarks[25].y * canvas.height;
            
            ctx.fillText(`${Math.round(kneeAngle)}°`, kneeX, kneeY - 10);
          }
        }

        ctx.restore();
      }
    });
  }, [exerciseType]);

  useEffect(() => {
    if (!enabled || initializedRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let mounted = true;

    const initPose = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log(`Initializing MediaPipe Pose for ${exerciseType} analysis...`);

        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        // Optimized settings for better performance
        pose.setOptions({
          modelComplexity: 0, // Use 0 for fastest performance (1 for balanced)
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results: Results) => {
          if (!mounted) return;
          
          const currentCanvas = canvasRef.current;
          const currentVideo = videoRef.current;
          if (currentCanvas && currentVideo) {
            drawResults(results, currentCanvas, currentVideo, mirrored);
          }

          if (results.poseLandmarks && onPoseDetectedRef.current) {
            // Throttle analysis to ~10 FPS (100ms interval)
            const now = Date.now();
            if (now - lastAnalysisTimeRef.current < 100) {
              return;
            }
            lastAnalysisTimeRef.current = now;

            const analysis = analyzePose(results.poseLandmarks, exerciseType, true);
            onPoseDetectedRef.current(
              {
                landmarks: results.poseLandmarks,
                worldLandmarks: results.poseWorldLandmarks,
              },
              analysis
            );

            // Trigger voice feedback for important issues (throttled)
            if (analysis.feedback.length > 0) {
              const latestFeedback = analysis.feedback[analysis.feedback.length - 1];
              
              // Only speak if it's a warning/error and not spoken recently
              if ((latestFeedback.type === 'warning' || latestFeedback.type === 'error') &&
                  latestFeedback.message !== lastFeedbackRef.current &&
                  now - lastVoiceTimeRef.current > 8000) { // Increased to 8 seconds
                
                lastFeedbackRef.current = latestFeedback.message;
                lastVoiceTimeRef.current = now;
                
                if (onVoiceFeedbackRef.current) {
                  onVoiceFeedbackRef.current(latestFeedback.message);
                }
              }
            }
          }
        });

        poseRef.current = pose;
        console.log('Pose initialized, starting camera...');

        const camera = new Camera(video, {
          onFrame: async () => {
            if (poseRef.current && video.readyState >= 2) {
              await poseRef.current.send({ image: video });
            }
          },
          width: 640, // Balanced resolution
          height: 480,
          facingMode: 'user',
        });

        cameraRef.current = camera;
        await camera.start();
        
        if (mounted) {
          initializedRef.current = true;
          setIsLoading(false);
          console.log('Camera started successfully');
        }
      } catch (err) {
        console.error('Error initializing pose detection:', err);
        if (mounted) {
          setError('Failed to initialize camera. Please ensure camera permissions are granted.');
          setIsLoading(false);
        }
      }
    };

    initPose();

    return () => {
      mounted = false;
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [enabled, videoRef, canvasRef, drawResults, mirrored, exerciseType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
      initializedRef.current = false;
    };
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (cameraRef.current) {
      await cameraRef.current.start();
    }
  }, []);

  const speakFeedback = useCallback((message: string) => {
    speakText(message);
  }, []);

  return {
    isLoading,
    error,
    stopCamera,
    startCamera,
    speakFeedback,
  };
}