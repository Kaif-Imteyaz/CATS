import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Play, 
  Pause, 
  ChevronRight, 
  Quote, 
  TrendingUp,
  Heart,
  Clock,
  User
} from 'lucide-react';
import { patientStories, getRandomQuote, type PatientStory } from '../../data/stories';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../stores/appStore';

export function StoriesScreen() {
  const { userProfile } = useAppStore();
  const [selectedStory, setSelectedStory] = useState<PatientStory | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quote] = useState(getRandomQuote());

  const speakStory = (story: PatientStory) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(story.fullStory);
    utterance.lang = userProfile.language;
    utterance.rate = 0.9;
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  if (selectedStory) {
    return (
      <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
        <header className="p-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => {
            window.speechSynthesis?.cancel();
            setIsPlaying(false);
            setSelectedStory(null);
          }}>
            ← Back
          </Button>
          <h1 className="text-lg font-bold">{selectedStory.name}'s Story</h1>
        </header>

        <main className="px-4 space-y-6 max-w-md mx-auto max-w-md mx-auto">
          {/* Story Header */}
          <Card variant="gradient" className="animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="text-primary" size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedStory.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedStory.age} years • {selectedStory.condition}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{selectedStory.title}</h3>
              <Badge variant="secondary">{selectedStory.duration} journey</Badge>
            </CardContent>
          </Card>

          {/* Listen Button */}
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full"
            onClick={() => speakStory(selectedStory)}
          >
            {isPlaying ? <Pause className="mr-2" size={20} /> : <Play className="mr-2" size={20} />}
            {isPlaying ? 'Pause Story' : 'Listen to Story'}
          </Button>

          {/* Full Story */}
          <Card variant="default" className="animate-slide-up animation-delay-100">
            <CardContent className="p-6">
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {selectedStory.fullStory}
              </p>
            </CardContent>
          </Card>

          {/* Progress Comparison */}
          <div className="animate-slide-up animation-delay-200">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">TRANSFORMATION</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card variant="outline">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">BEFORE</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Pain Level</span>
                        <span>{selectedStory.beforeStats.painLevel}/10</span>
                      </div>
                      <Progress value={selectedStory.beforeStats.painLevel * 10} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Mobility</span>
                        <span>{selectedStory.beforeStats.mobility}%</span>
                      </div>
                      <Progress value={selectedStory.beforeStats.mobility} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card variant="gradient">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">AFTER</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Pain Level</span>
                        <span className="text-success">{selectedStory.afterStats.painLevel}/10</span>
                      </div>
                      <Progress value={selectedStory.afterStats.painLevel * 10} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Mobility</span>
                        <span className="text-success">{selectedStory.afterStats.mobility}%</span>
                      </div>
                      <Progress value={selectedStory.afterStats.mobility} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="p-4">
        <h1 className="text-2xl font-bold text-foreground">Success Stories</h1>
        <p className="text-muted-foreground">Real patients, real results</p>
      </header>

      <main className="px-4 space-y-6">
        {/* Daily Quote */}
        <Card variant="glass" className="animate-slide-up">
          <CardContent className="p-6">
            <Quote className="text-primary mb-3" size={24} />
            <p className="text-lg font-medium italic mb-2">"{quote.text}"</p>
            <p className="text-sm text-muted-foreground">— {quote.author}</p>
          </CardContent>
        </Card>

        {/* Patient Stories */}
        <div className="space-y-4 animate-slide-up animation-delay-100">
          <h2 className="text-lg font-semibold">Patient Journeys</h2>
          {patientStories.map((story, index) => (
            <Card 
              key={story.id} 
              variant="interactive"
              className="cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedStory(story)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="text-primary" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{story.name}</h3>
                      <Badge variant="secondary" className="text-xs">{story.age}y</Badge>
                    </div>
                    <p className="text-sm font-medium text-primary mb-1">{story.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{story.summary}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-xs text-success">
                        <TrendingUp size={12} />
                        <span>{story.afterStats.mobility - story.beforeStats.mobility}% mobility gain</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>{story.duration}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-muted-foreground flex-shrink-0" size={20} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon */}
        <Card variant="outline" className="animate-slide-up animation-delay-200">
          <CardContent className="p-6 text-center">
            <Heart className="text-primary mx-auto mb-3" size={32} />
            <h3 className="font-semibold mb-2">More Stories Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              We are collecting more inspiring recovery journeys from our community.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}