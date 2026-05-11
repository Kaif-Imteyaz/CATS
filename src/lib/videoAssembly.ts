import type { Lang } from "@/context/AppContext";
import type { PatientProfile, TherapyPlan } from "./therapyEngine";

export interface VideoModule {
  id: string;
  src: string;
  subtitleSrc?: string;
  voiceOverLang: Lang;
  duration: number;
  tag: string;
}

export interface AssembledSession {
  modules: VideoModule[];
  totalDuration: number;
  voiceLang: Lang;
  hasSubtitles: boolean;
  pacing: "slow" | "moderate" | "normal";
}

const MODULE_LIBRARY: Record<string, Omit<VideoModule, "voiceOverLang">> = {
  "breathing-warmup": { id: "breathing-warmup", src: "/videos/warmup.mp4", subtitleSrc: "/subtitles/warmup.vtt", duration: 300, tag: "warmup" },
  "knee-raise-assisted": { id: "knee-raise-assisted", src: "/videos/knee_raise.mp4", subtitleSrc: "/subtitles/knee_raise.vtt", duration: 600, tag: "knee-raise" },
  "seated-leg-lift": { id: "seated-leg-lift", src: "/videos/seated_leg_lift.mp4", subtitleSrc: "/subtitles/seated_leg_lift.vtt", duration: 480, tag: "knee-raise" },
  "chair-stand": { id: "chair-stand", src: "/videos/chair_stand.mp4", subtitleSrc: "/subtitles/chair_stand.vtt", duration: 420, tag: "knee-raise" },
  "shoulder-roll": { id: "shoulder-roll", src: "/videos/shoulder_roll.mp4", subtitleSrc: "/subtitles/shoulder_roll.vtt", duration: 360, tag: "shoulder-raise" },
  "arm-raise": { id: "arm-raise", src: "/videos/arm_raise.mp4", subtitleSrc: "/subtitles/arm_raise.vtt", duration: 480, tag: "shoulder-raise" },
  "pelvic-tilt": { id: "pelvic-tilt", src: "/videos/pelvic_tilt.mp4", subtitleSrc: "/subtitles/pelvic_tilt.vtt", duration: 480, tag: "hip-flex" },
  "cooldown": { id: "cooldown", src: "/videos/cooldown.mp4", subtitleSrc: "/subtitles/cooldown.vtt", duration: 300, tag: "cooldown" },
};

export function assembleSession(plan: TherapyPlan, profile: PatientProfile): AssembledSession {
  const modules: VideoModule[] = plan.exercises
    .map((ex) => {
      const mod = MODULE_LIBRARY[ex.id];
      if (!mod) return null;
      return {
        ...mod,
        voiceOverLang: profile.language,
        duration: plan.pacing === "slow" ? Math.round(mod.duration * 1.3) : mod.duration,
      };
    })
    .filter(Boolean) as VideoModule[];

  const totalDuration = modules.reduce((sum, m) => sum + m.duration, 0);

  return {
    modules,
    totalDuration,
    voiceLang: profile.language,
    hasSubtitles: profile.language !== "en" || profile.age >= 60,
    pacing: plan.pacing,
  };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
