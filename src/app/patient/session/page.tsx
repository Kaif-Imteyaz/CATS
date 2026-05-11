"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Camera, Volume2, VolumeX, Pause, Play, SkipForward,
  ThumbsUp, AlertCircle, CheckCircle, Sun, AlertTriangle,
  BarChart2, X, Settings, ChevronRight, ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { ConsentModal, useConsentGate } from "@/components/shared/ConsentModal";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { speak, speakRaw, stopVoice } from "@/lib/voiceEngine";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { EXERCISE_LIBRARY, BODY_CONNECTIONS, ROM_CONFIGS, ELDER_ROM_CONFIGS, drawNeckLine } from "@/lib/poseEngine";
import type { Lang as VoiceLang } from "@/context/AppContext";
import type { PoseLandmarks } from "@/lib/poseEngine";


interface ExerciseItem {
  name: string; tag: string; duration_min: number; difficulty: string;
  target: string; instructions: string;
}

function drawSkeleton(canvas: HTMLCanvasElement, landmarks: PoseLandmarks, type: "correct" | "warning" | "error", connections: [number, number][]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  const color = type === "correct" ? "#4ade80" : type === "warning" ? "#facc15" : "#f87171";
  const px = (i: number) => {
    const j = landmarks[i];
    return j ? { x: (1 - j.x) * w, y: j.y * h } : null;
  };
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round";
  connections.forEach(([a, b]) => {
    const pa = px(a); const pb = px(b);
    if (!pa || !pb) return;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
  });
  Object.keys(landmarks).forEach((k) => {
    const p = px(Number(k));
    if (!p) return;
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  });
}

