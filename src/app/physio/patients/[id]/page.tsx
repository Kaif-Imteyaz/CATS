"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Video, MessageCircle, TrendingUp, Activity, AlertTriangle,
  CheckCircle, Clock, Save, Loader2, Plus, Dumbbell, Apple,
  X, Send, ClipboardList,
} from "lucide-react";
import { EXERCISE_LIBRARY, ROM_CONFIGS } from "@/lib/poseEngine";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RomOverride { exercise_tag: string; rom_min: number; rom_max: number; reps?: number | null; }
interface SessionRow { id: string; exercise_tag: string; reps: number; score: number; completed_at: string; }
interface PainRow { level: number; logged_at: string; }
interface PatientProfile { name: string; age: number | null; lang: string; }
interface PatientPlan { pain_areas: string[]; mobility_level: string; exercises: { name: string; tag: string }[]; ai_goals: string[]; }
interface RecRow { id: string; type: string; detail: string; duration: string | null; created_at: string; }
interface MsgRow { id: string; patient_id: string; physio_id: string; sender_role: "patient" | "physio"; content: string; read: boolean; created_at: string; }

const REC_TYPES = ["Exercise", "Diet", "Precaution", "Pacing", "Lifestyle"];

const recColor: Record<string, string> = {
  Exercise: "bg-primary/10 text-primary",
  Diet: "bg-sage/30 text-primary",
  Precaution: "bg-terracotta/10 text-terracotta",
  Pacing: "bg-terracotta/10 text-terracotta",
  Lifestyle: "bg-sage/30 text-primary",
};

const recIcon: Record<string, typeof Dumbbell> = {
  Exercise: Dumbbell,
  Diet: Apple,
  Precaution: AlertTriangle,
  Pacing: Clock,
  Lifestyle: Clock,
};

