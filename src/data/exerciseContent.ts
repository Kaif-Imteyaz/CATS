// Exercise content database with language and cultural tagging
// Privacy: Only condition categories and preferences used, no personal identifiers
// Updated for senior users with local videos

import type { SupportedLanguage } from './translations';

export interface ExerciseContent {
  id: string;
  exerciseId: string;
  language: SupportedLanguage;
  culturalContext: string;
  title: string;
  description: string;
  videoUrl: string; 
  thumbnailUrl: string;
  duration: string;
  instructions: string[];
  safetyTips: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requiresEquipment: boolean;
  aiGenerated: boolean;
  cachedAt?: Date;
}


export interface ExerciseStats {
  todayAssigned: number;
  todayCompleted: number;
  totalRepsLastSession: number;
  avgSpeed: 'slow' | 'normal' | 'fast';
  fatigueDetected: boolean;
  consistency: 'improving' | 'stable' | 'declining';
  weeklyProgress: number[];
}

// Culture-aware content database for seniors
export const exerciseContentDB: ExerciseContent[] = [
  // English - Western (Senior-focused exercises)
  {
    id: 'content-1-en',
    exerciseId: '1',
    language: 'en-US',
    culturalContext: 'western',
    title: 'Standing Overhead Shoulder Press',
    description: 'Safe standing exercise to improve shoulder strength and mobility with light weights or resistance bands.',
    videoUrl: '/public/assets/elderVideo_en/Urdu_Shoulder_Exercise_Video_Generation.mp4',
    thumbnailUrl: '/public/assets/elder_en_thumbnails/image.png',
    duration: '5 min',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold light weights (1-2 lbs) or resistance bands',
      'Start with hands at shoulder height, palms facing forward',
      'Engage your core for stability',
      'Slowly press weights upward until arms are almost straight',
      'Lower back to shoulder height with control'
    ],
    safetyTips: [
      'Keep a slight bend in knees for balance',
      'Do not lock elbows at the top',
      'Stop if you feel shoulder pain',
      'Use lighter weights or no weights if needed',
      'Keep back straight, avoid arching',
      'Have a chair nearby for support if needed'
    ],
    difficulty: 'intermediate',
    requiresEquipment: true,
    aiGenerated: false,
  },
  {
    id: 'content-2-en',
    exerciseId: '2',
    language: 'en-US',
    culturalContext: 'western',
    title: 'Gentle Chair Squat',
    description: 'Safe, seated exercise to strengthen leg muscles while maintaining balance and stability.',
    videoUrl: '/assets/videos/gentle-chair-squat-en.mp4',
    thumbnailUrl: '/assets/thumb/chair-squat-thumb.jpg',
    duration: '8 min',
    instructions: [
      'Sit near the front of a sturdy chair',
      'Place feet flat on floor, shoulder-width apart',
      'Lean slightly forward and stand up slowly',
      'Hold for 2 seconds, then sit back down gently',
      'Use chair arms for support if needed'
    ],
    safetyTips: [
      'Have chair against wall for stability',
      'Keep movements slow and controlled',
      'Stop if you feel dizzy or unsteady',
      'Breathe normally throughout'
    ],
    difficulty: 'beginner',
    requiresEquipment: true,
    aiGenerated: false,
  },
  {
    id: 'content-3-en',
    exerciseId: '3',
    language: 'en-US',
    culturalContext: 'western',
    title: 'Seated Leg Lifts',
    description: 'Improve leg strength and circulation while seated comfortably.',
    videoUrl: '/assets/videos/seated-leg-lifts-en.mp4',
    thumbnailUrl: '/assets/thumb/leg-lifts-thumb.jpg',
    duration: '6 min',
    instructions: [
      'Sit in a chair with back straight',
      'Slowly lift one leg straight out',
      'Hold for 3 seconds, then lower gently',
      'Repeat with other leg',
      'Perform 8-10 lifts per leg'
    ],
    safetyTips: [
      'Keep back supported against chair',
      'Hold onto chair for balance',
      'Do not lock knees completely',
      'Move at comfortable pace'
    ],
    difficulty: 'beginner',
    requiresEquipment: true,
    aiGenerated: false,
  },
  {
    id: 'content-4-en',
    exerciseId: '4',
    language: 'en-US',
    culturalContext: 'western',
    title: 'Wall-Assisted Arm Raises',
    description: 'Improve shoulder mobility and upper body strength with wall support.',
    videoUrl: '/assets/videos/wall-arm-raises-en.mp4',
    thumbnailUrl: '/assets/thumb/arm-raises-thumb.jpg',
    duration: '7 min',
    instructions: [
      'Stand facing a wall',
      'Place hands on wall at shoulder height',
      'Slowly walk hands up the wall',
      'Stop when comfortable, hold for 5 seconds',
      'Walk hands back down'
    ],
    safetyTips: [
      'Keep feet slightly away from wall',
      'Stop if you feel shoulder pain',
      'Use non-slip shoes',
      'Have a chair nearby for support'
    ],
    difficulty: 'beginner',
    requiresEquipment: false,
    aiGenerated: false,
  },
  {
    id: 'content-5-en',
    exerciseId: '5',
    language: 'en-US',
    culturalContext: 'western',
    title: 'Balance and Stability (Chair Support)',
    description: 'Simple balance exercises to prevent falls and improve confidence.',
    videoUrl: '/assets/videos/balance-exercises-en.mp4',
    thumbnailUrl: '/assets/thumb/balance-thumb.jpg',
    duration: '10 min',
    instructions: [
      'Stand behind a sturdy chair',
      'Hold chair back with both hands',
      'Lift one foot slightly off floor',
      'Hold for 10 seconds, then switch',
      'Progress to one-hand support'
    ],
    safetyTips: [
      'Never do balance exercises alone',
      'Have chair against wall',
      'Stop if you feel unsteady',
      'Wear proper footwear'
    ],
    difficulty: 'intermediate',
    requiresEquipment: true,
    aiGenerated: false,
  },
  {
    id: 'content-6-en',
    exerciseId: '6',
    language: 'en-US',
    culturalContext: 'western',
    title: 'Gentle Neck and Shoulder Stretches',
    description: 'Relieve tension in neck and shoulders with safe, seated stretches.',
    videoUrl: '/assets/videos/neck-stretches-en.mp4',
    thumbnailUrl: '/assets/thumb/neck-stretch-thumb.jpg',
    duration: '8 min',
    instructions: [
      'Sit upright in chair',
      'Slowly tilt head toward shoulder',
      'Hold for 15 seconds, do not bounce',
      'Return to center and repeat other side',
      'Roll shoulders forward and backward'
    ],
    safetyTips: [
      'Move slowly and smoothly',
      'Stop if you feel pain',
      'Breathe deeply during stretches',
      'Keep movements small'
    ],
    difficulty: 'beginner',
    requiresEquipment: true,
    aiGenerated: false,
  },
  // Spanish versions (Senior-focused)
  {
    id: 'content-1-es',
    exerciseId: '1',
    language: 'es-ES',
    culturalContext: 'hispanic',
    title: 'Sentadilla Suave en Silla',
    description: 'Ejercicio seguro sentado para fortalecer los músculos de las piernas manteniendo el equilibrio.',
    videoUrl: '/assets/videos/gentle-chair-squat-es.mp4',
    thumbnailUrl: '/assets/thumb/chair-squat-thumb-es.jpg',
    duration: '8 min',
    instructions: [
      'Siéntese cerca del borde de una silla robusta',
      'Ponga los pies planos en el suelo, separados al ancho de los hombros',
      'Inclínese ligeramente hacia adelante y levántese lentamente',
      'Mantenga por 2 segundos, luego siéntese suavemente',
      'Use los brazos de la silla como apoyo si es necesario'
    ],
    safetyTips: [
      'Coloque la silla contra la pared para estabilidad',
      'Mantenga movimientos lentos y controlados',
      'Deténgase si se siente mareado o inestable',
      'Respire normalmente durante todo el ejercicio'
    ],
    difficulty: 'beginner',
    requiresEquipment: true,
    aiGenerated: false,
  },
  {
    id: 'content-2-es',
    exerciseId: '2',
    language: 'es-ES',
    culturalContext: 'hispanic',
    title: 'Levantamiento de Piernas Sentado',
    description: 'Mejore la fuerza de las piernas y la circulación mientras está sentado cómodamente.',
    videoUrl: '/assets/videos/seated-leg-lifts-es.mp4',
    thumbnailUrl: '/assets/thumb/leg-lifts-thumb-es.jpg',
    duration: '6 min',
    instructions: [
      'Siéntese en una silla con la espalda recta',
      'Levante lentamente una pierna hacia adelante',
      'Mantenga por 3 segundos, luego baje suavemente',
      'Repita con la otra pierna',
      'Realice 8-10 levantamientos por pierna'
    ],
    safetyTips: [
      'Mantenga la espalda apoyada contra la silla',
      'Sosténgase de la silla para equilibrarse',
      'No bloquee las rodillas completamente',
      'Muévase a un ritmo cómodo'
    ],
    difficulty: 'beginner',
    requiresEquipment: true,
    aiGenerated: false,
  },
  // French versions (Senior-focused)
  {
    id: 'content-1-fr',
    exerciseId: '1',
    language: 'fr-FR',
    culturalContext: 'european',
    title: 'Squat Doux sur Chaise',
    description: 'Exercice assis sûr pour renforcer les muscles des jambes tout en maintenant l\'équilibre.',
    videoUrl: '/assets/videos/gentle-chair-squat-fr.mp4',
    thumbnailUrl: '/assets/thumb/chair-squat-thumb-fr.jpg',
    duration: '8 min',
    instructions: [
      'Asseyez-vous près du bord d\'une chaise robuste',
      'Placez les pieds à plat sur le sol, écartés à la largeur des épaules',
      'Penchez-vous légèrement vers l\'avant et levez-vous lentement',
      'Maintenez pendant 2 secondes, puis rasseyez-vous doucement',
      'Utilisez les accoudoirs de la chaise pour vous soutenir si nécessaire'
    ],
    safetyTips: [
      'Placez la chaise contre un mur pour plus de stabilité',
      'Gardez les mouvements lents et contrôlés',
      'Arrêtez si vous vous sentez étourdi ou instable',
      'Respirez normalement tout au long'
    ],
    difficulty: 'beginner',
    requiresEquipment: true,
    aiGenerated: false,
  },
  // Hindi versions (Senior-focused)
  {
    id: 'content-1-hi',
    exerciseId: '1',
    language: 'hi-IN',
    culturalContext: 'south-asian',
    title: 'कोमल कुर्सी स्क्वाट',
    description: 'संतुलन बनाए रखते हुए पैरों की मांसपेशियों को मजबूत करने के लिए सुरक्षित, बैठा हुआ व्यायाम।',
    videoUrl: '/assets/videos/gentle-chair-squat-hi.mp4',
    thumbnailUrl: '/assets/thumb/chair-squat-thumb-hi.jpg',
    duration: '8 मिनट',
    instructions: [
      'एक मजबूत कुर्सी के सामने बैठें',
      'पैरों को जमीन पर सपाट रखें, कंधे की चौड़ाई पर',
      'थोड़ा आगे झुकें और धीरे-धीरे खड़े हों',
      '2 सेकंड के लिए रुकें, फिर धीरे से वापस बैठें',
      'यदि आवश्यक हो तो कुर्सी के हत्थे का सहारा लें'
    ],
    safetyTips: [
      'स्टेबिलिटी के लिए कुर्सी दीवार से लगाकर रखें',
      'हल्के और नियंत्रित आंदोलन करें',
      'यदि चक्कर आए या अस्थिर महसूस हो तो रुक जाएं',
      'पूरे समय सामान्य रूप से सांस लें'
    ],
    difficulty: 'beginner',
    requiresEquipment: true,
    aiGenerated: false,
  },
  // Chinese versions (Senior-focused)
  {
    id: 'content-1-zh',
    exerciseId: '1',
    language: 'zh-CN',
    culturalContext: 'east-asian',
    title: '温和的椅子深蹲',
    description: '安全、坐姿的练习，在保持平衡和稳定性的同时加强腿部肌肉。',
    videoUrl: '/assets/videos/gentle-chair-squat-zh.mp4',
    thumbnailUrl: '/assets/thumb/chair-squat-thumb-zh.jpg',
    duration: '8分钟',
    instructions: [
      '坐在稳固的椅子前部',
      '双脚平放在地上，与肩同宽',
      '身体微微前倾，慢慢站起',
      '保持2秒钟，然后轻轻坐下',
      '如需要，可使用椅子扶手支撑'
    ],
    safetyTips: [
      '将椅子靠墙放置以增加稳定性',
      '保持动作缓慢且受控',
      '如感到头晕或不稳请停止',
      '整个过程中正常呼吸'
    ],
    difficulty: 'beginner',
    requiresEquipment: true,
    aiGenerated: false,
  },
];

