import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const CULTURAL_BACKGROUNDS = [
  { id: 'western', label: 'Western', languages: ['en-US'] },
  { id: 'hispanic', label: 'Hispanic/Latino', languages: ['es-ES', 'pt-BR'] },
  { id: 'south-asian', label: 'South Asian', languages: ['hi-IN'] },
  { id: 'east-asian', label: 'East Asian', languages: ['zh-CN', 'ja-JP'] },
  { id: 'middle-eastern', label: 'Middle Eastern', languages: ['ar-SA'] },
  { id: 'african', label: 'African', languages: ['en-US', 'fr-FR'] },
  { id: 'european', label: 'European', languages: ['de-DE', 'fr-FR'] },
] as const;

export const LANGUAGES = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  { code: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar-SA', label: 'العربية', flag: '🇸🇦' },
] as const;

export interface Notification {
  id: string;
  type: 'reminder' | 'doctor' | 'achievement' | 'tip';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface DoctorMessage {
  id: string;
  type: 'prescription' | 'recommendation' | 'exercise' | 'medicine';
  title: string;
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface HealthReminder {
  id: string;
  type: 'medicine' | 'exercise' | 'water';
  title: string;
  time: string;
  completed: boolean;
}

export interface UserProfile {
  name: string;
  age: number;
  ageRange: string;
  gender: string;
  weight?: number;
  weightUnit: 'kg' | 'lb';
  conditions: string[];
  otherCondition?: string;
  affectedSide: 'left' | 'right' | 'both';
  mobilityLevel: 'low' | 'medium' | 'high';
  painLevel: number;
  goals: {
    reducePain: number;
    improveMobility: number;
    buildStrength: number;
  };
  consents: {
    camera: boolean;
    dataCollection: boolean;
    medicalAdvice: boolean;
  };
  culturalBackground: string;
  language: string;
  voiceLanguage: string;
  instructionStyle: 'simple' | 'encouraging' | 'clinical';
  motivationTone: 'calm' | 'coach' | 'doctor';
  voiceAccessibility: boolean;
  prescriptionImages: string[];
}

interface AppState {
  currentScreen: 'splash' | 'welcome' | 'onboarding' | 'dashboard' | 'exercises' | 'session' | 'progress' | 'profile' | 'stories' | 'my-health';
  onboardingStep: number;
  userProfile: UserProfile;
  isOnboarded: boolean;
  notifications: Notification[];
  doctorMessages: DoctorMessage[];
  healthReminders: HealthReminder[];
  userRole: 'patient' | 'doctor' | null;
  
  setCurrentScreen: (screen: AppState['currentScreen']) => void;
  setOnboardingStep: (step: number) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetApp: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addReminder: (reminder: Omit<HealthReminder, 'id' | 'completed'>) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
  addPrescriptionImage: (imageUrl: string) => void;
  addDoctorMessage: (message: Omit<DoctorMessage, 'id' | 'timestamp'>) => void;
  setUserRole: (role: 'patient' | 'doctor' | null) => void;
}

const defaultUserProfile: UserProfile = {
  name: '',
  age: 30,
  ageRange: '30-45',
  gender: '',
  weight: undefined,
  weightUnit: 'kg',
  conditions: [],
  affectedSide: 'both',
  mobilityLevel: 'medium',
  painLevel: 3,
  goals: {
    reducePain: 40,
    improveMobility: 30,
    buildStrength: 30,
  },
  consents: {
    camera: false,
    dataCollection: false,
    medicalAdvice: false,
  },
  culturalBackground: 'western',
  language: 'en-US',
  voiceLanguage: 'en-US',
  instructionStyle: 'encouraging',
  motivationTone: 'coach',
  voiceAccessibility: false,
  prescriptionImages: [],
};

const sampleReminders: HealthReminder[] = [
  { id: '1', type: 'medicine', title: 'Take morning vitamins', time: '08:00', completed: false },
  { id: '2', type: 'water', title: 'Drink water', time: '10:00', completed: false },
  { id: '3', type: 'exercise', title: 'Morning stretches', time: '07:00', completed: true },
];

const sampleNotifications: Notification[] = [
  { id: '1', type: 'reminder', title: 'Time for exercises!', message: 'Your morning routine is ready', timestamp: new Date(), read: false },
  { id: '2', type: 'doctor', title: 'Message from Dr. Smith', message: 'Great progress this week!', timestamp: new Date(Date.now() - 3600000), read: false },
  { id: '3', type: 'achievement', title: '7 Day Streak! 🔥', message: 'You have been consistent for a week', timestamp: new Date(Date.now() - 86400000), read: true },
];

const sampleDoctorMessages: DoctorMessage[] = [
  { id: '1', type: 'recommendation', title: 'Daily Exercise', content: 'I recommend continuing with gentle stretching exercises. Focus on the bird-dog and cat-cow movements for your lower back. Take it slow and listen to your body.', timestamp: new Date() },
  { id: '2', type: 'prescription', title: 'Pain Management', content: 'Take your prescribed anti-inflammatory medication after meals. Apply ice pack for 15 minutes if you experience any swelling.', timestamp: new Date(Date.now() - 86400000) },
  { id: '3', type: 'exercise', title: 'This Week Goals', content: 'Aim for 3 sessions this week. Start with 5-minute warm-ups. Gradually increase duration as comfort allows.', timestamp: new Date(Date.now() - 172800000) },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentScreen: 'splash',
      onboardingStep: 1,
      userProfile: defaultUserProfile,
      isOnboarded: false,
      notifications: sampleNotifications,
      doctorMessages: sampleDoctorMessages,
      healthReminders: sampleReminders,
      userRole: null,

      setCurrentScreen: (screen) => set({ currentScreen: screen }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      updateUserProfile: (updates) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...updates },
        })),
      completeOnboarding: () => set({ isOnboarded: true, currentScreen: 'dashboard' }),
      resetApp: () => set({ 
        currentScreen: 'splash', 
        onboardingStep: 1, 
        userProfile: defaultUserProfile, 
        isOnboarded: false,
        notifications: sampleNotifications,
        userRole: null,
      }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            { ...notification, id: Date.now().toString(), timestamp: new Date(), read: false },
            ...state.notifications,
          ],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
      addReminder: (reminder) =>
        set((state) => ({
          healthReminders: [
            ...state.healthReminders,
            { ...reminder, id: Date.now().toString(), completed: false },
          ],
        })),
      toggleReminder: (id) =>
        set((state) => ({
          healthReminders: state.healthReminders.map((r) =>
            r.id === id ? { ...r, completed: !r.completed } : r
          ),
        })),
      removeReminder: (id) =>
        set((state) => ({
          healthReminders: state.healthReminders.filter((r) => r.id !== id),
        })),
      addPrescriptionImage: (imageUrl) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            prescriptionImages: [...state.userProfile.prescriptionImages, imageUrl],
          },
        })),
      addDoctorMessage: (message) =>
        set((state) => ({
          doctorMessages: [
            { ...message, id: Date.now().toString(), timestamp: new Date() },
            ...state.doctorMessages,
          ],
        })),
      setUserRole: (role) => set({ userRole: role }),
    }),
    {
      name: 'physio-app-storage',
      partialize: (state) => ({ 
        userProfile: state.userProfile, 
        isOnboarded: state.isOnboarded,
        notifications: state.notifications,
        healthReminders: state.healthReminders,
        userRole: state.userRole,
      }),
    }
  )
);
