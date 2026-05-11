export interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  bodyArea: string[];
  imageUrl?: string;
  videoUrl?: string;
  isFavorite: boolean;
  instructions: string[];
  targetMuscles: string[];
  commonMistakes: string[];
  reps?: number;
  sets?: number;
  category: 'strength' | 'mobility' | 'balance' | 'stretching' | 'cardio';
  equipment?: string[];
  contraindications?: string[];
}

export const exercises: Exercise[] = [
  // SHOULDER EXERCISES
  {
    id: '1',
    title: 'Standing Overhead Shoulder Press',
    description: 'Safe standing exercise to improve shoulder strength and mobility with light weights or resistance bands.',
    duration: '5 min',
    difficulty: 'intermediate',
    bodyArea: ['Shoulders', 'Upper Back', 'Core'],
    videoUrl: '/public/assets/elderVideo_en/Urdu_Shoulder_Exercise_Video_Generation.mp4',
    isFavorite: false,
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold light weights (1-2 lbs) or resistance bands',
      'Start with hands at shoulder height, palms facing forward',
      'Engage your core for stability',
      'Slowly press weights upward until arms are almost straight',
      'Lower back to shoulder height with control'
    ],
    targetMuscles: ['Deltoids', 'Trapezius', 'Triceps', 'Core'],
    commonMistakes: [
      'Locking elbows at the top',
      'Arching the lower back',
      'Using too heavy weights',
      'Raising shoulders to ears'
    ],
    reps: 10,
    sets: 3,
    category: 'strength',
    equipment: ['Light dumbbells', 'Resistance bands'],
  },
  {
    id: '2',
    title: 'Shoulder Pendulum Swing',
    description: 'Gentle pendulum movement to improve shoulder mobility and reduce stiffness.',
    duration: '3 min',
    difficulty: 'beginner',
    bodyArea: ['Shoulders'],
    isFavorite: false,
    instructions: [
      'Lean forward with one hand on a table for support',
      'Let your affected arm hang down relaxed',
      'Gently swing your arm in small circles',
      'Gradually increase the circle size',
      'Swing forward and backward',
      'Swing side to side'
    ],
    targetMuscles: ['Rotator Cuff', 'Deltoids'],
    commonMistakes: [
      'Swinging too fast',
      'Using shoulder muscles instead of momentum',
      'Not keeping arm relaxed'
    ],
    reps: 20,
    sets: 2,
    category: 'mobility',
  },
  {
    id: '3',
    title: 'Wall Angels',
    description: 'Improve shoulder mobility and posture by sliding arms up and down against a wall.',
    duration: '4 min',
    difficulty: 'beginner',
    bodyArea: ['Shoulders', 'Upper Back'],
    isFavorite: false,
    instructions: [
      'Stand with back flat against a wall',
      'Feet about 6 inches from the wall',
      'Press lower back, head, and shoulders against wall',
      'Raise arms to shoulder height, elbows bent 90 degrees',
      'Slowly slide arms up while keeping contact with wall',
      'Return to starting position'
    ],
    targetMuscles: ['Deltoids', 'Rhomboids', 'Lower Trapezius'],
    commonMistakes: [
      'Arching lower back off wall',
      'Not maintaining contact with wall',
      'Moving too quickly'
    ],
    reps: 12,
    sets: 3,
    category: 'mobility',
  },

  // KNEE EXERCISES
  {
    id: '4',
    title: 'Bodyweight Squat',
    description: 'Fundamental lower body exercise to strengthen legs and improve knee stability.',
    duration: '5 min',
    difficulty: 'beginner',
    bodyArea: ['Legs', 'Knees', 'Glutes'],
    isFavorite: true,
    instructions: [
      'Stand with feet shoulder-width apart',
      'Keep chest up and core engaged',
      'Push hips back as if sitting into a chair',
      'Lower until thighs are parallel to floor',
      'Keep knees tracking over toes',
      'Push through heels to return to standing'
    ],
    targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Core'],
    commonMistakes: [
      'Knees caving inward',
      'Rising onto toes',
      'Leaning too far forward',
      'Not going deep enough'
    ],
    reps: 12,
    sets: 3,
    category: 'strength',
  },
  {
    id: '5',
    title: 'Seated Knee Extension',
    description: 'Strengthen the quadriceps muscle to support knee stability.',
    duration: '4 min',
    difficulty: 'beginner',
    bodyArea: ['Knees', 'Legs'],
    isFavorite: false,
    instructions: [
      'Sit in a sturdy chair with feet flat on floor',
      'Hold onto the sides of the chair',
      'Slowly straighten one leg out in front',
      'Hold for 2-3 seconds at the top',
      'Lower back down with control',
      'Repeat on other leg'
    ],
    targetMuscles: ['Quadriceps'],
    commonMistakes: [
      'Swinging the leg up',
      'Not fully extending the knee',
      'Leaning back excessively'
    ],
    reps: 15,
    sets: 3,
    category: 'strength',
    equipment: ['Chair'],
  },
  {
    id: '6',
    title: 'Wall Sit',
    description: 'Isometric exercise to build quadriceps strength and knee endurance.',
    duration: '3 min',
    difficulty: 'intermediate',
    bodyArea: ['Knees', 'Legs', 'Core'],
    isFavorite: false,
    instructions: [
      'Stand with back against a wall',
      'Slide down until knees are at 90 degrees',
      'Keep knees over ankles, not past toes',
      'Press lower back into the wall',
      'Hold position as long as comfortable',
      'Slide back up to standing'
    ],
    targetMuscles: ['Quadriceps', 'Glutes', 'Core'],
    commonMistakes: [
      'Knees going past toes',
      'Not sitting deep enough',
      'Lower back coming off wall'
    ],
    reps: 1,
    sets: 3,
    category: 'strength',
  },

  // LOWER BACK EXERCISES
  {
    id: '7',
    title: 'Glute Bridge',
    description: 'Strengthen glutes and core to support lower back health.',
    duration: '4 min',
    difficulty: 'beginner',
    bodyArea: ['Lower Back', 'Glutes', 'Core'],
    isFavorite: true,
    instructions: [
      'Lie on back with knees bent, feet flat',
      'Arms by sides, palms down',
      'Squeeze glutes and lift hips off floor',
      'Create a straight line from shoulders to knees',
      'Hold for 2-3 seconds at the top',
      'Lower back down slowly'
    ],
    targetMuscles: ['Glutes', 'Hamstrings', 'Core', 'Lower Back'],
    commonMistakes: [
      'Overarching the back',
      'Not squeezing glutes',
      'Pushing through toes instead of heels'
    ],
    reps: 15,
    sets: 3,
    category: 'strength',
  },
  {
    id: '8',
    title: 'Bird Dog',
    description: 'Core stability exercise that improves balance and lower back strength.',
    duration: '5 min',
    difficulty: 'intermediate',
    bodyArea: ['Lower Back', 'Core', 'Shoulders'],
    isFavorite: false,
    instructions: [
      'Start on hands and knees',
      'Keep spine neutral and core engaged',
      'Extend right arm forward and left leg back',
      'Hold for 3-5 seconds',
      'Return to starting position',
      'Repeat with left arm and right leg'
    ],
    targetMuscles: ['Erector Spinae', 'Glutes', 'Core', 'Shoulders'],
    commonMistakes: [
      'Arching or rounding the back',
      'Rotating hips',
      'Moving too quickly'
    ],
    reps: 10,
    sets: 3,
    category: 'strength',
  },
  {
    id: '9',
    title: 'Cat-Cow Stretch',
    description: 'Gentle spinal mobility exercise to relieve lower back tension.',
    duration: '3 min',
    difficulty: 'beginner',
    bodyArea: ['Lower Back', 'Spine'],
    isFavorite: false,
    instructions: [
      'Start on hands and knees',
      'Inhale: Drop belly, lift head and tailbone (Cow)',
      'Exhale: Round spine, tuck chin and tailbone (Cat)',
      'Move slowly with your breath',
      'Keep movements smooth and controlled'
    ],
    targetMuscles: ['Erector Spinae', 'Abdominals'],
    commonMistakes: [
      'Moving too quickly',
      'Not coordinating with breath',
      'Collapsing shoulders'
    ],
    reps: 10,
    sets: 2,
    category: 'stretching',
  },
  {
    id: '10',
    title: 'Pelvic Tilt',
    description: 'Simple exercise to engage core and relieve lower back discomfort.',
    duration: '3 min',
    difficulty: 'beginner',
    bodyArea: ['Lower Back', 'Core'],
    isFavorite: false,
    instructions: [
      'Lie on back with knees bent',
      'Feet flat on floor, arms by sides',
      'Flatten lower back into the floor',
      'Tighten abdominal muscles',
      'Hold for 5 seconds',
      'Release and repeat'
    ],
    targetMuscles: ['Transverse Abdominis', 'Pelvic Floor'],
    commonMistakes: [
      'Holding breath',
      'Using glutes instead of core',
      'Lifting hips off floor'
    ],
    reps: 15,
    sets: 3,
    category: 'strength',
  },

  // HIP EXERCISES
  {
    id: '11',
    title: 'Clamshell',
    description: 'Strengthen hip abductors for better hip stability and function.',
    duration: '4 min',
    difficulty: 'beginner',
    bodyArea: ['Hips', 'Glutes'],
    isFavorite: false,
    instructions: [
      'Lie on side with knees bent at 45 degrees',
      'Keep feet together',
      'Lift top knee while keeping feet touching',
      'Do not rotate pelvis',
      'Hold briefly at the top',
      'Lower with control'
    ],
    targetMuscles: ['Gluteus Medius', 'Hip External Rotators'],
    commonMistakes: [
      'Rolling hips backward',
      'Lifting too high',
      'Moving too quickly'
    ],
    reps: 15,
    sets: 3,
    category: 'strength',
  },
  {
    id: '12',
    title: 'Hip Flexor Stretch',
    description: 'Stretch tight hip flexors that contribute to lower back and hip issues.',
    duration: '3 min',
    difficulty: 'beginner',
    bodyArea: ['Hips', 'Lower Back'],
    isFavorite: false,
    instructions: [
      'Kneel on one knee (half-kneeling)',
      'Front foot flat, knee over ankle',
      'Keep torso upright',
      'Gently shift weight forward',
      'Feel stretch in front of back hip',
      'Hold for 30 seconds, switch sides'
    ],
    targetMuscles: ['Iliopsoas', 'Rectus Femoris'],
    commonMistakes: [
      'Arching lower back',
      'Leaning forward too much',
      'Front knee going past toes'
    ],
    reps: 3,
    sets: 2,
    category: 'stretching',
  },

  // NECK EXERCISES
  {
    id: '13',
    title: 'Chin Tucks',
    description: 'Strengthen deep neck flexors and improve posture.',
    duration: '3 min',
    difficulty: 'beginner',
    bodyArea: ['Neck'],
    isFavorite: false,
    instructions: [
      'Sit or stand with good posture',
      'Look straight ahead',
      'Gently draw chin back (make a double chin)',
      'Keep eyes level, do not look down',
      'Hold for 5 seconds',
      'Relax and repeat'
    ],
    targetMuscles: ['Deep Cervical Flexors', 'Longus Colli'],
    commonMistakes: [
      'Jutting chin forward',
      'Looking down',
      'Tensing shoulders'
    ],
    reps: 10,
    sets: 3,
    category: 'strength',
  },
  {
    id: '14',
    title: 'Neck Rotation Stretch',
    description: 'Gently improve neck mobility and reduce stiffness.',
    duration: '2 min',
    difficulty: 'beginner',
    bodyArea: ['Neck'],
    isFavorite: false,
    instructions: [
      'Sit comfortably with shoulders relaxed',
      'Slowly turn head to the right',
      'Hold for 15-30 seconds',
      'Return to center',
      'Turn head to the left',
      'Repeat each side'
    ],
    targetMuscles: ['Sternocleidomastoid', 'Scalenes'],
    commonMistakes: [
      'Rotating too far',
      'Moving too quickly',
      'Lifting shoulders'
    ],
    reps: 5,
    sets: 2,
    category: 'stretching',
  },

  // BALANCE EXERCISES
  {
    id: '15',
    title: 'Single Leg Stand',
    description: 'Improve balance and proprioception for fall prevention.',
    duration: '4 min',
    difficulty: 'beginner',
    bodyArea: ['Legs', 'Core'],
    isFavorite: false,
    instructions: [
      'Stand near a wall or sturdy surface for support',
      'Shift weight to one leg',
      'Lift other foot slightly off the ground',
      'Hold for 30 seconds',
      'Switch legs',
      'Progress to no hand support'
    ],
    targetMuscles: ['Core', 'Ankle Stabilizers', 'Hip Stabilizers'],
    commonMistakes: [
      'Locking the standing knee',
      'Not engaging core',
      'Looking down'
    ],
    reps: 4,
    sets: 2,
    category: 'balance',
  },
  {
    id: '16',
    title: 'Heel-to-Toe Walk',
    description: 'Dynamic balance exercise to improve gait and coordination.',
    duration: '3 min',
    difficulty: 'intermediate',
    bodyArea: ['Legs', 'Core'],
    isFavorite: false,
    instructions: [
      'Walk in a straight line',
      'Place heel directly in front of toes',
      'Arms out to sides for balance',
      'Look ahead, not at feet',
      'Walk 10-15 steps',
      'Turn and repeat'
    ],
    targetMuscles: ['Core', 'Leg Muscles', 'Ankle Stabilizers'],
    commonMistakes: [
      'Looking at feet',
      'Taking too wide steps',
      'Moving too quickly'
    ],
    reps: 10,
    sets: 3,
    category: 'balance',
  },

  // ANKLE EXERCISES
  {
    id: '17',
    title: 'Ankle Circles',
    description: 'Improve ankle mobility and reduce stiffness.',
    duration: '2 min',
    difficulty: 'beginner',
    bodyArea: ['Ankles'],
    isFavorite: false,
    instructions: [
      'Sit with leg extended or elevated',
      'Rotate ankle clockwise slowly',
      'Make full circles with your foot',
      'Complete 10 circles',
      'Reverse direction',
      'Switch feet'
    ],
    targetMuscles: ['Ankle Muscles', 'Calf Muscles'],
    commonMistakes: [
      'Moving too fast',
      'Not making full circles',
      'Moving entire leg'
    ],
    reps: 10,
    sets: 2,
    category: 'mobility',
  },
  {
    id: '18',
    title: 'Calf Raises',
    description: 'Strengthen calves and improve ankle stability.',
    duration: '3 min',
    difficulty: 'beginner',
    bodyArea: ['Ankles', 'Calves'],
    isFavorite: false,
    instructions: [
      'Stand with feet hip-width apart',
      'Hold onto a wall or chair for balance',
      'Rise up onto balls of feet',
      'Hold briefly at the top',
      'Lower heels back down slowly',
      'Keep movements controlled'
    ],
    targetMuscles: ['Gastrocnemius', 'Soleus'],
    commonMistakes: [
      'Rolling ankles outward',
      'Not going full range',
      'Dropping down too fast'
    ],
    reps: 15,
    sets: 3,
    category: 'strength',
  },

  // WRIST/HAND EXERCISES
  {
    id: '19',
    title: 'Wrist Flexion & Extension',
    description: 'Improve wrist mobility for better hand function.',
    duration: '3 min',
    difficulty: 'beginner',
    bodyArea: ['Wrists', 'Forearms'],
    isFavorite: false,
    instructions: [
      'Rest forearm on table, wrist hanging off edge',
      'Palm facing down for extension',
      'Slowly raise hand up, then lower',
      'Flip hand palm up for flexion',
      'Slowly raise hand up, then lower',
      'Keep forearm still throughout'
    ],
    targetMuscles: ['Wrist Flexors', 'Wrist Extensors'],
    commonMistakes: [
      'Moving forearm',
      'Moving too quickly',
      'Gripping too tightly'
    ],
    reps: 15,
    sets: 2,
    category: 'mobility',
  },
  {
    id: '20',
    title: 'Grip Strengthening',
    description: 'Improve hand grip strength for daily activities.',
    duration: '3 min',
    difficulty: 'beginner',
    bodyArea: ['Hands', 'Forearms'],
    isFavorite: false,
    instructions: [
      'Use a stress ball or soft ball',
      'Squeeze the ball firmly',
      'Hold for 3-5 seconds',
      'Release slowly',
      'Repeat with each hand',
      'Progress to firmer balls'
    ],
    targetMuscles: ['Finger Flexors', 'Forearm Muscles'],
    commonMistakes: [
      'Squeezing too quickly',
      'Not holding the squeeze',
      'Using only fingertips'
    ],
    reps: 15,
    sets: 3,
    category: 'strength',
    equipment: ['Stress ball', 'Tennis ball'],
  },
];

