"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Clock, Calendar, Plus, X, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface ScheduledSession {
  id: string;
  patient_id: string;
  datetime: string;
  type: string;
  status: "upcoming" | "scheduled" | "completed" | "cancelled";
  room_code: string | null;
  notes: string | null;
  profiles: { name: string } | null;
}

type FilterTab = "Today" | "Tomorrow" | "This Week";

const STATUS_STYLE: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary",
  scheduled: "bg-muted text-deep/50",
  completed: "bg-sage/30 text-primary",
  cancelled: "bg-red-100 text-red-500",
};

const SESSION_TYPES = ["Video Consultation", "Live Posture Review", "Progress Review", "Initial Assessment"];

function fmt(iso: string) {
  const d = new Date(iso);
  return {
    time: d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    date: d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }),
  };
}

function filterSessions(sessions: ScheduledSession[], tab: FilterTab): ScheduledSession[] {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const weekEnd = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7);

  return sessions.filter((s) => {
    const d = new Date(s.datetime);
    if (tab === "Today") return d >= todayStart && d < todayEnd;
    if (tab === "Tomorrow") return d >= todayEnd && d < tomorrowEnd;
    return d >= todayStart && d < weekEnd;
  });
}

export default function Sessions() {
  const { user } = useApp();
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("Today");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    datetime: "",
    type: SESSION_TYPES[0],
    notes: "",
  });

  useEffect(() => {
    if (!user.id) { setLoading(false); return; }
    loadData();
  }, [user.id]);

  const loadData = async () => {
    const { supabase } = await import("@/lib/supabaseClient");
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 1);
    const weekFwd = new Date(); weekFwd.setDate(weekFwd.getDate() + 7);

    const [sessRes, planRes] = await Promise.all([
      supabase
        .from("scheduled_sessions")
        .select("id, patient_id, datetime, type, status, room_code, notes, profiles!patient_id(name)")
        .eq("physio_id", user.id)
        .gte("datetime", weekAgo.toISOString())
        .lte("datetime", weekFwd.toISOString())
        .order("datetime", { ascending: true }),
      supabase
        .from("plans")
        .select("patient_id, profiles!patient_id(name)")
        .eq("physio_id", user.id)
        .eq("active", true),
    ]);

    setSessions((sessRes.data ?? []) as unknown as ScheduledSession[]);
    setPatients(
      ((planRes.data ?? []) as unknown as Array<{ patient_id: string; profiles: { name: string } | null }>)
        .map((p) => ({ id: p.patient_id, name: p.profiles?.name ?? "Patient" }))
    );
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.patient_id || !form.datetime || !user.id) return;
    setSaving(true);
    try {
      const { supabase } = await import("@/lib/supabaseClient");
      const roomCode = `${Math.random().toString(36).slice(2, 5).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await supabase.from("scheduled_sessions").insert({
        patient_id: form.patient_id,
        physio_id: user.id,
        datetime: form.datetime,
        type: form.type,
        status: "scheduled",
        room_code: roomCode,
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm({ patient_id: "", datetime: "", type: SESSION_TYPES[0], notes: "" });
      await loadData();
    } catch { /* fail silently */ } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: string) => {
    const { supabase } = await import("@/lib/supabaseClient");
    await supabase.from("scheduled_sessions").update({ status: "cancelled" }).eq("id", id);
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: "cancelled" } : s));
  };

  const filtered = filterSessions(sessions, filter);
  const todayCount = filterSessions(sessions, "Today").length;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Sessions</h1>
          <p className="text-deep/50 text-sm mt-1">{todayCount} session{todayCount !== 1 ? "s" : ""} today</p>
        </div>
        <Button className="bg-primary text-white rounded-full" onClick={() => setShowForm(true)} aria-label="Schedule new session">
          <Plus className="w-4 h-4 mr-2" aria-hidden />Schedule
        </Button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl p-6 mb-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>New Session</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} aria-label="Close form" className="h-8 w-8 p-0">
                <X className="w-4 h-4" aria-hidden />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-deep mb-2 block">Patient</Label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
                  aria-label="Select patient"
                  className="w-full h-11 rounded-2xl border border-border px-3 text-sm bg-cream focus:outline-none focus:border-primary"
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-semibold text-deep mb-2 block">Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.datetime}
                  onChange={(e) => setForm((f) => ({ ...f, datetime: e.target.value }))}
                  aria-label="Session date and time"
                  className="h-11 rounded-2xl bg-cream border-0 focus:border-primary"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-deep mb-2 block">Type</Label>
                <div className="flex flex-wrap gap-2">
                  {SESSION_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      aria-pressed={form.type === t}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.type === t ? "bg-primary text-white" : "bg-cream text-deep/60 hover:bg-primary/10 hover:text-primary"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-deep mb-2 block">Notes (optional)</Label>
                <Input
                  placeholder="Session notes..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="h-11 rounded-2xl bg-cream border-0"
                />
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!form.patient_id || !form.datetime || saving}
              className="mt-4 bg-primary text-white rounded-2xl h-11 w-full"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden /> : null}
              {saving ? "Scheduling..." : "Create Session"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 mb-6" role="tablist" aria-label="Filter sessions">
        {(["Today", "Tomorrow", "This Week"] as FilterTab[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? "bg-primary text-white" : "bg-white text-deep/50 hover:bg-sage/20"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center">
          <Calendar className="w-10 h-10 text-deep/10 mx-auto mb-3" aria-hidden />
          <p className="text-sm text-deep/30">No sessions for {filter.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="space-y-4" role="tabpanel">
          {filtered.map((s, i) => {
            const { time, date } = fmt(s.datetime);
            const name = s.profiles?.name ?? "Patient";
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-primary" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-deep text-sm" style={{ fontFamily: "var(--font-poppins)" }}>{name}</p>
                    <Badge className={`border-0 text-xs ${STATUS_STYLE[s.status]}`}>{s.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-deep/50 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden />{time}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden />{date}</span>
                    <span>{s.type}</span>
                    {s.room_code && <span className="font-mono bg-cream px-1.5 py-0.5 rounded">{s.room_code}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {s.status === "upcoming" && (
                    <Button className="bg-primary text-white rounded-full px-4 h-8 text-xs">Join</Button>
                  )}
                  {(s.status === "scheduled" || s.status === "upcoming") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(s.id)}
                      aria-label="Cancel session"
                      className="text-deep/30 hover:text-red-500 h-8 w-8 p-0"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
