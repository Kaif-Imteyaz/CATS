/**
 * Session Stats Hook
 * Provides session statistics and progress data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { offlineStorage } from '../services/offlineStorage';
import type { Session, ExerciseRecord } from '../types/database';

export interface DailyStats {
  date: string;
  dayName: string;
  painLevel: number;
  sessionDuration: number;
  formScore: number;
  exercisesCompleted: number;
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  averageFormScore: number;
  totalReps: number;
  sessionsUsed: number;
}

export interface ProgressStats {
  currentStreak: number;
  totalSessions: number;
  averageFormScore: number;
  painReduction: number;
  weeklyData: DailyStats[];
  exerciseBreakdown: ExerciseStats[];
  recentSessions: Session[];
}

interface UseSessionStatsResult {
  stats: ProgressStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  dateRange: 'week' | 'month' | 'quarter' | 'year';
  setDateRange: (range: 'week' | 'month' | 'quarter' | 'year') => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useSessionStats(userId?: string): UseSessionStatsResult {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('week');

  const dateRangeDays = useMemo(() => {
    switch (dateRange) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
    }
  }, [dateRange]);

  const calculateStreak = (sessions: Session[]): number => {
    if (sessions.length === 0) return 0;

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasSession = sortedSessions.some((s) => {
        const sessionDate = new Date(s.started_at);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime();
      });

      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  };

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRangeDays);

      // Try offline storage first if not configured
      if (!isSupabaseConfigured() || !navigator.onLine) {
        const cachedSessions = await offlineStorage.getUserSessions?.(userId);
        if (cachedSessions && cachedSessions.length > 0) {
          // Calculate stats from cached data
          const filteredSessions = cachedSessions.filter(
            (s) => new Date(s.started_at) >= startDate
          );
          // Build basic stats from cache
          setStats({
            currentStreak: calculateStreak(cachedSessions),
            totalSessions: filteredSessions.length,
            averageFormScore: filteredSessions.length > 0
              ? Math.round(
                  filteredSessions.reduce((sum, s) => sum + (s.average_form_score || 0), 0) /
                  filteredSessions.length
                )
              : 0,
            painReduction: 0,
            weeklyData: [],
            exerciseBreakdown: [],
            recentSessions: filteredSessions.slice(0, 10),
          });
        }
        setIsLoading(false);
        return;
      }

      // Fetch sessions
      const { data: sessions, error: sessError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: false });

      if (sessError) throw sessError;

      // Fetch all sessions for streak calculation
      const { data: allSessions } = await supabase
        .from('sessions')
        .select('started_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(60);

      // Fetch exercise records
      const sessionIds = (sessions || []).map((s) => s.id);
      let exerciseRecords: ExerciseRecord[] = [];

      if (sessionIds.length > 0) {
        const { data: records, error: recError } = await supabase
          .from('exercise_records')
          .select('*')
          .in('session_id', sessionIds);

        if (recError) throw recError;
        exerciseRecords = records || [];
      }

      // Calculate daily stats
      const weeklyData: DailyStats[] = [];
      for (let i = dateRangeDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const daySessions = (sessions || []).filter((s) => {
          const sessionDate = new Date(s.started_at);
          return sessionDate >= date && sessionDate < nextDate;
        });

        const avgPain = daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + ((s.pain_before || 5) + (s.pain_after || 5)) / 2, 0) / daySessions.length
          : 0;

        const avgForm = daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + (s.average_form_score || 0), 0) / daySessions.length
          : 0;

        const totalDuration = daySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
        const totalExercises = daySessions.reduce((sum, s) => sum + (s.exercises_completed || 0), 0);

        weeklyData.push({
          date: date.toISOString().split('T')[0],
          dayName: DAY_NAMES[date.getDay()],
          painLevel: Math.round(avgPain),
          sessionDuration: Math.round(totalDuration / 60),
          formScore: Math.round(avgForm),
          exercisesCompleted: totalExercises,
        });
      }

      // Calculate exercise breakdown
      const exerciseMap = new Map<string, {
        name: string;
        totalScore: number;
        totalReps: number;
        count: number;
      }>();

      exerciseRecords.forEach((record) => {
        const existing = exerciseMap.get(record.exercise_id);
        if (existing) {
          existing.totalScore += record.form_score || 0;
          existing.totalReps += record.reps_completed || 0;
          existing.count++;
        } else {
          exerciseMap.set(record.exercise_id, {
            name: record.exercise_name,
            totalScore: record.form_score || 0,
            totalReps: record.reps_completed || 0,
            count: 1,
          });
        }
      });

      const exerciseBreakdown: ExerciseStats[] = Array.from(exerciseMap.entries())
        .map(([id, data]) => ({
          exerciseId: id,
          exerciseName: data.name,
          averageFormScore: Math.round(data.totalScore / data.count),
          totalReps: data.totalReps,
          sessionsUsed: data.count,
        }))
        .sort((a, b) => b.sessionsUsed - a.sessionsUsed)
        .slice(0, 5);

      // Calculate pain reduction
      const recentPain = (sessions || [])
        .slice(0, 5)
        .reduce((sum, s) => sum + (s.pain_after || 5), 0) / Math.max((sessions || []).slice(0, 5).length, 1);

      const olderPain = (sessions || [])
        .slice(-5)
        .reduce((sum, s) => sum + (s.pain_before || 5), 0) / Math.max((sessions || []).slice(-5).length, 1);

      const painReduction = olderPain > 0 ? Math.round(((olderPain - recentPain) / olderPain) * 100) : 0;

      // Calculate overall stats
      const totalSessions = sessions?.length || 0;
      const averageFormScore = totalSessions > 0
        ? Math.round(
            (sessions || []).reduce((sum, s) => sum + (s.average_form_score || 0), 0) / totalSessions
          )
        : 0;

      setStats({
        currentStreak: calculateStreak(allSessions as Session[] || []),
        totalSessions,
        averageFormScore,
        painReduction,
        weeklyData,
        exerciseBreakdown,
        recentSessions: (sessions || []).slice(0, 10),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, [userId, dateRangeDays]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;

    const subscription = supabase
      .channel('session-stats-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sessions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
    dateRange,
    setDateRange,
  };
}

// Hook for doctor to get aggregate stats across all patients
export function useDoctorStats(doctorId?: string) {
  const [stats, setStats] = useState({
    activePatients: 0,
    sessionsToday: 0,
    avgFormScore: 0,
    pendingReviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!doctorId || !isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      // Get active patients count
      const { count: patientCount } = await supabase
        .from('doctor_patients')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('status', 'active');

      // Get patient IDs
      const { data: relationships } = await supabase
        .from('doctor_patients')
        .select('patient_id')
        .eq('doctor_id', doctorId)
        .eq('status', 'active');

      const patientIds = (relationships || []).map((r) => r.patient_id);

      if (patientIds.length > 0) {
        // Get today's sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: sessionsToday } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .in('user_id', patientIds)
          .gte('started_at', today.toISOString());

        // Get average form score from recent sessions
        const { data: recentSessions } = await supabase
          .from('sessions')
          .select('average_form_score')
          .in('user_id', patientIds)
          .not('average_form_score', 'is', null)
          .order('started_at', { ascending: false })
          .limit(50);

        const avgScore = recentSessions && recentSessions.length > 0
          ? Math.round(
              recentSessions.reduce((sum, s) => sum + (s.average_form_score || 0), 0) /
              recentSessions.length
            )
          : 0;

        // Get pending reviews (unread messages or patients needing attention)
        const { count: pendingReviews } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', doctorId)
          .eq('is_read', false);

        setStats({
          activePatients: patientCount || 0,
          sessionsToday: sessionsToday || 0,
          avgFormScore: avgScore,
          pendingReviews: pendingReviews || 0,
        });
      } else {
        setStats({
          activePatients: 0,
          sessionsToday: 0,
          avgFormScore: 0,
          pendingReviews: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch doctor stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refresh: fetchStats };
}
