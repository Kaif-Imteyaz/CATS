import { Home, Dumbbell, Play, Stethoscope, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { useButtonVoice } from '../hooks/useButtonVoice';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Home', icon: Home, voiceId: 'start-session' },
  { id: 'exercises', label: 'Exercises', icon: Dumbbell, voiceId: 'view-exercises' },
  { id: 'session', label: 'Start', icon: Play, isMain: true, voiceId: 'start-session' },
  { id: 'my-health', label: 'Health', icon: Stethoscope, voiceId: 'my-health' },
  { id: 'stories', label: 'Stories', icon: BookOpen, voiceId: 'view-stories' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { speak } = useButtonVoice();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50 z-50 max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => speak(item.voiceId)}
                className="relative -mt-5"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                  "bg-gradient-to-br from-primary to-primary/80",
                  "hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                )}>
                  <Icon className="text-white" size={24} />
                </div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              onMouseEnter={() => speak(item.voiceId)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                'text-[10px]',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
