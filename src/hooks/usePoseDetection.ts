"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  analyzePosture, PostureResult, ROM_CONFIGS, PoseLandmarks,
  measureBrightness, calcAngle, EXERCISE_LIBRARY,
} from "@/lib/poseEngine";
import type { RepConfig } from "@/lib/poseEngine";

export type DetectionQuality = "good" | "low-light" | "no-pose" | "initializing";
type RepState = "idle" | "active" | "peaked";

export interface PoseState {
  result: PostureResult | null;
  landmarks: PoseLandmarks | null;
  isTracking: boolean;
  repCount: number;
  currentAngle: number;
  repState: RepState;
  cameraError: string | null;
  detectionQuality: DetectionQuality;
  brightness: number;
}

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type Landmarker = import("@mediapipe/tasks-vision").PoseLandmarker;

const BRIGHTNESS_LOW = 40;
const BRIGHTNESS_CHECK_INTERVAL = 30;
const VISIBILITY_MIN = 0.5;
const ANGLE_HISTORY_SIZE = 5;

function smoothAngle(history: number[]): number {
  if (!history.length) return 0;
  return history.reduce((s, a) => s + a, 0) / history.length;
}

function isTowardPeak(angle: number, cfg: RepConfig): boolean {
  const midpoint = (cfg.startAngle + cfg.peakAngle) / 2;
  return cfg.peakAngle < cfg.startAngle
    ? angle < midpoint
    : angle > midpoint;
}

function reachedPeak(angle: number, cfg: RepConfig): boolean {
  return cfg.peakAngle < cfg.startAngle
    ? angle <= cfg.peakAngle + cfg.tolerance
    : angle >= cfg.peakAngle - cfg.tolerance;
}

function returnedToStart(angle: number, cfg: RepConfig): boolean {
  return cfg.peakAngle < cfg.startAngle
    ? angle >= cfg.startAngle - cfg.tolerance
    : angle <= cfg.startAngle + cfg.tolerance;
}

