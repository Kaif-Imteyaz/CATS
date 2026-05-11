import { useState, useRef, useCallback, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const { haptic } = useHaptics();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || refreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startYRef.current = e.touches[0].clientY;
    setPulling(true);
  }, [disabled, refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setPulling(false);
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startYRef.current) * 0.5);

    setPullDistance(Math.min(distance, threshold * 1.5));

    if (distance >= threshold) {
      haptic('selection');
    }
  }, [pulling, refreshing, threshold, haptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      haptic('medium');

      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }

    setPulling(false);
    setPullDistance(0);
  }, [pulling, pullDistance, threshold, refreshing, onRefresh, haptic]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center',
          'transition-opacity duration-200',
          (pulling || refreshing) && pullDistance > 10 ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: Math.max(pullDistance - 40, 8),
        }}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-full bg-card shadow-lg border flex items-center justify-center',
            refreshing && 'animate-spin'
          )}
          style={{
            transform: refreshing ? undefined : `rotate(${rotation}deg)`,
          }}
        >
          <RefreshCw
            size={20}
            className={cn(
              'text-primary transition-colors',
              progress >= 1 && 'text-success'
            )}
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: pulling || refreshing ? `translateY(${pullDistance}px)` : undefined,
          transition: pulling ? undefined : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
