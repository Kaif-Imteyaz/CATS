import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { usePoseDetection, PoseAnalysis } from '../../hooks/usePoseDetection';
import { useVoiceCoach, VOICE_LANGUAGES, VoiceLanguage } from '../../hooks/useVoiceCoach';
import {
  X,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Check,
  AlertTriangle,
  Camera,
  Loader2,
  AlertCircle,
  Coffee,
  Languages,
} from 'lucide-react';
import { exercises, getExerciseById } from '../../data/exercises';
import { cn } from '../../lib/utils';

interface SessionScreenProps {
  exerciseId?: string;
  onExit: () => void;
  onComplete: () => void;
}

type SessionPhase = 'prep' | 'active' | 'paused' | 'resting' | 'complete';

const REST_DURATION = 30;

export function SessionScreen({ exerciseId, onExit, onComplete }: SessionScreenProps) {
  const exercise = exerciseId ? getExerciseById(exerciseId) : exercises[0];
  const [phase, setPhase] = useState<SessionPhase>('prep');
  const [currentRep, setCurrentRep] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(REST_DURATION);
  const [formScore, setFormScore] = useState(0);
  const [avgFormScore, setAvgFormScore] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState<PoseAnalysis['feedback'][0] | null>(null);
  const [currentAngles, setCurrentAngles] = useState<PoseAnalysis['angles']>({});
  const [settings, setSettings] = useState({
    voiceGuidance: true,
    formCorrections: true,
    countReps: true,
    mirrored: true,
    soundEnabled: true,
    language: 'en-US' as VoiceLanguage,
  });
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for performance-critical values
  const repStateRef = useRef<'up' | 'down'>('up');
  const lastAngleRef = useRef<number>(180);
  const prevRepRef = useRef<number>(0);
  const formScoreHistoryRef = useRef<number[]>([]);

  const totalReps = exercise?.reps || 12;
  const totalSets = exercise?.sets || 3;

  // Determine exercise type for pose detection
  const getExerciseType = () => {
    if (!exercise) return 'general';
    
    const title = exercise.title.toLowerCase();
    if (title.includes('squat')) return 'squat';
    if (title.includes('shoulder') || title.includes('press') || title.includes('overhead')) return 'overhead-press';
    if (title.includes('bridge')) return 'bridge';
    if (title.includes('bird') || title.includes('dog')) return 'bird-dog';
    if (title.includes('stretch') || title.includes('cat') || title.includes('cow')) return 'stretch';
    if (title.includes('wall') || title.includes('sit')) return 'wall-sit';
    return 'general';
  };

  // Get relevant angles for the current exercise
  const getRelevantAngles = (angles: PoseAnalysis['angles']) => {
    const exerciseType = getExerciseType();
    
    switch (exerciseType) {
      case 'squat':
        return [
          { label: 'Knee Angle', value: ((angles.leftKnee || 0) + (angles.rightKnee || 0)) / 2, color: 'primary' },
          { label: 'Hip Angle', value: ((angles.leftHip || 0) + (angles.rightHip || 0)) / 2, color: 'accent' }
        ];
      case 'overhead-press':
        return [
          { label: 'Elbow Angle', value: ((angles.leftElbow || 0) + (angles.rightElbow || 0)) / 2, color: 'primary' },
          { label: 'Shoulder Angle', value: ((angles.leftShoulder || 0) + (angles.rightShoulder || 0)) / 2, color: 'accent' },
          { label: 'Spine Angle', value: ((angles.leftSpineAngle || 0) + (angles.rightSpineAngle || 0)) / 2, color: 'secondary' }
        ];
      case 'bridge':
        return [
          { label: 'Hip Angle', value: ((angles.leftHip || 0) + (angles.rightHip || 0)) / 2, color: 'primary' }
        ];
      case 'bird-dog':
        return [
          { label: 'Spine Angle', value: ((angles.leftSpineAngle || 0) + (angles.rightSpineAngle || 0)) / 2, color: 'primary' },
          { label: 'Shoulder Angle', value: ((angles.leftShoulder || 0) + (angles.rightShoulder || 0)) / 2, color: 'accent' }
        ];
      case 'stretch':
        return [
          { label: 'Neck Angle', value: angles.neckAngle || 0, color: 'primary' },
          { label: 'Spine Angle', value: ((angles.leftSpineAngle || 0) + (angles.rightSpineAngle || 0)) / 2, color: 'accent' }
        ];
      case 'wall-sit':
        return [
          { label: 'Knee Angle', value: ((angles.leftKnee || 0) + (angles.rightKnee || 0)) / 2, color: 'primary' },
          { label: 'Hip Angle', value: ((angles.leftHip || 0) + (angles.rightHip || 0)) / 2, color: 'accent' }
        ];
      default:
        return [
          { label: 'Knee Angle', value: ((angles.leftKnee || 0) + (angles.rightKnee || 0)) / 2, color: 'primary' },
          { label: 'Elbow Angle', value: ((angles.leftElbow || 0) + (angles.rightElbow || 0)) / 2, color: 'accent' }
        ];
    }
  };

  // Get rep counting logic based on exercise
  const getRepCountLogic = (analysis: PoseAnalysis): 'up' | 'down' => {
    const exerciseType = getExerciseType();
    const angles = analysis.angles;
    
    switch (exerciseType) {
      case 'squat':
        const avgKneeAngle = ((angles.leftKnee || 180) + (angles.rightKnee || 180)) / 2;
        if (repStateRef.current === 'up' && avgKneeAngle < 110 && lastAngleRef.current >= 110) {
          return 'down';
        } else if (repStateRef.current === 'down' && avgKneeAngle > 160 && lastAngleRef.current <= 160) {
          return 'up';
        }
        break;
        
      case 'overhead-press':
        const avgElbowAngle = ((angles.leftElbow || 180) + (angles.rightElbow || 180)) / 2;
        if (repStateRef.current === 'up' && avgElbowAngle > 150 && lastAngleRef.current <= 150) {
          return 'down';
        } else if (repStateRef.current === 'down' && avgElbowAngle < 90 && lastAngleRef.current >= 90) {
          return 'up';
        }
        break;
        
      case 'bridge':
        const avgHipAngle = ((angles.leftHip || 180) + (angles.rightHip || 180)) / 2;
        if (repStateRef.current === 'up' && avgHipAngle > 150 && lastAngleRef.current <= 150) {
          return 'down';
        } else if (repStateRef.current === 'down' && avgHipAngle < 120 && lastAngleRef.current >= 120) {
          return 'up';
        }
        break;
        
      default:
        // Generic rep counting for other exercises
        if (analysis.formScore < 60 && lastAngleRef.current >= 60) {
          return 'down';
        } else if (analysis.formScore >= 80 && lastAngleRef.current < 80) {
          return 'up';
        }
    }
    
    return repStateRef.current;
  };

  // Voice coach with language support
  const voiceCoach = useVoiceCoach({
    enabled: settings.voiceGuidance && settings.soundEnabled,
    rate: 1.0,
    pitch: 1.0,
    language: settings.language,
  });

  // Stable callback for pose detection
  const handlePoseDetected = useCallback((data: any, analysis: PoseAnalysis) => {
    if (!analysis.isVisible) return;

    setFormScore(analysis.formScore);
    formScoreHistoryRef.current = [...formScoreHistoryRef.current.slice(-50), analysis.formScore];
    setCurrentAngles(analysis.angles);
    
    if (analysis.feedback.length > 0) {
      setCurrentFeedback(analysis.feedback[0]);
    }

    // Update rep counting based on exercise type
    const newRepState = getRepCountLogic(analysis);
    const currentAngle = getRelevantAngles(analysis.angles)[0]?.value || 0;
    
    if (newRepState === 'up' && repStateRef.current === 'down') {
      setCurrentRep(prev => {
        const newRep = prev + 1;
        // Voice announce rep
        if (settings.countReps && settings.voiceGuidance && settings.soundEnabled) {
          voiceCoach.speakRep(newRep, totalReps);
        }
        return newRep;
      });
    }
    
    repStateRef.current = newRepState;
    lastAngleRef.current = currentAngle;
  }, [totalReps, settings, voiceCoach]);

  // Pose detection hook with exercise type
  const { isLoading, error } = usePoseDetection({
    videoRef,
    canvasRef,
    enabled: phase === 'active',
    mirrored: settings.mirrored,
    exerciseType: getExerciseType(),
    onPoseDetected: handlePoseDetected,
  });

  // Handle rep completion and set transitions
  useEffect(() => {
    if (currentRep > 0 && currentRep !== prevRepRef.current) {
      prevRepRef.current = currentRep;

      // Check if set is complete
      if (currentRep >= totalReps) {
        if (currentSet >= totalSets) {
          voiceCoach.speakSetComplete(currentSet, totalSets, 0);
          setTimeout(() => setPhase('complete'), 500);
        } else {
          voiceCoach.speakSetComplete(currentSet, totalSets, REST_DURATION);
          setRestTimer(REST_DURATION);
          setPhase('resting');
          setCurrentRep(0);
          prevRepRef.current = 0;
          repStateRef.current = 'up';
          lastAngleRef.current = 180;
        }
      }
    }
  }, [currentRep, currentSet, totalReps, totalSets, voiceCoach]);

  // Voice feedback for form corrections (debounced)
  useEffect(() => {
    if (currentFeedback && settings.formCorrections && settings.voiceGuidance && settings.soundEnabled) {
      voiceCoach.speakFormFeedback(currentFeedback);
    }
  }, [currentFeedback?.message]);

  // Voice announce session start
  useEffect(() => {
    if (phase === 'active' && timer === 0) {
      voiceCoach.speakStart();
    }
  }, [phase]);

  // Rest timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase === 'resting' && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          const next = prev - 1;
          voiceCoach.speakRestCountdown(next);
          if (next <= 0) {
            setCurrentSet(s => s + 1);
            setPhase('active');
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, voiceCoach]);

  // Calculate average form score
  useEffect(() => {
    if (formScoreHistoryRef.current.length > 0) {
      const avg = formScoreHistoryRef.current.reduce((a, b) => a + b, 0) / formScoreHistoryRef.current.length;
      setAvgFormScore(Math.round(avg));
    }
  }, [formScore]);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase === 'active' || phase === 'resting') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    setCurrentRep(0);
    setCurrentSet(1);
    setTimer(0);
    formScoreHistoryRef.current = [];
    prevRepRef.current = 0;
    repStateRef.current = 'up';
    lastAngleRef.current = 180;
    setPhase('active');
  };

  if (!exercise) return null;

  // Get relevant angles for display
  const relevantAngles = getRelevantAngles(currentAngles);

  // Prep Screen
  if (phase === 'prep') {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
        <header className="p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <X size={20} />
          </Button>
          <h1 className="font-semibold">{exercise.title}</h1>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 pb-32 space-y-6 overflow-auto max-w-md mx-auto">
          {/* Preview */}
          <Card variant="gradient" className="overflow-hidden">
            <div className="aspect-video bg-primary/10 flex items-center justify-center">
              <span className="text-8xl">
                {getExerciseType() === 'squat' ? '🦵' : 
                 getExerciseType() === 'overhead-press' ? '💪' : 
                 getExerciseType() === 'bridge' ? '🏋️' : 
                 getExerciseType() === 'bird-dog' ? '🐕' : 
                 getExerciseType() === 'stretch' ? '🧘' : 
                 getExerciseType() === 'wall-sit' ? '🧍' : '🏃'}
              </span>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{exercise.reps} reps × {exercise.sets} sets</span>
                <span>•</span>
                <span>Approx. {exercise.duration}</span>
              </div>
              <div className="mt-2 text-sm">
                <p className="font-medium">AI will track:</p>
                <p className="text-muted-foreground">
                  {getExerciseType() === 'overhead-press' 
                    ? 'Shoulder & elbow angles, posture alignment' 
                    : getExerciseType() === 'squat'
                    ? 'Knee & hip angles, depth, and form'
                    : 'Form and posture during exercise'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <div className="space-y-3">
            <h2 className="font-semibold">Before you start</h2>
            {getExerciseType() === 'overhead-press' ? [
              'Use light weights or resistance bands',
              'Stand with feet shoulder-width apart',
              'Keep core engaged throughout',
              'Have chair nearby for support if needed',
              'Ensure good upper body visibility',
            ] : [
              'Wear comfortable clothing',
              'Ensure good lighting',
              'Stand 6-8 feet from camera',
              'Keep full body in frame',
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <Check size={12} className="text-success" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <h2 className="font-semibold flex items-center gap-2">
              <Languages size={18} />
              Voice Language
            </h2>
            <Select
              value={settings.language}
              onValueChange={(value: VoiceLanguage) => 
                setSettings(prev => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {VOICE_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h2 className="font-semibold">Session Settings</h2>
            {[
              { key: 'voiceGuidance', label: 'Enable voice guidance' },
              { key: 'formCorrections', label: 'Enable form corrections' },
              { key: 'countReps', label: 'Auto-count reps' },
              { key: 'mirrored', label: 'Mirror camera view' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Switch
                  checked={settings[key as keyof typeof settings] as boolean}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <div className="w-full flex justify-center">
            <Button variant="hero" size="xl" className={cn(
              "w-full max-w-sm h-14 sm:h-16 px-8 text-base sm:text-lg font-semibold",
              "rounded-2xl animate-slide-up shadow-lg transition-all",
              "bg-gradient-to-r from-primary to-accent text-white",
              "hover:from-primary/90 hover:to-accent/90 hover:shadow-xl",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )} onClick={() => setPhase('active')}>
              <Camera className="mr-2" size={20} />
              Start Exercise
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Resting Screen
  if (phase === 'resting') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Coffee className="text-primary" size={56} />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Rest Time</h1>
            <p className="text-muted-foreground">Set {currentSet} of {totalSets} complete!</p>
          </div>

          {/* Countdown Timer */}
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={553}
                strokeDashoffset={553 * (1 - restTimer / REST_DURATION)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-bold text-foreground">{restTimer}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Next: Set {currentSet + 1} • {totalReps} reps
          </p>

          <Button 
            variant="outline" 
            onClick={() => {
              setCurrentSet(s => s + 1);
              setPhase('active');
              voiceCoach.speakSkipRest();
            }}
          >
            Skip Rest
          </Button>
        </div>
      </div>
    );
  }

  // Active/Paused Session with real camera
  if (phase === 'active' || phase === 'paused') {
    return (
      <div className="min-h-screen bg-foreground relative overflow-hidden">
        {/* Hidden video element for camera input */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
        />

        {/* Canvas for rendering pose detection */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-foreground/90 flex flex-col items-center justify-center z-50">
            <Loader2 className="w-12 h-12 text-primary-foreground animate-spin mb-4" />
            <p className="text-primary-foreground text-lg">Initializing AI pose detection...</p>
            <p className="text-primary-foreground/60 text-sm mt-2">Please allow camera access</p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-foreground/90 flex flex-col items-center justify-center z-50 p-6">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-primary-foreground text-lg text-center">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => setPhase('prep')}>
              Go Back
            </Button>
          </div>
        )}

        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-foreground/80 to-transparent z-20">
          <div className="flex items-center justify-between text-primary-foreground">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setPhase('paused')} 
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X size={20} />
            </Button>
            <div className="text-center">
              <p className="font-semibold">{exercise.title}</p>
              <p className="text-2xl font-bold">{formatTime(timer)}</p>
            </div>
            <div className="w-10" />
          </div>
        </div>

        {/* Left side - Rep counter & form score */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-4 z-20">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl p-3 text-center shadow-lg">
            <p className="text-3xl font-bold text-foreground">{currentRep}/{totalReps}</p>
            <p className="text-xs text-muted-foreground">Reps</p>
          </div>
          <div className="bg-card/90 backdrop-blur-sm rounded-xl p-3 text-center shadow-lg">
            <p className={cn(
              "text-2xl font-bold",
              formScore >= 80 ? "text-success" : formScore >= 60 ? "text-warning" : "text-destructive"
            )}>
              {formScore}%
            </p>
            <p className="text-xs text-muted-foreground">Form</p>
          </div>
          
          {/* Dynamic angle display based on exercise */}
          {relevantAngles.map((angle, index) => (
            <div 
              key={index} 
              className="bg-card/90 backdrop-blur-sm rounded-xl p-3 text-center shadow-lg animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="text-lg font-bold text-primary">
                {Math.round(angle.value)}°
              </p>
              <p className="text-xs text-muted-foreground">{angle.label}</p>
            </div>
          ))}
        </div>

        {/* Right side - Feedback */}
        {currentFeedback && (
          <div className="absolute right-4 top-1/3 z-20">
            <div
              className={cn(
                'px-4 py-2 rounded-lg backdrop-blur-sm animate-slide-up shadow-lg max-w-[200px]',
                currentFeedback.type === 'good'
                  ? 'bg-success/90 text-success-foreground'
                  : currentFeedback.type === 'warning'
                  ? 'bg-warning/90 text-warning-foreground'
                  : 'bg-destructive/90 text-destructive-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                {currentFeedback.type === 'good' ? (
                  <Check size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
                <span className="text-sm font-medium">{currentFeedback.message}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground/80 to-transparent z-20">
          {/* Set progress */}
          <div className="flex justify-center gap-2 mb-4">
            {[...Array(totalSets)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-colors',
                  i < currentSet - 1
                    ? 'bg-success'
                    : i === currentSet - 1
                    ? 'bg-primary animate-pulse'
                    : 'bg-primary-foreground/30'
                )}
              />
            ))}
            <span className="text-primary-foreground/80 text-sm ml-2">
              Set {currentSet}/{totalSets}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setSettings(prev => ({ ...prev, mirrored: !prev.mirrored }))}
            >
              <FlipHorizontal size={20} />
            </Button>
            <Button
              variant="glass"
              size="icon-lg"
              onClick={() => setPhase(phase === 'active' ? 'paused' : 'active')}
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
            >
              {phase === 'active' ? <Pause size={28} /> : <Play size={28} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            >
              {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </Button>
          </div>
        </div>

        {/* Pause modal */}
        {phase === 'paused' && (
          <div className="absolute inset-0 bg-foreground/90 backdrop-blur-sm flex items-center justify-center p-6 z-30">
            <Card variant="elevated" className="w-full max-w-sm">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-center">Session Paused</h2>
                <div className="text-center text-muted-foreground">
                  <p>Completed: {currentRep}/{totalReps} reps</p>
                  <p>Set: {currentSet}/{totalSets}</p>
                  <p>Time: {formatTime(timer)}</p>
                  <p>Avg Form: {avgFormScore}%</p>
                </div>
                <div className="space-y-2">
                  <Button variant="hero" className="w-full" onClick={() => setPhase('active')}>
                    Resume
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleRestart}>
                    <RotateCcw size={16} className="mr-2" />
                    Restart Exercise
                  </Button>
                  <Button variant="ghost" className="w-full text-destructive" onClick={onExit}>
                    Exit to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Complete Screen
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Confetti effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))'][
                Math.floor(Math.random() * 3)
              ],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center space-y-6 animate-bounce-in">
        <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto">
          <Check className="text-success" size={48} />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Great Work!</h1>
          <p className="text-muted-foreground">You crushed today's session</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card variant="gradient">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{formatTime(timer)}</p>
              <p className="text-xs text-muted-foreground">Total Time</p>
            </CardContent>
          </Card>
          <Card variant="gradient">
            <CardContent className="p-4 text-center">
              <p className={cn(
                "text-2xl font-bold",
                avgFormScore >= 80 ? "text-success" : avgFormScore >= 60 ? "text-warning" : "text-foreground"
              )}>
                {avgFormScore}%
              </p>
              <p className="text-xs text-muted-foreground">Avg Form</p>
            </CardContent>
          </Card>
          <Card variant="gradient">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{totalReps * totalSets}</p>
              <p className="text-xs text-muted-foreground">Total Reps</p>
            </CardContent>
          </Card>
        </div>

        {/* Exercise-specific completion message */}
        {avgFormScore >= 85 && (
          <Card variant="outline">
            <CardContent className="p-4">
              <p className="text-sm text-success font-medium">
                {getExerciseType() === 'overhead-press' 
                  ? '🎉 Excellent shoulder press form! Perfect elbow and shoulder alignment.'
                  : getExerciseType() === 'squat'
                  ? '🎉 Perfect squat depth and knee alignment!'
                  : '🎉 Excellent form throughout the session!'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Rate feeling */}
        <div className="space-y-3">
          <p className="text-sm font-medium">How do you feel?</p>
          <div className="flex justify-center gap-3">
            {['😫', '😕', '😐', '🙂', '😄'].map((emoji, i) => (
              <button
                key={i}
                className="text-3xl hover:scale-110 transition-transform p-2"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Pain slider */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Pain level after exercise</p>
          <Slider defaultValue={[3]} max={10} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>No pain</span>
            <span>Severe</span>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button variant="hero" size="xl" className="w-full" onClick={onComplete}>
            Finish Session
          </Button>
          <Button variant="outline" className="w-full">
            Review Form Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}