// Senior-friendly exercise categories
export const seniorExerciseCategories = {
  balance: ['1', '4'], // Exercise IDs for balance exercises
  strength: ['1', '2', '3'], // Exercise IDs for strength exercises
  flexibility: ['5'], // Exercise IDs for flexibility exercises
  seated: ['1', '2', '5'], // Exercises that can be done seated
  standing: ['3', '4'], // Exercises that require standing
};

// Get content based on user preferences with senior-friendly filtering
export function getExerciseContent(
  exerciseId: string,
  language: SupportedLanguage,
  culturalContext?: string,
  mobilityLevel: string = 'medium'
): ExerciseContent | undefined {
  // First, filter by mobility level
  let availableExercises = exerciseContentDB.filter(exercise => {
    if (mobilityLevel === 'low' && exercise.difficulty !== 'beginner') {
      return false;
    }
    if (mobilityLevel === 'medium' && exercise.difficulty === 'advanced') {
      return false;
    }
    return true;
  });
  
  // Try to find exact match with language and cultural context
  let content = availableExercises.find(
    (c) => c.exerciseId === exerciseId && 
           c.language === language && 
           (culturalContext ? c.culturalContext === culturalContext : true)
  );
  
  // Fallback to language match only
  if (!content) {
    content = availableExercises.find(
      (c) => c.exerciseId === exerciseId && c.language === language
    );
  }
  
  // Fallback to English with senior-friendly filter
  if (!content) {
    content = availableExercises.find(
      (c) => c.exerciseId === exerciseId && c.language === 'en-US'
    );
  }
  
  return content;
}