export const getExerciseById = (id: string): Exercise | undefined => {
  return exercises.find((ex) => ex.id === id);
};

export const getExercisesByBodyArea = (area: string): Exercise[] => {
  return exercises.filter((ex) => ex.bodyArea.includes(area));
};

export const getExercisesByCategory = (category: Exercise['category']): Exercise[] => {
  return exercises.filter((ex) => ex.category === category);
};

export const getExercisesByDifficulty = (difficulty: Exercise['difficulty']): Exercise[] => {
  return exercises.filter((ex) => ex.difficulty === difficulty);
};

export const getFavoriteExercises = (): Exercise[] => {
  return exercises.filter((ex) => ex.isFavorite);
};

export const searchExercises = (query: string): Exercise[] => {
  const lowerQuery = query.toLowerCase();
  return exercises.filter((ex) =>
    ex.title.toLowerCase().includes(lowerQuery) ||
    ex.description.toLowerCase().includes(lowerQuery) ||
    ex.bodyArea.some(area => area.toLowerCase().includes(lowerQuery)) ||
    ex.targetMuscles.some(muscle => muscle.toLowerCase().includes(lowerQuery))
  );
};

export const getUniqueBodyAreas = (): string[] => {
  const areas = new Set<string>();
  exercises.forEach(ex => ex.bodyArea.forEach(area => areas.add(area)));
  return Array.from(areas).sort();
};

export const getUniqueCategories = (): Exercise['category'][] => {
  const categories = new Set<Exercise['category']>();
  exercises.forEach(ex => categories.add(ex.category));
  return Array.from(categories);
};
