"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, MessageCircle, Play, ChevronRight, Activity, TrendingUp, Smile } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ActivePlan {
  id: string;
  pain_areas: string[];
  exercises: { name: string; tag: string; duration_min: number }[];
  ai_goals: string[];
  created_at: string;
}

interface SessionRow {
  completed_at: string;
  exercise_tag: string;
  score: number;
  reps: number;
}

interface DashData {
  plan: ActivePlan | null;
  sessions: SessionRow[];
  streak: number;
  totalSessions: number;
  todayCount: number;
}

function calcStreak(sessions: SessionRow[]): number {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map((s) => new Date(s.completed_at).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

const PLAN_NAME_MAP: Record<string, string> = {
  Knee: "Knee Recovery",
  Shoulder: "Shoulder Rehab",
  "Lower Back": "Lower Back",
  Hip: "Hip Mobility",
};

export default function PatientHome() {
  const { user, t } = useApp();
  const [dash, setDash] = useState<DashData | null>(null);
  const [todayPain, setTodayPain] = useState<number | null>(null);
  const [logPain, setLogPain] = useState<number | null>(null);
  const [painSaving, setPainSaving] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadDash = async (uid: string) => {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [planRes, sessRes] = await Promise.all([
      supabase
        .from("plans")
        .select("id, pain_areas, exercises, ai_goals, created_at")
        .eq("patient_id", uid)
        .eq("active", true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("sessions")
        .select("completed_at, exercise_tag, score, reps")
        .eq("patient_id", uid)
        .gte("completed_at", since.toISOString())
        .gte("reps", 10)
        .order("completed_at", { ascending: false }),
    ]);
    const sessions: SessionRow[] = sessRes.data ?? [];
    const today = new Date().toDateString();
    setDash({
      plan: planRes.data ?? null,
      sessions,
      streak: calcStreak(sessions),
      totalSessions: sessions.length,
      todayCount: sessions.filter((s) => new Date(s.completed_at).toDateString() === today).length,
    });
  };

  const loadTodayPain = async (uid: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("pain_logs")
      .select("level")
      .eq("patient_id", uid)
      .gte("logged_at", today.toISOString())
      .order("logged_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) { setTodayPain(data.level); setLogPain(data.level); }
  };

  const savePain = async (level: number) => {
    if (!user.id || painSaving) return;
    setPainSaving(true);
    setTodayPain(level);
    await supabase.from("pain_logs").insert({ patient_id: user.id, level });
    setPainSaving(false);
  };

  useEffect(() => {
    if (!user.id) return;
    loadDash(user.id);
    loadTodayPain(user.id);

    const channel = supabase
      .channel(`dash-rt:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sessions", filter: `patient_id=eq.${user.id}` },
        () => { loadDash(user.id); })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    };
  }, [user.id]);

  const plan = dash?.plan;
  const exercises: { name: string }[] = plan?.exercises ?? [];
  const planName = plan
    ? (PLAN_NAME_MAP[plan.pain_areas?.[0]] ?? "Recovery Plan")
    : "Recovery Plan";
  const planDay = plan
    ? Math.floor((Date.now() - new Date(plan.created_at).getTime()) / 86400000) + 1
    : 0;

  const todayTotal = exercises.length;
  const todayDone = todayTotal ? Math.min(dash?.todayCount ?? 0, todayTotal) : 0;
  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  const totalSess = dash?.totalSessions ?? 0;
  const streak = dash?.streak ?? 0;

  const greeting = t("greeting");
  const firstName = user.name?.split(" ")[0] || "—";

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-deep/50 text-sm">{greeting}</p>
        <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
          {firstName} {!user.name && <span className="text-deep/20 animate-pulse">...</span>}
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-primary rounded-3xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
          <p className="text-white/70 text-sm mb-1">{t("today")}</p>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
            {planName}{planDay > 0 ? ` — Day ${planDay}` : ""}
          </h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">{todayDone} of {todayTotal} complete</span>
              <span className="font-bold">{todayPct}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${todayPct}%` }} />
            </div>
          </div>
          <Button className="bg-white text-primary hover:bg-white/90 rounded-full font-semibold" asChild>
            <Link href="/patient/session">
              <Play className="w-4 h-4 mr-2" />
              {todayDone > 0 ? t("session.continue") : t("session.start")}
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center gap-3"
        >
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#EAE8E4" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40"
                fill="none" stroke="#2F7E6D" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40 * (todayPct / 100)} ${2 * Math.PI * 40}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-poppins)" }}>
                {todayPct}%
              </span>
              <span className="text-xs text-deep/40">{t("recovery")}</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-deep">Week Progress</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 flex items-center gap-4"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${streak >= 12 ? "bg-orange-50" : "text-terracotta bg-terracotta/10"}`}>
            {streak >= 12 ? (
              <>
                <span
                  className="absolute inset-0 rounded-2xl animate-ping opacity-30 bg-orange-400"
                  style={{ animationDuration: "1.4s" }}
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-0 rounded-2xl animate-pulse opacity-20 bg-orange-300"
                  style={{ animationDuration: "2s" }}
                  aria-hidden="true"
                />
                <span className="text-xl relative z-10" role="img" aria-label="Fire streak">🔥</span>
              </>
            ) : (
              <Flame className="w-6 h-6 text-terracotta" />
            )}
          </div>
          <div>
            <p className="text-xs text-deep/50">{t("streak")}</p>
            <p className="font-bold text-deep text-lg" style={{ fontFamily: "var(--font-poppins)" }}>
              {streak ? `${streak} Days` : "—"}
            </p>
          </div>
        </motion.div>

        {[
          { icon: Activity, label: "Sessions", val: totalSess ? `${totalSess} Total` : "—", color: "text-primary bg-primary/10" },
          { icon: TrendingUp, label: "ROM Gain", val: "+0%", color: "text-primary bg-sage/30" },
        ].map(({ icon: Icon, label, val, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-deep/50">{label}</p>
              <p className="font-bold text-deep text-lg" style={{ fontFamily: "var(--font-poppins)" }}>{val}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-white rounded-3xl p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Smile className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            {todayPain !== null ? `Today's Pain: ${todayPain}/10` : "How is your pain today?"}
          </h3>
          {todayPain !== null && (
            <Badge className="ml-auto bg-primary/10 text-primary border-0 text-xs">Logged</Badge>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const color = n <= 3 ? "bg-primary text-white" : n <= 6 ? "bg-amber-400 text-white" : "bg-terracotta text-white";
            const ghost = n <= 3 ? "bg-primary/10 text-primary hover:bg-primary hover:text-white" : n <= 6 ? "bg-amber-50 text-amber-600 hover:bg-amber-400 hover:text-white" : "bg-red-50 text-red-500 hover:bg-terracotta hover:text-white";
            const active = logPain === n;
            return (
              <button
                key={n}
                onClick={() => { setLogPain(n); savePain(n); }}
                disabled={painSaving}
                aria-label={`Pain level ${n}`}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${active ? color : ghost}`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-deep/30 mt-2">1 = no pain · 10 = severe · tap to log</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{t("today")}</h3>
            <Link href="/patient/exercises" className="text-xs text-primary font-semibold flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {exercises.length > 0 ? exercises.slice(0, 5).map(({ name }, i) => {
              const done = i < todayDone;
              return (
                <div key={name} className={`flex items-center gap-3 p-3 rounded-2xl ${done ? "bg-primary/5" : "bg-cream"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-primary" : "border-2 border-muted"}`}>
                    {done && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${done ? "text-deep/40 line-through" : "text-deep"}`}>{name}</p>
                  </div>
                  {!done && (
                    <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full px-3 h-7 text-xs" asChild>
                      <Link href="/patient/session">Start</Link>
                    </Button>
                  )}
                </div>
              );
            }) : (
              <p className="text-sm text-deep/30 text-center py-4">No plan yet — complete onboarding</p>
            )}
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{t("therapist.note")}</h3>
              {plan?.ai_goals?.length ? (
                <Badge className="ml-auto bg-primary/10 text-primary border-0 text-xs">AI Goals</Badge>
              ) : null}
            </div>
            <div className="bg-cream rounded-2xl p-4">
              {plan?.ai_goals?.length ? (
                <ul className="space-y-1">
                  {plan.ai_goals.slice(0, 3).map((g) => (
                    <li key={g} className="text-sm text-deep/70 flex items-start gap-2">
                      <span className="text-primary mt-0.5">·</span>{g}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-deep/40">Complete onboarding to see your therapy goals.</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{t("upcoming")}</h3>
            </div>
            <div className="bg-cream rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-deep text-sm">Video Consultation</p>
                <p className="text-xs text-deep/50">Schedule with your physio</p>
              </div>
              <Button size="sm" className="bg-primary text-white rounded-full px-4" asChild>
                <Link href="/patient/video">Join</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
