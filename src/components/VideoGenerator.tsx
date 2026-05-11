import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton-loaders';
import { useAppStore } from '../stores/appStore';
import {
  videoGenerationService,
  GeneratedVideo,
  ExerciseConfig,
  CULTURAL_ADAPTATIONS,
} from '../services/videoGeneration';
import {
  Sparkles,
  Video,
  Play,
  Loader2,
  Check,
  AlertCircle,
  Globe,
  Heart,
  Dumbbell,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface VideoGeneratorProps {
  onVideoGenerated?: (video: GeneratedVideo) => void;
  className?: string;
}

export function VideoGenerator({ onVideoGenerated, className }: VideoGeneratorProps) {
  const { userProfile } = useAppStore();
  const { haptic } = useHaptics();
  const [generating, setGenerating] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const culturalInfo = CULTURAL_ADAPTATIONS[userProfile.culturalBackground] || CULTURAL_ADAPTATIONS.mixed;

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setError(null);
    haptic('medium');

    try {
      const generatedVideos = await videoGenerationService.generateExercisePlan(
        {
          age: userProfile.age,
          gender: userProfile.gender,
          culturalBackground: userProfile.culturalBackground,
          conditions: userProfile.conditions,
          painLevel: userProfile.painLevel,
        },
        15 // 15-minute session
      );

      setVideos(generatedVideos);
      haptic('success');

      if (generatedVideos.length > 0 && onVideoGenerated) {
        onVideoGenerated(generatedVideos[0]);
      }
    } catch (err) {
      setError('Failed to generate exercise plan. Please try again.');
      haptic('error');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSingle = async (exerciseType: string) => {
    setSelectedExercise(exerciseType);
    setGenerating(true);
    setError(null);
    haptic('light');

    const exerciseConfig: ExerciseConfig = {
      exerciseType,
      bodyArea: userProfile.conditions[0] || 'general',
      difficulty: userProfile.painLevel > 5 ? 'beginner' : 'intermediate',
      duration: 60,
      repetitions: 10,
    };

    try {
      const video = await videoGenerationService.generateVideo(
        {
          age: userProfile.age,
          gender: userProfile.gender,
          culturalBackground: userProfile.culturalBackground,
          conditions: userProfile.conditions,
          painLevel: userProfile.painLevel,
        },
        exerciseConfig
      );

      setVideos(prev => [...prev, video]);
      haptic('success');

      if (onVideoGenerated) {
        onVideoGenerated(video);
      }
    } catch (err) {
      setError('Failed to generate video. Please try again.');
      haptic('error');
    } finally {
      setGenerating(false);
      setSelectedExercise(null);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">AI Exercise Videos</h2>
          <p className="text-xs text-muted-foreground">
            Personalized for your needs and culture
          </p>
        </div>
      </div>

      {/* Cultural Adaptation Info */}
      <Card className="bg-muted/50 border-0">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Globe className="text-primary flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">
                Culturally Adapted for You
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {culturalInfo.modifications.map((mod, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={12} className="text-success" />
                    {mod}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condition-based exercises */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">
          Based on your conditions:
        </h3>
        <div className="flex flex-wrap gap-2">
          {userProfile.conditions.map((condition) => (
            <span
              key={condition}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {condition.replace('-', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Exercise Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: 'Gentle Stretch', icon: Heart, color: 'text-pink-500 bg-pink-500/10' },
          { name: 'Core Stability', icon: Dumbbell, color: 'text-blue-500 bg-blue-500/10' },
          { name: 'Mobility Work', icon: RefreshCw, color: 'text-emerald-500 bg-emerald-500/10' },
          { name: 'Breathing', icon: Sparkles, color: 'text-purple-500 bg-purple-500/10' },
        ].map((exercise) => (
          <button
            key={exercise.name}
            onClick={() => handleGenerateSingle(exercise.name)}
            disabled={generating}
            className={cn(
              'p-3 rounded-xl border text-left transition-all',
              'hover:border-primary/50 hover:shadow-sm',
              'active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', exercise.color)}>
              {selectedExercise === exercise.name && generating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <exercise.icon size={16} />
              )}
            </div>
            <p className="text-sm font-medium">{exercise.name}</p>
          </button>
        ))}
      </div>

      {/* Generate Full Plan Button */}
      <Button
        onClick={handleGeneratePlan}
        disabled={generating}
        className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl"
      >
        {generating && !selectedExercise ? (
          <>
            <Loader2 className="mr-2 animate-spin" size={18} />
            Generating Your Plan...
          </>
        ) : (
          <>
            <Video className="mr-2" size={18} />
            Generate Full Session
          </>
        )}
      </Button>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="text-destructive flex-shrink-0" size={18} />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Generated Videos */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Your Exercises ({videos.length})
          </h3>

          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-muted flex items-center justify-center flex-shrink-0">
                    {video.status === 'completed' && video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.exerciseType}
                        className="w-full h-full object-cover"
                      />
                    ) : video.status === 'generating' ? (
                      <Loader2 className="animate-spin text-muted-foreground" size={24} />
                    ) : (
                      <Video className="text-muted-foreground" size={24} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{video.exerciseType}</h4>
                      {video.status === 'completed' && (
                        <Check className="text-success flex-shrink-0" size={14} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {video.duration}s • {video.culturalAdaptations[0] || 'Standard'}
                    </p>
                    {video.status === 'completed' && (
                      <Button size="sm" className="h-7 text-xs">
                        <Play size={12} className="mr-1" />
                        Watch
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading Skeletons */}
      {generating && videos.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <div className="flex">
                  <Skeleton className="w-24 h-24 rounded-none" />
                  <div className="p-3 flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
