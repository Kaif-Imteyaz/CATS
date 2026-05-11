"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Play, Lock, CheckCircle, Loader2, X, ChevronRight,
  SkipForward, Maximize2, Minimize2, BookOpen, ChevronDown, Plus, Search,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, VideoRecord } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { EXERCISE_LIBRARY } from "@/lib/poseEngine";
import type { ExerciseMeta } from "@/lib/poseEngine";
import type { RealtimeChannel } from "@supabase/supabase-js";

const CATEGORY_KEYS = [
  { key: "All", i18n: "exercises.filter.all" },
  { key: "Knee", i18n: "exercises.filter.knee" },
  { key: "Shoulder", i18n: "exercises.filter.shoulder" },
  { key: "Lower Back", i18n: "exercises.filter.lower_back" },
  { key: "Posture", i18n: "exercises.filter.posture" },
  { key: "Breathing", i18n: "exercises.filter.breathing" },
];

const DEFAULT_EXERCISES: ExerciseRow[] = [];

interface PlanExercise {
  name: string; tag: string; duration_min: number; difficulty: string; target: string;
}

interface ExerciseRow {
  name: string; duration: string; difficulty: string; target: string; tag: string; status: string;
}

function toRow(ex: PlanExercise, i: number, done: number): ExerciseRow {
  const status = i < done ? "done" : i === done ? "current" : "upcoming";
  return { name: ex.name, duration: `${ex.duration_min} min`, difficulty: ex.difficulty, target: ex.target, tag: ex.tag, status };
}

const SWIPE_THRESHOLD = 80;

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "text-primary bg-primary/10",
  Gentle: "text-primary bg-sage/30",
  Moderate: "text-terracotta bg-terracotta/10",
  Hard: "text-red-600 bg-red-50",
};

