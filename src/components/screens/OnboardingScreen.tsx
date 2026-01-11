import { useState } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { ArrowLeft, ArrowRight, Check, Info, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore, UserProfile } from '../../stores/appStore';

const conditions = [
  { id: 'lower-back', label: 'Lower Back Pain', icon: '/public/lb.png' },
  { id: 'knee', label: 'Knee Rehabilitation', icon: '/public/knee.png' },
  { id: 'shoulder', label: 'Shoulder Mobility', icon: '/public/shoulder.png' },
  { id: 'neck', label: 'Neck & Spine', icon: '/public/neck.png' },
  { id: 'post-surgery', label: 'Post-Surgery Recovery', icon: '/public/psr.png' },
  { id: 'general', label: 'General Fitness', icon: '/public/general.png' },
];

const painEmojis = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const painEmojis1 = ['😊', '🙂', '😐', '🥲', '😔', '😣', '😫', '😖', '😭', '🤕'];

// Cultural background options
const culturalBackgrounds = [
  { value: 'western', label: 'Western', flag: '🇺🇸', description: 'North America, Europe, Australia' },
  { value: 'hispanic', label: 'Hispanic/Latin American', flag: '🇲🇽', description: 'Latin America, Spain' },
  { value: 'east-asian', label: 'East Asian', flag: '🇨🇳', description: 'China, Japan, Korea' },
  { value: 'south-asian', label: 'South Asian', flag: '🇮🇳', description: 'India, Pakistan, Bangladesh' },
  { value: 'african', label: 'African', flag: '🇳🇬', description: 'Africa and diaspora' },
  { value: 'middle-eastern', label: 'Middle Eastern', flag: '🇸🇦', description: 'Arab world, Iran, Turkey' },
  { value: 'indigenous', label: 'Indigenous/First Nations', flag: '🌍', description: 'Indigenous communities worldwide' },
  { value: 'mixed', label: 'Mixed/Other', flag: '🌎', description: 'Multiple cultural backgrounds' },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { onboardingStep, setOnboardingStep, userProfile, updateUserProfile } = useAppStore();
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);

  const totalSteps = 5; // Changed from 4 to 5 for new step
  const progress = (onboardingStep / totalSteps) * 100;

  const handleNext = () => {
    updateUserProfile(localProfile);
    if (onboardingStep < totalSteps) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const canContinue = () => {
    switch (onboardingStep) {
      case 1:
        return localProfile.name.trim() !== '' && localProfile.gender !== '';
      case 2:
        return localProfile.conditions.length > 0;
      case 3:
        return true;
      case 4:
        return true; // Cultural background is optional
      case 5:
        return localProfile.consents.camera && localProfile.consents.medicalAdvice;
      default:
        return false;
    }
  };

  const toggleCondition = (conditionId: string) => {
    const newConditions = localProfile.conditions.includes(conditionId)
      ? localProfile.conditions.filter((c) => c !== conditionId)
      : [...localProfile.conditions, conditionId];
    setLocalProfile({ ...localProfile, conditions: newConditions });
  };

  const updateGoal = (key: keyof UserProfile['goals'], value: number) => {
    const goals = { ...localProfile.goals };
    const diff = value - goals[key];
    goals[key] = value;

    // Redistribute the difference among other goals
    const otherKeys = (Object.keys(goals) as Array<keyof typeof goals>).filter((k) => k !== key);
    const adjustment = diff / otherKeys.length;

    otherKeys.forEach((k) => {
      goals[k] = Math.max(0, Math.min(100, goals[k] - adjustment));
    });

    // Normalize to ensure total is 100
    const total = Object.values(goals).reduce((sum, v) => sum + v, 0);
    if (total !== 100) {
      const factor = 100 / total;
      (Object.keys(goals) as Array<keyof typeof goals>).forEach((k) => {
        goals[k] = Math.round(goals[k] * factor);
      });
    }

    setLocalProfile({ ...localProfile, goals });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        {onboardingStep > 1 && (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={20} />
          </Button>
        )}
        <div className="flex-1">
          <Progress value={progress} className="h-2 max-w-md mx-auto" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {onboardingStep}/{totalSteps}
        </span>
      </header>



      {/* Content */}
      <main className="flex-1 p-6 pb-32 overflow-y-auto">
        {onboardingStep === 1 && (
          <div className="animate-slide-up space-y-6 max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Tell us about yourself</h1>
              <p className="text-muted-foreground">This helps us personalize your experience</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={localProfile.name}
                  onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={1}
                  max={120}
                  value={localProfile.age}
                  onChange={(e) => setLocalProfile({ ...localProfile, age: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="flex gap-3">
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <Button
                      key={gender}
                      variant={localProfile.gender === gender ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setLocalProfile({ ...localProfile, gender })}
                    >
                      {gender}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Enter weight"
                    value={localProfile.weight || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, weight: parseFloat(e.target.value) || undefined })}
                    className="flex-1"
                  />
                  <div className="flex rounded-lg overflow-hidden border">
                    {['kg', 'lb'].map((unit) => (
                      <button
                        key={unit}
                        className={cn(
                          'px-4 py-2 text-sm font-medium transition-colors',
                          localProfile.weightUnit === unit
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        )}
                        onClick={() => setLocalProfile({ ...localProfile, weightUnit: unit as 'kg' | 'lb' })}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="animate-slide-up space-y-6 max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">What brings you here today?</h1>
              <p className="text-muted-foreground">Select all that apply</p>
            </div>

            {/* 3x3 Grid */}
            <div className="grid grid-cols-2 gap-3">
              {conditions.map((condition) => {
                const isSelected = localProfile.conditions.includes(condition.id);
                return (
                  <button
                    key={condition.id}
                    className={cn(
                      'p-3 cursor-pointer transition-all border rounded-lg',
                      'hover:border-primary hover:shadow-sm flex flex-col items-center justify-center',
                      'h-32', // Fixed height for consistent grid
                      isSelected
                        ? 'border-2 border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-card'
                    )}
                    onClick={() => toggleCondition(condition.id)}
                  >
                    {/* Icon Display Logic */}
                    <div className="flex flex-col items-center justify-center gap-2 h-full">
                      {condition.icon.startsWith('/') ? (
                        // For image URLs (like /lb.png)
                        <img
                          src={condition.icon}
                          alt={condition.label}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        // For emoji icons
                        <span className="text-4xl">{condition.icon}</span>
                      )}
                      <span className="text-xs font-medium text-center line-clamp-2">
                        {condition.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check size={10} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="other">Other (describe)</Label>
              <Input
                id="other"
                placeholder="Describe your condition..."
                value={localProfile.otherCondition || ''}
                onChange={(e) => setLocalProfile({ ...localProfile, otherCondition: e.target.value })}
              />
            </div>
          </div>
        )}

        {onboardingStep === 3 && (
          <div className="animate-slide-up space-y-8 max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Pain & Goals</h1>
              <p className="text-muted-foreground">Help us understand your current state and priorities</p>
            </div>

            {/* Pain Level */}
            <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Current Pain Level</Label>
                <span className="text-3xl">{painEmojis[localProfile.painLevel]}</span>
              </div>
              <Slider
                value={[localProfile.painLevel]}
                onValueChange={([value]) => setLocalProfile({ ...localProfile, painLevel: value })}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No pain</span>
                <span>Severe</span>
              </div>
            </Card>

            {/* Goals */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Goal Priority</Label>
              <p className="text-sm text-muted-foreground">Adjust to reflect your priorities (total = 100%)</p>

              {[
                { key: 'reducePain' as const, label: 'Reduce Pain', icon: '❤️' },
                { key: 'improveMobility' as const, label: 'Improve Mobility', icon: '🏃' },
                { key: 'buildStrength' as const, label: 'Build Strength', icon: '💪' },
              ].map(({ key, label, icon }) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {icon} {label}
                    </span>
                    <span className="text-sm font-semibold text-primary">{Math.round(localProfile.goals[key])}%</span>
                  </div>
                  <Slider
                    value={[localProfile.goals[key]]}
                    onValueChange={([value]) => updateGoal(key, value)}
                    max={100}
                    step={5}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {onboardingStep === 4 && (
          <div className="animate-slide-up space-y-6 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <Globe className="h-6 w-6 text-primary mt-1" />
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Cultural Background</h1>
                <p className="text-muted-foreground">Help us provide culturally appropriate guidance (optional)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {culturalBackgrounds.map((bg) => (
                  <button
                    key={bg.value}
                    className={cn(
                      'p-4 border rounded-lg text-left transition-all hover:border-primary',
                      localProfile.culturalBackground === bg.value
                        ? 'border-2 border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-card'
                    )}
                    onClick={() => setLocalProfile({ ...localProfile, culturalBackground: bg.value })}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{bg.flag}</span>
                      <div className="text-left">
                        <p className="font-medium text-sm">{bg.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{bg.description}</p>
                      </div>
                    </div>
                    {localProfile.culturalBackground === bg.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check size={12} className="text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="culturalNote">Cultural Preferences Note (optional)</Label>
                <Input
                  id="culturalNote"
                  placeholder="Any cultural considerations we should be aware of?"
                  value={localProfile.culturalNote || ''}
                  onChange={(e) => setLocalProfile({ ...localProfile, culturalNote: e.target.value })}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  This helps us adapt instructions, imagery, and communication style to be culturally relevant and respectful.
                </p>
              </div>
            </div>
          </div>
        )}

        {onboardingStep === 5 && (
          <div className="animate-slide-up space-y-6 max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Almost there!</h1>
              <p className="text-muted-foreground">Review and accept to get started</p>
            </div>

            {/* Summary */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{localProfile.age}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pain Level</p>
                  <p className="font-medium">{localProfile.painLevel}/10 {painEmojis1[localProfile.painLevel]}</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Conditions</p>
                <p className="font-medium text-sm">
                  {localProfile.conditions
                    .map((c) => conditions.find((cond) => cond.id === c)?.label)
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
              {localProfile.culturalBackground && (
                <div>
                  <p className="text-sm text-muted-foreground">Cultural Background</p>
                  <p className="font-medium text-sm">
                    {culturalBackgrounds.find(bg => bg.value === localProfile.culturalBackground)?.label}
                  </p>
                </div>
              )}
            </Card>

            {/* Consents */}
            <div className="space-y-4">
              {[
                {
                  key: 'camera' as const,
                  label: 'I agree to use camera for pose analysis',
                  required: true,
                  info: 'We use your camera to analyze your form in real-time. All processing happens on your device.',
                },
                {
                  key: 'dataCollection' as const,
                  label: 'I consent to anonymized data collection',
                  required: false,
                  info: 'Help us improve our AI models with anonymized movement data.',
                },
                {
                  key: 'medicalAdvice' as const,
                  label: 'I understand this is not medical advice',
                  required: true,
                  info: 'CATS is a fitness tool and should not replace professional medical advice.',
                },
              ].map(({ key, label, required, info }) => (
                <Card key={key} className="p-4 border">
                  <div className="flex items-start gap-3">
                    <Switch
                      checked={localProfile.consents[key]}
                      onCheckedChange={(checked) =>
                        setLocalProfile({
                          ...localProfile,
                          consents: { ...localProfile.consents, [key]: checked },
                        })
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{label}</span>
                        {required && <span className="text-xs text-destructive">*</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{info}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button variant="link" className="text-sm">
              Read Privacy Policy
            </Button>
          </div>
        )}
      </main>

      {/* Bottom CTA - FIXED BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="w-full flex justify-center">

          <Button
            onClick={handleNext}
            disabled={!canContinue()}
            className={cn(
              "w-full max-w-sm h-14 sm:h-16 px-8 text-base sm:text-lg font-semibold",
              "rounded-2xl animate-slide-up shadow-lg transition-all",
              "bg-gradient-to-r from-primary to-accent text-white",
              "hover:from-primary/90 hover:to-accent/90 hover:shadow-xl",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {onboardingStep === totalSteps ? 'Start My Journey' : 'Continue'}
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}