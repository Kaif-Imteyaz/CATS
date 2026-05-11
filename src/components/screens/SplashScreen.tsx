import { useState, useEffect } from 'react';
import { Logo } from '../Logo';
import { Activity } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary/95 to-accent/80 flex flex-col items-center justify-center relative overflow-hidden max-w-md mx-auto">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md mx-auto px-6">
        {/* Logo container */}
        <div className="animate-scale-in">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
            <Logo size="xl" />
          </div>
        </div>

        {/* Title and tagline */}
        <div className="text-center animate-slide-up animation-delay-200">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
            <h1 className="text-4xl font-bold text-white tracking-tight">
              CATS
            </h1>
          </div>
          <p className="text-white/90 text-base font-medium mb-1">
            Culturally Adaptive Therapeutic System
          </p>
          <p className="text-white/70 text-sm">
            Your AI-Powered Physiotherapist
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-3 animate-slide-up animation-delay-400 mt-4">
          <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <span className="text-white/60 text-xs font-medium">Loading</span>
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="absolute bottom-8 left-0 right-0 text-center px-6 animate-slide-up animation-delay-500">
        <p className="text-white/50 text-xs">
          Rehabilitation Meets Technology
        </p>
      </div>
    </div>
  );
}
