import { cn } from '@/lib/utils';
import { Logo } from '../Logo';
import { Button } from '../ui/button';
import { ArrowRight, Sparkles, Shield, TrendingUp } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Analysis',
    description: 'Real-time form correction using advanced pose detection',
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Monitor your improvement with detailed analytics',
  },
  {
    icon: Shield,
    title: 'Safe & Private',
    description: 'Your data stays on your device, processed locally',
  },
];

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="p-6">
        <Logo size="md" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24 max-w-md mx-auto">
        {/* Hero illustration area */}
       

        {/* Headline */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Exercise with AI Guidance
          </h1>
          <p className="text-muted-foreground text-lg max-w-xs mx-auto">
            Get real-time form correction, personalized plans, and track your progress
          </p>
        </div>

        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-start gap-4 animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
  {/* Gradient + space */}
  <div className="h-48 bg-gradient-to-t from-background via-background/70 to-background/0 flex items-end">
    <div className="w-full flex justify-center pb-10">
      <Button
        size="xl"
        onClick={onGetStarted}
        className={cn(
                    "w-full max-w-sm  h-14 sm:h-16 px-8 text-base sm:text-lg font-semibold",
                    "rounded-2xl animate-slide-up shadow-lg transition-all",
                    "bg-gradient-to-r from-primary to-accent text-white",
                    "hover:from-primary/90 hover:to-accent/90 hover:shadow-xl",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
        
      >
        Get Started
        <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </div>
  </div>
</div>



    </div>
  );
}
