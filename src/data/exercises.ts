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
}

export const exercises: Exercise[] = [
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
  },
];

export const getExerciseById = (id: string): Exercise | undefined => {
  return exercises.find((ex) => ex.id === id);
};

export const getExercisesByBodyArea = (area: string): Exercise[] => {
  return exercises.filter((ex) => ex.bodyArea.includes(area));
};

export const getFavoriteExercises = (): Exercise[] => {
  return exercises.filter((ex) => ex.isFavorite);
};