import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search, Heart, Plus, Filter, Play } from 'lucide-react';
import { exercises, Exercise } from '../../data/exercises';
import { cn } from '../../lib/utils';

const filterChips = ['All', 'Shoulders', 'Upper Back', 'Core', 'Favorites'];

interface ExerciseLibraryScreenProps {
  onSelectExercise: (id: string) => void;
}

export function ExerciseLibraryScreen({ onSelectExercise }: ExerciseLibraryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [favorites, setFavorites] = useState<string[]>(
    exercises.filter((e) => e.isFavorite).map((e) => e.id)
  );

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Favorites') return matchesSearch && favorites.includes(exercise.id);
    return matchesSearch && exercise.bodyArea.some((area) => 
      area.toLowerCase().includes(activeFilter.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-background pb-24 w-full max-w-md mx-auto">
      {/* Header */}
      <header className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Exercise Library</h1>
          <Button variant="ghost" size="icon">
            <Filter size={20} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {filterChips.map((chip) => (
            <Button
              key={chip}
              variant={activeFilter === chip ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(chip)}
              className="flex-shrink-0"
            >
              {chip}
            </Button>
          ))}
        </div>
      </header>

      {/* Exercise grid */}
      <main className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredExercises.map((exercise, index) => (
            <Card
              key={exercise.id}
              variant="interactive"
              className="animate-scale-in overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onSelectExercise(exercise.id)}
            >
              <CardContent className="p-0">
                {/* Thumbnail with local image */}
                <div className="relative w-full aspect-video bg-primary/10">
                  <img 
                    src="/public/assets/elder_en_thumbnails/image.png"
                    alt={exercise.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Play size={16} className="text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  
                  {/* Favorite button */}
                  <button
                    onClick={(e) => toggleFavorite(exercise.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm"
                  >
                    <Heart
                      size={16}
                      className={cn(
                        'transition-colors',
                        favorites.includes(exercise.id)
                          ? 'fill-destructive text-destructive'
                          : 'text-muted-foreground'
                      )}
                    />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-1">{exercise.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={exercise.difficulty} className="text-xs">
                      {exercise.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{exercise.duration}</span>
                  </div>

                  {/* Body area tags */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {exercise.bodyArea.slice(0, 2).map((area) => (
                      <Badge key={area} variant="secondary" className="text-xs py-0">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="text-muted-foreground" size={24} />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No exercises found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Button
        variant="hero"
        size="icon-lg"
        className="fixed bottom-24 right-4 shadow-lg"
      >
        <Plus size={24} />
      </Button>
    </div>
  );
}