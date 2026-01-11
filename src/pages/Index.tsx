import { useState } from 'react';
import { SplashScreen } from '../components/screens/SplashScreen';
import { WelcomeScreen } from '../components/screens/WelcomeScreen';
import { OnboardingScreen } from '../components/screens/OnboardingScreen';
import { DashboardScreen } from '../components/screens/DashboardScreen';
import { ExerciseLibraryScreen } from '../components/screens/ExerciseLibraryScreen';
import { ExerciseDetailScreen } from '../components/screens/ExerciseDetailScreen';
import { SessionScreen } from '../components/screens/SessionScreen';
import { ProgressScreen } from '../components/screens/ProgressScreen';
import { ProfileScreen } from '../components/screens/ProfileScreen';
import { StoriesScreen } from '../components/screens/StoriesScreen';
import { MyHealthScreen } from '../components/screens/MyHealthScreen';
import { RoleSelectionScreen } from '../components/screens/RoleSelectionScreen';
import { DoctorDashboardScreen } from '../components/screens/DoctorDashboardScreen';
import { BottomNav } from '../components/BottomNav';
import { useAppStore } from '../stores/appStore';

type Screen = 'splash' | 'role-selection' | 'welcome' | 'onboarding' | 'dashboard' | 'exercises' | 'exercise-detail' | 'session' | 'progress' | 'profile' | 'stories' | 'my-health' | 'doctor-dashboard';

const Index = () => {
  const { isOnboarded, completeOnboarding, resetApp, userRole, setUserRole } = useAppStore();
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>();

  const handleSplashComplete = () => {
    if (userRole === 'doctor') {
      setCurrentScreen('doctor-dashboard');
    } else if (isOnboarded && userRole === 'patient') {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('role-selection');
    }
  };

  const handleRoleSelect = (role: 'doctor' | 'patient') => {
    setUserRole(role);
    if (role === 'doctor') {
      setCurrentScreen('doctor-dashboard');
    } else if (isOnboarded) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('welcome');
    }
  };

  const handleGetStarted = () => {
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setCurrentScreen('dashboard');
  };

  const handleViewExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setCurrentScreen('exercise-detail');
  };

  const handleStartSession = (exerciseId?: string) => {
    setSelectedExerciseId(exerciseId);
    setCurrentScreen('session');
  };

  const handleSessionComplete = () => {
    setSelectedExerciseId(undefined);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    resetApp();
    setCurrentScreen('splash');
  };

  const handleSwitchRole = () => {
    setUserRole(null);
    setCurrentScreen('role-selection');
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'session') {
      handleStartSession();
    } else if (tab === 'my-health') {
      setCurrentScreen('my-health');
    } else {
      setCurrentScreen(tab as Screen);
    }
  };

  const showBottomNav = ['dashboard', 'exercises', 'progress', 'stories', 'my-health'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {currentScreen === 'role-selection' && (
        <RoleSelectionScreen onSelectRole={handleRoleSelect} />
      )}

      {currentScreen === 'welcome' && (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}

      {currentScreen === 'onboarding' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}

      {currentScreen === 'dashboard' && (
        <DashboardScreen 
          onStartSession={() => handleStartSession()} 
          onViewExercise={handleViewExercise}
          onViewProfile={() => setCurrentScreen('profile')}
        />
      )}

      {currentScreen === 'exercises' && (
        <ExerciseLibraryScreen onSelectExercise={handleViewExercise} />
      )}

      {currentScreen === 'exercise-detail' && selectedExerciseId && (
        <ExerciseDetailScreen 
          exerciseId={selectedExerciseId}
          onBack={() => setCurrentScreen('exercises')}
          onStartSession={() => handleStartSession(selectedExerciseId)}
        />
      )}

      {currentScreen === 'session' && (
        <SessionScreen 
          exerciseId={selectedExerciseId}
          onExit={() => setCurrentScreen('dashboard')}
          onComplete={handleSessionComplete}
        />
      )}

      {currentScreen === 'progress' && (
        <ProgressScreen />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen 
          onLogout={handleLogout} 
          onBack={() => setCurrentScreen('dashboard')}
        />
      )}

      {currentScreen === 'stories' && (
        <StoriesScreen />
      )}

      {currentScreen === 'my-health' && (
        <MyHealthScreen onBack={() => setCurrentScreen('dashboard')} />
      )}

      {currentScreen === 'doctor-dashboard' && (
        <DoctorDashboardScreen onLogout={handleSwitchRole} />
      )}

      {showBottomNav && (
        <BottomNav activeTab={currentScreen} onTabChange={handleTabChange} />
      )}
    </div>
  );
};

export default Index;
