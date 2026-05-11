"use client";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock, Dumbbell, Activity, AlignCenter, ScanLine, RotateCcw, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const exercises: { name: string; duration: string; difficulty: string; target: string; tag: string; icon: LucideIcon }[] = [
  { name: "Shoulder Mobility", duration: "12 min", difficulty: "Gentle", target: "Shoulder", tag: "Shoulder", icon: Dumbbell },
  { name: "Knee Recovery", duration: "15 min", difficulty: "Moderate", target: "Knee", tag: "Knee", icon: Activity },
  { name: "Lower Back Relief", duration: "10 min", difficulty: "Gentle", target: "Spine", tag: "Lower Back", icon: AlignCenter },
  { name: "Posture Correction", duration: "8 min", difficulty: "Easy", target: "Core", tag: "Posture", icon: ScanLine },
  { name: "Hip Flexibility", duration: "14 min", difficulty: "Gentle", target: "Hip", tag: "Hip", icon: RotateCcw },
  { name: "Breathing Exercises", duration: "6 min", difficulty: "Easy", target: "Full Body", tag: "Breathing", icon: Wind },
];

const colors = [
  "from-primary/10 to-sage/20",
  "from-terracotta/10 to-cream",
  "from-sage/20 to-primary/5",
  "from-primary/5 to-sage/10",
  "from-cream to-terracotta/10",
  "from-sage/10 to-primary/10",
];

export default function ExercisePreview() {
  return (
    <section id="features" className="py-24 px-6 bg-card">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-semibold text-sm mb-3 uppercase tracking-widest">Exercise Library</p>
          <h2 className="text-4xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            Exercises for real recovery
          </h2>
          <p className="text-deep/50 mt-4 max-w-xl mx-auto">
            Each session is matched to your condition and adjusted as you improve.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex, i) => (
            <motion.div
              key={ex.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className={`h-40 bg-gradient-to-br ${colors[i]} flex items-center justify-center`}>
                <div className="w-16 h-16 rounded-2xl bg-background/60 flex items-center justify-center">
                  <ex.icon className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="p-5">
                <Badge className="bg-primary/10 text-primary border-0 text-xs mb-3">{ex.tag}</Badge>
                <h3 className="font-bold text-deep text-base mb-2" style={{ fontFamily: "var(--font-poppins)" }}>{ex.name}</h3>
                <div className="flex items-center gap-4 text-sm text-deep/50">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{ex.duration}</span>
                  <span>{ex.difficulty}</span>
                  <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">{ex.target}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
