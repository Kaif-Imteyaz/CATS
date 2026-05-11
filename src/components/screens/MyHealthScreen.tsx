import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { 
  ArrowLeft,
  Stethoscope, 
  Play, 
  Pause, 
  Pill, 
  Dumbbell, 
  FileText, 
  Clock,
  Volume2,
  Camera,
  Upload,
  Plus,
  Droplets,
  Bell,
  Image,
  Trash2,
  Check
} from 'lucide-react';
import { useAppStore, type DoctorMessage, type HealthReminder } from '../../stores/appStore';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useButtonVoice } from '../../hooks/useButtonVoice';

const messageIcons: Record<DoctorMessage['type'], typeof Stethoscope> = {
  prescription: Pill,
  recommendation: Stethoscope,
  exercise: Dumbbell,
  medicine: Pill,
};

const messageColors: Record<DoctorMessage['type'], string> = {
  prescription: 'bg-warning/20 text-warning',
  recommendation: 'bg-primary/20 text-primary',
  exercise: 'bg-success/20 text-success',
  medicine: 'bg-destructive/20 text-destructive',
};

const reminderIcons: Record<HealthReminder['type'], typeof Bell> = {
  medicine: Pill,
  exercise: Dumbbell,
  water: Droplets,
};

interface MyHealthScreenProps {
  onBack: () => void;
}

