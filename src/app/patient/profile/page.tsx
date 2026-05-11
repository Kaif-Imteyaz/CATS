"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Loader2, Eye, EyeOff, Pencil } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import type { VoicePersona, Lang } from "@/context/AppContext";

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

interface ProfileRow {
  label: string;
  value: string | null | undefined;
}

function Field({ label, value }: ProfileRow) {
  return (
    <div className="bg-sage/10 rounded-2xl p-3">
      <p className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-bold ${value ? "text-deep" : "text-deep/30 italic"}`}>{value || "—"}</p>
    </div>
  );
}

const PERSONAS: { id: VoicePersona; name: string; desc: string }[] = [
  { id: "april", name: "April", desc: "Warm · Gentle · Female" },
  { id: "kai", name: "Kai", desc: "Calm · Professional · Male" },
];

const PAIN_OPTIONS = ["Shoulder", "Knee", "Lower Back", "Hip", "Neck", "Ankle", "Wrist", "Full Body"];
const LANG_OPTIONS: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "hi", label: "हि" },
  { id: "ur", label: "اُر" },
];
const langLabel: Record<string, string> = { en: "English", hi: "हिन्दी", ur: "اردو" };
const today = new Date().toISOString().split("T")[0];

export default function PatientProfile() {
  const { user, config, setLang, setCultureMode, toggleElder, toggleHighContrast, setFontSize, setVoicePersona } = useApp();

  const [data, setData] = useState({
    name: "",
    email: "",
    patient_code: "",
    dob: "",
    age: null as number | null,
    sex: "",
    region: "",
    lang: "",
    pain_areas: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  // Personal info edit state
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ dob: "", sex: "", region: "", lang: "" });
  const [infoSaving, setInfoSaving] = useState(false);

  // Pain areas edit state
  const [editingPain, setEditingPain] = useState(false);
  const [localPainAreas, setLocalPainAreas] = useState<string[]>([]);
  const [painSaving, setPainSaving] = useState(false);

  // Password state
  const [pwd, setPwd] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!user.id) return;
    (async () => {
      const [profileRes, authRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, dob, age, sex, region, lang, pain_areas, patient_code")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.auth.getUser(),
      ]);
      const p = profileRes.data;
      const computedAge = p?.dob ? calcAge(p.dob) : (p?.age ?? null);
      setData({
        name: p?.name ?? "",
        email: authRes.data.user?.email ?? "",
        patient_code: p?.patient_code ?? "",
        dob: p?.dob ?? "",
        age: computedAge,
        sex: p?.sex ?? "",
        region: p?.region ?? "",
        lang: p?.lang ?? "",
        pain_areas: p?.pain_areas ?? [],
      });
      setLoading(false);
    })();
  }, [user.id]);

  const startEditInfo = () => {
    setInfoForm({ dob: data.dob, sex: data.sex, region: data.region, lang: data.lang || config.lang });
    setEditingInfo(true);
  };

  const saveInfo = async () => {
    setInfoSaving(true);
    await supabase.from("profiles")
      .update({
        dob: infoForm.dob || null,
        sex: infoForm.sex || null,
        region: infoForm.region || null,
        lang: infoForm.lang || null,
      })
      .eq("id", user.id);
    const newAge = infoForm.dob ? calcAge(infoForm.dob) : data.age;
    setData(prev => ({ ...prev, dob: infoForm.dob, sex: infoForm.sex, region: infoForm.region, lang: infoForm.lang, age: newAge }));
    if (infoForm.lang && infoForm.lang !== config.lang) setLang(infoForm.lang as Lang);
    setInfoSaving(false);
    setEditingInfo(false);
  };

  const savePainAreas = async () => {
    setPainSaving(true);
    await supabase.from("profiles").update({ pain_areas: localPainAreas }).eq("id", user.id);
    setData(prev => ({ ...prev, pain_areas: localPainAreas }));
    setPainSaving(false);
    setEditingPain(false);
  };

  const handlePasswordUpdate = async () => {
    if (pwd.length < 8) { setPwdMsg({ ok: false, text: "Min 8 characters." }); return; }
    if (pwd !== pwdConfirm) { setPwdMsg({ ok: false, text: "Passwords do not match." }); return; }
    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setPwdSaving(false);
    if (error) { setPwdMsg({ ok: false, text: error.message }); }
    else { setPwdMsg({ ok: true, text: "Password updated." }); setPwd(""); setPwdConfirm(""); }
    setTimeout(() => setPwdMsg(null), 3000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(data.patient_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Profile & Settings</h1>
        <p className="text-sm text-deep/40 mt-1">Your account details and preferences</p>
      </motion.div>

      {/* ── Identity card ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-sage/30 flex items-center justify-center text-2xl font-bold text-primary">
            {data.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-bold text-deep text-lg" style={{ fontFamily: "var(--font-poppins)" }}>{data.name}</p>
            <p className="text-sm text-deep/40">{data.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-sage/30 text-[10px] font-semibold text-primary uppercase tracking-wide">
              Patient
            </span>
          </div>
        </div>

        {/* Personal Info */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-deep/40 uppercase tracking-wide">Personal Info</p>
          {!editingInfo ? (
            <button onClick={startEditInfo} className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline">
              <Pencil className="w-3 h-3" /> Edit
            </button>
          ) : (
            <button onClick={() => setEditingInfo(false)} className="text-[10px] text-deep/40 font-semibold hover:underline">Cancel</button>
          )}
        </div>

        {editingInfo ? (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide mb-1 block">Date of Birth</label>
                <input
                  type="date"
                  max={today}
                  value={infoForm.dob}
                  onChange={(e) => setInfoForm(p => ({ ...p, dob: e.target.value }))}
                  className="w-full border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide mb-1 block">Gender</label>
                <select
                  value={infoForm.sex}
                  onChange={(e) => setInfoForm(p => ({ ...p, sex: e.target.value }))}
                  className="w-full border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide mb-1 block">Region</label>
              <input
                type="text"
                value={infoForm.region}
                onChange={(e) => setInfoForm(p => ({ ...p, region: e.target.value }))}
                placeholder="e.g. London, UK"
                className="w-full border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide mb-1.5 block">Language</label>
              <div className="flex gap-2">
                {LANG_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setInfoForm(p => ({ ...p, lang: id }))}
                    className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${infoForm.lang === id ? "bg-primary text-white" : "bg-cream text-deep/50 hover:bg-sage/20"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={saveInfo} disabled={infoSaving} className="rounded-full px-5 text-xs h-8">
              {infoSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Full Name" value={data.name} />
            <Field label="Email" value={data.email} />
            <Field label="Age" value={data.age !== null ? `${data.age} years` : null} />
            {data.dob && <Field label="Date of Birth" value={new Date(data.dob).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />}
            <Field label="Gender" value={data.sex ? (data.sex.charAt(0).toUpperCase() + data.sex.slice(1)) : null} />
            <Field label="Region" value={data.region || null} />
            <Field label="Language" value={data.lang ? langLabel[data.lang] ?? data.lang : null} />
          </div>
        )}

        {/* Pain Areas */}
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide">Pain Areas</p>
            <button
              onClick={() => { setEditingPain(v => !v); setLocalPainAreas(data.pain_areas); }}
              className="text-[10px] text-primary font-semibold hover:underline"
            >
              {editingPain ? "Cancel" : "Edit"}
            </button>
          </div>
          {editingPain ? (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {PAIN_OPTIONS.map((area) => {
                  const selected = localPainAreas.includes(area);
                  return (
                    <button
                      key={area}
                      onClick={() => setLocalPainAreas(prev => selected ? prev.filter(a => a !== area) : [...prev, area])}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selected ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
              <Button onClick={savePainAreas} disabled={painSaving} className="rounded-full px-5 text-xs h-8">
                {painSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Save
              </Button>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.pain_areas.length > 0 ? data.pain_areas.map((area) => (
                <span key={area} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{area}</span>
              )) : <span className="text-xs text-deep/30 italic">None selected</span>}
            </div>
          )}
        </div>

        {/* Patient UHID */}
        <div className="border-t border-border/50 pt-4 mt-4">
          <p className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide mb-1.5">Patient ID (UHID)</p>
          {data.patient_code ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 rounded-2xl border border-border bg-muted/40 px-4 flex items-center">
                  <span className="font-mono font-bold text-primary tracking-widest">{data.patient_code}</span>
                </div>
                <Button variant="outline" size="sm" onClick={copyCode} className="rounded-xl h-10 px-3 flex-shrink-0">
                  {codeCopied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-deep/35 mt-1">Share with your physiotherapist to link accounts.</p>
            </>
          ) : (
            <p className="text-sm text-deep/30 italic">Not assigned yet. Contact your physiotherapist.</p>
          )}
        </div>
      </motion.div>

      {/* ── Voice Coach ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6">
        <h3 className="font-bold text-deep mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Voice Coach</h3>
        <p className="text-xs text-deep/40 mb-4">Choose the AI voice that guides your exercises.</p>
        <div className="grid grid-cols-2 gap-3">
          {PERSONAS.map(({ id, name, desc }) => (
            <button
              key={id}
              onClick={() => setVoicePersona(id)}
              aria-pressed={config.voicePersona === id}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${config.voicePersona === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
            >
              <p className={`font-bold text-sm ${config.voicePersona === id ? "text-primary" : "text-deep"}`}>{name}</p>
              <p className="text-xs text-deep/45 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Language ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="bg-white rounded-3xl p-6">
        <h3 className="font-bold text-deep mb-1" style={{ fontFamily: "var(--font-poppins)" }}>App Language</h3>
        <p className="text-xs text-deep/40 mb-4">Controls the app interface and voice language.</p>
        <div className="grid grid-cols-3 gap-3" role="group" aria-label="Language">
          {LANG_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={async () => {
                setLang(id);
                if (user.id) await supabase.from("profiles").update({ lang: id }).eq("id", user.id);
                setData(prev => ({ ...prev, lang: id }));
              }}
              aria-pressed={config.lang === id}
              className={`py-3 rounded-2xl text-sm font-semibold transition-all ${config.lang === id ? "bg-primary text-white" : "bg-cream text-deep/50 hover:bg-sage/20"}`}
            >
              {label === "EN" ? "English" : label === "हि" ? "हिन्दी" : "اردو"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Experience Mode ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="bg-white rounded-3xl p-6">
        <h3 className="font-bold text-deep mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Experience Mode</h3>
        <p className="text-xs text-deep/40 mb-4">Adjusts pacing, font size, and UI density.</p>
        <div className="grid grid-cols-3 gap-3" role="group" aria-label="Experience mode">
          {(["standard", "elder", "youth"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setCultureMode(m)}
              aria-pressed={config.cultureMode === m}
              className={`py-3 rounded-2xl text-sm font-semibold capitalize transition-all ${config.cultureMode === m ? "bg-primary text-white" : "bg-cream text-deep/50 hover:bg-sage/20"}`}
            >
              {m === "elder" ? "Elder" : m === "youth" ? "Youth" : "Standard"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Accessibility ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="bg-white rounded-3xl p-6">
        <h3 className="font-bold text-deep mb-4" style={{ fontFamily: "var(--font-poppins)" }}>Accessibility</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-cream rounded-2xl">
            <div>
              <p className="font-semibold text-deep text-sm">Elder Mode</p>
              <p className="text-xs text-deep/40">Large buttons · Slower pace · Simplified UI</p>
            </div>
            <button onClick={toggleElder} role="switch" aria-checked={config.elderMode} aria-label="Toggle Elder Mode"
              className={`w-12 h-6 rounded-full transition-all relative ${config.elderMode ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${config.elderMode ? "left-6" : "left-0.5"}`} aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-cream rounded-2xl">
            <div>
              <p className="font-semibold text-deep text-sm">High Contrast</p>
              <p className="text-xs text-deep/40">Improved readability</p>
            </div>
            <button onClick={toggleHighContrast} role="switch" aria-checked={config.highContrast} aria-label="Toggle High Contrast"
              className={`w-12 h-6 rounded-full transition-all relative ${config.highContrast ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${config.highContrast ? "left-6" : "left-0.5"}`} aria-hidden="true" />
            </button>
          </div>
          <div className="p-3 bg-cream rounded-2xl">
            <p className="font-semibold text-deep text-sm mb-3">Font Size</p>
            <div className="flex gap-2" role="group" aria-label="Font size">
              {(["normal", "large", "xlarge"] as const).map((s) => (
                <button key={s} onClick={() => setFontSize(s)} aria-pressed={config.fontSize === s}
                  aria-label={s === "xlarge" ? "Extra large" : s === "large" ? "Large" : "Normal"}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${config.fontSize === s ? "bg-primary text-white" : "bg-white text-deep/40"}`}>
                  {s === "xlarge" ? "XL" : s === "large" ? "L" : "A"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Security ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="bg-white rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Change Password</h3>

        <div className="relative">
          <Input
            type={showPwd ? "text" : "password"}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="h-12 rounded-2xl border-border pr-10"
          />
          <button
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-deep/40 hover:text-deep"
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input
          type={showPwd ? "text" : "password"}
          value={pwdConfirm}
          onChange={(e) => setPwdConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="h-12 rounded-2xl border-border"
        />

        {pwdMsg && (
          <p className={`text-xs font-medium ${pwdMsg.ok ? "text-primary" : "text-red-500"}`}>{pwdMsg.text}</p>
        )}

        <Button
          onClick={handlePasswordUpdate}
          disabled={pwdSaving || !pwd}
          className="bg-deep text-white rounded-full px-6 w-full sm:w-auto"
        >
          {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {pwdSaving ? "Updating…" : "Update Password"}
        </Button>
      </motion.div>
    </div>
  );
}
