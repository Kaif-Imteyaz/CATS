export interface Joint {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseLandmarks {
  [key: number]: Joint;
}

export interface PostureResult {
  score: number;
  feedback: string[];
  type: "correct" | "warning" | "error";
  metrics: {
    shoulderAngle: number;
    kneeAngle: number;
    hipAlignment: number;
    symmetry: number;
  };
}

export interface RepConfig {
  anglePoints: [number, number, number];
  startAngle: number;
  peakAngle: number;
  tolerance: number;
}

export interface ExerciseMeta {
  tag: string;
  name: string;
  target: string;
  difficulty: "Easy" | "Gentle" | "Moderate" | "Hard";
  duration_min: number;
  instructions: string;
  connections: [number, number][];
  repConfig: RepConfig;
}

export const LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 2, RIGHT_EYE: 5,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
};

export const BODY_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 23], [12, 24], [23, 24],
  [23, 25], [24, 26], [25, 27], [26, 28],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [27, 29], [28, 30],
];

export const ROM_CONFIGS: Record<string, { min: number; max: number }> = {
  "knee-raise":         { min: 60,  max: 120 },
  "seated-leg-lift":    { min: 30,  max: 80  },
  "shoulder-raise":     { min: 70,  max: 160 },
  "shoulder-abduction": { min: 60,  max: 170 },
  "hip-flex":           { min: 45,  max: 90  },
  "hip-abduction":      { min: 20,  max: 50  },
  "ankle-rotation":     { min: 20,  max: 45  },
  "ankle-dorsiflexion": { min: 10,  max: 30  },
  "knee-extension":     { min: 0,   max: 10  },
  "squat":              { min: 70,  max: 100 },
  "lunge":              { min: 80,  max: 100 },
  "calf-raise":         { min: 20,  max: 45  },
  "elbow-flex":         { min: 30,  max: 150 },
  "wrist-flex":         { min: 20,  max: 80  },
  "neck-rotation":      { min: 30,  max: 70  },
  "trunk-rotation":     { min: 20,  max: 60  },
  "shoulder-press":     { min: 90,  max: 180 },
  "chest-stretch":      { min: 100, max: 170 },
  "seated-row":         { min: 90,  max: 165 },
  "forearm-rotation":   { min: 60,  max: 170 },
  "default":            { min: 45,  max: 135 },
};

export const ELDER_ROM_CONFIGS: Record<string, { min: number; max: number }> = {
  "knee-raise":         { min: 70,  max: 110 },
  "seated-leg-lift":    { min: 40,  max: 70  },
  "shoulder-raise":     { min: 75,  max: 140 },
  "shoulder-abduction": { min: 65,  max: 150 },
  "hip-flex":           { min: 50,  max: 80  },
  "hip-abduction":      { min: 25,  max: 45  },
  "ankle-rotation":     { min: 25,  max: 40  },
  "ankle-dorsiflexion": { min: 12,  max: 25  },
  "knee-extension":     { min: 0,   max: 10  },
  "squat":              { min: 80,  max: 100 },
  "lunge":              { min: 85,  max: 100 },
  "calf-raise":         { min: 22,  max: 40  },
  "elbow-flex":         { min: 35,  max: 130 },
  "wrist-flex":         { min: 22,  max: 70  },
  "neck-rotation":      { min: 30,  max: 55  },
  "trunk-rotation":     { min: 20,  max: 45  },
  "shoulder-press":     { min: 90,  max: 155 },
  "chest-stretch":      { min: 105, max: 155 },
  "seated-row":         { min: 95,  max: 150 },
  "forearm-rotation":   { min: 65,  max: 150 },
  "default":            { min: 50,  max: 120 },
};

// Default rep config for exercises without dedicated tracking
const DEFAULT_REP: RepConfig = {
  anglePoints: [11, 23, 25],
  startAngle: 110, peakAngle: 70, tolerance: 15,
};

