import { Home, Dumbbell, Camera, TrendingUp, Headphones, Stethoscope } from 'lucide-react';
import { cn } from '../lib/utils';
import { useButtonVoice } from '../hooks/useButtonVoice';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Home', icon: Home, voiceId: 'start-session' },
  { id: 'exercises', label: 'Exercises', icon: Dumbbell, voiceId: 'view-exercises' },
  { id: 'session', label: 'Start', icon: Camera, isMain: true, voiceId: 'start-session' },
  { id: 'my-health', label: 'My Health', icon: Stethoscope, voiceId: 'my-health' },
  { id: 'stories', label: 'Stories', icon: Headphones, voiceId: 'view-stories' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { speak } = useButtonVoice();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 max-w-md mx-auto">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => speak(item.voiceId)}
                className="relative -mt-6"
              >
                <div className="gradient-primary rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Icon className="text-primary-foreground" size={28} />
                </div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">
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
                'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn('text-xs', isActive && 'font-semibold')}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
