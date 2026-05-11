/**
 * Fal.ai Video Generation Service
 * Generates culturally-aware physiotherapy exercise videos based on user profile
 */

export interface UserProfile {
  age: number;
  gender: string;
  culturalBackground: string;
  conditions: string[];
  painLevel: number;
  mobilityLevel?: string;
}

export interface ExerciseConfig {
  exerciseType: string;
  bodyArea: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // seconds
  repetitions: number;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  exerciseType: string;
  duration: number;
  culturalAdaptations: string[];
  instructions: string[];
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

// Cultural adaptation settings
const CULTURAL_ADAPTATIONS: Record<string, {
  clothing: string;
  setting: string;
  instructor: string;
  language: string;
  modifications: string[];
}> = {
  western: {
    clothing: 'modern athletic wear',
    setting: 'bright modern gym or home environment',
    instructor: 'diverse fitness instructor',
    language: 'English',
    modifications: ['standard form', 'clear verbal cues'],
  },
  hispanic: {
    clothing: 'comfortable athletic wear',
    setting: 'warm, colorful home environment or outdoor space',
    instructor: 'Latino/Latina fitness instructor',
    language: 'Spanish with English subtitles',
    modifications: ['rhythmic movements', 'family-inclusive'],
  },
  'east-asian': {
    clothing: 'modest, comfortable clothing',
    setting: 'minimalist, zen-inspired space',
    instructor: 'East Asian fitness instructor',
    language: 'Mandarin/Japanese/Korean with subtitles',
    modifications: ['tai chi influences', 'mindful breathing'],
  },
  'south-asian': {
    clothing: 'loose, comfortable traditional or modern wear',
    setting: 'serene indoor space with natural elements',
    instructor: 'South Asian fitness instructor',
    language: 'Hindi/Urdu with English subtitles',
    modifications: ['yoga-inspired', 'pranayama breathing'],
  },
  african: {
    clothing: 'vibrant, comfortable athletic wear',
    setting: 'warm community-oriented space',
    instructor: 'African fitness instructor',
    language: 'English with cultural context',
    modifications: ['rhythmic movements', 'community spirit'],
  },
  'middle-eastern': {
    clothing: 'modest, comfortable athletic wear',
    setting: 'private, comfortable indoor space',
    instructor: 'Middle Eastern fitness instructor',
    language: 'Arabic with English subtitles',
    modifications: ['gender-sensitive options', 'modest movements'],
  },
  indigenous: {
    clothing: 'natural, comfortable clothing',
    setting: 'nature-inspired environment',
    instructor: 'Indigenous wellness guide',
    language: 'English with cultural respect',
    modifications: ['connection to land', 'holistic approach'],
  },
  mixed: {
    clothing: 'universal athletic wear',
    setting: 'inclusive modern space',
    instructor: 'diverse fitness instructor',
    language: 'English',
    modifications: ['culturally neutral', 'universally accessible'],
  },
};

// Exercise prompts for different conditions
const EXERCISE_PROMPTS: Record<string, {
  focus: string;
  movements: string[];
  precautions: string[];
}> = {
  'lower-back': {
    focus: 'lumbar spine mobility and core stabilization',
    movements: ['cat-cow stretch', 'pelvic tilts', 'bird-dog', 'knee-to-chest'],
    precautions: ['avoid twisting', 'maintain neutral spine', 'no forward bending initially'],
  },
  knee: {
    focus: 'knee joint mobility and quadriceps strengthening',
    movements: ['seated leg extensions', 'wall sits', 'step-ups', 'hamstring curls'],
    precautions: ['avoid deep squats', 'no impact movements', 'controlled range of motion'],
  },
  shoulder: {
    focus: 'shoulder mobility and rotator cuff strengthening',
    movements: ['pendulum swings', 'wall slides', 'external rotation', 'scapular squeezes'],
    precautions: ['avoid overhead reaching', 'no heavy lifting', 'gentle movements only'],
  },
  neck: {
    focus: 'cervical spine mobility and postural correction',
    movements: ['chin tucks', 'neck rotations', 'shoulder rolls', 'isometric holds'],
    precautions: ['no sudden movements', 'avoid extreme ranges', 'stop if dizzy'],
  },
  'post-surgery': {
    focus: 'gentle rehabilitation and scar tissue management',
    movements: ['breathing exercises', 'gentle range of motion', 'isometrics', 'walking'],
    precautions: ['follow surgeon guidelines', 'no resistance initially', 'monitor for swelling'],
  },
  general: {
    focus: 'overall fitness and functional movement',
    movements: ['squats', 'lunges', 'push-ups', 'planks', 'stretching'],
    precautions: ['proper warm-up', 'listen to body', 'maintain form'],
  },
};

class VideoGenerationService {
  private apiKey: string | null = null;
  private baseUrl = 'https://fal.run';

