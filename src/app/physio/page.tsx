"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, AlertTriangle, CheckCircle, TrendingUp, ChevronRight, Activity,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import { useApp } from "@/context/AppContext";

interface PatientRow {
  patient_id: string;
  created_at: string;
  pain_areas: string[];
  exercises: { name: string }[];
  ai_goals: string[];
  profiles: { name: string; lang: string } | null;
}
interface SessionRow { patient_id: string; score: number; completed_at: string; }
interface PainRow { patient_id: string; level: number; logged_at: string; }

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildWeekData(sessions: SessionRow[]) {
  const counts: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = DAYS[new Date(s.completed_at).getDay()];
    counts[d] = (counts[d] ?? 0) + 1;
  });
  return DAYS.map((day) => ({ day, sessions: counts[day] ?? 0 }));
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{title}</h2>
      {subtitle && <p className="text-xs text-deep/40 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function PhysioDashboard() {
  const { user } = useApp();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [todaySessions, setTodaySessions] = useState<SessionRow[]>([]);
  const [recentPain, setRecentPain] = useState<PainRow[]>([]);
  const [weekData, setWeekData] = useState(DAYS.map((day) => ({ day, sessions: 0 })));
  const [adherenceData, setAdherenceData] = useState<{ name: string; val: number; patient_id: string }[]>([]);
  const [patientReports, setPatientReports] = useState<{
    patient_id: string; name: string; weeks: number; avgScore: number;
    sessionCount: number; adherencePct: number; lastPain: number | null; badge: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = user.name || "Physiotherapist";

  useEffect(() => {
    if (!user.id) return;
    import("@/lib/supabaseClient").then(async ({ supabase }) => {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 28);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      const [plansRes, todaySessRes, recentPainRes] = await Promise.all([
        supabase.from("plans")
          .select("patient_id, created_at, pain_areas, exercises, ai_goals, profiles!patient_id(name, lang)")
          .eq("physio_id", user.id).eq("active", true),
        supabase.from("sessions").select("patient_id, score, completed_at")
          .gte("completed_at", todayStart.toISOString()),
        supabase.from("pain_logs").select("patient_id, level, logged_at")
          .gte("logged_at", weekAgo.toISOString()).gt("level", 6),
      ]);

      const plans = (plansRes.data ?? []) as unknown as PatientRow[];
      const allPatientIds = plans.map((p) => p.patient_id);

      let weekSessions: SessionRow[] = [];
      let monthSessions: SessionRow[] = [];

      if (allPatientIds.length) {
        const [wRes, mRes] = await Promise.all([
          supabase.from("sessions").select("patient_id, score, completed_at")
            .in("patient_id", allPatientIds).gte("completed_at", weekAgo.toISOString()),
          supabase.from("sessions").select("patient_id, score, completed_at")
            .in("patient_id", allPatientIds).gte("completed_at", monthAgo.toISOString()),
        ]);
        weekSessions = wRes.data ?? [];
        monthSessions = mRes.data ?? [];
      }

      const adherence = plans.map((p) => {
        const ps = monthSessions.filter((s) => s.patient_id === p.patient_id);
        return {
          name: p.profiles?.name?.split(" ")[0] ?? "Patient",
          val: Math.min(100, Math.round((ps.length / 20) * 100)),
          patient_id: p.patient_id,
        };
      }).sort((a, b) => b.val - a.val);

      const reports = plans.map((p) => {
        const ps = monthSessions.filter((s) => s.patient_id === p.patient_id);
        const avgS = ps.length ? Math.round(ps.reduce((a, s) => a + s.score, 0) / ps.length) : 0;
        const adh = Math.min(100, Math.round((ps.length / 20) * 100));
        const planAge = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (7 * 86400000));
        const painForPatient = (recentPainRes.data ?? []).filter((r) => r.patient_id === p.patient_id);
        const lastPain = painForPatient.length ? painForPatient[0].level : null;
        const badge = adh >= 80 ? "Excellent" : adh >= 50 ? "Good" : "At Risk";
        return {
          patient_id: p.patient_id, name: p.profiles?.name ?? "Patient",
          weeks: Math.max(1, planAge), avgScore: avgS, sessionCount: ps.length,
          adherencePct: adh, lastPain, badge,
        };
      });

      setPatients(plans);
      setTodaySessions(todaySessRes.data ?? []);
      setRecentPain(recentPainRes.data ?? []);
      setWeekData(buildWeekData(weekSessions));
      setAdherenceData(adherence);
      setPatientReports(reports);
      setLoading(false);
    });
  }, [user.id]);

  const flaggedIds = new Set(recentPain.map((p) => p.patient_id));
  const flaggedPatients = patients.filter((p) => flaggedIds.has(p.patient_id));
  const avgScore = todaySessions.length
    ? Math.round(todaySessions.reduce((a, s) => a + s.score, 0) / todaySessions.length)
    : 0;

  const badgeStyle: Record<string, string> = {
    Excellent: "bg-primary/10 text-primary",
    Good: "bg-muted text-deep/60",
    "At Risk": "bg-red-100 text-red-600",
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">

      {/* greeting */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-deep/40 text-sm font-medium">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-3xl font-bold text-deep mt-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          {displayName.split(" ")[0]}
        </h1>
      </motion.div>

      {/* stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Patients", val: patients.length || "—", color: "text-primary bg-primary/10", icon: Users },
          { label: "Sessions Today", val: todaySessions.length || "—", color: "text-primary bg-sage/30", icon: CheckCircle },
          { label: "Flagged", val: flaggedPatients.length || "—", color: "text-terracotta bg-terracotta/10", icon: AlertTriangle },
          { label: "Avg. Score Today", val: avgScore ? `${avgScore}%` : "—", color: "text-primary bg-primary/10", icon: TrendingUp },
        ].map(({ label, val, color, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-5 border border-border/40">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{val}</p>
            <p className="text-xs text-deep/40 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* weekly chart + flagged */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-3xl p-6 border border-border/40">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Weekly Sessions</h3>
              <p className="text-xs text-deep/35 mt-0.5">All linked patients · last 7 days</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 text-xs">This Week</Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="wkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2F7E6D" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2F7E6D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A9E96" }} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: 12 }} />
              <Area type="monotone" dataKey="sessions" stroke="#2F7E6D" strokeWidth={2.5} fill="url(#wkGrad)" name="Sessions" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl p-6 border border-border/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>High Pain Alerts</h3>
            <Link href="/physio/patients" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {flaggedPatients.length > 0 ? flaggedPatients.slice(0, 4).map((p) => {
              const name = p.profiles?.name ?? "Patient";
              const pain = recentPain.find((r) => r.patient_id === p.patient_id);
              return (
                <Link key={p.patient_id} href={`/physio/patients/${p.patient_id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-red-50 hover:bg-red-100/70 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-600">{name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-deep truncate">{name}</p>
                    <p className="text-xs text-deep/40">Pain {pain?.level}/10</p>
                  </div>
                  <Badge className="border-0 text-[10px] bg-red-100 text-red-600 flex-shrink-0">High</Badge>
                </Link>
              );
            }) : (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-primary/20 mx-auto mb-2" />
                <p className="text-xs text-deep/30">No high pain reports</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* active patients */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl p-6 border border-border/40">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Active Patients</h3>
            <p className="text-xs text-deep/35 mt-0.5">Linked to your plans</p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary text-xs h-8 px-3" asChild>
            <Link href="/physio/patients">See all <ChevronRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
        {patients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {patients.slice(0, 6).map((p) => {
              const name = p.profiles?.name ?? "Patient";
              const sessCount = todaySessions.filter((s) => s.patient_id === p.patient_id).length;
              const planLabel = p.pain_areas?.[0] ?? "Recovery";
              const isFlagged = flaggedIds.has(p.patient_id);
              return (
                <Link key={p.patient_id} href={`/physio/patients/${p.patient_id}`}
                  className="flex items-center gap-3 p-4 bg-[#F5F7F5] rounded-2xl hover:bg-sage/15 transition-colors">
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-bold ${isFlagged ? "bg-red-100 text-red-600" : "bg-sage/30 text-primary"}`}>
                    {name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-deep text-sm truncate">{name}</p>
                    <p className="text-xs text-deep/40">{planLabel}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {isFlagged ? (
                      <AlertTriangle className="w-4 h-4 text-terracotta" />
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5 text-primary/40 mx-auto mb-0.5" />
                        <p className="text-[10px] text-deep/30">{sessCount} today</p>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-deep/10 mx-auto mb-3" />
            <p className="text-sm text-deep/30">No patients assigned yet.</p>
          </div>
        )}
      </motion.div>

      {/* adherence chart */}
      <div>
        <SectionHeader title="Patient Adherence" subtitle="Sessions completed vs target · last 4 weeks" />
        <div className="bg-white rounded-3xl p-6 border border-border/40">
          {loading ? (
            <div className="h-[180px] bg-deep/5 rounded-2xl animate-pulse" />
          ) : adherenceData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-sm text-deep/30">No patients assigned yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, adherenceData.length * 32)}>
              <BarChart data={adherenceData} layout="vertical" barSize={8}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: "#8A9E96" }} width={60} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, "Adherence"]} />
                <Bar dataKey="val" radius={[0, 6, 6, 0]} name="Adherence %">
                  {adherenceData.map(({ val }, i) => (
                    <Cell key={i} fill={val < 50 ? "#D97B5D" : "#2F7E6D"} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* patient reports */}
      <div>
        <SectionHeader title="Patient Reports" subtitle="4-week summaries · linked patients only" />
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-36 bg-white rounded-3xl animate-pulse border border-border/40" />)}
          </div>
        ) : patientReports.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-border/40">
            <Users className="w-10 h-10 text-deep/10 mx-auto mb-3" />
            <p className="text-sm text-deep/30">No patient data to report yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {patientReports.map(({ patient_id, name, weeks, avgScore: aScore, sessionCount, adherencePct, lastPain, badge }, i) => (
              <motion.div key={patient_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-3xl p-5 border border-border/40">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sage/30 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-deep text-sm" style={{ fontFamily: "var(--font-poppins)" }}>{name}</p>
                        <Badge className={`border-0 text-[10px] px-1.5 ${badgeStyle[badge]}`}>{badge}</Badge>
                      </div>
                      <p className="text-xs text-deep/40">Week {weeks} · {sessionCount} sessions logged</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-deep/25 hover:text-primary h-8 w-8 p-0" asChild>
                    <Link href={`/physio/patients/${patient_id}`}><ChevronRight className="w-4 h-4" /></Link>
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Posture", val: aScore > 0 ? `${aScore}%` : "—" },
                    { label: "Adherence", val: `${adherencePct}%` },
                    { label: "Sessions", val: String(sessionCount) },
                    { label: "Last Pain", val: lastPain !== null ? `${lastPain}/10` : "—" },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-[#F5F7F5] rounded-2xl p-3 text-center">
                      <p className="text-sm font-bold text-deep">{val}</p>
                      <p className="text-[10px] text-deep/40 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
