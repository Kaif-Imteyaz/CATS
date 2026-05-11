"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Apple, AlertCircle, Clock, Plus, Check, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface RecRow {
  id: string;
  patient_id: string;
  type: string;
  detail: string;
  duration: string | null;
  created_at: string;
  profiles: { name: string } | null;
}

const TYPES = ["Exercise", "Diet", "Precaution", "Pacing", "Lifestyle"];

const typeIcon: Record<string, typeof Dumbbell> = {
  Exercise: Dumbbell,
  Diet: Apple,
  Precaution: AlertCircle,
  Pacing: Clock,
  Lifestyle: Clock,
};

const typeColor: Record<string, string> = {
  Exercise: "bg-primary/10 text-primary",
  Diet: "bg-sage/30 text-primary",
  Precaution: "bg-terracotta/10 text-terracotta",
  Pacing: "bg-terracotta/10 text-terracotta",
  Lifestyle: "bg-sage/30 text-primary",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function Recommendations() {
  const { user } = useApp();
  const [existing, setExisting] = useState<RecRow[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    type: TYPES[0],
    detail: "",
    duration: "",
  });

  useEffect(() => {
    if (!user.id) { setLoading(false); return; }
    loadData();
  }, [user.id]);

  const loadData = async () => {
    const { supabase } = await import("@/lib/supabaseClient");
    const [recRes, planRes] = await Promise.all([
      supabase
        .from("recommendations")
        .select("id, patient_id, type, detail, duration, created_at, profiles!patient_id(name)")
        .eq("physio_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("plans")
        .select("patient_id, profiles!patient_id(name)")
        .eq("physio_id", user.id)
        .eq("active", true),
    ]);

    setExisting((recRes.data ?? []) as unknown as RecRow[]);
    setPatients(
      ((planRes.data ?? []) as unknown as Array<{ patient_id: string; profiles: { name: string } | null }>)
        .map((p) => ({ id: p.patient_id, name: p.profiles?.name ?? "Patient" }))
    );
    setLoading(false);
  };

  const handleSend = async () => {
    if (!form.patient_id || !form.detail.trim() || !user.id) return;
    setSaving(true);
    try {
      const { supabase } = await import("@/lib/supabaseClient");
      await supabase.from("recommendations").insert({
        patient_id: form.patient_id,
        physio_id: user.id,
        type: form.type,
        detail: form.detail.trim(),
        duration: form.duration.trim() || null,
      });
      setSaved(true);
      setForm((f) => ({ ...f, detail: "", duration: "" }));
      await loadData();
      setTimeout(() => setSaved(false), 2000);
    } catch { /* fail silently */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Recommendations</h1>
        <p className="text-deep/50 text-sm mt-1">Prescribe exercises, diet, and recovery instructions</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6"
        >
          <h3 className="font-bold text-deep mb-4" style={{ fontFamily: "var(--font-poppins)" }}>New Recommendation</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-deep mb-2 block">Patient</Label>
              {loading ? (
                <div className="h-11 bg-cream rounded-2xl animate-pulse" />
              ) : (
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
              )}
            </div>

            <div>
              <Label className="text-sm font-semibold text-deep mb-2 block">Type</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Recommendation type">
                {TYPES.map((t) => (
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
              <Label htmlFor="rec-detail" className="text-sm font-semibold text-deep mb-2 block">Details</Label>
              <textarea
                id="rec-detail"
                value={form.detail}
                onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
                placeholder="Describe the recommendation..."
                aria-label="Recommendation details"
                className="w-full h-24 rounded-2xl border border-border p-3 text-sm text-deep bg-cream resize-none focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <Label htmlFor="rec-duration" className="text-sm font-semibold text-deep mb-2 block">Duration / Frequency</Label>
              <Input
                id="rec-duration"
                placeholder="e.g. 2 sets × 15 reps · daily"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                className="h-11 rounded-2xl bg-cream border-0"
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={!form.patient_id || !form.detail.trim() || saving}
              aria-label="Send recommendation to patient"
              className="w-full bg-primary text-white rounded-2xl h-12"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
              ) : saved ? (
                <Check className="w-4 h-4 mr-2" aria-hidden />
              ) : (
                <Plus className="w-4 h-4 mr-2" aria-hidden />
              )}
              {saving ? "Sending..." : saved ? "Sent!" : "Send Recommendation"}
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="font-bold text-deep mb-4" style={{ fontFamily: "var(--font-poppins)" }}>Recent</h3>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
            </div>
          ) : existing.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="text-sm text-deep/30">No recommendations sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {existing.map(({ id, type, detail, duration, created_at, profiles }) => {
                const Icon = typeIcon[type] ?? Dumbbell;
                const color = typeColor[type] ?? "bg-sage/30 text-primary";
                const patName = profiles?.name ?? "Patient";
                return (
                  <div key={id} className="bg-white rounded-2xl p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-deep text-sm truncate">{patName}</p>
                        <Badge className="bg-muted text-deep/50 border-0 text-xs flex-shrink-0">{type}</Badge>
                        <span className="text-xs text-deep/30 ml-auto flex-shrink-0">{fmt(created_at)}</span>
                      </div>
                      <p className="text-xs text-deep/60 truncate">{detail}</p>
                      {duration && <p className="text-xs text-deep/40 mt-0.5">{duration}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
