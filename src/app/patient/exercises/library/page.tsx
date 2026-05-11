"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Activity, Target, Play, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EXERCISE_LIBRARY, ROM_CONFIGS } from "@/lib/poseEngine";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";

const AREAS = ["All", "Knee", "Shoulder", "Hip", "Lower Back", "Ankle", "Neck", "Elbow", "Wrist", "Full Body"];

const DIFFICULTY_STYLE: Record<string, string> = {
  Easy: "bg-primary/10 text-primary",
  Gentle: "bg-sage/40 text-deep",
  Moderate: "bg-terracotta/10 text-terracotta",
  Hard: "bg-red-50 text-red-600",
};

export default function ExerciseLibrary() {
  const { user, token } = useApp();
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [videos, setVideos] = useState<Record<string, { url: string; status: string } | null>>({});

  const allExercises = Object.values(EXERCISE_LIBRARY);
  const filtered = filter === "All" ? allExercises : allExercises.filter((e) => e.target === filter);

  const toggleCard = async (tag: string) => {
    const key = tag;
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);

    if (!token || videos[key] !== undefined) return;
    try {
      import("@/lib/supabaseClient").then(async ({ supabase }) => {
        const { data } = await supabase
          .from("exercise_videos")
          .select("url, status")
          .eq("pain_area", tag)
          .eq("status", "ready")
          .limit(1)
          .maybeSingle();
        setVideos((v) => ({ ...v, [key]: data ? { url: data.url, status: data.status } : null }));
      });
    } catch {
      setVideos((v) => ({ ...v, [key]: null }));
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link
          href="/patient/exercises"
          className="inline-flex items-center gap-1.5 text-xs text-deep/50 hover:text-deep mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to exercises
        </Link>
        <h1 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Exercise Library</h1>
        <p className="text-deep/45 text-sm mt-0.5">{allExercises.length} exercises · Range of motion targets</p>
      </motion.div>

      <div
        className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide"
        role="group"
        aria-label="Filter by target area"
      >
        {AREAS.map((area) => (
          <button
            key={area}
            onClick={() => setFilter(area)}
            aria-pressed={filter === area}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              filter === area
                ? "bg-primary text-white"
                : "bg-white text-deep/55 hover:bg-sage/20 border border-border"
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ex, i) => {
          const rom = ROM_CONFIGS[ex.tag] ?? ROM_CONFIGS.default;
          const key = ex.tag;
          const isOpen = expanded === key;
          const vid = videos[key];

          return (
            <motion.div
              key={ex.tag + ex.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-border hover:border-primary/20 hover:shadow-sm transition-all overflow-hidden"
            >
              <button
                className="w-full text-left p-4"
                onClick={() => toggleCard(key)}
                aria-expanded={isOpen}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-sm text-deep leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                    {ex.name}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge className={`text-[10px] border-0 ${DIFFICULTY_STYLE[ex.difficulty] ?? "bg-muted text-deep/50"}`}>
                      {ex.difficulty}
                    </Badge>
                    <ChevronDown className={`w-3.5 h-3.5 text-deep/30 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 text-xs text-deep/45">
                    <Target className="w-3 h-3" aria-hidden="true" />
                    <span>{ex.target}</span>
                  </div>
                  <span className="text-deep/20">·</span>
                  <span className="text-xs text-deep/45">{ex.duration_min} min</span>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Activity className="w-3 h-3 text-primary" aria-hidden="true" />
                    <span className="text-[10px] font-semibold text-deep/50 uppercase tracking-wide">ROM Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="h-1.5 bg-white rounded-full relative overflow-hidden">
                        <div
                          className="h-1.5 bg-primary rounded-full absolute"
                          style={{ left: `${(rom.min / 180) * 100}%`, width: `${((rom.max - rom.min) / 180) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-deep flex-shrink-0">{rom.min}°–{rom.max}°</span>
                  </div>
                </div>

                {/* <p className="text-xs text-deep/55 leading-relaxed">{ex.instructions}</p> */}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="p-4">
                      {vid === undefined ? (
                        <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : vid?.url ? (
                        <div className="rounded-xl overflow-hidden">
                          <video
                            src={vid.url}
                            controls
                            className="w-full aspect-video bg-black object-cover"
                            preload="metadata"
                          />
                          <p className="text-[10px] text-deep/40 mt-1.5">Demo video · {ex.target}</p>
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted/50 rounded-xl flex flex-col items-center justify-center gap-2 text-center p-4">
                          <Play className="w-6 h-6 text-deep/20" aria-hidden="true" />
                          <p className="text-xs text-deep/40">No video available for this exercise yet.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-deep/35 text-sm py-16">No exercises for this area.</p>
      )}
    </div>
  );
}
