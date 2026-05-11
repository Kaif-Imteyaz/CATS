import { useState, useEffect, useCallback } from 'react';
import { Logo } from '../Logo';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { PullToRefresh } from '../ui/pull-to-refresh';
import { AnimatedCounter } from '../ui/animated-counter';
import { NotificationBadge, DotIndicator } from '../ui/notification-badge';
import { DashboardSkeleton, ExerciseCardSkeleton, ActivityCardSkeleton } from '../ui/skeleton-loaders';
import {
  Bell,
  Flame,
  Clock,
  TrendingUp,
  Play,
  ChevronRight,
  Calendar,
  Sparkles,
  Stethoscope,
  Quote,
  Dumbbell,
  Video,
} from 'lucide-react';
import { exercises } from '../../data/exercises';
import { getRandomQuote } from '../../data/stories';
import { useAppStore } from '../../stores/appStore';
import { NotificationSheet } from '../NotificationSheet';
import { useButtonVoice } from '../../hooks/useButtonVoice';
import { useHaptics } from '../../hooks/useHaptics';
import { cn } from '@/lib/utils';

interface DashboardScreenProps {
  onStartSession: () => void;
  onViewExercise: (id: string) => void;
  onViewProfile: () => void;
  onViewVideoGenerator?: () => void;
}

