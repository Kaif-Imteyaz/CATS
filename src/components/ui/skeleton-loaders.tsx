import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

// Exercise card skeleton
export function ExerciseCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-36 rounded-xl border bg-card p-3">
      <Skeleton className="w-full aspect-square rounded-lg mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}

// Activity card skeleton
export function ActivityCardSkeleton() {
  return (
    <div className="p-3 rounded-xl border bg-card flex items-center gap-3">
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right">
        <Skeleton className="h-6 w-12 mb-1" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}

// Stats card skeleton
export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl p-3 bg-muted/50 flex flex-col items-center">
      <Skeleton className="w-5 h-5 rounded-full mb-2" />
      <Skeleton className="h-6 w-12 mb-1" />
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

// Quote card skeleton
export function QuoteCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-muted/50 flex items-start gap-3">
      <Skeleton className="w-4 h-4 rounded" />
      <div className="flex-1">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-20 mt-2" />
      </div>
    </div>
  );
}

// Dashboard skeleton (full page)
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
      </header>

      <main className="px-4 space-y-5">
        {/* Welcome */}
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Quick Start */}
        <Skeleton className="h-40 w-full rounded-2xl" />

        {/* Quote */}
        <QuoteCardSkeleton />

        {/* Exercises */}
        <div>
          <div className="flex justify-between mb-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            <ExerciseCardSkeleton />
            <ExerciseCardSkeleton />
            <ExerciseCardSkeleton />
          </div>
        </div>

        {/* Activity */}
        <div>
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="space-y-2">
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}

// Feature card skeleton for welcome screen
export function FeatureCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border bg-card/50 flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}
