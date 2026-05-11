"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, Volume2, VolumeX, Subtitles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AssembledSession } from "@/lib/videoAssembly";
import { formatDuration } from "@/lib/videoAssembly";

interface Props {
  session: AssembledSession;
  onComplete?: () => void;
  elderMode?: boolean;
}

export default function ModularVideoPlayer({ session, onComplete, elderMode = false }: Props) {
  const [moduleIdx, setModuleIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showSubs, setShowSubs] = useState(session.hasSubtitles);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = session.modules[moduleIdx];
  const isLast = moduleIdx === session.modules.length - 1;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setPlaying((p) => !p);
  };

  const nextModule = () => {
    if (isLast) { onComplete?.(); return; }
    setModuleIdx((i) => i + 1);
    setProgress(0);
    setPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
  };

  if (!current) return null;

  return (
    <div className={`bg-deep rounded-3xl overflow-hidden ${elderMode ? "text-xl" : ""}`}>
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={current.src}
          className="w-full h-full object-cover"
          muted={muted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={nextModule}
          playsInline
        />

        {!playing && (
          <button
            onClick={togglePlay}
            className={`absolute inset-0 flex items-center justify-center bg-black/30 group`}
          >
            <div className={`rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-105 transition-transform ${elderMode ? "w-24 h-24" : "w-16 h-16"}`}>
              <Play className={`text-white ${elderMode ? "w-10 h-10" : "w-7 h-7"}`} />
            </div>
          </button>
        )}

        {showSubs && (
          <div className="absolute bottom-16 left-4 right-4">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/70 rounded-xl px-4 py-2 text-center"
              >
                <p className={`text-white ${elderMode ? "text-lg" : "text-sm"}`}>
                  {current.tag === "warmup" ? "Breathe in slowly... and out." :
                   current.tag === "cooldown" ? "Well done. Relax and breathe." :
                   "Follow the movement. Go at your own pace."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={`font-bold text-white ${elderMode ? "text-lg" : "text-sm"}`} style={{ fontFamily: "var(--font-poppins)" }}>
              {current.id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-white/40" />
              <span className="text-xs text-white/40">{formatDuration(current.duration)}</span>
              <Badge className="bg-primary/20 text-primary border-0 text-xs">{current.tag}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/30">Module</p>
            <p className="text-sm font-bold text-white">{moduleIdx + 1}/{session.modules.length}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={togglePlay}
            className={`flex-1 bg-primary text-white rounded-2xl ${elderMode ? "h-14 text-base" : "h-10"}`}
          >
            {playing ? <><Pause className="w-4 h-4 mr-2" />Pause</> : <><Play className="w-4 h-4 mr-2" />Play</>}
          </Button>
          <Button onClick={() => setMuted((m) => !m)} className="bg-white/10 text-white rounded-2xl w-10 h-10 p-0">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button onClick={() => setShowSubs((s) => !s)} className={`bg-white/10 text-white rounded-2xl w-10 h-10 p-0 ${showSubs ? "ring-1 ring-primary" : ""}`}>
            <Subtitles className="w-4 h-4" />
          </Button>
          <Button onClick={nextModule} className="bg-white/10 text-white rounded-2xl w-10 h-10 p-0">
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-1 mt-3">
          {session.modules.map((_, i) => (
            <div
              key={i}
              onClick={() => { setModuleIdx(i); setProgress(0); setPlaying(false); }}
              className={`flex-1 h-1 rounded-full cursor-pointer transition-all ${
                i < moduleIdx ? "bg-primary" : i === moduleIdx ? "bg-primary/60" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
