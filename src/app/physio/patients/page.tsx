"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Activity, ChevronRight, UserPlus, X, Loader2, Check, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

interface PatientRow {
  id: string;
  name: string;
  age: number | null;
  sex: string | null;
  region: string | null;
  pain_areas: string[];
  lang: string;
  patient_code: string | null;
  plan?: { id: string; pain_areas: string[]; active: boolean } | null;
  sessions_today: number;
  linked_at: string;
}

interface FoundPatient {
  id: string;
  name: string;
  age: number | null;
  sex: string | null;
  region: string | null;
  pain_areas: string[];
  patient_code: string;
}

export default function Patients() {
  const { user } = useApp();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<FoundPatient | null>(null);
  const [searchErr, setSearchErr] = useState("");
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);

  const loadPatients = async () => {
    if (!user.id) return;
    const { data: links } = await supabase
      .from("physio_patients")
      .select("patient_id, linked_at")
      .eq("physio_id", user.id);
    if (!links?.length) { setLoading(false); return; }

    const ids = links.map((l) => l.patient_id);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [profilesRes, plansRes, sessRes] = await Promise.all([
      supabase.from("profiles").select("id, name, age, sex, region, pain_areas, lang, patient_code").in("id", ids),
      supabase.from("plans").select("id, patient_id, pain_areas, active").in("patient_id", ids).eq("active", true),
      supabase.from("sessions").select("patient_id").in("patient_id", ids).gte("completed_at", today.toISOString()),
    ]);

    const planMap: Record<string, { id: string; pain_areas: string[]; active: boolean }> = {};
    (plansRes.data ?? []).forEach((p) => { planMap[p.patient_id] = p; });
    const sessCount: Record<string, number> = {};
    (sessRes.data ?? []).forEach((s) => { sessCount[s.patient_id] = (sessCount[s.patient_id] ?? 0) + 1; });
    const linkMap: Record<string, string> = {};
    links.forEach((l) => { linkMap[l.patient_id] = l.linked_at; });

    const rows: PatientRow[] = (profilesRes.data ?? []).map((p) => ({
      ...p,
      plan: planMap[p.id] ?? null,
      sessions_today: sessCount[p.id] ?? 0,
      linked_at: linkMap[p.id] ?? "",
    }));
    setPatients(rows);
    setLoading(false);
  };

  useEffect(() => { loadPatients(); }, [user.id]);

  const handleSearch = async () => {
    const q = code.trim().toUpperCase();
    if (!q) return;
    setSearching(true); 
    setSearchErr(""); 
    setFound(null);
    
    // Primary search: by patient_code
    let { data } = await supabase
      .from("profiles")
      .select("id, name, age, sex, region, pain_areas, patient_code, role")
      .eq("patient_code", q)
      .eq("role", "patient")
      .maybeSingle();
    
    // If not found, check if account exists but role is not set correctly
    if (!data) {
      const { data: unconfirmedPatient } = await supabase
        .from("profiles")
        .select("id, name, age, sex, region, pain_areas, patient_code, role")
        .eq("patient_code", q)
        .maybeSingle();
      
      if (unconfirmedPatient && unconfirmedPatient.role !== "patient") {
        setSearching(false);
        setSearchErr(`Account exists but is set up as a ${unconfirmedPatient.role}. Please verify the Patient ID.`);
        return;
      }
    }
    
    setSearching(false);
    if (!data) { 
      setSearchErr("Patient ID not found. Ensure the patient has completed their onboarding."); 
      return; 
    }
    if (patients.some((p) => p.id === data.id)) { 
      setSearchErr("Patient already linked."); 
      return; 
    }
    setFound({ 
      id: data.id, 
      name: data.name, 
      age: data.age, 
      sex: data.sex, 
      region: data.region, 
      pain_areas: data.pain_areas || [], 
      patient_code: data.patient_code || "" 
    });
  };

  const handleLink = async () => {
    if (!found || !user.id) return;
    setLinking(true);
    await supabase.from("physio_patients").upsert({ physio_id: user.id, patient_id: found.id }, { onConflict: "physio_id,patient_id" });
    const { data: plan } = await supabase.from("plans").select("id").eq("patient_id", found.id).eq("active", true).maybeSingle();
    if (plan?.id) {
      await supabase.from("plans").update({ physio_id: user.id }).eq("id", plan.id);
    } else {
      await supabase.from("plans").insert({
        patient_id: found.id, physio_id: user.id,
        pain_areas: found.pain_areas ?? [], exercises: [], active: true,
      });
    }
    setLinking(false); setLinked(true);
    setTimeout(() => { setAddOpen(false); setCode(""); setFound(null); setLinked(false); loadPatients(); }, 1200);
  };

  const filtered = patients.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.patient_code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Patients</h1>
          <p className="text-deep/50 text-sm mt-1">{patients.length} linked</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary text-white rounded-2xl gap-2 flex-shrink-0">
          <UserPlus className="w-4 h-4" />Add Patient
        </Button>
      </motion.div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-deep/30" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or Patient ID…" className="pl-10 h-12 rounded-2xl bg-white border-0" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-deep/30 text-sm">{search ? "No results." : "No patients linked yet. Add one using their Patient ID."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/physio/patients/${p.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-5 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-sage/30 flex items-center justify-center flex-shrink-0 font-bold text-primary text-lg">
                  {p.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-deep text-sm truncate" style={{ fontFamily: "var(--font-poppins)" }}>{p.name}</p>
                    {p.age && <span className="text-xs text-deep/30 flex-shrink-0">· {p.age}y</span>}
                    {p.plan ? (
                      <Badge className="ml-auto border-0 text-[10px] bg-primary/10 text-primary flex-shrink-0">Active Plan</Badge>
                    ) : (
                      <Badge className="ml-auto border-0 text-[10px] bg-muted text-deep/40 flex-shrink-0">No Plan</Badge>
                    )}
                  </div>
                  <p className="text-xs text-deep/40 mb-2">
                    {p.patient_code && <span className="font-mono">{p.patient_code} · </span>}
                    {p.region || "—"} · {p.pain_areas.slice(0, 2).join(", ") || "No pain areas"}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {p.pain_areas.slice(0, 3).map((a) => (
                      <Badge key={a} className="bg-muted text-deep/50 border-0 text-[10px]">{a}</Badge>
                    ))}
                    {p.sessions_today > 0 && (
                      <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                        <Activity className="w-3 h-3" />{p.sessions_today} today
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-deep/20 group-hover:text-primary transition-colors flex-shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Patient Sheet */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40" onClick={() => { setAddOpen(false); setCode(""); setFound(null); setSearchErr(""); }} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
              role="dialog" aria-label="Add patient"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-deep text-lg" style={{ fontFamily: "var(--font-poppins)" }}>Add Patient</h3>
                <button onClick={() => { setAddOpen(false); setCode(""); setFound(null); setSearchErr(""); }}
                  className="text-deep/30 hover:text-deep p-1" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-deep/50 mb-4">Enter the Patient ID (UHID) shared by the patient.</p>

              <div className="flex gap-2 mb-4">
                <Input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setSearchErr(""); setFound(null); }}
                  placeholder="e.g. A3F9B2C1" maxLength={8}
                  className="flex-1 h-12 rounded-2xl border-border font-mono text-lg tracking-widest text-center uppercase"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                />
                <Button onClick={handleSearch} disabled={searching || code.length < 6} className="bg-primary text-white rounded-2xl h-12 px-5 flex-shrink-0">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
                </Button>
              </div>

              {searchErr && (
                <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{searchErr}
                </div>
              )}

              {found && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-cream rounded-2xl p-5 space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sage/30 flex items-center justify-center font-bold text-primary text-lg">
                      {found.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-deep">{found.name}</p>
                      <p className="text-xs text-deep/40">
                        {found.age ? `${found.age}y` : ""}{found.sex ? ` · ${found.sex}` : ""}{found.region ? ` · ${found.region}` : ""}
                      </p>
                    </div>
                  </div>
                  {found.pain_areas?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {found.pain_areas.map((a) => (
                        <Badge key={a} className="bg-primary/10 text-primary border-0 text-xs">{a}</Badge>
                      ))}
                    </div>
                  )}
                  <Button onClick={handleLink} disabled={linking || linked} className="w-full bg-primary text-white rounded-2xl h-11 gap-2">
                    {linked ? <><Check className="w-4 h-4" />Linked!</> : linking ? <><Loader2 className="w-4 h-4 animate-spin" />Linking…</> : "Confirm & Link Patient"}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