export function MyHealthScreen({ onBack }: MyHealthScreenProps) {
  const { doctorMessages, userProfile, healthReminders, addReminder, toggleReminder, removeReminder, addPrescriptionImage } = useAppStore();
  const { speak } = useButtonVoice();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [newReminderType, setNewReminderType] = useState<HealthReminder['type']>('medicine');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const speakMessage = (message: DoctorMessage) => {
    if (!window.speechSynthesis) return;
    
    if (playingId === message.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    const text = `${message.title}. ${message.content}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = userProfile.language;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    
    window.speechSynthesis.speak(utterance);
    setPlayingId(message.id);
  };

  const handleAddReminder = () => {
    if (!newReminderTitle.trim()) return;
    addReminder({
      type: newReminderType,
      title: newReminderTitle,
      time: newReminderTime,
    });
    setNewReminderTitle('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        addPrescriptionImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const getMessagesByType = (type: DoctorMessage['type']) => 
    doctorMessages.filter((m) => m.type === type);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          onMouseEnter={() => speak('go-back')}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="text-primary" size={24} />
            My Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Prescriptions, reminders & doctor's advice
          </p>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="messages">Doctor</TabsTrigger>
            <TabsTrigger value="prescriptions">Rx Images</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          {/* Doctor Messages Tab */}
          <TabsContent value="messages" className="space-y-3 mt-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="recommendation">Advice</TabsTrigger>
                <TabsTrigger value="prescription">Rx</TabsTrigger>
                <TabsTrigger value="exercise">Exercise</TabsTrigger>
              </TabsList>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                <TabsContent value="all" className="space-y-3 mt-0">
                  {doctorMessages.map((message) => (
                    <MessageCard 
                      key={message.id} 
                      message={message} 
                      isPlaying={playingId === message.id}
                      onPlay={() => speakMessage(message)}
                    />
                  ))}
                </TabsContent>

                {(['recommendation', 'prescription', 'exercise'] as const).map((type) => (
                  <TabsContent key={type} value={type} className="space-y-3 mt-0">
                    {getMessagesByType(type).map((message) => (
                      <MessageCard 
                        key={message.id} 
                        message={message} 
                        isPlaying={playingId === message.id}
                        onPlay={() => speakMessage(message)}
                      />
                    ))}
                    {getMessagesByType(type).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No {type} messages yet
                      </div>
                    )}
                  </TabsContent>
                ))}
              </div>
            </Tabs>

            {/* Accessibility Note */}
            <div className="rounded-xl border bg-muted/50">
              <div className="p-3 flex items-center gap-3">
                <Volume2 className="text-primary flex-shrink-0" size={20} />
                <p className="text-xs text-muted-foreground">
                  Tap the play button on any message to hear it read aloud.
                  Designed for easy access by seniors.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Prescriptions/Images Tab */}
          <TabsContent value="prescriptions" className="space-y-4 mt-0">
            <div className="rounded-xl border bg-card">
              <div className="p-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center gap-3">
                    <Camera className="text-muted-foreground" size={32} />
                    <p className="text-sm text-muted-foreground text-center">
                      Upload prescription or medicine photos
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={14} className="mr-2" />
                        Upload
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.setAttribute('capture', 'environment');
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        <Camera size={14} className="mr-2" />
                        Camera
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Images */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">UPLOADED PRESCRIPTIONS</h3>
              {userProfile.prescriptionImages && userProfile.prescriptionImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {userProfile.prescriptionImages.map((img, index) => (
                    <div key={index} className="rounded-xl border bg-card overflow-hidden">
                      <img
                        src={img}
                        alt={`Prescription ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground text-center">
                          Prescription {index + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border bg-card/50">
                  <div className="p-6 flex flex-col items-center gap-2 text-center">
                    <Image className="text-muted-foreground" size={24} />
                    <p className="text-sm text-muted-foreground">No prescriptions uploaded yet</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4 mt-0">
            {/* Add Reminder Form */}
            <div className="rounded-xl border bg-gradient-to-br from-primary/10 to-accent/10">
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Plus size={16} />
                  Add New Reminder
                </h3>
                <div className="flex gap-2">
                  {(['medicine', 'exercise', 'water'] as const).map((type) => {
                    const Icon = reminderIcons[type];
                    return (
                      <Button
                        key={type}
                        variant={newReminderType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewReminderType(type)}
                        className="flex-1"
                      >
                        <Icon size={14} className="mr-1" />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    );
                  })}
                </div>
                <Input
                  placeholder="Reminder title (e.g., Take vitamin D)"
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddReminder} disabled={!newReminderTitle.trim()}>
                    <Plus size={16} className="mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Reminders */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">YOUR REMINDERS</h3>
              {healthReminders.length > 0 ? (
                healthReminders.map((reminder) => {
                  const Icon = reminderIcons[reminder.type];
                  return (
                    <div
                      key={reminder.id}
                      className={cn(
                        'rounded-xl border',
                        reminder.completed ? 'bg-card/50' : 'bg-card'
                      )}
                    >
                      <div className="p-4 flex items-center gap-3">
                        <Button
                          variant={reminder.completed ? 'default' : 'outline'}
                          size="icon"
                          className={cn('flex-shrink-0', reminder.completed && 'bg-success hover:bg-success/90')}
                          onClick={() => toggleReminder(reminder.id)}
                        >
                          {reminder.completed ? <Check size={16} /> : <Icon size={16} />}
                        </Button>
                        <div className="flex-1">
                          <p className={cn('font-medium text-sm', reminder.completed && 'line-through text-muted-foreground')}>
                            {reminder.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{reminder.time}</span>
                            <Badge variant="secondary" className="text-xs capitalize">{reminder.type}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeReminder(reminder.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border bg-card/50">
                  <div className="p-6 flex flex-col items-center gap-2 text-center">
                    <Bell className="text-muted-foreground" size={24} />
                    <p className="text-sm text-muted-foreground">No reminders set</p>
                    <p className="text-xs text-muted-foreground">Add reminders for medicine, exercise, or water</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface MessageCardProps {
  message: DoctorMessage;
  isPlaying: boolean;
  onPlay: () => void;
}

function MessageCard({ message, isPlaying, onPlay }: MessageCardProps) {
  const Icon = messageIcons[message.type];
  const colorClass = messageColors[message.type];

  return (
    <div
      className={cn(
        'rounded-xl border bg-card transition-all',
        isPlaying && 'shadow-lg ring-2 ring-primary/20'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{message.title}</h4>
              <Badge variant="secondary" className="text-xs capitalize">{message.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{message.content}</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>
          <Button
            variant={isPlaying ? 'default' : 'outline'}
            size="icon"
            className={cn('flex-shrink-0', isPlaying && 'animate-pulse')}
            onClick={onPlay}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
