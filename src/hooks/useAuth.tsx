/**
 * Authentication Hook
 * Provides authentication state and methods using Supabase
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { offlineStorage } from '../services/offlineStorage';
import { dataSync } from '../services/dataSync';
import type { Profile } from '../types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isConfigured: isSupabaseConfigured(),
  });

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Try to get from local storage first
    const cached = await offlineStorage.getUserProfile(userId);

    // If online, fetch from Supabase
    if (isSupabaseConfigured() && navigator.onLine) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        // Cache the profile
        await offlineStorage.saveUserProfile(userId, data);
        return data as Profile;
      }
    }

    return cached as Profile | null;
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          profile,
          session,
          isLoading: false,
          isAuthenticated: true,
          isConfigured: true,
        });

        // Sync data in background
        dataSync.syncAll(session.user.id).catch(console.error);
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            session,
            isLoading: false,
            isAuthenticated: true,
            isConfigured: true,
          });

          // Sync data
          dataSync.syncAll(session.user.id).catch(console.error);
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isConfigured: true,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState((prev) => ({ ...prev, session }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign up
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: Record<string, unknown>
    ): Promise<{ error: AuthError | null }> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      return { error };
    },
    []
  );

  // Sign in
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: AuthError | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    []
  );

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Clear local data on sign out
    await offlineStorage.clearAll();
  }, []);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
      if (!state.user) {
        return { error: new Error('Not authenticated') };
      }

      try {
        // Update locally first
        const currentProfile = state.profile || ({} as Profile);
        const updatedProfile = { ...currentProfile, ...updates, id: state.user.id };
        await offlineStorage.saveUserProfile(state.user.id, updatedProfile);

        setState((prev) => ({ ...prev, profile: updatedProfile as Profile }));

        // Sync to Supabase if online
        if (isSupabaseConfigured() && navigator.onLine) {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', state.user.id);

          if (error) {
            // Queue for later sync
            await offlineStorage.addPendingAction('update', 'profiles', {
              id: state.user.id,
              ...updates,
            });
          }
        } else {
          // Queue for later sync
          await offlineStorage.addPendingAction('update', 'profiles', {
            id: state.user.id,
            ...updates,
          });
        }

        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    [state.user, state.profile]
  );

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (!state.user) return;

    const profile = await fetchProfile(state.user.id);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user, fetchProfile]);

  const value: AuthContextValue = {
    ...state,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Standalone hook for simpler use cases
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, isLoading, isAuthenticated: !!user };
}