// Get senior-friendly exercises by category
export function getSeniorExercisesByCategory(
  category: keyof typeof seniorExerciseCategories,
  language: SupportedLanguage,
  mobilityLevel: string = 'medium'
): ExerciseContent[] {
  const exerciseIds = seniorExerciseCategories[category];
  return exerciseIds
    .map(id => getExerciseContent(id, language, undefined, mobilityLevel))
    .filter((exercise): exercise is ExerciseContent => exercise !== undefined);
}

// Get all content for a specific language with senior-friendly filter
export function getContentByLanguage(
  language: SupportedLanguage, 
  mobilityLevel: string = 'medium'
): ExerciseContent[] {
  return exerciseContentDB.filter((c) => 
    c.language === language && 
    (mobilityLevel === 'low' ? c.difficulty === 'beginner' : true) &&
    (mobilityLevel === 'medium' ? c.difficulty !== 'advanced' : true)
  );
}

// Mock exercise stats for seniors
export function getExerciseStats(): ExerciseStats {
  return {
    todayAssigned: 2, // Reduced for seniors
    todayCompleted: 1,
    totalRepsLastSession: 24, // Lower rep count
    avgSpeed: 'slow', // Default to slow for safety
    fatigueDetected: false,
    consistency: 'improving',
    weeklyProgress: [75, 78, 80, 82, 85, 0, 0], // More gradual progress
  };
}