export function DashboardScreen({
  onStartSession,
  onViewExercise,
  onViewProfile,
  onViewVideoGenerator,
}: DashboardScreenProps) {
  const { userProfile, notifications } = useAppStore();
  const { speak } = useButtonVoice();
  const { haptic, buttonPress } = useHaptics();
  const firstName = userProfile.name.split(' ')[0] || 'there';
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [quote, setQuote] = useState(getRandomQuote());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState(false);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Trigger stats animation after load
      setTimeout(() => setStatsAnimated(true), 300);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    haptic('medium');

    // Simulate data refresh
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setQuote(getRandomQuote());

    setIsRefreshing(false);
    haptic('success');
  }, [haptic]);

  const timeOfDay = currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening';
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const stats = [
    { icon: Flame, label: 'Streak', value: 3, suffix: ' days', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Clock, label: 'Next', value: 8, suffix: ' AM', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: TrendingUp, label: 'Form', value: 92, suffix: '%', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const recommendedExercises = exercises.slice(0, 3);

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'intermediate':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'advanced':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Show skeleton while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md p-4 flex items-center justify-between border-b border-border/50">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <NotificationSheet>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onMouseEnter={() => speak('notifications')}
              onClick={() => buttonPress()}
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <NotificationBadge
                  count={unreadCount}
                  className="absolute -top-1 -right-1"
                />
              )}
            </Button>
          </NotificationSheet>
          <button
            onClick={() => {
              buttonPress();
              onViewProfile();
            }}
            onMouseEnter={() => speak('view-profile')}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm hover:bg-primary/20 active:scale-95 transition-all"
            aria-label="View profile"
          >
            {firstName[0].toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 space-y-5 pt-4">
        {/* Welcome */}
        <div className="animate-slide-up">
          <p className="text-xs text-muted-foreground mb-1">{formattedDate}</p>
          <h1 className="text-xl font-bold text-foreground">
            Good {timeOfDay}, {firstName}
          </h1>
        </div>

        {/* Stats row with animated counters */}
        <div
          className="grid grid-cols-3 gap-3 animate-slide-up animation-delay-100"
          role="region"
          aria-label="Your stats"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={cn(
                  'rounded-xl p-3 flex flex-col items-center text-center',
                  'transition-transform active:scale-95',
                  stat.bg
                )}
                role="status"
                aria-label={`${stat.label}: ${stat.value}${stat.suffix}`}
              >
                <Icon className={cn('mb-1', stat.color)} size={20} aria-hidden />
                <span className={cn('text-lg font-bold tabular-nums', stat.color)}>
                  {statsAnimated ? (
                    <AnimatedCounter
                      value={stat.value}
                      duration={800 + index * 200}
                      suffix={stat.suffix}
                    />
                  ) : (
                    `0${stat.suffix}`
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Start Card */}
        <div className="rounded-2xl overflow-hidden animate-slide-up animation-delay-200 shadow-lg">
          <div className="bg-gradient-to-br from-primary to-primary/80 dark:from-primary/90 dark:to-primary/70 p-5 relative">
            <div className="absolute top-3 right-3 opacity-10">
              <Sparkles size={64} />
            </div>
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-white mb-1">
                Ready for today's session?
              </h2>
              <div className="flex items-center gap-3 text-white/70 text-xs mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={12} aria-hidden />
                  15 min
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" aria-hidden />
                <span>3 exercises</span>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  haptic('medium');
                  onStartSession();
                }}
                onMouseEnter={() => speak('start-session')}
                className="w-full bg-white text-primary hover:bg-white/90 active:scale-[0.98] font-semibold rounded-xl h-12 transition-transform"
                aria-label="Start your exercise session"
              >
                <Play size={18} className="mr-2" aria-hidden />
                Start Session
              </Button>
            </div>
          </div>
        </div>

        {/* AI Video Generator Card */}
        {onViewVideoGenerator && (
          <button
            onClick={() => {
              buttonPress();
              onViewVideoGenerator();
            }}
            className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all flex items-center gap-4 animate-slide-up animation-delay-200"
            aria-label="Generate AI exercise videos"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Video className="text-white" size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-sm text-foreground">AI Exercise Videos</h3>
              <p className="text-muted-foreground text-xs">Personalized for your culture</p>
            </div>
            <Sparkles className="text-primary" size={18} />
          </button>
        )}

        {/* Quote Card */}
        <Card className="bg-muted/50 dark:bg-muted/30 border-0 animate-slide-up animation-delay-300">
          <CardContent className="p-4 flex items-start gap-3">
            <Quote className="text-primary/60 flex-shrink-0 mt-0.5" size={16} aria-hidden />
            <div>
              <p className="text-sm text-foreground/80 italic leading-relaxed">"{quote.text}"</p>
              <p className="text-xs text-muted-foreground mt-2">— {quote.author}</p>
            </div>
          </CardContent>
        </Card>

        {/* My Health Button */}
        <button
          onClick={() => {
            buttonPress();
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'my-health' }));
          }}
          className="w-full p-4 rounded-xl border bg-card hover:bg-muted/50 active:scale-[0.98] transition-all flex items-center gap-4 animate-slide-up animation-delay-300"
          aria-label="Go to My Health section"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Stethoscope className="text-emerald-500" size={20} aria-hidden />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-sm">My Health</h3>
            <p className="text-muted-foreground text-xs">Prescriptions & reminders</p>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} aria-hidden />
        </button>

        {/* Recommended Exercises */}
        <section className="animate-slide-up animation-delay-400" aria-labelledby="recommended-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="recommended-heading" className="text-sm font-semibold text-foreground">
              Recommended for you
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary text-xs h-8 px-2"
              onMouseEnter={() => speak('view-exercises')}
              onClick={() => buttonPress()}
              aria-label="See all exercises"
            >
              See all
              <ChevronRight size={14} className="ml-1" aria-hidden />
            </Button>
          </div>

          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory"
            role="list"
            aria-label="Recommended exercises"
          >
            {isRefreshing ? (
              <>
                <ExerciseCardSkeleton />
                <ExerciseCardSkeleton />
                <ExerciseCardSkeleton />
              </>
            ) : (
              recommendedExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  role="listitem"
                  className="flex-shrink-0 w-36 rounded-xl border bg-card p-3 text-left hover:shadow-md active:scale-[0.98] transition-all snap-start"
                  onClick={() => {
                    buttonPress();
                    onViewExercise(exercise.id);
                  }}
                  aria-label={`${exercise.title}, ${exercise.difficulty} difficulty, ${exercise.duration}`}
                >
                  <div className="w-full aspect-square rounded-lg bg-primary/5 dark:bg-primary/10 flex items-center justify-center mb-2 overflow-hidden">
                    <Dumbbell className="text-primary/40" size={32} aria-hidden />
                  </div>
                  <h3 className="font-medium text-xs mb-1.5 line-clamp-1">{exercise.title}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium capitalize',
                        getDifficultyStyle(exercise.difficulty)
                      )}
                    >
                      {exercise.difficulty}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{exercise.duration}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Upcoming Check-in */}
        <div
          className="p-4 rounded-xl border bg-card animate-slide-up animation-delay-400"
          role="region"
          aria-label="Upcoming appointment"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
              <Calendar className="text-primary" size={20} aria-hidden />
              <DotIndicator color="success" pulse />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Next check-in</h3>
              <p className="text-muted-foreground text-xs">Dr. Smith, Tomorrow 3 PM</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 active:scale-95 transition-transform"
              onClick={() => buttonPress()}
            >
              Update
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <section className="animate-slide-up animation-delay-500" aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="text-sm font-semibold text-foreground mb-3">
            Recent Activity
          </h2>
          <div className="space-y-2" role="list">
            {isRefreshing ? (
              <>
                <ActivityCardSkeleton />
                <ActivityCardSkeleton />
                <ActivityCardSkeleton />
              </>
            ) : (
              [
                { date: 'Today', exercise: 'Bodyweight Squat', score: 94, duration: '12 min' },
                { date: 'Yesterday', exercise: 'Glute Bridge', score: 88, duration: '8 min' },
                { date: '2 days ago', exercise: 'Bird Dog', score: 91, duration: '10 min' },
              ].map((activity, index) => (
                <div
                  key={index}
                  role="listitem"
                  className="p-3 rounded-xl border bg-card flex items-center gap-3 hover:bg-muted/50 transition-colors"
                  aria-label={`${activity.exercise} on ${activity.date}, form score ${activity.score}%`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{activity.exercise}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.date} · {activity.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-emerald-500 tabular-nums">{activity.score}%</p>
                    <p className="text-[10px] text-muted-foreground">Form</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bottom padding for safe area */}
        <div className="h-safe-area-inset-bottom" />
      </main>
    </PullToRefresh>
  );
}
