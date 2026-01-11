import { useState, useEffect } from 'react';
import { Logo } from '../Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center relative overflow-hidden max-w-md mx-auto">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-success/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-float animation-delay-500" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md mx-auto">
        <div className="animate-scale-in">
          <div className="bg-card/20 backdrop-blur-sm rounded-3xl p-8 ">
            <Logo size="xl" />
          </div>
        </div>

        <div className="text-center animate-slide-up animation-delay-300">
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">
            CATS<span className="text-success"></span>
          </h1>
          <p className="text-primary-foreground/80 text-lg font-medium">
            Culturally Adaptive Theraupetic System
          </p>
          <p className="text-primary-foreground/80 text-lg font-medium">
            Your AI Physiotherapist
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-2 animate-slide-up animation-delay-500">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-primary-foreground/80 rounded-full animate-pulse-soft"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-8 text-center animate-fade-in animation-delay-500">
        <p className="text-primary-foreground/60 text-sm">
          Assistive Technology for Rehabilitation and Therapy
        </p>
      </div>
    </div>
  );
}
