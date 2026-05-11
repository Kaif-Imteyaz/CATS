import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type TransitionType = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'scale';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  type?: TransitionType;
  duration?: number;
  show?: boolean;
}

export function PageTransition({
  children,
  className,
  type = 'fade',
  duration = 300,
  show = true,
}: PageTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  const baseClasses = 'transition-all ease-out';

  const transitionClasses = {
    fade: isAnimating ? 'opacity-100' : 'opacity-0',
    'slide-left': isAnimating
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-4',
    'slide-right': isAnimating
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 -translate-x-4',
    'slide-up': isAnimating
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-4',
    scale: isAnimating
      ? 'opacity-100 scale-100'
      : 'opacity-0 scale-95',
  };

  return (
    <div
      className={cn(baseClasses, transitionClasses[type], className)}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Screen wrapper with enter animation
interface AnimatedScreenProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedScreen({ children, className, delay = 0 }: AnimatedScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
    >
      {children}
    </div>
  );
}
