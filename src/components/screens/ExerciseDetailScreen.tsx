import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import {
  ArrowLeft,
  Play,
  Pause,
  Settings2,
  Target,
  Volume2,
  VolumeX
} from 'lucide-react';
import { getExerciseById, Exercise } from '../../data/exercises';
import { useAppStore } from '../../stores/appStore';
import { cn } from '../../lib/utils';

interface ExerciseDetailScreenProps {
  exerciseId: string;
  onBack: () => void;
  onStartSession: () => void;
}

export function ExerciseDetailScreen({ exerciseId, onBack, onStartSession }: ExerciseDetailScreenProps) {
  const { userProfile } = useAppStore();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [customSets, setCustomSets] = useState(3);
  const [customReps, setCustomReps] = useState(12);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const ex = getExerciseById(exerciseId);
    if (ex) {
      setExercise(ex);
      setCustomSets(ex.sets || 3);
      setCustomReps(ex.reps || 12);
    }
  }, [exerciseId]);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Mock last session data
  const lastSession = {
    date: 'Yesterday',
    formScore: 88,
    reps: 10,
    sets: 3,
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  if (!exercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading exercise...</p>
      </div>
    );
  }

  // Determine placeholder icon based on body area
  const getPlaceholderIcon = () => {
    if (exercise.bodyArea.includes('Shoulders')) return '💪';
    if (exercise.bodyArea.includes('Legs')) return '🦵';
    if (exercise.bodyArea.includes('Core')) return '🏋️';
    if (exercise.bodyArea.includes('Back')) return '🧘';
    return '🏃';
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold line-clamp-1">{exercise.title}</h1>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>
        <Badge variant={exercise.difficulty}>{exercise.difficulty}</Badge>
      </header>

      <main className="px-4 space-y-4">
        {/* Video Player Section */}
        <Card variant="default" className="overflow-hidden animate-slide-up">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black">
              {exercise.videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    poster="/assets/thumb/shoulder-press-thumb.jpg"
                    onEnded={handleVideoEnded}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    controls={false}
                    muted={!soundEnabled}
                  >
                    <source src={exercise.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Custom Play/Pause Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={togglePlayPause}
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
                        isPlaying 
                          ? "opacity-0 hover:opacity-100 bg-black/50" 
                          : "bg-black/50 hover:bg-black/70"
                      )}
                    >
                      {isPlaying ? (
                        <Pause size={32} className="text-white" />
                      ) : (
                        <Play size={32} className="text-white ml-1" />
                      )}
                    </button>
                  </div>

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white hover:bg-white/20"
                          onClick={togglePlayPause}
                        >
                          {isPlaying ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} className="ml-0.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white hover:bg-white/20"
                          onClick={() => setSoundEnabled(!soundEnabled)}
                        >
                          {soundEnabled ? (
                            <Volume2 size={16} />
                          ) : (
                            <VolumeX size={16} />
                          )}
                        </Button>
                      </div>
                      <span className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
                        {/* {exercise.duration} */}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                  <div className="text-center">
                    <div className="text-6xl mb-2">
                      {getPlaceholderIcon()}
                    </div>
                    <p className="text-sm text-muted-foreground">Video not available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card variant="gradient" className="animate-slide-up animation-delay-100">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 size={14} />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Sets</span>
                <span className="font-semibold">{customSets}</span>
              </div>
              <Slider
                value={[customSets]}
                onValueChange={([v]) => setCustomSets(v)}
                min={1}
                max={5}
                step={1}
                className="h-4"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Reps</span>
                <span className="font-semibold">{customReps}</span>
              </div>
              <Slider
                value={[customReps]}
                onValueChange={([v]) => setCustomReps(v)}
                min={5}
                max={20}
                step={1}
                className="h-4"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (videoRef.current) {
                  videoRef.current.muted = !soundEnabled;
                }
              }}
            >
              <span>Sound</span>
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card variant="default" className="animate-slide-up animation-delay-200">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ul className="space-y-2 text-xs">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground line-clamp-2">{instruction}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Goals & Stats Card */}
        <Card variant="outline" className="animate-slide-up animation-delay-300">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target size={14} />
              Today's Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="space-y-1">
              {[
                { key: 'reducePain', label: 'Pain Relief', icon: '💆' },
                { key: 'improveMobility', label: 'Mobility', icon: '🏃' },
                { key: 'buildStrength', label: 'Strength', icon: '💪' },
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span>{icon}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full"
                      style={{ width: `${userProfile.goals[key as keyof typeof userProfile.goals]}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-6 text-right">
                    {userProfile.goals[key as keyof typeof userProfile.goals]}%
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Last Session</p>
              <div className="flex items-center justify-between">
                <span className="text-xs">{lastSession.date}</span>
                <Badge variant="secondary" className="text-xs">
                  {lastSession.formScore}% form
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Muscles Card */}
        <Card variant="ghost" className="border animate-slide-up animation-delay-400">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Target Muscles</p>
            <div className="flex flex-wrap gap-2">
              {exercise.targetMuscles.map((muscle) => (
                <Badge key={muscle} variant="secondary">{muscle}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Common Mistakes Card */}
        <Card variant="outline" className="animate-slide-up animation-delay-500">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-warning">⚠️ Common Mistakes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul className="space-y-1">
              {exercise.commonMistakes.map((mistake, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-warning">•</span>
                  {mistake}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>

      {/* Fixed Start Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="w-full flex justify-center">
          <Button
            variant="hero"
            size="lg"
            className={cn(
              "w-full max-w-sm h-14 sm:h-16 px-8 text-base sm:text-lg font-semibold",
              "rounded-2xl animate-slide-up shadow-lg transition-all",
              "bg-gradient-to-r from-primary to-accent text-white",
              "hover:from-primary/90 hover:to-accent/90 hover:shadow-xl",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            onClick={onStartSession}
          >
            <Play size={20} className="mr-2" />
            Start Exercise ({customSets} sets × {customReps} reps)
          </Button>
        </div>
      </div>
    </div>
  );
}