function SessionContent() {
  const searchParams = useSearchParams();
  const exerciseIndex = Number(searchParams.get("exercise") ?? "0");
  const nameParam = searchParams.get("name") ?? "";
  const totalParam = Number(searchParams.get("total") ?? "0");

  const { user, token, config, t } = useApp();
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [planId, setPlanId] = useState<string | undefined>(undefined);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [romOverride, setRomOverride] = useState<{ min: number; max: number } | undefined>(undefined);
  const [maxReps, setMaxReps] = useState(10);
  const { consentGiven, showModal, requestConsent, handleAccept, handleDecline } = useConsentGate();

  const currentExercise = exercises[exerciseIndex];
  const exerciseTag = currentExercise?.tag ?? "default";
  const exerciseMeta = EXERCISE_LIBRARY[exerciseTag] ?? EXERCISE_LIBRARY["default"];
  const connections = exerciseMeta?.connections ?? BODY_CONNECTIONS;

  const elderRom = config.cultureMode === "elder"
    ? (ELDER_ROM_CONFIGS[exerciseTag] ?? ELDER_ROM_CONFIGS.default)
    : undefined;
  const effectiveRom = romOverride ?? elderRom;

  const { videoRef, state, startCamera, stopCamera, countRep } = usePoseDetection(exerciseTag, effectiveRom);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [paused, setPaused] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [repCountOn, setRepCountOn] = useState(true);
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [safetyAccepted, setSafetyAccepted] = useState(false);
  const [midwayAnnounced, setMidwayAnnounced] = useState(false);
  const [lang] = useState<VoiceLang>(config.lang as VoiceLang);
  const [lastFeedback, setLastFeedback] = useState("");
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const prevRepsRef = useRef(0);
  const lastQualityVoiceRef = useRef<string>("");

  const appendLog = useCallback((message: string) => {
    setSessionLogs((prev) => [message, ...prev].filter(Boolean).slice(0, 8));
  }, []);

  useEffect(() => {
    console.log(`[CATS] session mount: ${exerciseIndex} (${nameParam})`);
  }, []);

  useEffect(() => {
    if (!user.id) { setLoadingPlan(false); return; }
    const t0 = performance.now();
    import("@/lib/supabaseClient").then(async ({ supabase }) => {
      const [planRes, romRes] = await Promise.all([
        supabase.from("plans").select("id, exercises").eq("patient_id", user.id).eq("active", true).limit(1).maybeSingle(),
        supabase.from("patient_rom_overrides").select("exercise_tag, rom_min, rom_max, reps").eq("patient_id", user.id),
      ]);
      if (planRes.data) {
        setPlanId(planRes.data.id);
        setExercises(planRes.data.exercises ?? []);
      }
      console.log(`[CATS] plan load: ${(performance.now() - t0).toFixed(1)}ms`);
      if (romRes.data?.length) {
        const map: Record<string, { min: number; max: number; reps?: number }> = {};
        romRes.data.forEach((r: { exercise_tag: string; rom_min: number; rom_max: number; reps?: number }) => {
          map[r.exercise_tag] = { min: r.rom_min, max: r.rom_max, reps: r.reps ?? undefined };
        });
        const tag = planRes.data?.exercises?.[exerciseIndex]?.tag ?? "default";
        const override = map[tag];
        if (override) {
          setRomOverride({ min: override.min, max: override.max });
          if (override.reps) setMaxReps(override.reps);
        }
      }
      setLoadingPlan(false);
    });
  }, [user.id, exerciseIndex]);

  useEffect(() => {
    if (exercises[exerciseIndex]?.tag) {
      const tag = exercises[exerciseIndex].tag;
      import("@/lib/supabaseClient").then(async ({ supabase }) => {
        const { data } = await supabase
          .from("patient_rom_overrides")
          .select("rom_min, rom_max, reps")
          .eq("patient_id", user.id)
          .eq("exercise_tag", tag)
          .maybeSingle();
        setRomOverride(data ? { min: data.rom_min, max: data.rom_max } : undefined);
        setMaxReps(data?.reps ?? 10);
      });
    }
  }, [exerciseIndex, exercises, user.id]);

  const reps = Math.floor(state.repCount);
  const result = state.result;

  useEffect(() => {
    if (!consentGiven) { requestConsent(); return; }
    if (!safetyAccepted) { setSafetyOpen(true); }
  }, [consentGiven, safetyAccepted, requestConsent]);

  useEffect(() => {
    if (safetyOpen && voiceOn) speak("safety_briefing", lang, config.cultureMode, config.voicePersona);
  }, [safetyOpen]);

  useEffect(() => {
    if (loadingPlan || !consentGiven || !safetyAccepted) return;
    const camT0 = performance.now();
    startCamera();
    startTimeRef.current = Date.now();
    console.log(`[CATS] camera init: ${(performance.now() - camT0).toFixed(1)}ms (to getUserMedia request)`);
    return () => { stopCamera(); stopVoice(); };
  }, [loadingPlan, consentGiven, safetyAccepted, startCamera, stopCamera]);

  useEffect(() => {
    if (!result || !voiceOn) return;
    const fb = result.feedback[0];
    if (fb && fb !== lastFeedback) { setLastFeedback(fb); speak(fb, lang, config.cultureMode, config.voicePersona); }
  }, [result?.feedback[0]]);

  useEffect(() => {
    if (!canvasRef.current || !state.landmarks || !state.result) return;
    drawSkeleton(canvasRef.current, state.landmarks, state.result.type, connections as [number, number][]);
    const neckColor = state.result.type === "correct" ? "#4ade80" : state.result.type === "warning" ? "#facc15" : "#f87171";
    drawNeckLine(canvasRef.current, state.landmarks, neckColor);
  }, [state.landmarks, state.result?.type]);

  useEffect(() => {
    if (reps >= maxReps && !completed) {
      setCompleted(true);
      stopCamera();
      if (voiceOn) speak("session_end", lang, config.cultureMode, config.voicePersona);
      appendLog(t("session.complete_log"));
      saveSession();
    } else if (reps > prevRepsRef.current && reps > 0 && voiceOn && repCountOn && !completed) {
      const key = reps >= maxReps ? "rep_complete" : reps === 5 ? "rep_5" : `rep_${reps}`;
      speak(key, lang, config.cultureMode, config.voicePersona);
    }
    prevRepsRef.current = reps;
  }, [reps, completed, voiceOn, lang, config.cultureMode, config.voicePersona, appendLog, repCountOn]);

  const saveSession = async () => {
    if (!user.id || !token) return;
    setSaving(true);
    try {
      await api.session.save({
        patient_id: user.id, plan_id: planId, exercise_tag: exerciseTag,
        reps: maxReps, score: result?.score ?? 0,
        posture_data: result ? (result as unknown as Record<string, unknown>) : {},
        duration_seconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      }, token);
    } catch (err) {
      console.error("[CATS] session save failed:", err);
      appendLog("Session save failed — check connection");
    } finally { setSaving(false); }
  };

  const handlePause = () => { setPaused((p) => !p); if (!paused) stopCamera(); else startCamera(); };
  const handleVoice = () => {
    setVoiceOn((v) => {
      const next = !v;
      if (!next) stopVoice();
      appendLog(next ? t("session.voice_enabled") : t("session.voice_disabled"));
      return next;
    });
  };
  const handleRepToggle = () => {
    setRepCountOn((prev) => {
      const next = !prev;
      appendLog(next ? t("session.rep_count_enabled") : t("session.rep_count_disabled"));
      return next;
    });
  };
  const handleSafetyAccept = () => {
    setSafetyAccepted(true);
    setSafetyOpen(false);
    appendLog(t("session.safety_accepted"));
    if (voiceOn) {
      speak("safety_briefing", lang, config.cultureMode, config.voicePersona);
      setTimeout(() => {
        speak("session_start", lang, config.cultureMode, config.voicePersona);
        appendLog(t("session.start_log"));
      }, 900);
      setTimeout(() => {
        const name = (currentExercise?.name ?? exerciseMeta?.name ?? nameParam) || "";
        if (name) speakRaw(name, lang, config.cultureMode, config.voicePersona);
      }, 2200);
    } else {
      appendLog(t("session.start_log"));
    }
  };
  const handleSafetyClose = () => {
    if (voiceOn) stopVoice();
    setVoiceOn(false);
    setSafetyOpen(false);
    appendLog(t("session.safety_closed"));
  };
  const handleRep = () => {
    countRep();
    if (voiceOn && repCountOn) {
      const newRep = Math.floor(state.repCount) + 1;
      const repMessage = newRep === 5 ? "rep_5" : newRep === 10 ? "rep_complete" : `rep_${newRep}`;
      speak(repMessage, lang, config.cultureMode, config.voicePersona);
    }
  };
  const handleComplete = () => {
    if (completed) return;
    setCompleted(true);
    stopCamera();
    if (voiceOn) speak("session_end", lang, config.cultureMode, config.voicePersona);
    appendLog(t("session.complete_log"));
    saveSession();
  };

  useEffect(() => {
    if (completed || midwayAnnounced || reps < Math.ceil(maxReps / 2)) return;
    if (reps === 0) return;
    setMidwayAnnounced(true);
    appendLog(t("session.halfway_log"));
    if (voiceOn) speak("session_midway", lang, config.cultureMode, config.voicePersona);
  }, [reps, completed, midwayAnnounced, voiceOn, lang, config.cultureMode, config.voicePersona, appendLog]);

  const nextExerciseHref = exercises[exerciseIndex + 1]
    ? `/patient/session?exercise=${exerciseIndex + 1}` : "/patient/exercises";

  const metrics = result?.metrics;
  const score = result?.score ?? 0;
  const feedback = result?.feedback ?? [];
  const feedbackType = result?.type ?? "correct";
  const { detectionQuality, brightness, currentAngle, repState } = state;
  const totalExercises = exercises.length || totalParam || 1;
  const displayName = (currentExercise?.name ?? exerciseMeta?.name ?? nameParam) || t("session.exercise");
  const activeRom = effectiveRom ?? ROM_CONFIGS[exerciseTag] ?? ROM_CONFIGS.default;
  const romTier = romOverride ? "physio" : config.cultureMode === "elder" ? "elder" : "standard";

  useEffect(() => {
    if (!voiceOn || !safetyAccepted || completed) return;
    if (detectionQuality === "low-light" && lastQualityVoiceRef.current !== "low-light") {
      lastQualityVoiceRef.current = "low-light";
      speak("low_light_warning", lang, config.cultureMode, config.voicePersona);
    } else if (detectionQuality === "no-pose" && lastQualityVoiceRef.current !== "no-pose") {
      lastQualityVoiceRef.current = "no-pose";
      speak("no_pose_warning", lang, config.cultureMode, config.voicePersona);
    } else if (detectionQuality === "good") {
      lastQualityVoiceRef.current = "";
    }
  }, [detectionQuality, voiceOn, safetyAccepted, completed, lang, config.cultureMode, config.voicePersona]);

  if (completed) {
    return (
      <div className="min-h-screen bg-deep text-white flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-poppins)" }}>{t("session.complete_title")}</h1>
          <p className="text-white/50 mb-8">{displayName} · {maxReps} {t("session.reps").toLowerCase()}</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: t("session.reps"), val: `${maxReps}/${maxReps}` },
              { label: t("session.score"), val: `${score}%` },
              { label: t("session.duration"), val: `${Math.round((Date.now() - startTimeRef.current) / 60000)}m` },
              { label: t("common.status"), val: saving ? t("common.saving") : t("common.saved") },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-4">
                <p className="text-lg font-bold text-white">{val}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
          {exercises[exerciseIndex + 1] && (
            <Button className="bg-primary text-white rounded-full px-8 w-full mb-3" asChild>
              <Link href={nextExerciseHref}>{t("session.next_exercise")}</Link>
            </Button>
          )}
          <Button variant="ghost" className=" bg-white/10 border border-white/20 text-white/50 rounded-full px-8 w-full" asChild>
            <Link href="/patient/exercises">{t("session.back_exercises")}</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const statPanel = (
    <div className="space-y-4">
      {exerciseMeta?.instructions && (
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-xs text-white/40 mb-2 uppercase tracking-wide">{t("session.how_to")}</p>
          <p className="text-sm text-white/70 leading-relaxed">{exerciseMeta.instructions}</p>
        </div>
      )}
      <div className="bg-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-4 h-4 text-primary" aria-hidden="true" />
          <p className="text-sm font-semibold text-white/80">{t("session.pose_analysis")}</p>
          <div className={`ml-auto w-2 h-2 rounded-full ${
            detectionQuality === "good" ? "bg-green-400 animate-pulse" :
            detectionQuality === "low-light" ? "bg-yellow-400" : "bg-white/20"
          }`} />
        </div>
        <div className="space-y-3">
          {metrics ? (
            [
              { label: t("session.back_alignment"), pct: Math.min(100, Math.max(0, Math.round(metrics.shoulderAngle))) },
              { label: t("session.knee_angle"), pct: Math.min(100, Math.max(0, Math.round((metrics.kneeAngle / 120) * 100))) },
              { label: t("session.hip_alignment"), pct: Math.min(100, Math.max(0, Math.round(metrics.hipAlignment))) },
              { label: t("session.symmetry"), pct: Math.min(100, Math.max(0, Math.round(metrics.symmetry))) },
            ].map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>{label}</span>
                  <span className={`font-semibold ${pct >= 80 ? "text-green-400" : pct >= 60 ? "text-yellow-400" : "text-red-400"}`}>{pct}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
                  <div className={`h-1.5 rounded-full transition-all ${pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-yellow-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-white/30">{t("session.waiting_pose")}</p>
          )}
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-3">
        <p className="text-xs text-white/40 mb-1 uppercase tracking-wide">{t("session.rom_target")}</p>
        <p className="text-sm font-semibold text-white">{activeRom.min}°–{activeRom.max}°</p>
        {romTier === "physio" && <p className="text-[10px] text-primary mt-0.5">Physio custom ROM</p>}
        {romTier === "elder" && <p className="text-[10px] text-yellow-400 mt-0.5">Elder-adapted ROM</p>}
      </div>

      <div className="bg-white/5 rounded-2xl p-4">
        <p className="text-xs text-white/40 mb-3 uppercase tracking-wide">{t("session.stats_label")}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t("session.reps"), val: repCountOn ? `${reps}/${maxReps}` : t("session.rep_count_off") },
            { label: t("session.score"), val: `${score}%` },
            { label: t("session.voice_label"), val: voiceOn ? t("common.on") : t("common.off") },
            { label: t("session.quality"), val: detectionQuality === "good" ? t("session.quality_good") : detectionQuality === "low-light" ? t("session.quality_low_light") : t("session.quality_no_pose") },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-sm font-bold text-white">{val}</p>
              <p className="text-xs text-white/30">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-4">
        <p className="text-xs text-white/40 mb-3 uppercase tracking-wide">{t("session.settings")}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button className="rounded-2xl py-3 text-sm" variant={voiceOn ? "secondary" : "outline"} onClick={handleVoice}>
            {voiceOn ? t("session.voice_on") : t("session.voice_off")}
          </Button>
          <Button className="rounded-2xl py-3 text-sm" variant={repCountOn ? "secondary" : "outline"} onClick={handleRepToggle}>
            {repCountOn ? t("session.rep") : t("session.rep_count_off")}
          </Button>
          <Button className="col-span-2 rounded-2xl py-3 text-sm border border-white/20 text-white/70 hover:bg-white/10" variant="ghost" onClick={() => setSafetyOpen(true)}>
            {t("session.safety")}
          </Button>
        </div>
      </div>

      {false && sessionLogs.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-xs text-white/40 mb-3 uppercase tracking-wide">{t("session.log_label")}</p>
          <div className="space-y-2 text-xs text-white/70">
            {sessionLogs.map((entry, index) => (
              <div key={`${entry}-${index}`} className="rounded-xl bg-white/5 px-3 py-2">
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {exercises.length > 1 && (
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-xs text-white/40 mb-2 uppercase tracking-wide">{t("session.exercise_queue")}</p>
          <div className="space-y-1.5">
            {exercises.slice(0, 5).map((ex, i) => (
              <div key={ex.tag + i} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${i === exerciseIndex ? "bg-primary/20 text-white" : i < exerciseIndex ? "text-white/20" : "text-white/50"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${i === exerciseIndex ? "bg-primary" : i < exerciseIndex ? "bg-green-500/30" : "bg-white/10"}`}>
                  {i < exerciseIndex ? "✓" : i + 1}
                </span>
                <span className="truncate">{ex.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {showModal && (
        <ConsentModal onAccept={handleAccept} onDecline={() => { handleDecline(); window.history.back(); }} />
      )}

      <AnimatePresence>
        {safetyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black/80"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed inset-x-4 top-1/2 z-70 mx-auto max-w-2xl -translate-y-1/2 rounded-3xl bg-deep border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-lg font-semibold text-white">{t("session.safety_title")}</p>
                  <p className="text-xs text-white/50 mt-1">{t("session.safety_prompt")}</p>
                </div>
                <button onClick={handleSafetyClose} className="text-white/50 hover:text-white rounded-full p-2" aria-label="Close safety dialog">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="space-y-3 text-sm text-white/70 mb-6">
                <li>• {t("session.safety_rule_surface")}</li>
                <li>• {t("session.safety_rule_heavy")}</li>
                <li>• {t("session.safety_rule_hydrate")}</li>
                <li>• {t("session.safety_rule_support")}</li>
                <li>• {t("session.safety_rule_pain")}</li>
              </ul>
              <div className="space-y-3">
                <Button className="w-full rounded-2xl py-3" onClick={handleSafetyAccept}>{t("session.safety_accept")}</Button>
                <Button variant="ghost" className="w-full rounded-2xl py-3 border border-white/20 text-white/60 hover:text-white hover:bg-white/10" onClick={handleSafetyClose}>{t("session.safety_cancel")}</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile layout: fullscreen camera */}
      <div className="lg:hidden fixed inset-0 z-50 bg-black overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" muted playsInline aria-label="Camera view" />
        <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full z-10" aria-hidden="true" />

        {!state.isTracking && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
            <Camera className="w-12 h-12 text-white/20 mb-3" aria-hidden="true" />
            <p className="text-white/40 text-sm">{state.cameraError ?? t("session.start_camera")}</p>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div>
            <p className="text-white/50 text-xs">{t("session.exercise")} {exerciseIndex + 1}/{totalExercises}</p>
            <h2 className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-poppins)" }}>
              {displayName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {state.isTracking && (
              <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">{t("session.live")}</span>
              </div>
            )}
            {currentAngle > 0 && (
              <div className="bg-black/50 backdrop-blur px-2.5 py-1 rounded-xl">
                <p className={`text-sm font-bold ${repState === "peaked" ? "text-green-400" : repState === "active" ? "text-yellow-400" : "text-white/70"}`}>
                  {currentAngle}°
                </p>
              </div>
            )}
            {metrics && (
              <div className="bg-black/50 backdrop-blur px-2.5 py-1 rounded-xl">
                <p className={`text-sm font-bold ${score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400"}`}>{score}%</p>
              </div>
            )}
          </div>
        </div>

        {detectionQuality === "low-light" && (
          <div className="absolute top-16 left-4 right-4 z-20">
            <div className="bg-yellow-500/20 border border-yellow-500/30 backdrop-blur rounded-xl px-3 py-2 flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-yellow-400" aria-hidden="true" />
              <p className="text-xs text-yellow-300">{t("session.low_light")}</p>
            </div>
          </div>
        )}

        {detectionQuality === "no-pose" && state.isTracking && (
          <div className="absolute top-16 left-4 right-4 z-20">
            <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" aria-hidden="true" />
              <p className="text-xs text-yellow-300">{t("session.no_pose")}</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/60">{reps}/{maxReps} {t("session.reps").toLowerCase()}</span>
            </div>
            <Progress value={(reps / maxReps) * 100} className="h-1.5 bg-white/20" />
          </div>

          <div className="flex items-center gap-2.5">
            <Button onClick={handlePause} aria-label={paused ? "Resume" : "Pause"} className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 w-12 p-0">
              {paused ? <Play className="w-4 h-4" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
            </Button>
            <Button onClick={handleComplete} aria-label="Mark exercise complete" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-12 text-sm gap-2">
              <CheckCircle className="w-4 h-4" aria-hidden="true" />{t("session.mark_complete")}
            </Button>
            <Button onClick={handleVoice} aria-label={voiceOn ? "Mute voice" : "Unmute voice"} className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 w-12 p-0">
              {voiceOn ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
            </Button>
            <Button aria-label="Skip exercise" className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 w-12 p-0" asChild>
              <Link href={nextExerciseHref}><SkipForward className="w-4 h-4" aria-hidden="true" /></Link>
            </Button>
            <Button onClick={() => setSettingsOpen(true)} aria-label="Session settings" className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 w-12 p-0">
              <Settings className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {settingsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-black/40"
                onClick={() => setSettingsOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="absolute top-0 right-0 bottom-0 w-80 max-w-[90vw] z-40 bg-deep overflow-y-auto"
                role="dialog"
                aria-label="Session settings and stats"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-white text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4" /> {t("session.settings")}
                    </p>
                    <button onClick={() => setSettingsOpen(false)} aria-label="Close settings" className="text-white/30 hover:text-white p-1">
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  {statPanel}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block min-h-screen bg-deep text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/50 text-sm">{t("session.exercise")} {exerciseIndex + 1} {t("common.of")} {totalExercises} · {t("session.ai_tracking")}</p>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-poppins)" }}>
                {displayName}
              </h1>
            </div>
            <div className="flex gap-2 flex-wrap justify-end items-center">
              <Badge className="bg-white/10 text-white border-0">{currentExercise?.difficulty ?? "Gentle"}</Badge>
              <Badge className="bg-primary text-white border-0">{currentExercise?.target ?? "Recovery"}</Badge>
              {state.isTracking && (
                <Badge className="bg-green-500/20 text-green-400 border-0 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
                </Badge>
              )}
              <button
                onClick={() => setPanelOpen(v => !v)}
                className="ml-2 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
              >
                {panelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {detectionQuality === "low-light" && (
            <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-2 flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-400 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-yellow-300">Low light detected (brightness {brightness}). Move to a brighter area for better tracking.</p>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-6 ${panelOpen ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
            <div className={panelOpen ? "lg:col-span-2 space-y-4" : "space-y-4"}>
              <div className="bg-white/5 rounded-3xl aspect-video flex items-center justify-center relative overflow-hidden">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover rounded-3xl scale-x-[-1]" muted playsInline aria-label="Camera view" />
                <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full z-10 rounded-3xl" aria-hidden="true" />

                {!state.isTracking && (
                  <div className="relative z-20 text-center">
                    <Camera className="w-12 h-12 text-white/20 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-white/40 text-sm">{state.cameraError ?? t("session.start_camera")}</p>
                  </div>
                )}

                {detectionQuality === "no-pose" && state.isTracking && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-yellow-400" aria-hidden="true" />
                      <p className="text-xs text-yellow-300">{t("session.no_pose")}</p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <div className="bg-black/50 backdrop-blur rounded-2xl p-3 flex items-center gap-3">
                    <Progress value={(reps / maxReps) * 100} className="flex-1 h-2 bg-white/20" />
                    <span className="text-sm font-bold text-white">{repCountOn ? `${reps}/${maxReps} reps` : t("session.rep_count_off")}</span>
                  </div>
                </div>

                {state.isTracking && (
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    {metrics && (
                      <div className="bg-black/50 backdrop-blur rounded-xl px-3 py-2">
                        <p className="text-xs text-white/60">Score</p>
                        <p className={`text-lg font-bold ${score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400"}`}>{score}%</p>
                      </div>
                    )}
                    {currentAngle > 0 && (
                      <div className="bg-black/50 backdrop-blur rounded-xl px-3 py-2">
                        <p className="text-xs text-white/60">Angle</p>
                        <p className={`text-lg font-bold ${repState === "peaked" ? "text-green-400" : repState === "active" ? "text-yellow-400" : "text-white"}`}>
                          {currentAngle}°
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handlePause} aria-label={paused ? "Resume session" : "Pause session"} className="bg-white/10 hover:bg-white/20 text-white rounded-2xl h-14 w-14 p-0">
                  {paused ? <Play className="w-5 h-5" aria-hidden="true" /> : <Pause className="w-5 h-5" aria-hidden="true" />}
                </Button>
                <Button onClick={handleComplete} aria-label="Mark exercise complete" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 gap-2">
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />{t("session.mark_complete")}
                </Button>
                <Button onClick={handleVoice} aria-label={voiceOn ? "Mute voice coaching" : "Unmute voice coaching"} className="bg-white/10 hover:bg-white/20 text-white rounded-2xl h-14 w-14 p-0">
                  {voiceOn ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
                </Button>
                <Button aria-label="Skip to next exercise" className="bg-white/10 hover:bg-white/20 text-white rounded-2xl h-14 w-14 p-0" asChild>
                  <Link href={nextExerciseHref}><SkipForward className="w-5 h-5" aria-hidden="true" /></Link>
                </Button>
              </div>

              {currentExercise?.instructions && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-xs text-white/40 uppercase tracking-wide mb-1">{t("session.instructions")}</p>
                  <p className="text-sm text-white/70">{currentExercise.instructions}</p>
                </div>
              )}
            </div>

            {panelOpen && <div className="space-y-4">{statPanel}</div>}
          </div>
        </div>
      </div>
    </>
  );
}

export default function Session() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-deep flex items-center justify-center"><p className="text-white/40">…</p></div>}>
      <SessionContent />
    </Suspense>
  );
}