export const EXERCISE_LIBRARY: Record<string, ExerciseMeta> = {
  "knee-raise": {
    tag: "knee-raise", name: "Assisted Knee Raise", target: "Knee",
    difficulty: "Gentle", duration_min: 10,
    instructions: "Sit upright. Slowly raise knee to hip level. Hold 3 sec. Lower slowly.",
    connections: [[23, 25], [25, 27], [11, 23], [12, 24], [23, 24]],
    // shoulder→hip→knee: hip flexion angle. Seated~110°, raised~65°
    repConfig: { anglePoints: [11, 23, 25], startAngle: 110, peakAngle: 65, tolerance: 15 },
  },
  "seated-leg-lift": {
    tag: "seated-leg-lift", name: "Slow Seated Leg Lift", target: "Knee",
    difficulty: "Gentle", duration_min: 8,
    instructions: "Extend leg straight. Lift 45°. Hold 2 sec. Return slowly.",
    connections: [[23, 25], [25, 27], [11, 23], [12, 24], [23, 24]],
    // hip→knee→ankle: knee extension. Bent~90°, extended~155°
    repConfig: { anglePoints: [23, 25, 27], startAngle: 90, peakAngle: 155, tolerance: 15 },
  },
  "knee-extension": {
    tag: "knee-extension", name: "Terminal Knee Extension", target: "Knee",
    difficulty: "Easy", duration_min: 8,
    instructions: "Sit with knee at 30°. Press thigh down. Straighten fully. Hold 5 sec.",
    connections: [[23, 25], [25, 27], [11, 23], [12, 24], [23, 24]],
    // hip→knee→ankle. Flexed~30°, extended~5°
    repConfig: { anglePoints: [23, 25, 27], startAngle: 30, peakAngle: 5, tolerance: 10 },
  },
  "squat": {
    tag: "squat", name: "Supported Squat", target: "Knee",
    difficulty: "Moderate", duration_min: 10,
    instructions: "Feet shoulder-width. Hold chair. Bend to 90°. Hold 2 sec. Rise slowly.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28]],
    // hip→knee→ankle. Standing~165°, squatting~90°
    repConfig: { anglePoints: [23, 25, 27], startAngle: 165, peakAngle: 90, tolerance: 15 },
  },
  "lunge": {
    tag: "lunge", name: "Static Lunge Hold", target: "Knee",
    difficulty: "Moderate", duration_min: 8,
    instructions: "Step forward. Lower back knee toward floor. Hold 5 sec. Return.",
    connections: [[11, 12], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28]],
    // hip→knee→ankle of front leg
    repConfig: { anglePoints: [23, 25, 27], startAngle: 170, peakAngle: 90, tolerance: 15 },
  },
  "shoulder-raise": {
    tag: "shoulder-raise", name: "Forward Shoulder Raise", target: "Shoulder",
    difficulty: "Gentle", duration_min: 8,
    instructions: "Arm at side. Raise forward to shoulder height. Hold 2 sec. Lower slowly.",
    connections: [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16]],
    // hip→shoulder→elbow: shoulder flexion. Down~25°, raised~90°
    repConfig: { anglePoints: [23, 11, 13], startAngle: 25, peakAngle: 90, tolerance: 15 },
  },
  "shoulder-abduction": {
    tag: "shoulder-abduction", name: "Lateral Arm Raise", target: "Shoulder",
    difficulty: "Moderate", duration_min: 8,
    instructions: "Arms at side. Raise sideways to shoulder height. Hold 2 sec. Lower.",
    connections: [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16]],
    repConfig: { anglePoints: [23, 11, 13], startAngle: 20, peakAngle: 90, tolerance: 15 },
  },
  "pendulum": {
    tag: "shoulder-raise", name: "Pendulum Swing", target: "Shoulder",
    difficulty: "Gentle", duration_min: 5,
    instructions: "Lean forward. Let arm hang freely. Swing gently in circles.",
    connections: [[11, 13], [13, 15], [11, 23]],
    repConfig: { anglePoints: [23, 11, 13], startAngle: 15, peakAngle: 45, tolerance: 15 },
  },
  "wall-climb": {
    tag: "shoulder-raise", name: "Wall Finger Climb", target: "Shoulder",
    difficulty: "Moderate", duration_min: 8,
    instructions: "Face wall. Walk fingers up to tolerance. Hold 5 sec. Walk down.",
    connections: [[11, 13], [13, 15], [11, 12]],
    // full raise: down~30°, up~150°
    repConfig: { anglePoints: [23, 11, 13], startAngle: 30, peakAngle: 150, tolerance: 15 },
  },
  "elbow-flex": {
    tag: "elbow-flex", name: "Elbow Flexion Curl", target: "Elbow",
    difficulty: "Easy", duration_min: 6,
    instructions: "Arm at side, palm up. Curl forearm to shoulder. Hold 2 sec. Lower.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16]],
    // shoulder→elbow→wrist. Extended~165°, curled~40°
    repConfig: { anglePoints: [11, 13, 15], startAngle: 165, peakAngle: 40, tolerance: 15 },
  },
  "hip-flex": {
    tag: "hip-flex", name: "Hip Flexor Stretch", target: "Hip",
    difficulty: "Gentle", duration_min: 6,
    instructions: "Kneel on one knee. Push hips forward gently. Hold 20 sec each side.",
    connections: [[23, 24], [23, 25], [24, 26], [25, 27], [26, 28]],
    // shoulder→hip→knee. Neutral~120°, flexed~80°
    repConfig: { anglePoints: [11, 23, 25], startAngle: 120, peakAngle: 80, tolerance: 15 },
  },
  "hip-abduction": {
    tag: "hip-abduction", name: "Side-Lying Leg Raise", target: "Hip",
    difficulty: "Easy", duration_min: 6,
    instructions: "Lie on side. Raise top leg 45°. Hold 3 sec. Lower slowly.",
    connections: [[23, 24], [23, 25], [24, 26]],
    // left-hip→right-hip→right-knee lateral spread proxy
    repConfig: { anglePoints: [23, 24, 26], startAngle: 170, peakAngle: 130, tolerance: 15 },
  },
  "pelvic-tilt": {
    tag: "hip-flex", name: "Pelvic Tilt", target: "Lower Back",
    difficulty: "Easy", duration_min: 5,
    instructions: "Lie flat. Press lower back into floor. Hold 5 sec. Release.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 24]],
    // shoulder→hip→knee alignment
    repConfig: { anglePoints: [11, 23, 25], startAngle: 160, peakAngle: 145, tolerance: 10 },
  },
  "knee-to-chest": {
    tag: "hip-flex", name: "Knee-to-Chest Stretch", target: "Lower Back",
    difficulty: "Easy", duration_min: 6,
    instructions: "Lie on back. Pull one knee to chest. Hold 15 sec. Alternate.",
    connections: [[11, 23], [23, 25], [25, 27]],
    // hip flexion while supine: shoulder→hip→knee
    repConfig: { anglePoints: [11, 23, 25], startAngle: 160, peakAngle: 60, tolerance: 15 },
  },
  "cat-camel": {
    tag: "trunk-rotation", name: "Cat-Camel Stretch", target: "Lower Back",
    difficulty: "Easy", duration_min: 5,
    instructions: "On hands and knees. Arch back up (cat). Sag belly down (camel). Cycle slowly.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 24]],
    // shoulder symmetry axis oscillation: left-shoulder→mid→right-shoulder
    repConfig: { anglePoints: [11, 23, 24], startAngle: 100, peakAngle: 160, tolerance: 15 },
  },
  "trunk-rotation": {
    tag: "trunk-rotation", name: "Seated Trunk Rotation", target: "Lower Back",
    difficulty: "Easy", duration_min: 6,
    instructions: "Sit upright. Arms crossed on chest. Rotate torso left and right. Hold 3 sec each.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 24]],
    repConfig: { anglePoints: [11, 23, 24], startAngle: 170, peakAngle: 130, tolerance: 15 },
  },
  "bridge": {
    tag: "hip-flex", name: "Glute Bridge", target: "Lower Back",
    difficulty: "Gentle", duration_min: 8,
    instructions: "Lie on back, knees bent. Press feet into floor. Lift hips. Hold 5 sec.",
    connections: [[11, 23], [12, 24], [23, 25], [24, 26], [23, 24]],
    // shoulder→hip→knee. Flat~120°, bridge~160°
    repConfig: { anglePoints: [11, 23, 25], startAngle: 120, peakAngle: 155, tolerance: 15 },
  },
  "ankle-rotation": {
    tag: "ankle-rotation", name: "Ankle Circles", target: "Ankle",
    difficulty: "Easy", duration_min: 5,
    instructions: "Seated, foot lifted. Rotate ankle clockwise 10×. Reverse 10×.",
    connections: [[25, 27], [27, 29], [29, 31]],
    // knee→ankle→foot: dorsiflexion/plantarflexion cycle
    repConfig: { anglePoints: [25, 27, 31], startAngle: 90, peakAngle: 130, tolerance: 15 },
  },
  "ankle-dorsiflexion": {
    tag: "ankle-dorsiflexion", name: "Ankle Dorsiflexion Stretch", target: "Ankle",
    difficulty: "Easy", duration_min: 5,
    instructions: "Seated, heel on floor. Pull toes toward shin. Hold 10 sec. Release.",
    connections: [[25, 27], [27, 29]],
    repConfig: { anglePoints: [25, 27, 31], startAngle: 90, peakAngle: 115, tolerance: 12 },
  },
  "calf-raise": {
    tag: "calf-raise", name: "Standing Calf Raise", target: "Ankle",
    difficulty: "Gentle", duration_min: 6,
    instructions: "Hold chair for balance. Rise onto toes. Hold 3 sec. Lower slowly.",
    connections: [[25, 27], [27, 29], [26, 28], [28, 30]],
    // knee→ankle→foot: plantarflexion going up
    repConfig: { anglePoints: [25, 27, 31], startAngle: 90, peakAngle: 135, tolerance: 12 },
  },
  "chair-stand": {
    tag: "default", name: "Chair-Supported Stand", target: "Full Body",
    difficulty: "Moderate", duration_min: 7,
    instructions: "Use chair arms for support. Stand fully. Pause at top. Lower slowly.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28]],
    // hip→knee→ankle: sitting~90°, standing~170°
    repConfig: { anglePoints: [23, 25, 27], startAngle: 90, peakAngle: 165, tolerance: 15 },
  },
  "breathing": {
    tag: "default", name: "Diaphragmatic Breathing", target: "Full Body",
    difficulty: "Easy", duration_min: 5,
    instructions: "Deep belly breaths. Inhale 4 sec. Hold 2 sec. Exhale 6 sec. Repeat.",
    connections: [[11, 12], [11, 23], [12, 24]],
    // shoulder symmetry as breathing proxy
    repConfig: { anglePoints: [11, 23, 12], startAngle: 95, peakAngle: 75, tolerance: 10 },
  },
  "cooldown": {
    tag: "default", name: "Full-Body Cool-Down Stretch", target: "Full Body",
    difficulty: "Easy", duration_min: 5,
    instructions: "Gentle full-body stretch sequence. Hold each position 15 sec.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 24], [23, 25], [24, 26]],
    repConfig: DEFAULT_REP,
  },
  "neck-tilt": {
    tag: "neck-rotation", name: "Neck Side Tilt", target: "Neck",
    difficulty: "Easy", duration_min: 4,
    instructions: "Sit upright. Tilt ear toward shoulder. Hold 10 sec. Alternate sides.",
    connections: [[0, 11], [0, 12], [11, 12]],
    // nose→left-shoulder→right-shoulder: head tilt
    repConfig: { anglePoints: [0, 11, 12], startAngle: 90, peakAngle: 60, tolerance: 12 },
  },
  "wrist-flex": {
    tag: "wrist-flex", name: "Wrist Flexion Stretch", target: "Wrist",
    difficulty: "Easy", duration_min: 4,
    instructions: "Arm extended, palm up. Use other hand to bend wrist back. Hold 15 sec.",
    connections: [[13, 15], [14, 16]],
    repConfig: { anglePoints: [11, 13, 15], startAngle: 160, peakAngle: 120, tolerance: 15 },
  },
  "wrist-extension": {
    tag: "wrist-flex", name: "Wrist Extension Stretch", target: "Wrist",
    difficulty: "Easy", duration_min: 4,
    instructions: "Arm extended, palm down. Gently pull fingers downward. Hold 15 sec each side.",
    connections: [[13, 15], [14, 16]],
    repConfig: { anglePoints: [11, 13, 15], startAngle: 120, peakAngle: 160, tolerance: 15 },
  },
  "hamstring-curl": {
    tag: "knee-raise", name: "Seated Hamstring Curl", target: "Knee",
    difficulty: "Gentle", duration_min: 8,
    instructions: "Sit at chair edge. Slide one foot back under chair. Hold 5 sec. Return slowly.",
    connections: [[23, 25], [25, 27], [11, 23], [12, 24], [23, 24]],
    repConfig: { anglePoints: [23, 25, 27], startAngle: 90, peakAngle: 50, tolerance: 12 },
  },
  "wall-sit": {
    tag: "squat", name: "Wall Sit Isometric", target: "Knee",
    difficulty: "Moderate", duration_min: 6,
    instructions: "Back flat on wall. Slide down to 90° knee bend. Hold 15–30 sec. Rise slowly.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28]],
    repConfig: { anglePoints: [23, 25, 27], startAngle: 165, peakAngle: 90, tolerance: 12 },
  },
  "step-up": {
    tag: "squat", name: "Step-Up Exercise", target: "Knee",
    difficulty: "Moderate", duration_min: 8,
    instructions: "Step onto low step with one foot. Push through heel to stand. Step down slowly.",
    connections: [[23, 25], [24, 26], [25, 27], [26, 28], [23, 24]],
    repConfig: { anglePoints: [23, 25, 27], startAngle: 120, peakAngle: 170, tolerance: 15 },
  },
  "quad-stretch": {
    tag: "knee-extension", name: "Standing Quad Stretch", target: "Knee",
    difficulty: "Gentle", duration_min: 5,
    instructions: "Stand on one leg. Hold ankle behind. Pull gently toward glute. Hold 20 sec.",
    connections: [[23, 25], [25, 27], [24, 26], [26, 28]],
    repConfig: { anglePoints: [23, 25, 27], startAngle: 170, peakAngle: 50, tolerance: 15 },
  },
  "leg-press": {
    tag: "knee-raise", name: "Resistance Band Leg Press", target: "Knee",
    difficulty: "Gentle", duration_min: 8,
    instructions: "Seated. Loop band around foot. Extend leg against resistance. Return slowly.",
    connections: [[23, 25], [25, 27], [11, 23], [12, 24]],
    repConfig: { anglePoints: [23, 25, 27], startAngle: 90, peakAngle: 160, tolerance: 15 },
  },
  "shoulder-rotation": {
    tag: "shoulder-raise", name: "Shoulder External Rotation", target: "Shoulder",
    difficulty: "Gentle", duration_min: 6,
    instructions: "Elbow at 90° at side. Rotate forearm outward. Hold 2 sec. Return.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16], [11, 12]],
    repConfig: { anglePoints: [23, 11, 13], startAngle: 90, peakAngle: 45, tolerance: 12 },
  },
  "band-pull": {
    tag: "shoulder-abduction", name: "Band Pull-Apart", target: "Shoulder",
    difficulty: "Gentle", duration_min: 6,
    instructions: "Hold resistance band at chest height. Pull apart to full arm width. Return.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16], [11, 12]],
    repConfig: { anglePoints: [11, 13, 15], startAngle: 80, peakAngle: 160, tolerance: 15 },
  },
  "shoulder-shrug": {
    tag: "shoulder-raise", name: "Shoulder Shrug and Roll", target: "Shoulder",
    difficulty: "Easy", duration_min: 5,
    instructions: "Raise shoulders to ears. Roll backward in a circle. Repeat 10 times.",
    connections: [[11, 12], [11, 23], [12, 24]],
    repConfig: { anglePoints: [11, 23, 12], startAngle: 90, peakAngle: 70, tolerance: 10 },
  },
  "clamshell": {
    tag: "hip-abduction", name: "Clamshell Exercise", target: "Hip",
    difficulty: "Easy", duration_min: 6,
    instructions: "Lie on side, knees bent 45°. Lift top knee like clamshell. Hold 3 sec. Lower.",
    connections: [[23, 24], [23, 25], [24, 26]],
    repConfig: { anglePoints: [23, 24, 26], startAngle: 170, peakAngle: 120, tolerance: 15 },
  },
  "standing-hip-ext": {
    tag: "hip-flex", name: "Standing Hip Extension", target: "Hip",
    difficulty: "Easy", duration_min: 6,
    instructions: "Hold chair. Extend one leg behind. Keep back straight. Hold 3 sec.",
    connections: [[23, 25], [24, 26], [25, 27], [26, 28]],
    repConfig: { anglePoints: [11, 23, 25], startAngle: 165, peakAngle: 195, tolerance: 15 },
  },
  "hip-circle": {
    tag: "hip-abduction", name: "Standing Hip Circles", target: "Hip",
    difficulty: "Gentle", duration_min: 5,
    instructions: "Stand on one leg. Draw slow circles with raised knee. 10 forward, 10 back.",
    connections: [[23, 24], [23, 25], [24, 26]],
    repConfig: { anglePoints: [23, 24, 26], startAngle: 160, peakAngle: 120, tolerance: 15 },
  },
  "fire-hydrant": {
    tag: "hip-abduction", name: "Fire Hydrant", target: "Hip",
    difficulty: "Gentle", duration_min: 6,
    instructions: "On hands and knees. Raise one knee to side like a dog at a hydrant. Hold 3 sec.",
    connections: [[23, 24], [23, 25], [24, 26]],
    repConfig: { anglePoints: [23, 24, 26], startAngle: 170, peakAngle: 110, tolerance: 15 },
  },
  "bird-dog": {
    tag: "trunk-rotation", name: "Bird-Dog Exercise", target: "Lower Back",
    difficulty: "Gentle", duration_min: 8,
    instructions: "On hands and knees. Extend opposite arm and leg. Hold 5 sec. Alternate.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 25], [24, 26]],
    repConfig: { anglePoints: [11, 23, 25], startAngle: 90, peakAngle: 165, tolerance: 15 },
  },
  "sphinx": {
    tag: "hip-flex", name: "Sphinx Pose", target: "Lower Back",
    difficulty: "Easy", duration_min: 5,
    instructions: "Lie face down. Prop on forearms. Gently arch upper back. Hold 20 sec.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 24]],
    repConfig: { anglePoints: [11, 23, 24], startAngle: 160, peakAngle: 130, tolerance: 15 },
  },
  "child-pose": {
    tag: "hip-flex", name: "Child's Pose Stretch", target: "Lower Back",
    difficulty: "Easy", duration_min: 5,
    instructions: "Kneel and sit back on heels. Stretch arms forward on floor. Hold 20 sec.",
    connections: [[11, 23], [12, 24], [23, 25], [24, 26]],
    repConfig: { anglePoints: [11, 23, 25], startAngle: 160, peakAngle: 40, tolerance: 15 },
  },
  "towel-curl": {
    tag: "ankle-dorsiflexion", name: "Toe Towel Curl", target: "Ankle",
    difficulty: "Easy", duration_min: 5,
    instructions: "Seated. Place towel on floor. Scrunch it toward you using toes only. Repeat.",
    connections: [[25, 27], [27, 29], [29, 31]],
    repConfig: { anglePoints: [25, 27, 31], startAngle: 90, peakAngle: 120, tolerance: 12 },
  },
  "balance-stand": {
    tag: "default", name: "Single-Leg Balance", target: "Ankle",
    difficulty: "Gentle", duration_min: 6,
    instructions: "Stand on one leg near chair. Hold 15–30 sec. Alternate. Increase time weekly.",
    connections: [[23, 25], [25, 27], [27, 29]],
    repConfig: { anglePoints: [23, 25, 27], startAngle: 170, peakAngle: 160, tolerance: 10 },
  },
  "wall-push": {
    tag: "shoulder-raise", name: "Wall Push-Up", target: "Shoulder",
    difficulty: "Easy", duration_min: 6,
    instructions: "Stand arm's length from wall. Place palms flat. Bend elbows to touch wall. Push back.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16], [11, 12]],
    repConfig: { anglePoints: [11, 13, 15], startAngle: 160, peakAngle: 60, tolerance: 15 },
  },
  "seated-march": {
    tag: "knee-raise", name: "Seated Marching", target: "Full Body",
    difficulty: "Easy", duration_min: 5,
    instructions: "Seated. Alternate lifting knees as if marching. Keep back straight. 30 sec.",
    connections: [[23, 25], [24, 26], [11, 23], [12, 24]],
    repConfig: { anglePoints: [11, 23, 25], startAngle: 110, peakAngle: 65, tolerance: 15 },
  },
  "balance-reach": {
    tag: "hip-flex", name: "Standing Balance Reach", target: "Full Body",
    difficulty: "Gentle", duration_min: 6,
    instructions: "Stand on one leg. Slowly reach forward with both hands. Return. Alternate.",
    connections: [[11, 12], [11, 23], [12, 24], [23, 25], [24, 26]],
    repConfig: { anglePoints: [11, 23, 25], startAngle: 165, peakAngle: 120, tolerance: 15 },
  },
  "tai-chi-shift": {
    tag: "default", name: "Tai Chi Weight Shift", target: "Full Body",
    difficulty: "Easy", duration_min: 5,
    instructions: "Feet shoulder-width. Shift weight slowly left to right. Keep knees soft.",
    connections: [[11, 12], [23, 24], [23, 25], [24, 26]],
    repConfig: { anglePoints: [23, 25, 27], startAngle: 170, peakAngle: 155, tolerance: 12 },
  },
  "chin-tuck": {
    tag: "neck-rotation", name: "Chin Tuck", target: "Neck",
    difficulty: "Easy", duration_min: 4,
    instructions: "Sit upright. Gently pull chin straight back (not down). Hold 5 sec. Release.",
    connections: [[0, 11], [0, 12], [11, 12]],
    repConfig: { anglePoints: [0, 11, 12], startAngle: 85, peakAngle: 70, tolerance: 10 },
  },
  "neck-extension": {
    tag: "neck-rotation", name: "Neck Extension Stretch", target: "Neck",
    difficulty: "Easy", duration_min: 4,
    instructions: "Sit upright. Slowly look up toward ceiling. Hold 5 sec. Return to neutral.",
    connections: [[0, 11], [0, 12], [11, 12]],
    repConfig: { anglePoints: [0, 11, 12], startAngle: 90, peakAngle: 55, tolerance: 12 },
  },
  "shoulder-press": {
    tag: "shoulder-press", name: "Seated Overhead Press", target: "Shoulder",
    difficulty: "Moderate", duration_min: 8,
    instructions: "Sit upright. Start with hands at shoulder height, elbows at 90°. Press arms overhead until fully extended. Lower slowly.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16], [11, 12]],
    // hip→shoulder→elbow: 90° at bottom, ~170° overhead
    repConfig: { anglePoints: [23, 11, 13], startAngle: 90, peakAngle: 165, tolerance: 15 },
  },
  "shoulder-internal": {
    tag: "shoulder-raise", name: "Shoulder Internal Rotation", target: "Shoulder",
    difficulty: "Gentle", duration_min: 6,
    instructions: "Elbow at 90° tucked at side. Rotate forearm inward across body. Hold 2 sec. Return.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16], [11, 12]],
    // shoulder→elbow→wrist: neutral~90°, rotated inward~40°
    repConfig: { anglePoints: [11, 13, 15], startAngle: 90, peakAngle: 40, tolerance: 12 },
  },
  "tricep-stretch": {
    tag: "elbow-flex", name: "Overhead Tricep Stretch", target: "Elbow",
    difficulty: "Easy", duration_min: 5,
    instructions: "Raise one arm overhead. Bend elbow behind head. Use other hand to gently press elbow down. Hold 15 sec.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16]],
    // shoulder→elbow→wrist: elbow bent behind head~40°, extended~155°
    repConfig: { anglePoints: [11, 13, 15], startAngle: 40, peakAngle: 155, tolerance: 15 },
  },
  "bicep-stretch": {
    tag: "elbow-flex", name: "Bicep Doorway Stretch", target: "Elbow",
    difficulty: "Easy", duration_min: 5,
    instructions: "Place palm on door frame at shoulder height. Slowly rotate body away until bicep stretches. Hold 20 sec.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16]],
    // shoulder→elbow→wrist: arm extended back ~165°
    repConfig: { anglePoints: [11, 13, 15], startAngle: 80, peakAngle: 160, tolerance: 15 },
  },
  "chest-stretch": {
    tag: "chest-stretch", name: "Chest Expansion Stretch", target: "Shoulder",
    difficulty: "Easy", duration_min: 5,
    instructions: "Clasp hands behind back. Straighten arms. Squeeze shoulder blades. Lift chest. Hold 15 sec.",
    connections: [[11, 12], [11, 13], [12, 14], [11, 23], [12, 24]],
    // hip→shoulder→elbow: arms pulled back ~130°
    repConfig: { anglePoints: [23, 11, 13], startAngle: 30, peakAngle: 130, tolerance: 15 },
  },
  "seated-row": {
    tag: "seated-row", name: "Seated Band Row", target: "Shoulder",
    difficulty: "Gentle", duration_min: 8,
    instructions: "Sit tall. Loop band around feet. Pull handles to sides of chest, elbows back. Hold 2 sec. Return.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16], [11, 12]],
    // hip→shoulder→elbow: extended~160°, pulled in~90°
    repConfig: { anglePoints: [23, 11, 13], startAngle: 155, peakAngle: 85, tolerance: 15 },
  },
  "neck-rotation": {
    tag: "neck-rotation", name: "Neck Rotation", target: "Neck",
    difficulty: "Easy", duration_min: 4,
    instructions: "Sit upright. Slowly turn head to look over left shoulder. Hold 5 sec. Turn right. Repeat.",
    connections: [[0, 11], [0, 12], [11, 12]],
    // nose→L-shoulder→R-shoulder: centre~90°, turned~65°
    repConfig: { anglePoints: [0, 11, 12], startAngle: 90, peakAngle: 63, tolerance: 12 },
  },
  "wrist-circle": {
    tag: "wrist-flex", name: "Wrist Circles", target: "Wrist",
    difficulty: "Easy", duration_min: 4,
    instructions: "Extend arm forward. Make slow circles with wrist, 10 clockwise, 10 counter-clockwise each side.",
    connections: [[13, 15], [14, 16]],
    // shoulder→elbow→wrist: full circle range
    repConfig: { anglePoints: [11, 13, 15], startAngle: 140, peakAngle: 100, tolerance: 20 },
  },
  "forearm-pronation": {
    tag: "forearm-rotation", name: "Forearm Pronation & Supination", target: "Elbow",
    difficulty: "Easy", duration_min: 5,
    instructions: "Elbow bent at 90°, tucked at side. Rotate palm to face down (pronation), then up (supination). 10 each.",
    connections: [[11, 13], [13, 15], [12, 14], [14, 16]],
    repConfig: { anglePoints: [11, 13, 15], startAngle: 160, peakAngle: 100, tolerance: 20 },
  },
  "side-arm-raise": {
    tag: "shoulder-abduction", name: "Side Arm Raise", target: "Shoulder",
    difficulty: "Easy", duration_min: 8,
    instructions: "Stand or sit. Keep arms at sides. Slowly raise both arms sideways to shoulder height. Pause briefly. Lower slowly.",
    connections: [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16]],
    repConfig: { anglePoints: [23, 11, 13], startAngle: 20, peakAngle: 90, tolerance: 15 },
  },
  "front-arm-raise": {
    tag: "shoulder-raise", name: "Front Arm Raise", target: "Shoulder",
    difficulty: "Easy", duration_min: 8,
    instructions: "Sit upright. Arms relaxed near thighs. Slowly raise arms forward to shoulder height. Hold 2 sec. Lower slowly.",
    connections: [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16]],
    repConfig: { anglePoints: [23, 11, 13], startAngle: 25, peakAngle: 90, tolerance: 15 },
  },
  "neck-side-stretch": {
    tag: "neck-rotation", name: "Neck Side Stretch", target: "Neck",
    difficulty: "Gentle", duration_min: 5,
    instructions: "Sit comfortably. Keep shoulders relaxed. Slowly tilt head toward one shoulder. Hold 5–10 sec. Return to center. Repeat other side.",
    connections: [[0, 11], [0, 12], [11, 12]],
    repConfig: { anglePoints: [0, 11, 12], startAngle: 90, peakAngle: 58, tolerance: 12 },
  },
  "shoulder-rolls": {
    tag: "shoulder-raise", name: "Shoulder Rolls", target: "Shoulder",
    difficulty: "Easy", duration_min: 5,
    instructions: "Sit upright. Lift shoulders gently upward. Roll shoulders backward in a slow circle. Repeat forward and backward 10 times.",
    connections: [[11, 12], [11, 23], [12, 24]],
    repConfig: { anglePoints: [11, 23, 12], startAngle: 90, peakAngle: 70, tolerance: 10 },
  },
  "chest-opening": {
    tag: "chest-stretch", name: "Chest Opening Stretch", target: "Shoulder",
    difficulty: "Gentle", duration_min: 5,
    instructions: "Sit or stand upright. Place hands behind back. Open chest gently. Pull shoulders backward slightly. Hold 10 sec. Relax slowly.",
    connections: [[11, 12], [11, 13], [12, 14], [11, 23], [12, 24]],
    repConfig: { anglePoints: [23, 11, 13], startAngle: 30, peakAngle: 130, tolerance: 15 },
  },
  "default": {
    tag: "default", name: "General Exercise", target: "Full Body",
    difficulty: "Easy", duration_min: 5,
    instructions: "Follow your therapist's guidance. Move gently and hold each position.",
    connections: BODY_CONNECTIONS,
    repConfig: DEFAULT_REP,
  },
};