  constructor() {
    // API key should be set via environment or secure storage
    this.apiKey = import.meta.env.VITE_FAL_API_KEY || null;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * Generate a prompt for the AI video model based on user profile and exercise
   */
  generatePrompt(userProfile: UserProfile, exercise: ExerciseConfig): string {
    const cultural = CULTURAL_ADAPTATIONS[userProfile.culturalBackground] || CULTURAL_ADAPTATIONS.mixed;
    const exerciseInfo = EXERCISE_PROMPTS[exercise.bodyArea] || EXERCISE_PROMPTS.general;

    // Age-appropriate modifications
    const ageModifier = userProfile.age > 65
      ? 'senior-friendly, slow-paced, seated options available'
      : userProfile.age < 30
        ? 'dynamic, energetic but controlled'
        : 'moderate pace, clear instruction';

    // Pain level considerations
    const painModifier = userProfile.painLevel > 7
      ? 'very gentle, minimal movement, focus on breathing'
      : userProfile.painLevel > 4
        ? 'gentle, modified range of motion'
        : 'standard therapeutic movements';

    const prompt = `
      Create a professional physiotherapy exercise demonstration video:

      INSTRUCTOR: ${cultural.instructor} in ${cultural.clothing}
      SETTING: ${cultural.setting}

      EXERCISE: ${exercise.exerciseType}
      FOCUS: ${exerciseInfo.focus}
      DIFFICULTY: ${exercise.difficulty}
      DURATION: ${exercise.duration} seconds

      MOVEMENTS TO SHOW:
      ${exerciseInfo.movements.slice(0, 3).join(', ')}

      STYLE REQUIREMENTS:
      - ${ageModifier}
      - ${painModifier}
      - Clear visual demonstration from multiple angles
      - Calm, therapeutic atmosphere
      - ${cultural.modifications.join(', ')}

      SAFETY NOTES:
      ${exerciseInfo.precautions.join('. ')}

      The video should be calming, professional, and specifically designed for
      rehabilitation purposes. Show proper form, breathing cues, and modifications.
    `.trim();

    return prompt;
  }

  /**
   * Generate instructions text for the exercise
   */
  generateInstructions(userProfile: UserProfile, exercise: ExerciseConfig): string[] {
    const cultural = CULTURAL_ADAPTATIONS[userProfile.culturalBackground] || CULTURAL_ADAPTATIONS.mixed;
    const exerciseInfo = EXERCISE_PROMPTS[exercise.bodyArea] || EXERCISE_PROMPTS.general;

    const instructions: string[] = [
      `Welcome to your ${exercise.exerciseType} session.`,
      `Today we'll focus on ${exerciseInfo.focus}.`,
      `Please ensure you have a comfortable space and are wearing ${cultural.clothing}.`,
      '',
      'Before we begin:',
      '- Listen to your body at all times',
      '- Stop if you feel any sharp pain',
      '- Breathe naturally throughout',
      '',
      `Exercises for today (${exercise.difficulty} level):`,
      ...exerciseInfo.movements.map((m, i) => `${i + 1}. ${m}`),
      '',
      'Important reminders:',
      ...exerciseInfo.precautions.map(p => `• ${p}`),
    ];

    return instructions;
  }

  /**
   * Request video generation from fal.ai
   * Note: This is a mock implementation - actual fal.ai integration requires their SDK
   */
  async generateVideo(
    userProfile: UserProfile,
    exercise: ExerciseConfig
  ): Promise<GeneratedVideo> {
    const prompt = this.generatePrompt(userProfile, exercise);
    const instructions = this.generateInstructions(userProfile, exercise);

    // Create a pending video entry
    const video: GeneratedVideo = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: '',
      thumbnailUrl: '',
      exerciseType: exercise.exerciseType,
      duration: exercise.duration,
      culturalAdaptations: CULTURAL_ADAPTATIONS[userProfile.culturalBackground]?.modifications || [],
      instructions,
      status: 'pending',
    };

    // If no API key, return a mock response
    if (!this.apiKey) {
      console.warn('Fal.ai API key not set. Using mock video generation.');
      return {
        ...video,
        status: 'completed',
        url: '/assets/placeholder-video.mp4',
        thumbnailUrl: '/general.png',
      };
    }

    try {
      video.status = 'generating';

      // Fal.ai video generation request
      // Using their text-to-video or image-to-video models
      const response = await fetch(`${this.baseUrl}/fal-ai/fast-svd-lcm`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: 'blurry, low quality, distorted, inappropriate, violent',
          num_frames: Math.min(exercise.duration * 24, 120), // 24fps, max 5 seconds
          fps: 24,
          motion_bucket_id: 127,
          cond_aug: 0.02,
        }),
      });

      if (!response.ok) {
        throw new Error(`Video generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        ...video,
        status: 'completed',
        url: result.video?.url || result.url,
        thumbnailUrl: result.thumbnail?.url || result.images?.[0]?.url || '',
      };
    } catch (error) {
      console.error('Video generation error:', error);
      return {
        ...video,
        status: 'failed',
      };
    }
  }

  /**
   * Generate a personalized exercise plan with videos
   */
  async generateExercisePlan(
    userProfile: UserProfile,
    sessionDuration: number = 15 // minutes
  ): Promise<GeneratedVideo[]> {
    const exercises: ExerciseConfig[] = [];

    // Determine exercises based on conditions
    for (const condition of userProfile.conditions) {
      const info = EXERCISE_PROMPTS[condition];
      if (info) {
        // Add 2-3 exercises per condition
        info.movements.slice(0, 2).forEach((movement, index) => {
          exercises.push({
            exerciseType: movement,
            bodyArea: condition,
            difficulty: userProfile.painLevel > 5 ? 'beginner' : 'intermediate',
            duration: Math.floor((sessionDuration * 60) / (userProfile.conditions.length * 2)),
            repetitions: 10,
          });
        });
      }
    }

    // Generate videos for each exercise (in parallel with rate limiting)
    const videos: GeneratedVideo[] = [];
    for (const exercise of exercises) {
      const video = await this.generateVideo(userProfile, exercise);
      videos.push(video);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return videos;
  }
}

// Export singleton instance
export const videoGenerationService = new VideoGenerationService();

// Export types and utilities
export { CULTURAL_ADAPTATIONS, EXERCISE_PROMPTS };
