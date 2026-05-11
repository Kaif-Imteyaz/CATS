/**
 * Profile Stats Hook
 * Provides all-time statistics for user profile
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { offlineStorage } from '../services/offlineStorage';

export interface ProfileStats {
  totalSessions: number;
  totalTimeMinutes: number;
  avgFormScore: number;
  bestStreak: number;
  currentStreak: number;
  totalExercises: number;
  joinedDate: string;
}

interface UseProfileStatsResult {
  stats: ProfileStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const defaultStats: ProfileStats = {
  totalSessions: 0,
  totalTimeMinutes: 0,
  avgFormScore: 0,
  bestStreak: 0,
  currentStreak: 0,
  totalExercises: 0,
  joinedDate: new Date().toISOString(),
};

export function useProfileStats(userId?: string): UseProfileStatsResult {
  const [stats, setStats] = useState<ProfileStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStreak = (sessions: { started_at: string }[]): { current: number; best: number } => {
    if (sessions.length === 0) return { current: 0, best: 0 };

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current streak
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasSession = sortedSessions.some((s) => {
        const sessionDate = new Date(s.started_at);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime();
      });

      if (hasSession) {
        if (i === 0 || currentStreak > 0) {
          currentStreak++;
        }
        tempStreak++;
      } else if (i > 0 && currentStreak > 0) {
        break;
      }
    }

    // Calculate best streak by going through all sessions
    tempStreak = 0;
    let lastDate: Date | null = null;

    sortedSessions.forEach((session) => {
      const sessionDate = new Date(session.started_at);
      sessionDate.setHours(0, 0, 0, 0);

      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.floor(
          (lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      lastDate = sessionDate;
    });

    bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

    return { current: currentStreak, best: bestStreak };
  };

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setStats(defaultStats);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try offline storage first if not configured
      if (!isSupabaseConfigured() || !navigator.onLine) {
        const cachedSessions = await offlineStorage.getUserSessions?.(userId);
        if (cachedSessions && cachedSessions.length > 0) {
          const streaks = calculateStreak(cachedSessions);
          const totalTime = cachedSessions.reduce(
            (sum, s) => sum + (s.duration_seconds || 0),
            0
          );
          const totalExercises = cachedSessions.reduce(
            (sum, s) => sum + (s.exercises_completed || 0),
            0
          );
          const avgScore =
            cachedSessions.length > 0
              ? Math.round(
                  cachedSessions.reduce(
                    (sum, s) => sum + (s.average_form_score || 0),
                    0
                  ) / cachedSessions.length
                )
              : 0;

          setStats({
            totalSessions: cachedSessions.length,
            totalTimeMinutes: Math.round(totalTime / 60),
            avgFormScore: avgScore,
            bestStreak: streaks.best,
            currentStreak: streaks.current,
            totalExercises,
            joinedDate: new Date().toISOString(),
          });
        }
        setIsLoading(false);
        return;
      }

      // Fetch all sessions for the user
      const { data: sessions, error: sessError } = await supabase
        .from('sessions')
        .select('started_at, duration_seconds, average_form_score, exercises_completed')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (sessError) throw sessError;

      // Fetch profile for joined date
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

      const allSessions = sessions || [];
      const streaks = calculateStreak(allSessions);

      const totalTime = allSessions.reduce(
        (sum, s) => sum + (s.duration_seconds || 0),
        0
      );
      const totalExercises = allSessions.reduce(
        (sum, s) => sum + (s.exercises_completed || 0),
        0
      );
      const avgScore =
        allSessions.length > 0
          ? Math.round(
              allSessions.reduce(
                (sum, s) => sum + (s.average_form_score || 0),
                0
              ) / allSessions.length
            )
          : 0;

      setStats({
        totalSessions: allSessions.length,
        totalTimeMinutes: Math.round(totalTime / 60),
        avgFormScore: avgScore,
        bestStreak: streaks.best,
        currentStreak: streaks.current,
        totalExercises,
        joinedDate: profile?.created_at || new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
