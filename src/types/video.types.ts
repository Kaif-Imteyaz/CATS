export interface UserVideoProfile {
  // user demographics
  ageRange: 'child' | 'teen' | 'adult' | 'senior';
  mobilityLevel: 'low' | 'medium' | 'high';
  conditionCategory: string;
  language: string;
  culturalContext: string;
  instructionStyle: 'technical' | 'encouraging' | 'simple';
  equipmentAvailable: string[];
  environment: 'home' | 'gym' | 'office';
  
  // exercise preferences
  preferredPace: 'slow' | 'medium' | 'fast';
  demonstrationAngle: 'front' | 'side' | 'multiple';
  includeVerbalCues: boolean;
  includeSubtitles: boolean;
}

export interface VideoGenerationRequest {
  exerciseId: string;
  exerciseName: string;
  userProfile: UserVideoProfile;
  customization: {
    duration: number; // 秒
    resolution: '720p' | '1080p';
    includeWarmup: boolean;
    includeCooldown: boolean;
  };
}

export interface GeneratedVideo {
  id: string;
  exerciseId: string;
  videoUri: string;
  thumbnailUri: string;
  duration: number;
  generatedAt: Date;
  profileSignature: string; //hash of UserVideoProfile for integrity check
  metadata: {
    aiModel: string;
    generationTime: number;
    instructions: string[];
    personalizedModifications: string[];
  };
}

export interface AIGenerationTask {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedCompletion?: Date;
  result?: GeneratedVideo;
  error?: string;
}