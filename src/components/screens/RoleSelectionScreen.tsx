import { Logo } from '../Logo';
import { Stethoscope, UserRound, ArrowRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSelectionScreenProps {
  onSelectRole: (role: 'doctor' | 'patient') => void;
}

const roles = [
  {
    id: 'doctor' as const,
    title: "I'm a Doctor",
    description: 'Manage patients and monitor progress',
    icon: Stethoscope,
    color: 'bg-primary/10 text-primary border-primary/20',
    hoverColor: 'hover:bg-primary/15 hover:border-primary/40',
  },
  {
    id: 'patient' as const,
    title: "I'm a Patient",
    description: 'Start your rehabilitation journey',
    icon: UserRound,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    hoverColor: 'hover:bg-emerald-500/15 hover:border-emerald-500/40',
  },
];

export function RoleSelectionScreen({ onSelectRole }: RoleSelectionScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-2 text-primary">
          <Activity size={18} strokeWidth={2.5} />
          <span className="text-xs font-semibold">CATS</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-12">
        {/* Title */}
        <div className="text-center mb-10 animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome to CATS
          </h1>
          <p className="text-muted-foreground text-sm">
            How would you like to continue?
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                className={cn(
                  "w-full p-5 rounded-2xl border-2 text-left transition-all duration-200",
                  "animate-slide-up flex items-center gap-4",
                  role.color,
                  role.hoverColor
                )}
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  role.id === 'doctor' ? 'bg-primary/10' : 'bg-emerald-500/10'
                )}>
                  <Icon
                    size={28}
                    className={role.id === 'doctor' ? 'text-primary' : 'text-emerald-600'}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{role.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {role.description}
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground" size={20} />
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-8 animate-slide-up animation-delay-300">
          You can change this later in settings
        </p>
      </main>
    </div>
  );
}
