import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Stethoscope, 
  Play, 
  Pause, 
  Pill, 
  Dumbbell, 
  FileText, 
  Clock,
  Volume2
} from 'lucide-react';
import { useAppStore, type DoctorMessage } from '../stores/appStore';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

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

interface DoctorMessageSheetProps {
  children: React.ReactNode;
}

export function DoctorMessageSheet({ children }: DoctorMessageSheetProps) {
  const { doctorMessages, userProfile } = useAppStore();
  const [playingId, setPlayingId] = useState<string | null>(null);

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

  const getMessagesByType = (type: DoctorMessage['type']) => 
    doctorMessages.filter((m) => m.type === type);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Stethoscope className="text-primary" size={24} />
            Doctor's Messages
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Listen to your doctor's recommendations and prescriptions
          </p>
        </SheetHeader>

        <Tabs defaultValue="all" className="h-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="recommendation">Advice</TabsTrigger>
            <TabsTrigger value="prescription">Rx</TabsTrigger>
            <TabsTrigger value="exercise">Exercise</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(85vh-200px)] space-y-3">
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
        <div className="absolute bottom-4 left-4 right-4">
          <Card variant="outline" className="bg-muted/50">
            <CardContent className="p-3 flex items-center gap-3">
              <Volume2 className="text-primary" size={20} />
              <p className="text-xs text-muted-foreground">
                Tap the play button on any message to hear it read aloud in your selected language.
                Designed for easy access by seniors and those with visual impairments.
              </p>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
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
    <Card variant={isPlaying ? 'elevated' : 'default'} className="transition-all">
      <CardContent className="p-4">
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
      </CardContent>
    </Card>
  );
}