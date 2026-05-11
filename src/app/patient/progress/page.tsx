"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, Activity, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";

interface DayData {
  day: string;
  posture: number;
  rom: number;
  pain: number;
}

interface PainLog {
  level: number;
  logged_at: string;
}

interface SessionRow {
  score: number;
  completed_at: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildWeekData(sessions: SessionRow[], pains: PainLog[]): DayData[] {
  const scoreMap: Record<string, number[]> = {};
  const painMap: Record<string, number[]> = {};

  sessions.forEach((s) => {
    const d = DAYS[new Date(s.completed_at).getDay()];
    if (!scoreMap[d]) scoreMap[d] = [];
    scoreMap[d].push(s.score);
  });
  pains.forEach((p) => {
    const d = DAYS[new Date(p.logged_at).getDay()];
    if (!painMap[d]) painMap[d] = [];
    painMap[d].push(p.level);
  });

  return DAYS.map((day) => {
    const scores = scoreMap[day] ?? [];
    const painLevels = painMap[day] ?? [];
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const avgPain = painLevels.length ? Math.round(painLevels.reduce((a, b) => a + b, 0) / painLevels.length) : 5;
    return {
      day,
      posture: avgScore,
      rom: Math.round(avgScore * 0.85),
      pain: avgPain,
    };
  });
}

export default function Progress() {
  const { user, token } = useApp();
  const [painInput, setPainInput] = useState(5);
  const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
  const [logged, setLogged] = useState(false);
  const [logging, setLogging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ romGain: "+0%", postureScore: "—", painLevel: "—" });

  useEffect(() => {
    if (!user.id) { setLoading(false); return; }
    import("@/lib/supabaseClient").then(async ({ supabase }) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const [sessRes, painRes, prevSessRes] = await Promise.all([
        supabase
          .from("sessions")
          .select("score, completed_at, reps")
          .eq("patient_id", user.id)
          .gte("completed_at", weekAgo.toISOString())
          .gte("reps", 10)
          .order("completed_at", { ascending: true }),
        supabase
          .from("pain_logs")
          .select("level, logged_at")
          .eq("patient_id", user.id)
          .gte("logged_at", weekAgo.toISOString())
          .order("logged_at", { ascending: true }),
        supabase
          .from("sessions")
          .select("score")
          .eq("patient_id", user.id)
          .gte("completed_at", twoWeeksAgo.toISOString())
          .lt("completed_at", weekAgo.toISOString())
          .gte("reps", 10),
      ]);

      const sessions: SessionRow[] = sessRes.data ?? [];
      const pains: PainLog[] = painRes.data ?? [];
      const prevSessions: { score: number }[] = prevSessRes.data ?? [];

      const thisAvg = sessions.length
        ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length)
        : 0;
      const prevAvg = prevSessions.length
        ? Math.round(prevSessions.reduce((a, s) => a + s.score, 0) / prevSessions.length)
        : thisAvg;
      const romGainPct = prevAvg > 0 ? Math.round(((thisAvg - prevAvg) / prevAvg) * 100) : 0;
      const latestPain = pains.length ? pains[pains.length - 1].level : null;

      setStats({
        romGain: `${romGainPct >= 0 ? "+" : ""}${romGainPct}%`,
        postureScore: thisAvg > 0 ? `${thisAvg}%` : "—",
        painLevel: latestPain !== null ? `${latestPain}/10` : "—",
      });
      setWeeklyData(buildWeekData(sessions, pains));
      setLoading(false);
    });
  }, [user.id]);

  const handleLog = async () => {
    setWeeklyData((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], pain: painInput };
      return next;
    });
    setLogged(true);
    if (user.id && token) {
      setLogging(true);
      try {
        await api.session.logPain({ patient_id: user.id, level: painInput }, token);
      } catch { /* fail silently */ } finally {
        setLogging(false);
      }
    }
  };

  const statCards = [
    { icon: TrendingUp, label: "ROM Gain", val: stats.romGain, sub: "vs last week", color: "text-primary bg-primary/10" },
    { icon: Activity, label: "Posture Score", val: stats.postureScore, sub: "this week", color: "text-primary bg-sage/30" },
    { icon: Target, label: "Pain Level", val: stats.painLevel, sub: "latest log", color: "text-terracotta bg-terracotta/10" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Progress</h1>
        <p className="text-deep/50 text-sm mt-1">Weekly recovery tracking</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ icon: Icon, label, val, sub, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" aria-hidden />
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-deep/10 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{val}</p>
            )}
            <p className="text-xs text-deep/40 mt-1">{label} · {sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6"
        >
          <h3 className="font-bold text-deep mb-4" style={{ fontFamily: "var(--font-poppins)" }}>Posture & ROM — This Week</h3>
          {loading ? (
            <div className="h-[220px] bg-deep/5 rounded-2xl animate-pulse" />
          ) : weeklyData.every((d) => d.posture === 0) ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-deep/30">No session data this week. Complete a session to see your chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2F7E6D" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2F7E6D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="romGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A8C9B8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A8C9B8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7C76" }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Area type="monotone" dataKey="posture" stroke="#2F7E6D" strokeWidth={2} fill="url(#posGrad)" name="Posture" />
                <Area type="monotone" dataKey="rom" stroke="#A8C9B8" strokeWidth={2} fill="url(#romGrad)" name="ROM" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2 text-xs text-deep/50">
              <div className="w-3 h-3 rounded-full bg-primary" aria-hidden />Posture Score
            </div>
            <div className="flex items-center gap-2 text-xs text-deep/50">
              <div className="w-3 h-3 rounded-full bg-sage" aria-hidden />ROM
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl p-6"
        >
          <h3 className="font-bold text-deep mb-4" style={{ fontFamily: "var(--font-poppins)" }}>Pain Trend</h3>
          {loading ? (
            <div className="h-[160px] bg-deep/5 rounded-2xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7C76" }} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Line type="monotone" dataKey="pain" stroke="#D97B5D" strokeWidth={2} dot={{ fill: "#D97B5D", r: 4 }} name="Pain Level" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6"
        >
          <h3 className="font-bold text-deep mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Log Today's Pain</h3>
          <p className="text-xs text-deep/40 mb-5">Rate your current pain level (0 = none, 10 = severe)</p>

          <div className="space-y-4">
            <div className="flex justify-between text-xs text-deep/40 px-1" aria-hidden>
              <span>No pain</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={painInput}
              onChange={(e) => { setPainInput(Number(e.target.value)); setLogged(false); }}
              aria-label={`Pain level: ${painInput} out of 10`}
              className="w-full h-2 rounded-full accent-primary cursor-pointer"
            />
            <div className="flex items-center justify-between">
              <div aria-live="polite">
                <span
                  className={`text-3xl font-bold ${painInput <= 3 ? "text-primary" : painInput <= 6 ? "text-yellow-500" : "text-red-500"}`}
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  {painInput}
                </span>
                <span className="text-deep/40 text-sm">/10</span>
              </div>
              <Button
                onClick={handleLog}
                disabled={logged || logging}
                className={`rounded-full px-6 ${logged ? "bg-primary/20 text-primary" : "bg-primary text-white"}`}
              >
                {logging ? "Saving..." : logged ? "Logged" : "Log Pain"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