export function calcAngle(a: Joint, b: Joint, c: Joint): number {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(rad * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
}

export function measureBrightness(video: HTMLVideoElement): number {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64; canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 100;
    ctx.drawImage(video, 0, 0, 64, 48);
    const data = ctx.getImageData(0, 0, 64, 48).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }
    return Math.round(sum / (data.length / 4));
  } catch {
    return 100;
  }
}

export function drawNeckLine(
  canvas: HTMLCanvasElement,
  landmarks: PoseLandmarks,
  color = "#4ade80",
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const nose = landmarks[0];
  const ls = landmarks[11];
  const rs = landmarks[12];
  if (!nose || !ls || !rs) return;
  const noseX = (1 - nose.x) * w;
  const noseY = nose.y * h;
  const neckX = (1 - (ls.x + rs.x) / 2) * w;
  const neckY = ((ls.y + rs.y) / 2) * h;
  ctx.beginPath();
  ctx.moveTo(noseX, noseY);
  ctx.lineTo(neckX, neckY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(neckX, neckY, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function analyzePosture(
  landmarks: PoseLandmarks,
  romConfig: { min: number; max: number },
): PostureResult {
  const feedback: string[] = [];
  let score = 100;

  const ls = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rs = landmarks[LANDMARKS.RIGHT_SHOULDER];
  const lh = landmarks[LANDMARKS.LEFT_HIP];
  const rh = landmarks[LANDMARKS.RIGHT_HIP];
  const lk = landmarks[LANDMARKS.LEFT_KNEE];
  const la = landmarks[LANDMARKS.LEFT_ANKLE];

  if (!ls || !rs || !lh || !rh) {
    return {
      score: 0,
      feedback: ["Position yourself in frame."],
      type: "warning",
      metrics: { shoulderAngle: 0, kneeAngle: 0, hipAlignment: 0, symmetry: 0 },
    };
  }

  const shoulderTilt = Math.abs(ls.y - rs.y) * 100;
  if (shoulderTilt > 5) { feedback.push("Straighten your shoulders."); score -= 15; }

  const hipTilt = Math.abs(lh.y - rh.y) * 100;
  if (hipTilt > 5) { feedback.push("Keep your hips level."); score -= 10; }

  let kneeAngle = 0;
  if (lk && la && lh) {
    kneeAngle = calcAngle(lh, lk, la);
    if (kneeAngle < romConfig.min) { feedback.push("Raise your leg higher."); score -= 20; }
    if (kneeAngle > romConfig.max) { feedback.push("Slow down. Don't overextend."); score -= 15; }
  }

  const symmetry = Math.max(0, 100 - shoulderTilt * 2);
  if (symmetry < 80) score -= 10;

  if (feedback.length === 0) feedback.push("Good posture. Continue slowly.");

  return {
    score: Math.max(0, score),
    feedback,
    type: score >= 80 ? "correct" : score >= 60 ? "warning" : "error",
    metrics: {
      shoulderAngle: 180 - shoulderTilt * 2,
      kneeAngle,
      hipAlignment: 100 - hipTilt * 2,
      symmetry,
    },
  };
}
