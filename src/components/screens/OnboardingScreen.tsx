import { useState } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Globe,
  Bone,
  CircleDot,
  Hand,
  Sparkles,
  HeartPulse,
  Dumbbell
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore, UserProfile } from '../../stores/appStore';

const conditions = [
  { id: 'lower-back', label: 'Lower Back', icon: Bone, color: 'text-orange-500 bg-orange-500/10' },
  { id: 'knee', label: 'Knee', icon: CircleDot, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'shoulder', label: 'Shoulder', icon: Hand, color: 'text-purple-500 bg-purple-500/10' },
  { id: 'neck', label: 'Neck & Spine', icon: Bone, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'post-surgery', label: 'Post-Surgery', icon: HeartPulse, color: 'text-red-500 bg-red-500/10' },
  { id: 'general', label: 'General Fitness', icon: Dumbbell, color: 'text-primary bg-primary/10' },
];

const painLabels = ['None', '', '', 'Mild', '', '', 'Moderate', '', '', 'Severe', 'Extreme'];

const culturalBackgrounds = [
  { value: 'western', label: 'Western', flag: '🇺🇸', description: 'North America, Europe' },
  { value: 'hispanic', label: 'Hispanic', flag: '🇲🇽', description: 'Latin America, Spain' },
  { value: 'east-asian', label: 'East Asian', flag: '🇨🇳', description: 'China, Japan, Korea' },
  { value: 'south-asian', label: 'South Asian', flag: '🇮🇳', description: 'India, Pakistan' },
  { value: 'african', label: 'African', flag: '🇳🇬', description: 'Africa & diaspora' },
  { value: 'middle-eastern', label: 'Middle Eastern', flag: '🇸🇦', description: 'Arab world, Turkey' },
  { value: 'indigenous', label: 'Indigenous', flag: '🌍', description: 'First Nations' },
  { value: 'mixed', label: 'Mixed/Other', flag: '🌎', description: 'Multiple backgrounds' },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { onboardingStep, setOnboardingStep, userProfile, updateUserProfile } = useAppStore();
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);

  const totalSteps = 5;
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
        return true;
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

    const otherKeys = (Object.keys(goals) as Array<keyof typeof goals>).filter((k) => k !== key);
    const adjustment = diff / otherKeys.length;

    otherKeys.forEach((k) => {
      goals[k] = Math.max(0, Math.min(100, goals[k] - adjustment));
    });

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
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
            <ArrowLeft size={20} />
          </Button>
        )}
        <div className="flex-1">
          <Progress value={progress} className="h-1.5" />
        </div>
        <span className="text-xs text-muted-foreground font-medium w-8 text-right">
          {onboardingStep}/{totalSteps}
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        {/* Step 1: Personal Info */}
        {onboardingStep === 1 && (
          <div className="animate-slide-up space-y-6">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Tell us about yourself</h1>
              <p className="text-sm text-muted-foreground">This helps personalize your experience</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={localProfile.name}
                  onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={1}
                  max={120}
                  placeholder="Enter your age"
                  value={localProfile.age || ''}
                  onChange={(e) => setLocalProfile({ ...localProfile, age: parseInt(e.target.value) || 0 })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Gender</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <button
                      key={gender}
                      className={cn(
                        "h-11 rounded-lg border-2 text-sm font-medium transition-all",
                        localProfile.gender === gender
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                      onClick={() => setLocalProfile({ ...localProfile, gender })}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm">Weight (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Weight"
                    value={localProfile.weight || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, weight: parseFloat(e.target.value) || undefined })}
                    className="flex-1 h-12"
                  />
                  <div className="flex rounded-lg overflow-hidden border">
                    {['kg', 'lb'].map((unit) => (
                      <button
                        key={unit}
                        className={cn(
                          'px-4 h-12 text-sm font-medium transition-colors',
                          localProfile.weightUnit === unit
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-muted'
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

        {/* Step 2: Conditions */}
        {onboardingStep === 2 && (
          <div className="animate-slide-up space-y-6">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">What brings you here?</h1>
              <p className="text-sm text-muted-foreground">Select all that apply</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {conditions.map((condition) => {
                const isSelected = localProfile.conditions.includes(condition.id);
                const Icon = condition.icon;
                return (
                  <button
                    key={condition.id}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-left relative',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    )}
                    onClick={() => toggleCondition(condition.id)}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
                      condition.color
                    )}>
                      <Icon size={20} />
                    </div>
                    <span className="text-sm font-medium block">{condition.label}</span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check size={12} className="text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="other" className="text-sm">Other condition</Label>
              <Input
                id="other"
                placeholder="Describe your condition..."
                value={localProfile.otherCondition || ''}
                onChange={(e) => setLocalProfile({ ...localProfile, otherCondition: e.target.value })}
                className="h-12"
              />
            </div>
          </div>
        )}

        {/* Step 3: Pain & Goals */}
        {onboardingStep === 3 && (
          <div className="animate-slide-up space-y-6">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Pain & Goals</h1>
              <p className="text-sm text-muted-foreground">Help us understand your needs</p>
            </div>

            {/* Pain Level */}
            <div className="p-4 rounded-xl bg-muted/50 space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Current Pain Level</Label>
                <span className="text-2xl font-bold text-primary">{localProfile.painLevel}/10</span>
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
                <span>{painLabels[localProfile.painLevel] || ''}</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Goals */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Goal Priority (Total: 100%)</Label>

              {[
                { key: 'reducePain' as const, label: 'Reduce Pain', icon: HeartPulse, color: 'text-red-500' },
                { key: 'improveMobility' as const, label: 'Improve Mobility', icon: Sparkles, color: 'text-blue-500' },
                { key: 'buildStrength' as const, label: 'Build Strength', icon: Dumbbell, color: 'text-emerald-500' },
              ].map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <Icon size={16} className={color} />
                      {label}
                    </span>
                    <span className="text-sm font-semibold">{Math.round(localProfile.goals[key])}%</span>
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

        {/* Step 4: Cultural Background */}
        {onboardingStep === 4 && (
          <div className="animate-slide-up space-y-6">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h1 className="text-xl font-bold text-foreground mb-1">Cultural Background</h1>
                <p className="text-sm text-muted-foreground">Optional - helps us personalize guidance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {culturalBackgrounds.map((bg) => (
                <button
                  key={bg.value}
                  className={cn(
                    'p-3 border-2 rounded-xl text-left transition-all relative',
                    localProfile.culturalBackground === bg.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                  onClick={() => setLocalProfile({ ...localProfile, culturalBackground: bg.value })}
                >
                  <span className="text-xl mb-1 block">{bg.flag}</span>
                  <p className="font-medium text-sm">{bg.label}</p>
                  <p className="text-xs text-muted-foreground">{bg.description}</p>
                  {localProfile.culturalBackground === bg.value && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check size={10} className="text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>This helps us adapt instructions and communication style to be culturally appropriate.</span>
            </div>
          </div>
        )}

        {/* Step 5: Consent */}
        {onboardingStep === 5 && (
          <div className="animate-slide-up space-y-6">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Almost there!</h1>
              <p className="text-sm text-muted-foreground">Review and accept to get started</p>
            </div>

            {/* Summary */}
            <Card className="p-4 bg-muted/50 border-0">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Age</p>
                  <p className="font-medium">{localProfile.age} years</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pain Level</p>
                  <p className="font-medium">{localProfile.painLevel}/10</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-muted-foreground text-xs">Conditions</p>
                <p className="font-medium text-sm">
                  {localProfile.conditions
                    .map((c) => conditions.find((cond) => cond.id === c)?.label)
                    .filter(Boolean)
                    .join(', ') || 'None selected'}
                </p>
              </div>
            </Card>

            {/* Consents */}
            <div className="space-y-3">
              {[
                {
                  key: 'camera' as const,
                  label: 'Camera access for pose analysis',
                  required: true,
                  info: 'All processing happens locally on your device.',
                },
                {
                  key: 'dataCollection' as const,
                  label: 'Anonymized data collection',
                  required: false,
                  info: 'Help us improve our AI models.',
                },
                {
                  key: 'medicalAdvice' as const,
                  label: 'Not a substitute for medical advice',
                  required: true,
                  info: 'CATS is a fitness tool, not medical treatment.',
                },
              ].map(({ key, label, required, info }) => (
                <div key={key} className="p-4 rounded-xl border bg-card">
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
                      <p className="text-xs text-muted-foreground mt-0.5">{info}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="ghost" className="text-xs text-muted-foreground">
              Read Privacy Policy
            </Button>
          </div>
        )}
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleNext}
            disabled={!canContinue()}
            className={cn(
              "w-full h-14 text-base font-semibold rounded-xl",
              "bg-gradient-to-r from-primary to-primary/80 text-white",
              "hover:opacity-90 transition-opacity",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {onboardingStep === totalSteps ? 'Start My Journey' : 'Continue'}
            <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
