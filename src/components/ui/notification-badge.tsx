import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
  showZero?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationBadge({
  count,
  max = 99,
  className,
  showZero = false,
  size = 'sm',
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) return null;

  const displayCount = count > max ? `${max}+` : count;

  const sizeClasses = {
    sm: 'min-w-[18px] h-[18px] text-[10px]',
    md: 'min-w-[22px] h-[22px] text-xs',
    lg: 'min-w-[26px] h-[26px] text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-full bg-destructive text-destructive-foreground',
        'font-semibold px-1.5',
        'animate-scale-in',
        sizeClasses[size],
        className
      )}
      aria-label={`${count} notifications`}
    >
      {displayCount}
    </span>
  );
}

// Dot indicator (for simple presence)
interface DotIndicatorProps {
  visible?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
  pulse?: boolean;
}

export function DotIndicator({
  visible = true,
  color = 'destructive',
  className,
  pulse = false,
}: DotIndicatorProps) {
  if (!visible) return null;

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };

  return (
    <span
      className={cn(
        'absolute top-0 right-0 w-2.5 h-2.5 rounded-full',
        'border-2 border-background',
        colorClasses[color],
        pulse && 'animate-pulse',
        className
      )}
    />
  );
}