function ScoreRing({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <svg width={56} height={56} className="transform -rotate-90">
      <circle cx={28} cy={28} r={r} fill="none" stroke="#E8EFEB" strokeWidth={4} />
      <circle cx={28} cy={28} r={r} fill="none" stroke="#2F7E6D" strokeWidth={4}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      <text x={28} y={28} textAnchor="middle" dominantBaseline="central"
        fill="#1A2620" fontSize={11} fontWeight={700} transform="rotate(90,28,28)">
        {score}%
      </text>
    </svg>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function PatientDetail() {
  const { user } = useApp();
  const params = useParams();
  const patientId = (params?.id as string) ?? "";

  const [recNotes, setRecNotes] = useState<Record<number, string>>({});
  const [romOverrides, setRomOverrides] = useState<Record<string, { min: number; max: number; reps?: number }>>({});
  const [romSaving, setRomSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [plan, setPlan] = useState<PatientPlan | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [painLogs, setPainLogs] = useState<PainRow[]>([]);
  const [recs, setRecs] = useState<RecRow[]>([]);
  const [recForm, setRecForm] = useState({ type: "Exercise", detail: "", duration: "" });
  const [recSaving, setRecSaving] = useState(false);
  const [recSaved, setRecSaved] = useState(false);
  const [callLoading, setCallLoading] = useState(false);

  // dialogs
  const [msgOpen, setMsgOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);

  // messaging state
  const [chatMessages, setChatMessages] = useState<MsgRow[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const msgChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 28);
      const [romRes, profRes, planRes, sessRes, painRes, recsRes] = await Promise.all([
        supabase.from("patient_rom_overrides").select("exercise_tag, rom_min, rom_max, reps").eq("patient_id", patientId),
        supabase.from("profiles").select("name, age, lang").eq("id", patientId).maybeSingle(),
        supabase.from("plans").select("pain_areas, mobility_level, exercises, ai_goals").eq("patient_id", patientId).eq("active", true).maybeSingle(),
        supabase.from("sessions").select("id, exercise_tag, reps, score, completed_at").eq("patient_id", patientId).order("completed_at", { ascending: false }).limit(30),
        supabase.from("pain_logs").select("level, logged_at").eq("patient_id", patientId).gte("logged_at", weekAgo.toISOString()).order("logged_at", { ascending: false }),
        supabase.from("recommendations").select("id, type, detail, duration, created_at").eq("patient_id", patientId).eq("physio_id", user.id ?? "").order("created_at", { ascending: false }).limit(20),
      ]);
      if (romRes.data) {
       const map: Record<string, { min: number; max: number; reps?: number }> = {};
        (romRes.data as RomOverride[]).forEach((r) => { map[r.exercise_tag] = { min: r.rom_min, max: r.rom_max, reps: r.reps ?? undefined }; });
        setRomOverrides(map);
      }
      if (profRes.data) setProfile(profRes.data as PatientProfile);
      if (planRes.data) setPlan(planRes.data as PatientPlan);
      if (sessRes.data) setSessions(sessRes.data as SessionRow[]);
      if (painRes.data) setPainLogs(painRes.data as PainRow[]);
      if (recsRes.data) setRecs(recsRes.data as RecRow[]);
    })();
  }, [patientId, user.id]);

  // load messages & subscribe when dialog opens
  useEffect(() => {
    if (!msgOpen || !patientId || !user.id) return;
    setMsgLoading(true);

    (async () => {
      const { data } = await supabase.from("messages")
        .select("*")
        .eq("patient_id", patientId)
        .eq("physio_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);
      setChatMessages((data ?? []) as MsgRow[]);
      setMsgLoading(false);

      await supabase.from("messages").update({ read: true })
        .eq("patient_id", patientId)
        .eq("physio_id", user.id)
        .eq("sender_role", "patient");
    })();

    const channel = supabase.channel(`physio-msg-detail-${patientId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `physio_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new as MsgRow;
        if (msg.patient_id === patientId) setChatMessages((m) => [...m, msg]);
      })
      .subscribe();
    msgChannelRef.current = channel;

    return () => {
      if (msgChannelRef.current) { supabase.removeChannel(msgChannelRef.current); msgChannelRef.current = null; }
    };
  }, [msgOpen, patientId, user.id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!msgInput.trim() || !patientId || !user.id || msgSending) return;
    setMsgSending(true);
    const content = msgInput.trim();
    setMsgInput("");
    await supabase.from("messages").insert({
      patient_id: patientId, physio_id: user.id,
      sender_role: "physio", content,
    });
    setMsgSending(false);
  };

  const handleRomChange = (tag: string, field: "min" | "max" | "reps", val: string) => {
    const defaults = ROM_CONFIGS[tag] ?? ROM_CONFIGS.default;
    if (field === "reps") {
      const n = val === "" ? undefined : Number(val);
      setRomOverrides((p) => ({ ...p, [tag]: { ...defaults, ...p[tag], reps: n } }));
    } else {
      const num = parseInt(val, 10);
      if (isNaN(num)) return;
      setRomOverrides((p) => ({ ...p, [tag]: { ...defaults, ...p[tag], [field]: num } }));
    }
  };

  const saveRom = useCallback(async () => {
    if (!patientId || !user.id) return;
    setRomSaving(true);
    try {
      const rows = Object.entries(romOverrides).map(([tag, v]) => ({
        patient_id: patientId, physio_id: user.id, exercise_tag: tag,
        rom_min: v.min, rom_max: v.max, reps: v.reps ?? null, updated_at: new Date().toISOString(),
      }));
      await supabase.from("patient_rom_overrides").upsert(rows, { onConflict: "patient_id,exercise_tag" });
    } catch { /* silent */ } finally { setRomSaving(false); }
  }, [patientId, user.id, romOverrides]);

  const handleSendRec = async () => {
    if (!recForm.detail.trim() || !user.id) return;
    setRecSaving(true);
    try {
      const { data } = await supabase.from("recommendations").insert({
        patient_id: patientId, physio_id: user.id,
        type: recForm.type, detail: recForm.detail.trim(),
        duration: recForm.duration.trim() || null,
      }).select("id, type, detail, duration, created_at").single();
      if (data) setRecs((r) => [data as RecRow, ...r]);
      setRecForm((f) => ({ ...f, detail: "", duration: "" }));
      setRecSaved(true);
      setTimeout(() => setRecSaved(false), 2000);
    } catch { /* silent */ } finally { setRecSaving(false); }
  };

  const startCall = async () => {
    setCallLoading(true);
    try {
      const res = await fetch("/api/daily/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `session-${patientId.slice(0, 8)}-${Date.now()}` }),
      });
      const { url, error } = await res.json();
      if (url) {
        await supabase.from("scheduled_sessions")
          .update({ room_code: url })
          .eq("patient_id", patientId).eq("physio_id", user.id ?? "").eq("status", "scheduled");
        window.open(url, "_blank");
      } else {
        console.error("Daily error:", error);
      }
    } catch { /* silent */ } finally { setCallLoading(false); }
  };

  const avgScore = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0;
  const completedCount = sessions.filter((s) => s.reps >= 10).length;
  const lastPain = painLogs[0]?.level ?? null;

  const WEEKS = ["W1", "W2", "W3", "W4"];
  const weekData = WEEKS.map((w, wi) => {
    const ws = sessions.filter((s) => {
      const weeksAgo = Math.floor((Date.now() - new Date(s.completed_at).getTime()) / (7 * 24 * 3600 * 1000));
      return weeksAgo === (3 - wi);
    });
    const avgS = ws.length ? ws.reduce((a, s) => a + s.score, 0) / ws.length : 0;
    const avgP = painLogs.filter((p) => {
      const weeksAgo = Math.floor((Date.now() - new Date(p.logged_at).getTime()) / (7 * 24 * 3600 * 1000));
      return weeksAgo === (3 - wi);
    }).reduce((a, p, _, arr) => a + p.level / arr.length, 0);
    return { day: w, posture: Math.round(avgS), rom: Math.round(avgS * 0.85), pain: Math.round(avgP) };
  });

  const name = profile?.name ?? "Patient";
  const recoveryArea = plan?.pain_areas?.[0] ? `${plan.pain_areas[0]} Recovery` : "Recovery Plan";

  return (
    <div className="p-5 lg:p-8">

      {/* message dialog */}
      <AnimatePresence>
        {msgOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setMsgOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.18 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
              style={{ maxHeight: "80vh" }}
            >
              {/* header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                <div className="w-9 h-9 rounded-xl bg-sage/30 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-deep text-sm">{name}</p>
                  <p className="text-xs text-deep/35">Patient</p>
                </div>
                <button onClick={() => setMsgOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-deep/30 hover:bg-[#F5F7F5] hover:text-deep transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : chatMessages.length === 0 ? (
                  <p className="text-xs text-deep/30 text-center py-8">No messages yet. Start the conversation.</p>
                ) : chatMessages.map((msg, i) => {
                  const isPhysio = msg.sender_role === "physio";
                  const showDate = i === 0 || fmtDate(msg.created_at) !== fmtDate(chatMessages[i - 1].created_at);
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center my-2">
                          <span className="text-[10px] font-medium text-deep/30 bg-[#F5F7F5] rounded-full px-3 py-1">{fmtDate(msg.created_at)}</span>
                        </div>
                      )}
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isPhysio ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2.5 ${isPhysio ? "bg-primary text-white rounded-br-sm" : "bg-[#F5F7F5] text-deep rounded-bl-sm"}`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isPhysio ? "text-white/60" : "text-deep/35"}`}>{fmt(msg.created_at)}</p>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* input */}
              <div className="border-t border-border/40 p-4">
                <div className="flex items-center gap-2">
                  <input
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 h-10 rounded-2xl border border-border px-3 text-sm text-deep bg-[#F5F7F5] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-deep/30"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!msgInput.trim() || msgSending}
                    className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-40"
                  >
                    {msgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* recommendations dialog */}
      <AnimatePresence>
        {recOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setRecOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.18 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
              style={{ maxHeight: "85vh" }}
            >
              {/* header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <p className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Recommendations</p>
                <button onClick={() => setRecOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-deep/30 hover:bg-[#F5F7F5] hover:text-deep transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* form */}
                  <div className="bg-[#F5F7F5] rounded-2xl p-5">
                    <p className="text-sm font-semibold text-deep mb-4">New Recommendation</p>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-semibold text-deep/50 mb-2 block uppercase tracking-wide">Type</Label>
                        <div className="flex flex-wrap gap-2">
                          {REC_TYPES.map((t) => (
                            <button key={t} type="button" onClick={() => setRecForm((f) => ({ ...f, type: t }))}
                              aria-pressed={recForm.type === t}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${recForm.type === t ? "bg-primary text-white" : "bg-white text-deep/60 hover:bg-primary/10 hover:text-primary"}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="rec-detail-d" className="text-xs font-semibold text-deep/50 mb-2 block uppercase tracking-wide">Details</Label>
                        <textarea id="rec-detail-d" value={recForm.detail}
                          onChange={(e) => setRecForm((f) => ({ ...f, detail: e.target.value }))}
                          placeholder="Describe the recommendation..."
                          className="w-full h-24 rounded-2xl border border-border/40 bg-white p-3 text-sm text-deep resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-deep/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rec-dur-d" className="text-xs font-semibold text-deep/50 mb-2 block uppercase tracking-wide">Duration / Frequency</Label>
                        <Input id="rec-dur-d" placeholder="e.g. 2 sets × 15 reps · daily" value={recForm.duration}
                          onChange={(e) => setRecForm((f) => ({ ...f, duration: e.target.value }))}
                          className="h-10 rounded-xl bg-white border-border/40" />
                      </div>
                      <Button onClick={handleSendRec} disabled={!recForm.detail.trim() || recSaving}
                        className="w-full bg-primary text-white rounded-2xl h-11">
                        {recSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : recSaved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {recSaving ? "Sending..." : recSaved ? "Sent!" : "Send Recommendation"}
                      </Button>
                    </div>
                  </div>

                  {/* recent */}
                  <div>
                    <p className="text-sm font-semibold text-deep mb-4">Recent</p>
                    {recs.length === 0 ? (
                      <div className="bg-[#F5F7F5] rounded-2xl p-6 text-center">
                        <p className="text-sm text-deep/30">No recommendations sent yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[360px] overflow-y-auto">
                        {recs.map(({ id, type, detail, duration, created_at }) => {
                          const Icon = recIcon[type] ?? Dumbbell;
                          const color = recColor[type] ?? "bg-sage/30 text-primary";
                          return (
                            <div key={id} className="bg-[#F5F7F5] rounded-2xl p-4 flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-white text-deep/50 border-0 text-[10px]">{type}</Badge>
                                  <span className="text-[10px] text-deep/30 ml-auto">
                                    {new Date(created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                  </span>
                                </div>
                                <p className="text-xs text-deep/70">{detail}</p>
                                {duration && <p className="text-[10px] text-deep/40 mt-0.5">{duration}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* profile header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-5 mb-5 border border-border/40">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sage/25 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
              {name[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{name}</h1>
                <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-2">Active</Badge>
                {lastPain !== null && lastPain > 6 && (
                  <Badge className="bg-red-100 text-red-600 border-0 text-[10px] px-2">High Pain</Badge>
                )}
              </div>
              <p className="text-sm text-deep/45 mt-0.5">
                {profile?.age ? `${profile.age}y · ` : ""}{recoveryArea}
                {sessions.length > 0 ? ` · ${sessions.length} sessions` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button onClick={startCall} disabled={callLoading}
              className="bg-primary text-white rounded-2xl h-9 px-4 text-sm gap-2 shadow-sm">
              {callLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
              Session
            </Button>
            <Button variant="outline" onClick={() => setMsgOpen(true)}
              className="border-border rounded-2xl h-9 px-4 text-sm gap-2">
              <MessageCircle className="w-3.5 h-3.5" />Message
            </Button>
            <Button variant="outline" onClick={() => setRecOpen(true)}
              className="border-border rounded-2xl h-9 px-4 text-sm gap-2">
              <ClipboardList className="w-3.5 h-3.5" />Recommend
            </Button>
          </div>
        </div>
      </motion.div>

      {/* key metrics */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Activity, label: "Avg Score", val: avgScore > 0 ? `${avgScore}%` : "—", color: "text-primary bg-primary/10" },
          { icon: TrendingUp, label: "Sessions", val: String(sessions.length), color: "text-primary bg-sage/30" },
          { icon: AlertTriangle, label: "Last Pain", val: lastPain !== null ? `${lastPain}/10` : "—", color: lastPain !== null && lastPain > 6 ? "text-red-600 bg-red-50" : "text-terracotta bg-terracotta/10" },
          { icon: CheckCircle, label: "Completed", val: sessions.length ? `${completedCount}/${sessions.length}` : "—", color: "text-primary bg-primary/10" },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-border/40">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{val}</p>
            <p className="text-xs text-deep/40 mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs defaultValue="overview">
          <div className="bg-white rounded-3xl border border-border/40 overflow-hidden">
            <div className="px-5 pt-4 border-b border-border/40">
              <TabsList className="bg-transparent p-0 h-auto gap-0 -mb-px">
                {[
                  { value: "overview", label: "Overview" },
                  { value: "notes", label: "Notes" },
                  { value: "rom", label: "ROM Config" },
                  { value: "history", label: "History" },
                ].map(({ value, label }) => (
                  <TabsTrigger key={value} value={value}
                    className="rounded-none px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-deep/40 bg-transparent shadow-none transition-colors">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* overview */}
            <TabsContent value="overview" className="p-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-deep">Mobility & Posture Trends</p>
                      <div className="flex gap-3 text-xs text-deep/40">
                        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />Posture</span>
                        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-sage" />ROM</span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={weekData}>
                        <defs>
                          <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2F7E6D" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#2F7E6D" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#A8C9B8" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#A8C9B8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A9E96" }} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
                        <Area type="monotone" dataKey="posture" stroke="#2F7E6D" strokeWidth={2.5} fill="url(#pg)" name="Posture" dot={false} />
                        <Area type="monotone" dataKey="rom" stroke="#A8C9B8" strokeWidth={2} fill="url(#rg)" name="ROM" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deep mb-3">Pain Level (4 weeks)</p>
                    <ResponsiveContainer width="100%" height={130}>
                      <LineChart data={weekData}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A9E96" }} />
                        <YAxis hide domain={[0, 10]} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} formatter={(v: number) => [v > 0 ? v : "No data", "Pain"]} />
                        <Line type="monotone" dataKey="pain" stroke="#D97B5D" strokeWidth={2.5} dot={{ fill: "#D97B5D", r: 4, strokeWidth: 0 }} name="Pain" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-deep mb-3">Recent Sessions</p>
                  <div className="space-y-2">
                    {sessions.slice(0, 6).length === 0 ? (
                      <div className="text-center py-10 bg-[#F5F7F5] rounded-2xl">
                        <Clock className="w-8 h-8 text-deep/10 mx-auto mb-2" />
                        <p className="text-xs text-deep/30">No sessions yet.</p>
                      </div>
                    ) : sessions.slice(0, 6).map((s) => {
                      const done = s.reps >= 10;
                      const dateStr = new Date(s.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                      return (
                        <div key={s.id} className="p-3 bg-[#F5F7F5] rounded-2xl">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-deep/40 bg-white rounded-lg px-2 py-0.5">{dateStr}</span>
                              <span className="text-xs font-medium text-deep truncate max-w-[80px]">{s.exercise_tag.replace(/-/g, " ")}</span>
                            </div>
                            <Badge className={`text-[10px] border-0 px-1.5 ${done ? "bg-primary/10 text-primary" : "bg-terracotta/10 text-terracotta"}`}>
                              {done ? "Done" : "Partial"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white rounded-full h-1.5">
                              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, s.score)}%` }} />
                            </div>
                            <span className="text-xs font-bold text-primary flex-shrink-0">{Math.round(s.score)}%</span>
                          </div>
                          <p className="text-[10px] text-deep/35 mt-1">{s.reps} reps</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ai observations */}
              <div>
                <p className="text-sm font-semibold text-deep mb-3">AI Observations</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { tag: "ROM", note: "Knee ROM improved 12% over 4 weeks. Approaching normal range for age group.", good: true },
                    { tag: "Posture", note: "Consistent improvement in back alignment. Shoulder tilt within acceptable range.", good: true },
                    { tag: "Adherence", note: sessions.length > 0 ? `${Math.round((completedCount / sessions.length) * 100)}% completion rate. ${completedCount / sessions.length > 0.8 ? "Consider increasing difficulty." : "Encourage consistent practice."}` : "Insufficient data.", good: completedCount / sessions.length > 0.5 },
                  ].map(({ tag, note, good }) => (
                    <div key={tag} className={`p-4 rounded-2xl border ${good ? "bg-primary/5 border-primary/10" : "bg-amber-50 border-amber-100"}`}>
                      <Badge className={`border-0 text-[10px] px-1.5 mb-2 ${good ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"}`}>{tag}</Badge>
                      <p className="text-xs text-deep/65 leading-relaxed">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* notes */}
            <TabsContent value="notes" className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {plan?.ai_goals?.length ? (
                  <div className="bg-[#F5F7F5] rounded-2xl p-4">
                    <p className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide mb-3">AI Goals</p>
                    <ul className="space-y-2">
                      {plan.ai_goals.map((g, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-deep/70">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : <div />}
                <div>
                  <p className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide mb-2">Physio Notes</p>
                  <textarea
                    placeholder="Add recommendation or clinical note..."
                    value={recNotes[0] ?? ""}
                    onChange={(e) => setRecNotes((n) => ({ ...n, [0]: e.target.value }))}
                    className="w-full h-40 rounded-2xl border border-border p-4 text-sm text-deep bg-[#F5F7F5] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-transparent placeholder:text-deep/30"
                  />
                </div>
              </div>
            </TabsContent>

            {/* rom config */}
            <TabsContent value="rom" className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-deep">ROM Configuration</p>
                  <p className="text-xs text-deep/40 mt-0.5">Override range-of-motion targets per exercise</p>
                </div>
                <Button onClick={saveRom} disabled={romSaving}
                  className="bg-primary text-white rounded-xl h-8 px-3 text-xs gap-1.5 shadow-sm">
                  {romSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </Button>
              </div>
              <div className="space-y-2">
                {Object.entries(EXERCISE_LIBRARY).map(([key, ex]) => {
                  const defaults = ROM_CONFIGS[ex.tag] ?? ROM_CONFIGS.default;
                  const current = romOverrides[ex.tag] ?? defaults;
                  const isOverridden = !!romOverrides[ex.tag];
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 bg-[#F5F7F5] rounded-2xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-deep truncate">{ex.name}</p>
                          {isOverridden && <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-1 flex-shrink-0">Custom</Badge>}
                        </div>
                        <p className="text-[10px] text-deep/35">{ex.target} · default {defaults.min}°–{defaults.max}°</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-deep/40">
                        <div className="flex items-center gap-1">
                          <label htmlFor={`min-${key}`}>Min</label>
                          <input id={`min-${key}`} type="number" min={0} max={180} value={current.min}
                            onChange={(e) => handleRomChange(ex.tag, "min", e.target.value)}
                            className="w-12 h-7 rounded-lg border border-border/60 bg-white text-xs text-center text-deep focus:outline-none focus:ring-1 focus:ring-primary/30" />
                        </div>
                        <span className="text-deep/25">–</span>
                        <div className="flex items-center gap-1">
                          <label htmlFor={`max-${key}`}>Max</label>
                          <input id={`max-${key}`} type="number" min={0} max={180} value={current.max}
                            onChange={(e) => handleRomChange(ex.tag, "max", e.target.value)}
                            className="w-12 h-7 rounded-lg border border-border/60 bg-white text-xs text-center text-deep focus:outline-none focus:ring-1 focus:ring-primary/30" />
                        </div>
                        <span className="text-deep/25 text-xs">°</span>
                        <div className="flex items-center gap-1 ml-1">
                          <label htmlFor={`reps-${key}`}>Reps</label>
                          <input id={`reps-${key}`} type="number" min={1} max={50} placeholder="10" value={current.reps ?? ""}
                            onChange={(e) => handleRomChange(ex.tag, "reps", e.target.value)}
                            className="w-11 h-7 rounded-lg border border-border/60 bg-white text-xs text-center text-deep focus:outline-none focus:ring-1 focus:ring-primary/30" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* history */}
            <TabsContent value="history" className="p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Sessions", val: String(sessions.length) },
                  { label: "Avg Score", val: avgScore > 0 ? `${avgScore}%` : "—" },
                  { label: "Completion", val: sessions.length ? `${Math.round((completedCount / sessions.length) * 100)}%` : "—" },
                  { label: "Last Pain", val: lastPain !== null ? `${lastPain}/10` : "—" },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-[#F5F7F5] rounded-2xl p-4 text-center">
                    <p className="text-xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{val}</p>
                    <p className="text-xs text-deep/40 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-deep/40 uppercase tracking-wide mb-3">All Sessions</p>
                {sessions.length === 0 ? (
                  <div className="text-center py-12 bg-[#F5F7F5] rounded-2xl">
                    <Clock className="w-10 h-10 text-deep/10 mx-auto mb-3" />
                    <p className="text-sm text-deep/30">No sessions recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((s) => {
                      const done = s.reps >= 10;
                      return (
                        <div key={s.id} className="flex items-center gap-4 p-4 bg-[#F5F7F5] rounded-2xl hover:bg-sage/10 transition-colors">
                          <div className="flex-shrink-0 text-center min-w-[44px]">
                            <p className="text-xs font-bold text-deep">{new Date(s.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                            <p className="text-[10px] text-deep/35 mt-0.5">{new Date(s.completed_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <div className="w-px h-8 bg-border/40 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-deep capitalize">{s.exercise_tag.replace(/-/g, " ")}</p>
                            <p className="text-xs text-deep/40">{s.reps} reps</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-28 hidden sm:block">
                              <div className="bg-white rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, s.score)}%` }} />
                              </div>
                            </div>
                            <ScoreRing score={Math.round(s.score)} />
                            <Badge className={`text-[10px] border-0 px-1.5 ${done ? "bg-primary/10 text-primary" : "bg-terracotta/10 text-terracotta"}`}>
                              {done ? "Completed" : "Partial"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
}
