-- =============================================
-- CATS Database Schema
-- Culturally Adaptive Therapeutic System
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    full_name TEXT,
    age INTEGER CHECK (age > 0 AND age < 150),
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    weight DECIMAL(5,2),
    weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lb')),
    cultural_background TEXT,
    language TEXT DEFAULT 'en',
    avatar_url TEXT,
    role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
    onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Patient conditions
CREATE TABLE IF NOT EXISTS public.conditions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    condition_type TEXT NOT NULL,
    severity INTEGER DEFAULT 5 CHECK (severity >= 0 AND severity <= 10),
    affected_side TEXT CHECK (affected_side IN ('left', 'right', 'both')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Exercise sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    exercises_completed INTEGER DEFAULT 0,
    average_form_score DECIMAL(5,2),
    total_reps INTEGER DEFAULT 0,
    mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 5),
    mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5),
    pain_before INTEGER CHECK (pain_before >= 0 AND pain_before <= 10),
    pain_after INTEGER CHECK (pain_after >= 0 AND pain_after <= 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Individual exercise records within sessions
CREATE TABLE IF NOT EXISTS public.exercise_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    exercise_id TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    sets_completed INTEGER DEFAULT 0,
    reps_completed INTEGER DEFAULT 0,
    form_score DECIMAL(5,2),
    duration_seconds INTEGER DEFAULT 0,
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Generated exercise videos
CREATE TABLE IF NOT EXISTS public.generated_videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    exercise_type TEXT NOT NULL,
    body_area TEXT NOT NULL,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    video_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 60,
    cultural_adaptations TEXT[] DEFAULT '{}',
    instructions TEXT[] DEFAULT '{}',
    prompt_used TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Health reminders
CREATE TABLE IF NOT EXISTS public.health_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    reminder_type TEXT DEFAULT 'custom' CHECK (reminder_type IN ('medication', 'exercise', 'water', 'appointment', 'custom')),
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly')),
    scheduled_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Doctor-patient relationships
CREATE TABLE IF NOT EXISTS public.doctor_patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(doctor_id, patient_id)
);

-- Messages between doctors and patients
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_conditions_user_id ON public.conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_records_session_id ON public.exercise_records(session_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_user_id ON public.generated_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reminders_user_id ON public.health_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reminders_active ON public.health_reminders(is_active, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_doctor_id ON public.doctor_patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_patient_id ON public.doctor_patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Doctors can view their patients' profiles
CREATE POLICY "Doctors can view patient profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.doctor_patients dp
            WHERE dp.doctor_id = auth.uid()
            AND dp.patient_id = profiles.id
            AND dp.status = 'active'
        )
    );

-- CONDITIONS POLICIES
-- Users can manage their own conditions
CREATE POLICY "Users can view own conditions"
    ON public.conditions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conditions"
    ON public.conditions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conditions"
    ON public.conditions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conditions"
    ON public.conditions FOR DELETE
    USING (auth.uid() = user_id);

-- Doctors can view their patients' conditions
CREATE POLICY "Doctors can view patient conditions"
    ON public.conditions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.doctor_patients dp
            WHERE dp.doctor_id = auth.uid()
            AND dp.patient_id = conditions.user_id
            AND dp.status = 'active'
        )
    );

-- SESSIONS POLICIES
-- Users can manage their own sessions
CREATE POLICY "Users can view own sessions"
    ON public.sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON public.sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON public.sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Doctors can view their patients' sessions
CREATE POLICY "Doctors can view patient sessions"
    ON public.sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.doctor_patients dp
            WHERE dp.doctor_id = auth.uid()
            AND dp.patient_id = sessions.user_id
            AND dp.status = 'active'
        )
    );

-- EXERCISE RECORDS POLICIES
-- Users can manage their own exercise records (through sessions)
CREATE POLICY "Users can view own exercise records"
    ON public.exercise_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions s
            WHERE s.id = exercise_records.session_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own exercise records"
    ON public.exercise_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessions s
            WHERE s.id = exercise_records.session_id
            AND s.user_id = auth.uid()
        )
    );

-- GENERATED VIDEOS POLICIES
-- Users can manage their own generated videos
CREATE POLICY "Users can view own videos"
    ON public.generated_videos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos"
    ON public.generated_videos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
    ON public.generated_videos FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
    ON public.generated_videos FOR DELETE
    USING (auth.uid() = user_id);

-- HEALTH REMINDERS POLICIES
-- Users can manage their own reminders
CREATE POLICY "Users can view own reminders"
    ON public.health_reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
    ON public.health_reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
    ON public.health_reminders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
    ON public.health_reminders FOR DELETE
    USING (auth.uid() = user_id);

-- DOCTOR PATIENTS POLICIES
-- Doctors can manage their patient relationships
CREATE POLICY "Doctors can view own relationships"
    ON public.doctor_patients FOR SELECT
    USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Doctors can insert relationships"
    ON public.doctor_patients FOR INSERT
    WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own relationships"
    ON public.doctor_patients FOR UPDATE
    USING (auth.uid() = doctor_id);

-- Patients can accept/view their doctor relationships
CREATE POLICY "Patients can update relationship status"
    ON public.doctor_patients FOR UPDATE
    USING (auth.uid() = patient_id);

-- MESSAGES POLICIES
-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages to their doctors/patients
CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.doctor_patients dp
            WHERE (dp.doctor_id = auth.uid() AND dp.patient_id = messages.recipient_id)
            OR (dp.patient_id = auth.uid() AND dp.doctor_id = messages.recipient_id)
            AND dp.status = 'active'
        )
    );

-- Users can mark their received messages as read
CREATE POLICY "Users can update received messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = recipient_id);

-- PUSH SUBSCRIPTIONS POLICIES
-- Users can manage their own push subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON public.push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
    ON public.push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_conditions_updated_at
    BEFORE UPDATE ON public.conditions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_generated_videos_updated_at
    BEFORE UPDATE ON public.generated_videos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_health_reminders_updated_at
    BEFORE UPDATE ON public.health_reminders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_doctor_patients_updated_at
    BEFORE UPDATE ON public.doctor_patients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to get user stats
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    total_exercises BIGINT,
    average_form_score DECIMAL,
    current_streak INTEGER,
    total_duration_minutes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT s.id)::BIGINT as total_sessions,
        COUNT(er.id)::BIGINT as total_exercises,
        COALESCE(AVG(er.form_score), 0)::DECIMAL as average_form_score,
        (
            SELECT COUNT(*)::INTEGER
            FROM (
                SELECT DATE(started_at) as session_date
                FROM public.sessions
                WHERE user_id = p_user_id
                AND started_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(started_at)
                ORDER BY session_date DESC
            ) dates
            WHERE session_date >= CURRENT_DATE - (
                SELECT COUNT(*) - 1
                FROM (
                    SELECT DATE(started_at) as d
                    FROM public.sessions
                    WHERE user_id = p_user_id
                    GROUP BY DATE(started_at)
                    ORDER BY d DESC
                ) consecutive
                WHERE d >= CURRENT_DATE - INTERVAL '30 days'
            )::INTEGER
        ) as current_streak,
        COALESCE(SUM(s.duration_seconds) / 60, 0)::BIGINT as total_duration_minutes
    FROM public.sessions s
    LEFT JOIN public.exercise_records er ON s.id = er.session_id
    WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO authenticated;
