import { useState, useEffect } from 'react';
import { Logo } from '../Logo';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
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
  User,
  Quote
} from 'lucide-react';
import { exercises } from '../../data/exercises';
import { getRandomQuote } from '../../data/stories';
import { useAppStore } from '../../stores/appStore';
import { NotificationSheet } from '../NotificationSheet';
import { useButtonVoice } from '../../hooks/useButtonVoice';
import { cn } from '@/lib/utils';

interface DashboardScreenProps {
  onStartSession: () => void;
  onViewExercise: (id: string) => void;
  onViewProfile: () => void;
}

export function DashboardScreen({ onStartSession, onViewExercise, onViewProfile }: DashboardScreenProps) {
  const { userProfile, notifications } = useAppStore();
  const { speak } = useButtonVoice();
  const firstName = userProfile.name.split(' ')[0] || 'there';
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const [quote] = useState(getRandomQuote());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeOfDay = currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening';
  const formattedDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  const stats = [
    { icon: Flame, label: '3 day streak', value: '🔥', color: 'text-warning' },
    { icon: Clock, label: 'Next session', value: '8 AM', color: 'text-primary' },
    { icon: TrendingUp, label: 'Form score', value: '92%', color: 'text-success' },
  ];

  const recommendedExercises = exercises.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <NotificationSheet>
            <Button 
              variant="ghost" 
              size="icon"
              onMouseEnter={() => speak('notifications')}
            >
              <Bell size={20} />
            </Button>
          </NotificationSheet>
          <button 
            onClick={onViewProfile}
            onMouseEnter={() => speak('view-profile')}
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold hover:bg-primary/30 transition-colors"
          >
            {firstName[0].toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 space-y-6">
        {/* Welcome with Time */}
        <div className="animate-slide-up">
          <p className="text-sm text-muted-foreground">{formattedDate} • {formattedTime}</p>
          <h1 className="text-2xl font-bold text-foreground">
            Good {timeOfDay}, {firstName}! 👋
          </h1>
        </div>

        {/* Motivational Quote */}
        <Card variant="glass" className="animate-slide-up animation-delay-100">
          <CardContent className="p-4 flex items-start gap-3">
            <Quote className="text-primary flex-shrink-0" size={20} />
            <div>
              <p className="text-sm italic">"{quote.text}"</p>
              <p className="text-xs text-muted-foreground mt-1">— {quote.author}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 animate-slide-up animation-delay-200">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} variant="gradient" className="flex-shrink-0 min-w-[120px]">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Icon className={stat.color} size={24} />
                  <span className="text-lg font-bold">{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Start Card */}
        <Card variant="interactive" className="overflow-hidden animate-slide-up animation-delay-300">
          <div className="gradient-primary p-6 relative">
            <div className="absolute top-4 right-4 opacity-20">
              <Sparkles size={80} />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-primary-foreground mb-2">
                Ready for today's session?
              </h2>
              <div className="flex items-center gap-4 text-primary-foreground/80 text-sm mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  15 minutes
                </span>
                <span>•</span>
                <span>3 exercises</span>
              </div>
              <Button 
                variant="glass" 
                size="lg" 
                onClick={onStartSession}
                onMouseEnter={() => speak('start-session')}
                className={cn(
                              "w-full max-w-sm h-14 sm:h-16 px-8 text-base sm:text-lg font-semibold",
                              "rounded-2xl animate-slide-up shadow-lg transition-all",
                              "bg-gradient-to-r from-primary to-accent text-white",
                              "hover:from-primary/90 hover:to-accent/90 hover:shadow-xl",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
              >
                <Play size={18} className="mr-2" />
                Start Session
              </Button>
            </div>
          </div>
        </Card>

        {/* My Health Button */}
        <Card 
          variant="outline" 
          className="animate-slide-up animation-delay-400 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'my-health' }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <Stethoscope className="text-success" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">My Health</h3>
                <p className="text-muted-foreground text-xs">Prescriptions, reminders & advice</p>
              </div>
              <ChevronRight className="text-muted-foreground" size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Recommended Exercises */}
        <div className="animate-slide-up animation-delay-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recommended for you</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onMouseEnter={() => speak('view-exercises')}
            >
              See all
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {recommendedExercises.map((exercise) => (
              <Card 
                key={exercise.id} 
                variant="interactive" 
                className="flex-shrink-0 w-40"
                onClick={() => onViewExercise(exercise.id)}
              >
                <CardContent className="p-4">
                  <div className="w-full aspect-square rounded-lg bg-primary/10 flex items-center justify-center mb-3 overflow-hidden">
                    {exercise.youtubeId ? (
                      <img 
                        src={`https://img.youtube.com/vi/${exercise.youtubeId}/mqdefault.jpg`}
                        alt={exercise.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">
                        {exercise.bodyArea.includes('Legs') ? '🦵' : 
                         exercise.bodyArea.includes('Core') ? '🧘' : 
                         exercise.bodyArea.includes('Back') ? '🦴' : '💪'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{exercise.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={exercise.difficulty}>{exercise.difficulty}</Badge>
                    <span className="text-xs text-muted-foreground">{exercise.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming with Clinician */}
        <Card variant="outline" className="animate-slide-up animation-delay-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Next check-in</h3>
                <p className="text-muted-foreground text-sm">Dr. Smith, Tomorrow 3 PM</p>
              </div>
              <Button variant="soft" size="sm">
                Send update
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="animate-slide-up animation-delay-500">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { date: 'Today', exercise: 'Bodyweight Squat', score: 94, duration: '12 min' },
              { date: 'Yesterday', exercise: 'Glute Bridge', score: 88, duration: '8 min' },
              { date: '2 days ago', exercise: 'Bird Dog', score: 91, duration: '10 min' },
            ].map((activity, index) => (
              <Card key={index} variant="ghost" className="border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.exercise}</p>
                    <p className="text-xs text-muted-foreground">{activity.date} • {activity.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">{activity.score}%</p>
                    <p className="text-xs text-muted-foreground">Form score</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}