function SwipeableCard({
  ex, index, realIndex, totalCount, onSwipeRight, onSwipeLeft, isSelected, onClick,
}: {
  ex: ExerciseRow; index: number; realIndex: number; totalCount: number;
  onSwipeRight: () => void; onSwipeLeft: () => void;
  isSelected: boolean; onClick: () => void;
}) {
  const x = useMotionValue(0);
  const rightBg = useTransform(x, [0, SWIPE_THRESHOLD], ["rgba(47,126,109,0)", "rgba(47,126,109,0.1)"]);
  const leftBg = useTransform(x, [-SWIPE_THRESHOLD, 0], ["rgba(217,123,93,0.1)", "rgba(217,123,93,0)"]);
  const { status } = ex;
  const isSwipeable = status === "current" || status === "upcoming" || status === "done";

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!isSwipeable) return;
    if (info.offset.x > SWIPE_THRESHOLD) onSwipeRight();
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipeLeft();
  };

  const borderColor =
    status === "done" ? "border-l-primary/30" :
    status === "current" ? "border-l-primary" :
    "border-l-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <motion.div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ backgroundColor: rightBg }} aria-hidden="true" />
      <motion.div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ backgroundColor: leftBg }} aria-hidden="true" />

      {isSwipeable && (
        <>
          <motion.div
            className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-primary text-xs font-semibold pointer-events-none"
            style={{ opacity: useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]) }}
            aria-hidden="true"
          >
            <ChevronRight className="w-3.5 h-3.5" />Start
          </motion.div>
          <motion.div
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-terracotta text-xs font-semibold pointer-events-none"
            style={{ opacity: useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]) }}
            aria-hidden="true"
          >
            Skip<SkipForward className="w-3.5 h-3.5" />
          </motion.div>
        </>
      )}

      <motion.div
        drag={isSwipeable ? "x" : false}
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        style={{ x }}
        className={`bg-white border border-l-4 ${borderColor} rounded-2xl px-4 py-3.5 flex items-center gap-3.5 cursor-${isSwipeable ? "grab active:cursor-grabbing" : "pointer"} select-none transition-shadow ${isSelected ? "shadow-md shadow-primary/10 ring-1 ring-primary/20" : "hover:shadow-sm"}`}
        aria-label={`${ex.name}, ${ex.duration}, ${ex.difficulty}${isSwipeable ? ". Swipe right to start, left to skip" : ""}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          status === "done" ? "bg-primary/8" : status === "current" ? "bg-primary" : "bg-muted"
        }`}>
          {status === "done" ? (
            <CheckCircle className="w-5 h-5 text-primary/60" aria-hidden="true" />
          ) : status === "current" ? (
            <Play className="w-4 h-4 text-white" aria-hidden="true" />
          ) : (
            <Lock className="w-4 h-4 text-deep/25" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3
              className={`font-semibold text-sm truncate ${status === "done" ? "text-deep/35 line-through" : "text-deep"}`}
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              {ex.name}
            </h3>
            {status === "current" && (
              <Badge className="bg-primary text-white border-0 text-[10px] px-1.5 py-0 h-4 flex-shrink-0">Now</Badge>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-xs text-deep/45">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" />{ex.duration}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${DIFFICULTY_COLOR[ex.difficulty] ?? "bg-muted text-deep/50"}`}>{ex.difficulty}</span>
            <span className="bg-muted/60 px-1.5 py-0.5 rounded-md text-[10px]">{ex.target}</span>
          </div>
        </div>

        {(status === "current" || status === "upcoming") && (
          <Button
            className={`rounded-xl px-4 h-8 text-xs flex-shrink-0 ${status === "current" ? "bg-primary text-white" : "bg-muted text-deep/60"}`}
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/patient/session?exercise=${realIndex}&total=${totalCount}&name=${encodeURIComponent(ex.name)}`}>Start</Link>
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Exercises() {
  const { user, token, t } = useApp();
  const router = useRouter();
  const [active, setActive] = useState("All");
  const [exercises, setExercises] = useState<ExerciseRow[]>(DEFAULT_EXERCISES);
  const [planLoading, setPlanLoading] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planLabel, setPlanLabel] = useState("Recovery Plan");
  const [addingEx, setAddingEx] = useState(false);
  const [libSearch, setLibSearch] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  const [selectedVideoLoading, setSelectedVideoLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedEx, setSelectedEx] = useState<ExerciseRow | null>(null);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [mobileVideoOpen, setMobileVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoCacheRef = useRef<Map<string, VideoRecord>>(new Map());
  const videoPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userProfileRef = useRef({ age: 50, lang: "en", region: "" });
  const channelRef = useRef<RealtimeChannel | null>(null);

  const clearVideoPoll = useCallback(() => {
    if (videoPollRef.current) { clearInterval(videoPollRef.current); videoPollRef.current = null; }
  }, []);

  useEffect(() => {
    if (!user.id || !token) { setPlanLoading(false); return; }
    const t0 = performance.now();
    import("@/lib/supabaseClient").then(async ({ supabase }) => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [profileRes, planRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("age, lang, region, pain_areas").eq("id", user.id).maybeSingle(),
        supabase.from("plans").select("id, pain_areas, exercises").eq("patient_id", user.id).eq("active", true).maybeSingle(),
        supabase.from("sessions").select("exercise_tag, reps").eq("patient_id", user.id).gte("completed_at", todayStart.toISOString()).gte("reps", 10),
      ]);
      if (profileRes.error) console.error("[CATS] profile load failed:", profileRes.error.message);
      if (planRes.error) console.error("[CATS] plan load failed:", planRes.error.message);
      if (sessionsRes.error) console.error("[CATS] sessions load failed:", sessionsRes.error.message);

      const age = profileRes.data?.age ?? 50;
      const profileLang: string = profileRes.data?.lang ?? "en";
      const profileRegion: string = profileRes.data?.region ?? "";
      userProfileRef.current = { age, lang: profileLang, region: profileRegion };
      const profilePainAreas: string[] = profileRes.data?.pain_areas ?? [];
      const painAreas: string[] = (planRes.data?.pain_areas?.length ? planRes.data.pain_areas : profilePainAreas);
      const painArea = painAreas[0]?.toLowerCase().replace(/ /g, "_") ?? "lower_back";
      const planExercises: PlanExercise[] = planRes.data?.exercises ?? [];
      if (planRes.data?.id) setPlanId(planRes.data.id);
      const doneTags = new Set((sessionsRes.data ?? [])
        .filter((s: { reps: number }) => s.reps >= 10)
        .map((s: { exercise_tag: string }) => s.exercise_tag));

      if (planExercises.length > 0) {
        const rows = planExercises.map((ex, i) => {
          const isDone = doneTags.has(ex.tag);
          const firstUndoneIdx = planExercises.findIndex((e) => !doneTags.has(e.tag));
          const status = isDone ? "done" : i === firstUndoneIdx ? "current" : "upcoming";
          return { name: ex.name, duration: `${ex.duration_min} min`, difficulty: ex.difficulty, target: ex.target, tag: ex.tag, status };
        });
        setExercises(rows);
      } else if (painAreas.length > 0) {
        const fallback = Object.values(EXERCISE_LIBRARY)
          .filter((ex) => painAreas.some((pa) =>
            ex.target.toLowerCase().includes(pa.toLowerCase()) ||
            pa.toLowerCase().includes(ex.target.toLowerCase())
          ))
          .slice(0, 5)
          .map((ex, i) => ({
            name: ex.name, tag: ex.tag,
            duration: `${ex.duration_min} min`,
            difficulty: ex.difficulty, target: ex.target,
            status: i === 0 ? "current" : "upcoming",
          }));
        if (fallback.length > 0) setExercises(fallback);
      }
      setPlanLabel(`${painArea.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Recovery`);
      setPlanLoading(false);
      console.log(`[CATS] exercises load: ${(performance.now() - t0).toFixed(1)}ms`);
    });
    return () => clearVideoPoll();
  }, [user.id, token, clearVideoPoll]);

  useEffect(() => {
    const current = exercises.find((e) => e.status === "current");
    setSelectedEx(current ?? exercises[0] ?? null);
  }, [exercises]);

  useEffect(() => {
    if (!selectedEx || !token) return;
    const tag = selectedEx.tag;

    const cached = videoCacheRef.current.get(tag);
    if (cached) {
      setSelectedVideo(cached);
      return;
    }

    clearVideoPoll();
    setSelectedVideo(null);
    setSelectedVideoLoading(true);

    const { age, lang, region } = userProfileRef.current;
    api.video.exercise(tag, age, token, lang, region)
      .then((vid) => {
        videoCacheRef.current.set(tag, vid);
        setSelectedVideo(vid);
        if (vid.status === "pending") {
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 10000);
          videoPollRef.current = setInterval(async () => {
            try {
              const updated = await api.video.status(vid.id, token);
              if (updated.status !== "pending") {
                videoCacheRef.current.set(tag, updated);
                setSelectedVideo(updated);
                clearVideoPoll();
              }
            } catch { clearVideoPoll(); }
          }, 4000);
        }
      })
      .catch(() => {})
      .finally(() => setSelectedVideoLoading(false));
  }, [selectedEx?.tag, token, clearVideoPoll]);

  useEffect(() => {
    if (!user.id) return;
    const channel = supabase
      .channel(`exercises-rt:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sessions", filter: `patient_id=eq.${user.id}` },
        (payload) => {
          const newRow = payload.new as { exercise_tag: string; reps: number };
          if (newRow.reps < 10) return;
          const tag = newRow.exercise_tag;
          setExercises((prev) => {
            const doneTags = new Set(prev.filter((e) => e.status === "done").map((e) => e.tag));
            doneTags.add(tag);
            const firstUndoneIdx = prev.findIndex((e) => !doneTags.has(e.tag));
            return prev.map((e, i) => {
              const isDone = doneTags.has(e.tag);
              return { ...e, status: isDone ? "done" : i === firstUndoneIdx ? "current" : "upcoming" };
            });
          });
        })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    };
  }, [user.id]);

  const filtered = active === "All" ? exercises : exercises.filter((e) => e.tag === active);
  const doneCount = exercises.filter((e) => e.status === "done").length;
  const progress = exercises.length ? Math.round((doneCount / exercises.length) * 100) : 0;

  const handleAddExercise = async (meta: ExerciseMeta) => {
    const newRow: ExerciseRow = {
      name: meta.name, tag: meta.tag,
      duration: `${meta.duration_min} min`,
      difficulty: meta.difficulty, target: meta.target,
      status: "upcoming",
    };
    setExercises((prev) => {
      const updated = [...prev, newRow];
      const doneSet = new Set(updated.filter((e) => e.status === "done").map((e) => e.tag));
      const firstUndone = updated.findIndex((e) => !doneSet.has(e.tag));
      return updated.map((e, i) => doneSet.has(e.tag) ? e : { ...e, status: i === firstUndone ? "current" : "upcoming" });
    });
    setAddingEx(false);
    setLibSearch("");

    const { supabase: sb } = await import("@/lib/supabaseClient");
    const exerciseItem = {
      name: meta.name,
      tag: meta.tag,
      duration_min: meta.duration_min,
      difficulty: meta.difficulty,
      target: meta.target,
      instructions: meta.instructions,
    };

    if (!planId) {
      if (!user.id) return;
      const { data: insertData, error: insertError } = await sb.from("plans").insert({
        patient_id: user.id,
        physio_id: null,
        pain_areas: [],
        exercises: [exerciseItem],
        active: true,
      }).select("id").single();
      if (insertError) {
        console.error("[CATS] failed to create plan for added exercise:", insertError.message);
        return;
      }
      if (insertData?.id) setPlanId(insertData.id);
      return;
    }

    const { data, error } = await sb.from("plans").select("exercises").eq("id", planId).single();
    if (error) {
      console.error("[CATS] failed to fetch plan exercises:", error.message);
      return;
    }
    const merged = [
      ...(data?.exercises ?? []),
      exerciseItem,
    ];
    const { error: updateError } = await sb.from("plans").update({ exercises: merged }).eq("id", planId);
    if (updateError) {
      console.error("[CATS] failed to save added exercise:", updateError.message);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setVideoExpanded(false);
      } else {
        videoRef.current.requestFullscreen?.();
        setVideoExpanded(true);
      }
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{t("exercises.title")}</h1>
            <p className="text-deep/45 text-sm mt-0.5">{planLabel} · {t("common.today")}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setAddingEx(true)}
              aria-label="Add exercise from library"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/70 transition-colors bg-primary/8 px-2.5 py-1.5 rounded-full"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />Add
            </button>
            <Link
              href="/patient/exercises/library"
              className="flex items-center gap-1.5 text-xs font-medium text-deep/40 hover:text-primary transition-colors"
              aria-label="Browse exercise library"
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-full h-1.5">
            <motion.div
              className="bg-primary h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-semibold text-deep/50 flex-shrink-0">
            {doneCount}/{exercises.length} {t("exercises.done_label")}
          </span>
        </div>
      </motion.div>

      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <div
            className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide"
            role="group"
            aria-label="Filter by category"
          >
            {CATEGORY_KEYS.map(({ key, i18n: i18nKey }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                aria-pressed={active === key}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  active === key
                    ? "bg-primary text-white"
                    : "bg-white text-deep/55 hover:bg-sage/20 border border-border"
                }`}
              >
                {t(i18nKey)}
              </button>
            ))}
          </div>

          {!selectedVideoLoading && selectedVideo?.status === "pending" && (
            <div className="mb-4 bg-white rounded-2xl p-3.5 border border-border flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-deep">Generating exercise demo…</p>
                <p className="text-[10px] text-deep/35 mt-0.5">1-2 minutes · Updates automatically</p>
              </div>
            </div>
          )}

          {!selectedVideoLoading && selectedVideo?.status === "ready" && selectedVideo.url && (
            <div className="mb-4 lg:hidden">
              <button
                onClick={() => setMobileVideoOpen((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-border text-sm font-medium text-deep"
                aria-expanded={mobileVideoOpen}
              >
                <span className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  Exercise Demo
                </span>
                <ChevronDown className={`w-4 h-4 text-deep/40 transition-transform ${mobileVideoOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              <AnimatePresence>
                {mobileVideoOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 bg-white rounded-2xl overflow-hidden border border-border">
                      <div className="relative">
                        <video
                          ref={videoRef}
                          src={selectedVideo!.url}
                          controls
                          className="w-full max-h-52 bg-black object-cover"
                          preload="metadata"
                        />
                        <button
                          onClick={handleFullscreen}
                          aria-label={videoExpanded ? "Exit fullscreen" : "Fullscreen video"}
                          className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-lg hover:bg-black/80 transition-colors"
                        >
                          {videoExpanded ? <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />}
                        </button>
                      </div>
                      <div className="px-3 py-2 flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Demo</Badge>
                        <p className="text-xs text-deep/50 truncate">{selectedVideo!.title}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="space-y-2.5">
            {planLoading && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3.5 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-2.5 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
            {!planLoading && filtered.map((ex, i) => {
              const realIndex = exercises.findIndex((e) => e.name === ex.name);
              return (
                <SwipeableCard
                  key={ex.name}
                  ex={ex}
                  index={i}
                  realIndex={realIndex}
                  totalCount={exercises.length}
                  isSelected={selectedEx?.name === ex.name}
                  onClick={() => setSelectedEx(ex)}
                  onSwipeRight={() => {
                    if (ex.status === "current" || ex.status === "upcoming") {
                      router.push(`/patient/session?exercise=${realIndex}&total=${exercises.length}&name=${encodeURIComponent(ex.name)}`);
                    }
                  }}
                  onSwipeLeft={() => {
                    const nextIdx = exercises.findIndex((e, i) => i > realIndex && e.status !== "done");
                    if (nextIdx !== -1) {
                      router.push(`/patient/session?exercise=${nextIdx}&total=${exercises.length}&name=${encodeURIComponent(exercises[nextIdx].name)}`);
                    }
                  }}
                />
              );
            })}

            {!planLoading && filtered.length === 0 && (
              <p className="text-center text-deep/35 text-sm py-10">No exercises in this category today.</p>
            )}
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            {selectedVideoLoading ? (
              <div className="bg-white rounded-3xl aspect-video flex items-center justify-center border border-border">
                <Loader2 className="w-5 h-5 text-primary/40 animate-spin" />
              </div>
            ) : selectedVideo?.status === "ready" && selectedVideo.url ? (
              <div className="bg-white rounded-3xl overflow-hidden border border-border">
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={selectedVideo.url}
                    controls
                    className="w-full aspect-video bg-black object-cover"
                    preload="metadata"
                  />
                  <button
                    onClick={handleFullscreen}
                    aria-label={videoExpanded ? "Exit fullscreen" : "Fullscreen video"}
                    className="absolute bottom-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70 transition-colors"
                  >
                    {videoExpanded ? <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />}
                  </button>
                </div>
                <div className="px-4 py-3 flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Demo</Badge>
                  <p className="text-xs text-deep/50 truncate">{selectedVideo.title}</p>
                </div>
              </div>
            ) : selectedVideo?.status === "pending" ? (
              <div className="bg-white rounded-3xl aspect-video border border-border flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-deep">Generating demo…</p>
                  <p className="text-xs text-deep/40 mt-0.5">AI-personalised · 1–2 min</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl aspect-video border border-border flex items-center justify-center">
                <p className="text-xs text-deep/30">No video available</p>
              </div>
            )}

            {selectedEx && (
              <div className="bg-white rounded-3xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    selectedEx.status === "done" ? "bg-primary/8" :
                    selectedEx.status === "current" ? "bg-primary" : "bg-muted"
                  }`}>
                    {selectedEx.status === "done" ? (
                      <CheckCircle className="w-4 h-4 text-primary/60" aria-hidden="true" />
                    ) : selectedEx.status === "current" ? (
                      <Play className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-deep/25" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{selectedEx.name}</h3>
                    <p className="text-xs text-deep/45">{selectedEx.target} · {selectedEx.duration}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge className={`border-0 text-[10px] ${DIFFICULTY_COLOR[selectedEx.difficulty] ?? "bg-muted text-deep/50"}`}>
                    {selectedEx.difficulty}
                  </Badge>
                  <Badge className="bg-muted text-deep/50 border-0 text-[10px]">{selectedEx.tag}</Badge>
                </div>

                {selectedEx.status !== "done" && (
                  <Button className="w-full bg-primary text-white rounded-xl h-9 text-sm" asChild>
                    <Link href={`/patient/session?exercise=${exercises.findIndex((e) => e.name === selectedEx.name)}&total=${exercises.length}&name=${encodeURIComponent(selectedEx.name)}`}>
                      {selectedEx.status === "current" ? t("exercises.start_exercise") : t("exercises.start_anyway")}
                    </Link>
                  </Button>
                )}
              </div>
            )}

            <Link
              href="/patient/exercises/library"
              className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-border hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-deep">Exercise Library</p>
                  <p className="text-[10px] text-deep/40">ROM ranges · Instructions · All exercises</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-deep/25 group-hover:text-primary transition-colors" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-deep text-white rounded-t-3xl p-5 pb-10 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
                <div>
                  <p className="font-bold text-sm">Generating exercise video</p>
                  <p className="text-xs text-white/45 mt-0.5">AI-personalised for your plan</p>
                </div>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                aria-label="Dismiss"
                className="text-white/30 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mt-2">
              Demo video for your exercises. Takes ~1–2 minutes. Appears automatically when ready.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addingEx && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => { setAddingEx(false); setLibSearch(""); }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[80vh] flex flex-col"
              role="dialog"
              aria-label="Add exercise from library"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                <p className="font-bold text-deep text-base" style={{ fontFamily: "var(--font-poppins)" }}>Add Exercise</p>
                <button onClick={() => { setAddingEx(false); setLibSearch(""); }} aria-label="Close" className="text-deep/30 hover:text-deep p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-deep/35 flex-shrink-0" aria-hidden="true" />
                  <input
                    type="text"
                    value={libSearch}
                    onChange={(e) => setLibSearch(e.target.value)}
                    placeholder="Search exercises…"
                    className="flex-1 bg-transparent text-sm text-deep placeholder:text-deep/35 outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto px-5 pb-8 space-y-2 flex-1">
                {Object.values(EXERCISE_LIBRARY)
                  .filter((m) => {
                    const q = libSearch.toLowerCase();
                    return !q || m.name.toLowerCase().includes(q) || m.target.toLowerCase().includes(q);
                  })
                  .filter((m) => !exercises.some((e) => e.name === m.name))
                  .map((meta) => (
                    <button
                      key={meta.name}
                      onClick={() => handleAddExercise(meta)}
                      className="w-full flex items-center gap-3 bg-white border border-border rounded-2xl px-4 py-3 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10">
                        <Plus className="w-4 h-4 text-deep/30 group-hover:text-primary" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-deep truncate">{meta.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-deep/40">{meta.target}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${DIFFICULTY_COLOR[meta.difficulty] ?? "bg-muted text-deep/50"}`}>{meta.difficulty}</span>
                          <span className="text-[10px] text-deep/40 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{meta.duration_min}m</span>
                        </div>
                      </div>
                    </button>
                  ))}
                {Object.values(EXERCISE_LIBRARY).filter((m) => {
                  const q = libSearch.toLowerCase();
                  return (!q || m.name.toLowerCase().includes(q) || m.target.toLowerCase().includes(q)) && !exercises.some((e) => e.name === m.name);
                }).length === 0 && (
                  <p className="text-center text-deep/35 text-sm py-8">No exercises found.</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
