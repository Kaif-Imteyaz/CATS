/**
 * Patients Hook
 * Provides patient data for doctors with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { offlineStorage } from '../services/offlineStorage';
import type { Profile, Session, Condition } from '../types/database';

export interface PatientWithStats {
  id: string;
  name: string;
  age: number | null;
  condition: string;
  lastSession: string;
  formScore: number;
  sessionsThisWeek: number;
  streak: number;
  status: 'active' | 'needs-attention' | 'excellent';
  profile: Profile;
}

interface UsePatientResult {
  patients: PatientWithStats[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addPatient: (patientEmail: string) => Promise<{ error: string | null }>;
  removePatient: (patientId: string) => Promise<{ error: string | null }>;
}

export function usePatients(doctorId?: string): UsePatientResult {
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getRelativeTime = (date: string): string => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffMs = now.getTime() - sessionDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return sessionDate.toLocaleDateString();
  };

  const determineStatus = (
    formScore: number,
    sessionsThisWeek: number,
    daysSinceLastSession: number
  ): 'active' | 'needs-attention' | 'excellent' => {
    if (formScore >= 90 && sessionsThisWeek >= 5) return 'excellent';
    if (daysSinceLastSession > 3 || sessionsThisWeek < 2) return 'needs-attention';
    return 'active';
  };

  const fetchPatients = useCallback(async () => {
    if (!doctorId) {
      setPatients([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured() || !navigator.onLine) {
        // Try to get cached data
        const cached = await offlineStorage.getDoctorPatients?.(doctorId);
        if (cached) {
          setPatients(cached);
        }
        setIsLoading(false);
        return;
      }

      // Fetch doctor-patient relationships
      const { data: relationships, error: relError } = await supabase
        .from('doctor_patients')
        .select('patient_id')
        .eq('doctor_id', doctorId)
        .eq('status', 'active');

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        setPatients([]);
        setIsLoading(false);
        return;
      }

      const patientIds = relationships.map((r) => r.patient_id);

      // Fetch patient profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds);

      if (profileError) throw profileError;

      // Fetch conditions for each patient
      const { data: conditions, error: condError } = await supabase
        .from('conditions')
        .select('*')
        .in('user_id', patientIds);

      if (condError) throw condError;

      // Fetch sessions for each patient (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: sessions, error: sessError } = await supabase
        .from('sessions')
        .select('*')
        .in('user_id', patientIds)
        .gte('started_at', weekAgo.toISOString())
        .order('started_at', { ascending: false });

      if (sessError) throw sessError;

      // Build patient stats
      const patientStats: PatientWithStats[] = (profiles || []).map((profile) => {
        const patientConditions = (conditions || []).filter(
          (c) => c.user_id === profile.id
        );
        const patientSessions = (sessions || []).filter(
          (s) => s.user_id === profile.id
        );

        const lastSession = patientSessions[0];
        const avgFormScore =
          patientSessions.length > 0
            ? Math.round(
                patientSessions.reduce(
                  (sum, s) => sum + (s.average_form_score || 0),
                  0
                ) / patientSessions.length
              )
            : 0;

        const daysSinceLastSession = lastSession
          ? Math.floor(
              (Date.now() - new Date(lastSession.started_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 999;

        return {
          id: profile.id,
          name: profile.full_name || 'Unknown',
          age: profile.age,
          condition:
            patientConditions[0]?.condition_type?.replace('-', ' ') ||
            'No condition set',
          lastSession: lastSession
            ? getRelativeTime(lastSession.started_at)
            : 'Never',
          formScore: avgFormScore,
          sessionsThisWeek: patientSessions.length,
          streak: calculateStreak(patientSessions),
          status: determineStatus(
            avgFormScore,
            patientSessions.length,
            daysSinceLastSession
          ),
          profile,
        };
      });

      setPatients(patientStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  const addPatient = useCallback(
    async (patientEmail: string): Promise<{ error: string | null }> => {
      if (!doctorId || !isSupabaseConfigured()) {
        return { error: 'Not configured' };
      }

      try {
        // Find patient by email (would need a function or view for this)
        const { data: patient, error: findError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'patient')
          .single();

        if (findError || !patient) {
          return { error: 'Patient not found' };
        }

        const { error: insertError } = await supabase
          .from('doctor_patients')
          .insert({
            doctor_id: doctorId,
            patient_id: patient.id,
            status: 'pending',
          });

        if (insertError) {
          return { error: insertError.message };
        }

        await fetchPatients();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown error' };
      }
    },
    [doctorId, fetchPatients]
  );

  const removePatient = useCallback(
    async (patientId: string): Promise<{ error: string | null }> => {
      if (!doctorId || !isSupabaseConfigured()) {
        return { error: 'Not configured' };
      }

      try {
        const { error } = await supabase
          .from('doctor_patients')
          .update({ status: 'inactive' })
          .eq('doctor_id', doctorId)
          .eq('patient_id', patientId);

        if (error) {
          return { error: error.message };
        }

        await fetchPatients();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown error' };
      }
    },
    [doctorId, fetchPatients]
  );

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!doctorId || !isSupabaseConfigured()) return;

    const subscription = supabase
      .channel('doctor-patients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
        },
        () => {
          fetchPatients();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [doctorId, fetchPatients]);

  return {
    patients,
    isLoading,
    error,
    refresh: fetchPatients,
    addPatient,
    removePatient,
  };
}
