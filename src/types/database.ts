/**
 * Supabase Database Types
 * Generated types for CATS database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // User profiles (extends Supabase auth.users)
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          age: number | null
          gender: string | null
          weight: number | null
          weight_unit: 'kg' | 'lb'
          cultural_background: string | null
          language: string
          avatar_url: string | null
          role: 'patient' | 'doctor'
          onboarding_completed: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          age?: number | null
          gender?: string | null
          weight?: number | null
          weight_unit?: 'kg' | 'lb'
          cultural_background?: string | null
          language?: string
          avatar_url?: string | null
          role?: 'patient' | 'doctor'
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          age?: number | null
          gender?: string | null
          weight?: number | null
          weight_unit?: 'kg' | 'lb'
          cultural_background?: string | null
          language?: string
          avatar_url?: string | null
          role?: 'patient' | 'doctor'
          onboarding_completed?: boolean
        }
      }

      // Patient conditions
      conditions: {
        Row: {
          id: string
          user_id: string
          condition_type: string
          severity: number
          affected_side: 'left' | 'right' | 'both' | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          condition_type: string
          severity?: number
          affected_side?: 'left' | 'right' | 'both' | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          condition_type?: string
          severity?: number
          affected_side?: 'left' | 'right' | 'both' | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // Exercise sessions
      sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          exercises_completed: number
          average_form_score: number | null
          total_reps: number
          mood_before: number | null
          mood_after: number | null
          pain_before: number | null
          pain_after: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          exercises_completed?: number
          average_form_score?: number | null
          total_reps?: number
          mood_before?: number | null
          mood_after?: number | null
          pain_before?: number | null
          pain_after?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          exercises_completed?: number
          average_form_score?: number | null
          total_reps?: number
          mood_before?: number | null
          mood_after?: number | null
          pain_before?: number | null
          pain_after?: number | null
          notes?: string | null
          created_at?: string
        }
      }

      // Individual exercise records within sessions
      exercise_records: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          exercise_name: string
          sets_completed: number
          reps_completed: number
          form_score: number | null
          duration_seconds: number
          feedback: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id: string
          exercise_name: string
          sets_completed?: number
          reps_completed?: number
          form_score?: number | null
          duration_seconds?: number
          feedback?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_id?: string
          exercise_name?: string
          sets_completed?: number
          reps_completed?: number
          form_score?: number | null
          duration_seconds?: number
          feedback?: Json | null
          created_at?: string
        }
      }

      // Generated exercise videos
      generated_videos: {
        Row: {
          id: string
          user_id: string
          exercise_type: string
          body_area: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          video_url: string | null
          thumbnail_url: string | null
          duration_seconds: number
          cultural_adaptations: string[]
          instructions: string[]
          prompt_used: string | null
          status: 'pending' | 'generating' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_type: string
          body_area: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          video_url?: string | null
          thumbnail_url?: string | null
          duration_seconds?: number
          cultural_adaptations?: string[]
          instructions?: string[]
          prompt_used?: string | null
          status?: 'pending' | 'generating' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_type?: string
          body_area?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          video_url?: string | null
          thumbnail_url?: string | null
          duration_seconds?: number
          cultural_adaptations?: string[]
          instructions?: string[]
          prompt_used?: string | null
          status?: 'pending' | 'generating' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }

      // Health reminders
      health_reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          reminder_type: 'medication' | 'exercise' | 'water' | 'appointment' | 'custom'
          frequency: 'once' | 'daily' | 'weekly' | 'monthly'
          scheduled_time: string
          is_active: boolean
          last_triggered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          reminder_type?: 'medication' | 'exercise' | 'water' | 'appointment' | 'custom'
          frequency?: 'once' | 'daily' | 'weekly' | 'monthly'
          scheduled_time: string
          is_active?: boolean
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          reminder_type?: 'medication' | 'exercise' | 'water' | 'appointment' | 'custom'
          frequency?: 'once' | 'daily' | 'weekly' | 'monthly'
          scheduled_time?: string
          is_active?: boolean
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // Doctor-patient relationships
      doctor_patients: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          status: 'pending' | 'active' | 'inactive'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          status?: 'pending' | 'active' | 'inactive'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          status?: 'pending' | 'active' | 'inactive'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // Doctor messages to patients
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          subject: string | null
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          subject?: string | null
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          subject?: string | null
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }

      // Push notification subscriptions
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_stats: {
        Args: { user_id: string }
        Returns: {
          total_sessions: number
          total_exercises: number
          average_form_score: number
          current_streak: number
          total_duration_minutes: number
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Specific table types for easier use
export type Profile = Tables<'profiles'>
export type Condition = Tables<'conditions'>
export type Session = Tables<'sessions'>
export type ExerciseRecord = Tables<'exercise_records'>
export type GeneratedVideo = Tables<'generated_videos'>
export type HealthReminder = Tables<'health_reminders'>
export type DoctorPatient = Tables<'doctor_patients'>
export type Message = Tables<'messages'>
export type PushSubscription = Tables<'push_subscriptions'>
