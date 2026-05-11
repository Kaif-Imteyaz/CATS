import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSessionStats } from '../../hooks/useSessionStats';
import { AnimatedCounter } from '../ui/animated-counter';

export function ProgressScreen() {
  const { user } = useAuth();
  const { stats, isLoading, dateRange, setDateRange, refresh } = useSessionStats(user?.id);

  const weekDays = stats?.weeklyData?.slice(-7).map(d => d.dayName) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const painData = stats?.weeklyData?.slice(-7).map(d => d.painLevel) || [0, 0, 0, 0, 0, 0, 0];
  const sessionData = stats?.weeklyData?.slice(-7).map(d => d.sessionDuration) || [0, 0, 0, 0, 0, 0, 0];

  return (
    <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refresh()}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>

        {/* Date range selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
              className="capitalize"
            >
              {range}
            </Button>
          ))}
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          <div className="rounded-xl border bg-gradient-to-br from-card to-muted/30 p-4 text-center">
            <Flame className="mx-auto text-warning mb-2" size={24} />
            {isLoading ? (
              <Loader2 className="mx-auto animate-spin" size={24} />
            ) : (
              <AnimatedCounter
                value={stats?.currentStreak || 0}
                className="text-2xl font-bold"
              />
            )}
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-card to-muted/30 p-4 text-center">
            <Target className="mx-auto text-primary mb-2" size={24} />
            {isLoading ? (
              <Loader2 className="mx-auto animate-spin" size={24} />
            ) : (
              <AnimatedCounter
                value={stats?.totalSessions || 0}
                className="text-2xl font-bold"
              />
            )}
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-card to-muted/30 p-4 text-center">
            <TrendingUp className="mx-auto text-success mb-2" size={24} />
            {isLoading ? (
              <Loader2 className="mx-auto animate-spin" size={24} />
            ) : (
              <AnimatedCounter
                value={stats?.averageFormScore || 0}
                suffix="%"
                className="text-2xl font-bold"
              />
            )}
            <p className="text-xs text-muted-foreground">Avg. Form</p>
          </div>
        </div>

        {/* Pain Level Trend */}
        <div className="rounded-xl border bg-card animate-slide-up animation-delay-100">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Pain Level Trend</h3>
              {stats?.painReduction !== undefined && stats.painReduction > 0 && (
                <Badge className="flex items-center gap-1 bg-success text-success-foreground">
                  <TrendingDown size={12} />
                  -{stats.painReduction}%
                </Badge>
              )}
            </div>
          </div>
          <div className="p-4 pt-0">
            {isLoading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : (
              <>
                {/* Simple bar chart */}
                <div className="flex items-end justify-between h-32 gap-2 mb-2">
                  {painData.map((value, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md transition-all duration-300"
                        style={{
                          height: `${Math.max((value / 10) * 100, 5)}%`,
                          background: value > 0
                            ? `linear-gradient(to top, hsl(var(--success)), hsl(var(--warning) / ${value / 10}))`
                            : 'hsl(var(--muted))'
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  {weekDays.map((day, i) => (
                    <span key={`${day}-${i}`}>{day}</span>
                  ))}
                </div>
                {/* Goal line indicator */}
                <div className="mt-2 pt-2 border-t flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-success" />
                  <span className="text-xs text-muted-foreground">Goal: Pain level under 3</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Session Consistency */}
        <div className="rounded-xl border bg-card animate-slide-up animation-delay-200">
          <div className="p-4 pb-2">
            <h3 className="text-base font-semibold">Session Consistency</h3>
          </div>
          <div className="p-4 pt-0">
            {isLoading ? (
              <div className="h-24 flex items-center justify-center">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between h-24 gap-2 mb-2">
                  {sessionData.map((value, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          value > 0 ? 'bg-primary' : 'bg-muted'
                        }`}
                        style={{ height: value > 0 ? `${Math.max((value / 40) * 100, 10)}%` : '10%' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  {weekDays.map((day, i) => (
                    <span key={`session-${day}-${i}`}>{day}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Form Improvement */}
        <div className="rounded-xl border bg-card animate-slide-up animation-delay-300">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Form Improvement</h3>
              {stats?.averageFormScore && stats.averageFormScore > 80 && (
                <span className="text-success font-semibold">↑ Great!</span>
              )}
            </div>
          </div>
          <div className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : (
              <>
                <div className="relative">
                  {/* Circular progress */}
                  <div className="w-32 h-32 mx-auto relative">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="hsl(var(--muted))"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(stats?.averageFormScore || 0) * 3.52} 352`}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(var(--success))" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <AnimatedCounter
                        value={stats?.averageFormScore || 0}
                        suffix="%"
                        className="text-3xl font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Breakdown by exercise */}
                {stats?.exerciseBreakdown && stats.exerciseBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {stats.exerciseBreakdown.map((exercise) => (
                      <div key={exercise.exerciseId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{exercise.exerciseName}</span>
                          <span className="font-medium">{exercise.averageFormScore}%</span>
                        </div>
                        <Progress value={exercise.averageFormScore} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Complete exercises to see breakdown
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Streak Details */}
        <div className="rounded-xl border bg-card animate-slide-up animation-delay-350">
          <div className="p-4 pb-2">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Flame className="text-warning" size={18} />
              Streak Stats
            </h3>
          </div>
          <div className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-warning">
                  {isLoading ? '-' : stats?.currentStreak || 0}
                </p>
                <p className="text-xs text-muted-foreground">Current Streak</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {isLoading ? '-' : stats?.totalSessions || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-warning/10 to-primary/10 border border-warning/20">
              <p className="text-sm font-medium text-center">
                {!stats?.currentStreak || stats.currentStreak === 0 ? (
                  "Start your streak today! 🎯"
                ) : stats.currentStreak < 7 ? (
                  `Keep going! ${7 - stats.currentStreak} more days to a week! 💪`
                ) : stats.currentStreak < 30 ? (
                  `Amazing! ${30 - stats.currentStreak} days to a month streak! 🔥`
                ) : (
                  "Incredible dedication! You're on fire! 🏆"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Export button */}
        <Button variant="outline" className="w-full animate-slide-up animation-delay-500">
          <Download size={16} className="mr-2" />
          Share Report with Clinician
        </Button>
      </main>
    </div>
  );
}
