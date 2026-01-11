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
  Bell,
  Send,
  ChevronRight,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Plus,
  Pill,
  Dumbbell,
  FileText
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
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

// Mock patient data
const mockPatients = [
  { id: '1', name: 'John Doe', age: 65, condition: 'Lower Back Pain', lastSession: '2 hours ago', formScore: 92, sessionsThisWeek: 5, streak: 7, status: 'active' },
  { id: '2', name: 'Sarah Johnson', age: 58, condition: 'Knee Rehabilitation', lastSession: 'Yesterday', formScore: 88, sessionsThisWeek: 3, streak: 4, status: 'active' },
  { id: '3', name: 'Michael Chen', age: 72, condition: 'Shoulder Recovery', lastSession: '3 days ago', formScore: 75, sessionsThisWeek: 1, streak: 0, status: 'needs-attention' },
  { id: '4', name: 'Emily Wilson', age: 45, condition: 'Post-Surgery PT', lastSession: 'Today', formScore: 95, sessionsThisWeek: 6, streak: 14, status: 'excellent' },
];

export function DoctorDashboardScreen({ onLogout }: DoctorDashboardScreenProps) {
  const { addDoctorMessage } = useAppStore();
  const [selectedPatient, setSelectedPatient] = useState<typeof mockPatients[0] | null>(null);
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
    { label: 'Active Patients', value: '24', icon: Users, color: 'text-primary' },
    { label: 'Sessions Today', value: '12', icon: Activity, color: 'text-success' },
    { label: 'Avg Form Score', value: '87%', icon: TrendingUp, color: 'text-warning' },
    { label: 'Pending Reviews', value: '3', icon: Clock, color: 'text-destructive' },
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
              <Card key={stat.label} variant="gradient">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card variant="outline" className="animate-slide-up animation-delay-100">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Send size={16} />
              Send Message to Patient
            </h3>
            <div className="space-y-3">
              <Select
                value={selectedPatient?.id || ''}
                onValueChange={(value) => setSelectedPatient(mockPatients.find(p => p.id === value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {mockPatients.map((patient) => (
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
        </Card>

        {/* Patient List */}
        <div className="animate-slide-up animation-delay-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Your Patients</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              <Plus size={14} className="mr-1" />
              Add Patient
            </Button>
          </div>
          <div className="space-y-3">
            {mockPatients.map((patient) => (
              <Card 
                key={patient.id} 
                variant="interactive"
                className="cursor-pointer"
                onClick={() => setSelectedPatient(patient)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {patient.name.split(' ').map(n => n[0]).join('')}
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
                        {patient.condition} • {patient.age} years
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
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <Card variant="outline" className="animate-slide-up animation-delay-300">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Today's Schedule
            </h3>
            <div className="space-y-3">
              {[
                { time: '10:00 AM', patient: 'John Doe', type: 'Check-in' },
                { time: '11:30 AM', patient: 'Sarah Johnson', type: 'Progress Review' },
                { time: '2:00 PM', patient: 'Michael Chen', type: 'Assessment' },
                { time: '4:00 PM', patient: 'Emily Wilson', type: 'Follow-up' },
              ].map((appt, index) => (
                <div key={index} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-16 text-sm font-medium text-primary">{appt.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{appt.patient}</p>
                    <p className="text-xs text-muted-foreground">{appt.type}</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
