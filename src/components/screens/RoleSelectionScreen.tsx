import { Logo } from '../Logo';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Stethoscope, User, ArrowRight } from 'lucide-react';

interface RoleSelectionScreenProps {
  onSelectRole: (role: 'doctor' | 'patient') => void;
}

export function RoleSelectionScreen({ onSelectRole }: RoleSelectionScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="p-6">
        <Logo size="md" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24 max-w-md mx-auto">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Welcome
          </h1>
          <p className="text-muted-foreground text-lg max-w-xs mx-auto">
            Please select how you want to continue
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* Doctor Option */}
          <Card 
            variant="interactive" 
            className="cursor-pointer animate-slide-up animation-delay-100"
            onClick={() => onSelectRole('doctor')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Stethoscope className="text-primary" size={32} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">I'm a Doctor</h2>
                  <p className="text-sm text-muted-foreground">
                    Access patient dashboards and manage care
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground" size={20} />
              </div>
            </CardContent>
          </Card>

          {/* Patient Option */}
          <Card 
            variant="interactive" 
            className="cursor-pointer animate-slide-up animation-delay-200"
            onClick={() => onSelectRole('patient')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                  <User className="text-success" size={32} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">I'm a Patient</h2>
                  <p className="text-sm text-muted-foreground">
                    Start your rehabilitation journey
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground" size={20} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