// Privacy-safe profile for AI content generation (senior-focused)
export interface SafeProfileForAI {
  ageRange: string;
  conditionCategory: string;
  mobilityLevel: string;
  language: string;
  culturalContext: string;
  instructionStyle: string;
  // No personal identifiers, camera data, or pose landmarks
  fallRisk: 'low' | 'medium' | 'high';
  requiresSeated: boolean;
}

export function createSafeProfileForAI(userProfile: {
  ageRange?: string;
  conditions?: string[];
  mobilityLevel?: string;
  language?: string;
  culturalBackground?: string;
  instructionStyle?: string;
  fallRisk?: 'low' | 'medium' | 'high';
}): SafeProfileForAI {
  const ageRange = userProfile.ageRange || 'senior';
  const conditions = userProfile.conditions || [];
  
  // Auto-detect seated requirement based on conditions
  const requiresSeated = conditions.some(condition => 
    ['balance-issues', 'arthritis', 'parkinsons', 'stroke-recovery'].includes(condition)
  ) || userProfile.mobilityLevel === 'low';
  
  return {
    ageRange,
    conditionCategory: conditions[0] || 'general',
    mobilityLevel: userProfile.mobilityLevel || 'medium',
    language: userProfile.language || 'en-US',
    culturalContext: userProfile.culturalBackground || 'western',
    instructionStyle: userProfile.instructionStyle || 'clear-simple',
    fallRisk: userProfile.fallRisk || 'medium',
    requiresSeated,
  };
}

// Get fall prevention exercises
export function getFallPreventionExercises(
  language: SupportedLanguage,
  fallRisk: 'low' | 'medium' | 'high'
): ExerciseContent[] {
  // Balance exercises are key for fall prevention
  const balanceExercises = getSeniorExercisesByCategory('balance', language);
  
  // Adjust based on fall risk
  if (fallRisk === 'high') {
    return balanceExercises.filter(exercise => 
      exercise.requiresEquipment && // Must have chair support
      exercise.difficulty === 'beginner'
    );
  }
  
  return balanceExercises;
}

// Check if exercise is safe for user's profile
export function isExerciseSafeForUser(
  exercise: ExerciseContent,
  userProfile: SafeProfileForAI
): boolean {
  // High fall risk users should only do seated or supported exercises
  if (userProfile.fallRisk === 'high' && !exercise.requiresEquipment) {
    return false;
  }
  
  // Low mobility users should only do beginner seated exercises
  if (userProfile.mobilityLevel === 'low' && 
      (exercise.difficulty !== 'beginner' || !seniorExerciseCategories.seated.includes(exercise.exerciseId))) {
    return false;
  }
  
  return true;
}