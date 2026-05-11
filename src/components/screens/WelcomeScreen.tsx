import { cn } from '@/lib/utils';
import { Logo } from '../Logo';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ArrowRight, Scan, BarChart3, Lock, Activity } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const features = [
  {
    icon: Scan,
    title: 'Real-time Analysis',
    description: 'AI-powered pose detection corrects your form instantly',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'Visualize your improvement with smart analytics',
    color: 'bg-accent/15 text-accent-foreground',
  },
  {
    icon: Lock,
    title: 'Private & Secure',
    description: 'All data processed locally on your device',
    color: 'bg-success/15 text-success',
  },
];

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-2 text-primary">
          <Activity size={20} strokeWidth={2.5} />
          <span className="text-sm font-semibold">CATS</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col px-6 pb-32 max-w-md mx-auto">
        {/* Headline */}
        <div className="text-center mb-8 pt-4 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
            Your Personal<br />
            <span className="text-gradient">AI Physiotherapist</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xs mx-auto leading-relaxed">
            Get expert guidance, real-time corrections, and personalized rehabilitation plans
          </p>
        </div>

        {/* Feature Cards */}
        <div className="w-full space-y-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="p-4 border bg-card/50 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                    feature.color
                  )}>
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-t from-background via-background to-transparent pt-8 pb-8 px-6">
          <div className="max-w-md mx-auto">
            <Button
              size="lg"
              onClick={onGetStarted}
              className={cn(
                "w-full h-14 text-base font-semibold",
                "rounded-xl shadow-lg transition-all duration-300",
                "bg-gradient-to-r from-primary to-primary/80 text-white",
                "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              No account required to start
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
