import { useState } from 'react';
import { Logo } from '../Logo';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Calendar,
  Send,
  ChevronRight,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Pill,
  Dumbbell,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';
import { usePatients, PatientWithStats } from '../../hooks/usePatients';
import { useDoctorStats } from '../../hooks/useSessionStats';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface DoctorDashboardScreenProps {
  onLogout: () => void;
}

export function DoctorDashboardScreen({ onLogout }: DoctorDashboardScreenProps) {
  const { addDoctorMessage } = useAppStore();
  const { user } = useAuth();
  const { patients, isLoading: patientsLoading, refresh: refreshPatients } = usePatients(user?.id);
  const { stats: doctorStats, isLoading: statsLoading } = useDoctorStats(user?.id);

  const [selectedPatient, setSelectedPatient] = useState<PatientWithStats | null>(null);
  const [messageType, setMessageType] = useState<'recommendation' | 'prescription' | 'exercise'>('recommendation');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');

  const currentTime = new Date();
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const handleSendMessage = () => {
    if (!messageTitle.trim() || !messageContent.trim()) return;

    addDoctorMessage({
      type: messageType,
      title: messageTitle,
      content: messageContent,
    });

    setMessageTitle('');
    setMessageContent('');
    setSelectedPatient(null);
  };

  const stats = [
    {
      label: 'Active Patients',
      value: statsLoading ? '-' : doctorStats.activePatients.toString(),
      icon: Users,
      color: 'text-primary'
    },
    {
      label: 'Sessions Today',
      value: statsLoading ? '-' : doctorStats.sessionsToday.toString(),
      icon: Activity,
      color: 'text-success'
    },
    {
      label: 'Avg Form Score',
      value: statsLoading ? '-' : `${doctorStats.avgFormScore}%`,
      icon: TrendingUp,
      color: 'text-warning'
    },
    {
      label: 'Pending Reviews',
      value: statsLoading ? '-' : doctorStats.pendingReviews.toString(),
      icon: Clock,
      color: 'text-destructive'
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-8 max-w-md mx-auto">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Doctor Dashboard</h1>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <ArrowLeft size={16} className="mr-2" />
          Switch Role
        </Button>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${stat.color}`}>
                  {statsLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border bg-card animate-slide-up animation-delay-100">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Send size={16} />
              Send Message to Patient
            </h3>
            <div className="space-y-3">
              <Select
                value={selectedPatient?.id || ''}
                onValueChange={(value) => setSelectedPatient(patients.find((p) => p.id === value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} - {patient.condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPatient && (
                <>
                  <div className="flex gap-2">
                    {(['recommendation', 'prescription', 'exercise'] as const).map((type) => {
                      const icons = { recommendation: FileText, prescription: Pill, exercise: Dumbbell };
                      const Icon = icons[type];
                      return (
                        <Button
                          key={type}
                          variant={messageType === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMessageType(type)}
                          className="flex-1"
                        >
                          <Icon size={14} className="mr-1" />
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      );
                    })}
                  </div>
                  <Input
                    placeholder="Message title"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Write your message here..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={3}
                  />
                  <Button
                    className="w-full"
                    onClick={handleSendMessage}
                    disabled={!messageTitle.trim() || !messageContent.trim()}
                  >
                    <Send size={14} className="mr-2" />
                    Send to {selectedPatient.name}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </div>

        {/* Patient List */}
        <div className="animate-slide-up animation-delay-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Your Patients</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshPatients()}
                disabled={patientsLoading}
              >
                <RefreshCw size={14} className={patientsLoading ? 'animate-spin' : ''} />
              </Button>
              <Button variant="ghost" size="sm" className="text-primary">
                <Plus size={14} className="mr-1" />
                Add Patient
              </Button>
            </div>
          </div>

          {patientsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center">
              <Users size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No patients yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add patients to start tracking their progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="rounded-xl border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {patient.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{patient.name}</h4>
                          <Badge
                            variant={
                              patient.status === 'excellent' ? 'default' :
                              patient.status === 'needs-attention' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {patient.status === 'excellent' ? <CheckCircle size={10} className="mr-1" /> :
                             patient.status === 'needs-attention' ? <AlertCircle size={10} className="mr-1" /> : null}
                            {patient.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {patient.condition} {patient.age ? `• ${patient.age} years` : ''}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Score: <span className="font-semibold text-success">{patient.formScore}%</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {patient.sessionsThisWeek} sessions this week
                          </span>
                          {patient.streak > 0 && (
                            <span className="text-xs">🔥 {patient.streak} day streak</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{patient.lastSession}</p>
                        <ChevronRight size={16} className="text-muted-foreground ml-auto mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="rounded-xl border bg-card animate-slide-up animation-delay-300">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Today's Schedule
            </h3>
            {patients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No appointments scheduled
              </p>
            ) : (
              <div className="space-y-3">
                {patients.slice(0, 4).map((patient, index) => {
                  const times = ['10:00 AM', '11:30 AM', '2:00 PM', '4:00 PM'];
                  const types = ['Check-in', 'Progress Review', 'Assessment', 'Follow-up'];
                  return (
                    <div key={patient.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-16 text-sm font-medium text-primary">{times[index]}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{types[index]}</p>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </div>
      </main>
    </div>
  );
}
