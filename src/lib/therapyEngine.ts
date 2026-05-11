export interface PatientProfile {
  age: number;
  painArea: string;
  mobilityLevel: "full" | "slight" | "moderate" | "limited" | "bedrest";
  language: "en" | "hi" | "ur";
  romCapability: number;
  sessionPerformance: number;
}

export interface TherapyPlan {
  exercises: ExerciseBlock[];
  pacing: "slow" | "moderate" | "normal";
  restInterval: number;
  difficulty: "gentle" | "mild" | "moderate";
  voiceTone: "reassuring" | "encouraging" | "neutral";
}

export interface ExerciseBlock {
  id: string;
  name: string;
  duration: number;
  reps: number;
  romTarget: { min: number; max: number };
  tag: string;
}

const EXERCISE_POOL: Record<string, ExerciseBlock[]> = {
  knee: [
    { id: "breathing-warmup", name: "Breathing Warm-up", duration: 300, reps: 0, romTarget: { min: 0, max: 0 }, tag: "warmup" },
    { id: "knee-raise-assisted", name: "Assisted Knee Raise", duration: 600, reps: 8, romTarget: { min: 60, max: 100 }, tag: "knee-raise" },
    { id: "seated-leg-lift", name: "Slow Seated Leg Lift", duration: 480, reps: 10, romTarget: { min: 45, max: 90 }, tag: "knee-raise" },
    { id: "chair-stand", name: "Chair-Supported Stand", duration: 420, reps: 5, romTarget: { min: 70, max: 120 }, tag: "knee-raise" },
    { id: "cooldown", name: "Cool-down Stretch", duration: 300, reps: 0, romTarget: { min: 0, max: 0 }, tag: "cooldown" },
  ],
  shoulder: [
    { id: "breathing-warmup", name: "Breathing Warm-up", duration: 300, reps: 0, romTarget: { min: 0, max: 0 }, tag: "warmup" },
    { id: "shoulder-roll", name: "Gentle Shoulder Roll", duration: 360, reps: 10, romTarget: { min: 30, max: 90 }, tag: "shoulder-raise" },
    { id: "arm-raise", name: "Assisted Arm Raise", duration: 480, reps: 8, romTarget: { min: 60, max: 130 }, tag: "shoulder-raise" },
    { id: "wall-slide", name: "Wall Slide", duration: 420, reps: 8, romTarget: { min: 70, max: 150 }, tag: "shoulder-raise" },
    { id: "cooldown", name: "Cool-down Stretch", duration: 300, reps: 0, romTarget: { min: 0, max: 0 }, tag: "cooldown" },
  ],
  "lower-back": [
    { id: "breathing-warmup", name: "Breathing Warm-up", duration: 300, reps: 0, romTarget: { min: 0, max: 0 }, tag: "warmup" },
    { id: "pelvic-tilt", name: "Pelvic Tilt", duration: 480, reps: 10, romTarget: { min: 10, max: 30 }, tag: "hip-flex" },
    { id: "knee-to-chest", name: "Knee to Chest", duration: 420, reps: 8, romTarget: { min: 45, max: 90 }, tag: "hip-flex" },
    { id: "cat-cow", name: "Cat-Cow Stretch", duration: 360, reps: 10, romTarget: { min: 20, max: 40 }, tag: "hip-flex" },
    { id: "cooldown", name: "Cool-down Stretch", duration: 300, reps: 0, romTarget: { min: 0, max: 0 }, tag: "cooldown" },
  ],
};

export function generateTherapyPlan(profile: PatientProfile): TherapyPlan {
  const painKey = profile.painArea.toLowerCase().replace(" ", "-");
  const pool = EXERCISE_POOL[painKey] ?? EXERCISE_POOL.knee;

  const isElder = profile.age >= 65;
  const isLimited = profile.mobilityLevel === "limited" || profile.mobilityLevel === "bedrest";
  const isLowPerf = profile.sessionPerformance < 60;

  let pacing: TherapyPlan["pacing"] = "normal";
  let difficulty: TherapyPlan["difficulty"] = "moderate";
  let restInterval = 60;

  if (isElder || isLimited) { pacing = "slow"; difficulty = "gentle"; restInterval = 120; }
  else if (isLowPerf) { pacing = "moderate"; difficulty = "mild"; restInterval = 90; }

  const adjustedExercises = pool.map((ex) => ({
    ...ex,
    reps: isElder || isLimited ? Math.max(3, Math.floor(ex.reps * 0.6)) : ex.reps,
    romTarget: {
      min: Math.floor(ex.romTarget.min * (profile.romCapability / 100)),
      max: Math.floor(ex.romTarget.max * (profile.romCapability / 100)),
    },
  }));

  return {
    exercises: adjustedExercises,
    pacing,
    restInterval,
    difficulty,
    voiceTone: isElder ? "reassuring" : "encouraging",
  };
}
