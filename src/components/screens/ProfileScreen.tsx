import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  User, 
  Bell, 
  Shield, 
  Volume2, 
  Camera, 
  HardDrive,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  Trash2,
  Calendar,
  MessageSquare,
  FileText,
  Globe,
  Languages,
  Accessibility,
  ArrowLeft
} from 'lucide-react';
import { useAppStore, CULTURAL_BACKGROUNDS, LANGUAGES } from '../../stores/appStore';
import { useButtonVoice } from '../../hooks/useButtonVoice';

interface ProfileScreenProps {
  onLogout: () => void;
  onBack: () => void;
}

const settingsItems = [
  { icon: Bell, label: 'Notifications', hasToggle: false },
  { icon: Shield, label: 'Privacy & Permissions', hasToggle: false },
  { icon: Volume2, label: 'Voice & Audio Settings', hasToggle: false },
  { icon: Camera, label: 'Camera Settings', hasToggle: false },
  { icon: HardDrive, label: 'Data & Storage', hasToggle: false },
  { icon: HelpCircle, label: 'Help & Support', hasToggle: false },
  { icon: Info, label: 'About', hasToggle: false },
];

export function ProfileScreen({ onLogout, onBack }: ProfileScreenProps) {
  const { userProfile, updateUserProfile } = useAppStore();
  const { speak } = useButtonVoice();

  return (
    <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          onMouseEnter={() => speak('go-back')}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      </header>

      <main className="px-4 space-y-6">
        {/* Profile card */}
        <Card variant="gradient" className="animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {userProfile.name ? userProfile.name[0].toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{userProfile.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">Member since Jan 2024</p>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cultural & Language Settings */}
        <div className="animate-slide-up animation-delay-100">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">CULTURAL & LANGUAGE</h3>
          <Card variant="default">
            <CardContent className="p-4 space-y-4">
              {/* Cultural Background */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-muted-foreground" />
                  <span className="text-sm">Cultural Background</span>
                </div>
                <Select
                  value={userProfile.culturalBackground}
                  onValueChange={(value) => updateUserProfile({ culturalBackground: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select background" />
                  </SelectTrigger>
                  <SelectContent>
                    {CULTURAL_BACKGROUNDS.map((bg) => (
                      <SelectItem key={bg.id} value={bg.id}>
                        {bg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Languages size={16} className="text-muted-foreground" />
                  <span className="text-sm">Language</span>
                </div>
                <Select
                  value={userProfile.language}
                  onValueChange={(value) => updateUserProfile({ language: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Accessibility */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Accessibility size={16} className="text-muted-foreground" />
                  <div>
                    <span className="text-sm">Voice Accessibility</span>
                    <p className="text-xs text-muted-foreground">Read button descriptions aloud</p>
                  </div>
                </div>
                <Switch
                  checked={userProfile.voiceAccessibility}
                  onCheckedChange={(checked) => updateUserProfile({ voiceAccessibility: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Info */}
        <div className="animate-slide-up animation-delay-200">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">PERSONAL INFO</h3>
          <Card variant="default">
            <CardContent className="p-0 divide-y divide-border">
              {[
                { label: 'Age', value: `${userProfile.age} years` },
                { label: 'Gender', value: userProfile.gender || 'Not specified' },
                { label: 'Weight', value: userProfile.weight ? `${userProfile.weight} ${userProfile.weightUnit}` : 'Not specified' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4">
                  <span className="text-sm">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Conditions & Goals */}
        <div className="animate-slide-up animation-delay-300">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">CONDITIONS & GOALS</h3>
          <Card variant="default">
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {userProfile.conditions.length > 0 ? (
                    userProfile.conditions.map((condition) => (
                      <span key={condition} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {condition.replace('-', ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No conditions specified</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Goals Priority</p>
                <div className="space-y-2">
                  {[
                    { key: 'reducePain', label: 'Reduce Pain' },
                    { key: 'improveMobility', label: 'Improve Mobility' },
                    { key: 'buildStrength', label: 'Build Strength' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full gradient-primary rounded-full"
                          style={{ width: `${userProfile.goals[key as keyof typeof userProfile.goals]}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16">
                        {label}: {Math.round(userProfile.goals[key as keyof typeof userProfile.goals])}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinician Connection */}
        <div className="animate-slide-up animation-delay-400">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">CLINICIAN CONNECTION</h3>
          <Card variant="default">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-success">DS</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Dr. Jane Smith</p>
                  <p className="text-xs text-muted-foreground">Last sync: Today</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageSquare size={14} className="mr-1" />
                  Message
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <FileText size={14} className="mr-1" />
                  Share Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Snapshot */}
        <div className="animate-slide-up animation-delay-500">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">ALL-TIME STATS</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Sessions', value: '24' },
              { label: 'Total Time', value: '8.5 hrs' },
              { label: 'Avg Form Score', value: '88%' },
              { label: 'Best Streak', value: '14 days' },
            ].map((stat) => (
              <Card key={stat.label} variant="gradient">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="animate-slide-up animation-delay-500 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">SETTINGS</h3>
          <Card variant="default">
            <CardContent className="p-0 divide-y divide-border">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Icon size={18} className="text-muted-foreground" />
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Logout & Delete */}
        <div className="space-y-3 pb-8">
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={onLogout}
          >
            <LogOut size={16} className="mr-2" />
            Log Out
          </Button>
          <Button variant="ghost" className="w-full text-destructive">
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </Button>
        </div>
      </main>
    </div>
  );
}