export function usePoseDetection(
  exerciseTag: string = "default",
  romOverride?: { min: number; max: number },
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<Landmarker | null>(null);
  const frameCountRef = useRef(0);

  const angleHistoryRef = useRef<number[]>([]);
  const repStateRef = useRef<RepState>("idle");
  const repCountRef = useRef(0);

  const [state, setState] = useState<PoseState>({
    result: null,
    landmarks: null,
    isTracking: false,
    repCount: 0,
    currentAngle: 0,
    repState: "idle",
    cameraError: null,
    detectionQuality: "initializing",
    brightness: 100,
  });

  const romConfig = romOverride ?? ROM_CONFIGS[exerciseTag] ?? ROM_CONFIGS.default;
  const exerciseMeta = EXERCISE_LIBRARY[exerciseTag];
  const repCfg: RepConfig = exerciseMeta?.repConfig ?? {
    anglePoints: [11, 23, 25],
    startAngle: 110, peakAngle: 70, tolerance: 15,
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        const lm = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: "GPU" },
          runningMode: "VIDEO", numPoses: 1,
        }).catch(() =>
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: "CPU" },
            runningMode: "VIDEO", numPoses: 1,
          })
        );
        if (active) landmarkerRef.current = lm;
      } catch { /* fallback to mock */ }
    })();
    return () => { active = false; };
  }, []);

  // Reset rep state when exercise changes
  useEffect(() => {
    angleHistoryRef.current = [];
    repStateRef.current = "idle";
    repCountRef.current = 0;
    setState((s) => ({ ...s, repCount: 0, currentAngle: 0, repState: "idle" }));
  }, [exerciseTag]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    frameCountRef.current += 1;
    let brightness = 100;
    if (frameCountRef.current % BRIGHTNESS_CHECK_INTERVAL === 0) {
      brightness = measureBrightness(video);
    }

    let poseLandmarks: PoseLandmarks;
    let hasPose = false;
    const lm = landmarkerRef.current;

    if (lm) {
      try {
        const result = lm.detectForVideo(video, performance.now());
        const pts = result.landmarks[0];
        if (pts?.length) {
          poseLandmarks = {};
          pts.forEach((pt, i) => {
            poseLandmarks[i] = { x: pt.x, y: pt.y, z: pt.z ?? 0, visibility: pt.visibility ?? 1 };
          });
          hasPose = true;
        } else {
          poseLandmarks = generateMock();
        }
      } catch {
        poseLandmarks = generateMock();
      }
    } else {
      poseLandmarks = generateMock();
      hasPose = true;
    }

    const analysis = analyzePosture(poseLandmarks, romConfig);

    const quality: DetectionQuality = brightness < BRIGHTNESS_LOW
      ? "low-light"
      : !hasPose ? "no-pose" : "good";

    // Angle-based rep counting
    const [pa, pb, pc] = repCfg.anglePoints;
    const lmA = poseLandmarks[pa];
    const lmB = poseLandmarks[pb];
    const lmC = poseLandmarks[pc];

    let newRepCount = repCountRef.current;
    let newRepState = repStateRef.current;
    let currentAngle = 0;

    const hasVisiblePoints =
      lmA && lmB && lmC &&
      (lmA.visibility ?? 1) > VISIBILITY_MIN &&
      (lmB.visibility ?? 1) > VISIBILITY_MIN &&
      (lmC.visibility ?? 1) > VISIBILITY_MIN;

    if (hasVisiblePoints) {
      const rawAngle = calcAngle(lmA, lmB, lmC);

      angleHistoryRef.current.push(rawAngle);
      if (angleHistoryRef.current.length > ANGLE_HISTORY_SIZE) {
        angleHistoryRef.current.shift();
      }

      const angle = smoothAngle(angleHistoryRef.current);
      currentAngle = Math.round(angle);

      if (newRepState === "idle" && isTowardPeak(angle, repCfg)) {
        newRepState = "active";
      } else if (newRepState === "active" && reachedPeak(angle, repCfg)) {
        newRepState = "peaked";
      } else if (newRepState === "peaked" && returnedToStart(angle, repCfg)) {
        newRepState = "idle";
        newRepCount += 1;
      }

      repStateRef.current = newRepState;
      repCountRef.current = newRepCount;
    }

    setState((s) => ({
      ...s,
      result: analysis,
      landmarks: poseLandmarks,
      repCount: newRepCount,
      currentAngle,
      repState: newRepState,
      detectionQuality: quality,
      brightness: frameCountRef.current % BRIGHTNESS_CHECK_INTERVAL === 0 ? brightness : s.brightness,
    }));

    rafRef.current = requestAnimationFrame(processFrame);
  }, [romConfig, repCfg]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setState((s) => ({ ...s, isTracking: true, cameraError: null, detectionQuality: "good" }));
      rafRef.current = requestAnimationFrame(processFrame);
    } catch {
      setState((s) => ({ ...s, cameraError: "Camera access denied.", detectionQuality: "initializing" }));
    }
  }, [processFrame]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setState((s) => ({ ...s, isTracking: false, landmarks: null, detectionQuality: "initializing" }));
  }, []);

  const countRep = useCallback(() => {
    repCountRef.current += 1;
    setState((s) => ({ ...s, repCount: repCountRef.current }));
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  return { videoRef, state, startCamera, stopCamera, countRep };
}

function generateMock(): PoseLandmarks {
  const b = () => ({ x: 0.5 + (Math.random() - 0.5) * 0.05, y: 0.5 + (Math.random() - 0.5) * 0.05, z: 0, visibility: 0.99 });
  return {
    11: { ...b(), y: 0.3 },
    12: { ...b(), y: 0.3 + (Math.random() - 0.5) * 0.04 },
    23: { ...b(), y: 0.55 },
    24: { ...b(), y: 0.55 },
    25: { ...b(), y: 0.72 },
    26: { ...b(), y: 0.72 },
    27: { ...b(), y: 0.9 },
    28: { ...b(), y: 0.9 },
  };
}
