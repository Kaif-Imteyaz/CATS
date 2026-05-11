"use client";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, MessageCircle, TrendingUp } from "lucide-react";

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-semibold text-sm mb-3 uppercase tracking-widest">Your progress</p>
          <h2 className="text-4xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            Everything in one place
          </h2>
          <p className="text-deep/50 mt-4 max-w-xl mx-auto">
            Patients see their daily exercises and recovery data. Physiotherapists monitor sessions and update plans.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl p-8 shadow-sm"
          >
            <p className="text-sm font-semibold text-deep/50 mb-6 uppercase tracking-wide">Patient view</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-cream rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-deep">Session streak</p>
                  <p className="text-xs text-deep/50">12 days in a row</p>
                </div>
                <Badge className="bg-primary text-white border-0">Active</Badge>
              </div>

              <div className="p-4 bg-cream rounded-2xl">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-semibold text-deep">Today</p>
                  <p className="text-sm text-primary font-bold">68%</p>
                </div>
                <Progress value={68} className="h-2 bg-muted" />
                <p className="text-xs text-deep/50 mt-2">3 of 5 exercises done</p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-cream rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-terracotta/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-terracotta" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-deep">Physiotherapist note</p>
                  <p className="text-xs text-deep/50">"Good progress on your knee this week."</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-cream rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-sage/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-deep">Next session</p>
                  <p className="text-xs text-deep/50">Tomorrow at 10:00</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl p-8 shadow-sm"
          >
            <p className="text-sm font-semibold text-deep/50 mb-6 uppercase tracking-wide">Physiotherapist view</p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Active patients", val: "48" },
                  { label: "Sessions today", val: "12" },
                  { label: "Flagged", val: "3" },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-cream rounded-2xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-poppins)" }}>{val}</p>
                    <p className="text-xs text-deep/50 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-cream rounded-2xl">
                <p className="text-sm font-semibold text-deep mb-3">Session completion</p>
                {[
                  { name: "Maria G.", pct: 92 },
                  { name: "Ahmed K.", pct: 74 },
                  { name: "Priya S.", pct: 61 },
                ].map(({ name, pct }) => (
                  <div key={name} className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-sage/40 flex-shrink-0" />
                    <p className="text-xs text-deep w-20">{name}</p>
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs font-semibold text-primary w-8">{pct}%</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 p-4 bg-cream rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-deep">Range of motion</p>
                  <p className="text-xs text-deep/50">Average knee ROM up 12 degrees this week</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
