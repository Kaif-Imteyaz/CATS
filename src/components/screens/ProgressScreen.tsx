import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Flame,
  Target,
  Calendar,
  ChevronRight,
  Download
} from 'lucide-react';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const painData = [6, 5, 5, 4, 4, 3, 3];
const sessionData = [30, 0, 25, 35, 20, 0, 15];

export function ProgressScreen() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('week');

  return (
    <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="p-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Your Progress</h1>
        
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
          <Card variant="gradient">
            <CardContent className="p-4 text-center">
              <Flame className="mx-auto text-warning mb-2" size={24} />
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card variant="gradient">
            <CardContent className="p-4 text-center">
              <Target className="mx-auto text-primary mb-2" size={24} />
              <p className="text-2xl font-bold">24</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          <Card variant="gradient">
            <CardContent className="p-4 text-center">
              <TrendingUp className="mx-auto text-success mb-2" size={24} />
              <p className="text-2xl font-bold">88%</p>
              <p className="text-xs text-muted-foreground">Avg. Form</p>
            </CardContent>
          </Card>
        </div>

        {/* Pain Level Trend */}
        <Card variant="elevated" className="animate-slide-up animation-delay-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pain Level Trend</CardTitle>
              <Badge variant="success" className="flex items-center gap-1">
                <TrendingDown size={12} />
                -50%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Simple bar chart */}
            <div className="flex items-end justify-between h-32 gap-2 mb-2">
              {painData.map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full rounded-t-md transition-all duration-300"
                    style={{ 
                      height: `${(value / 10) * 100}%`,
                      background: `linear-gradient(to top, hsl(var(--success)), hsl(var(--warning) / ${value / 10}))`
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {weekDays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            {/* Goal line indicator */}
            <div className="mt-2 pt-2 border-t flex items-center gap-2">
              <div className="w-3 h-0.5 bg-success" />
              <span className="text-xs text-muted-foreground">Goal: Pain level under 3</span>
            </div>
          </CardContent>
        </Card>

        {/* Session Consistency */}
        <Card variant="elevated" className="animate-slide-up animation-delay-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Session Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-24 gap-2 mb-2">
              {sessionData.map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      value > 0 ? 'bg-primary' : 'bg-muted'
                    }`}
                    style={{ height: value > 0 ? `${(value / 40) * 100}%` : '10%' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {weekDays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Improvement */}
        <Card variant="elevated" className="animate-slide-up animation-delay-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Form Improvement</CardTitle>
              <span className="text-success font-semibold">↑ 5%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    strokeDasharray={`${88 * 3.52} 352`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--success))" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">88%</span>
                </div>
              </div>
            </div>

            {/* Breakdown by exercise */}
            <div className="space-y-3">
              {[
                { name: 'Bodyweight Squat', score: 94 },
                { name: 'Glute Bridge', score: 88 },
                { name: 'Bird Dog', score: 82 },
              ].map((exercise) => (
                <div key={exercise.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{exercise.name}</span>
                    <span className="font-medium">{exercise.score}%</span>
                  </div>
                  <Progress value={exercise.score} indicatorVariant="gradient" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clinician Notes */}
        <Card variant="outline" className="animate-slide-up animation-delay-400">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">DS</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Dr. Smith</p>
                <p className="text-sm text-muted-foreground mt-1">
                  "Great improvement in knee stability! Keep focusing on maintaining proper form during squats."
                </p>
                <p className="text-xs text-muted-foreground mt-2">2 days ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export button */}
        <Button variant="outline" className="w-full animate-slide-up animation-delay-500">
          <Download size={16} className="mr-2" />
          Share Report with Clinician
        </Button>
      </main>
    </div>
  );
}
