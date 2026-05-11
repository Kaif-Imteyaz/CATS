"use client";
import { LazyMotion, domAnimation, m as motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Smartphone, ScanLine, Globe } from "lucide-react";

const trust = [
  { icon: CheckCircle, label: "Supervised by physiotherapists" },
  { icon: Smartphone, label: "Works on any device" },
  { icon: ScanLine, label: "Tracks range of motion" },
  { icon: Globe, label: "English, Hindi, Urdu and more" },
];

export default function Hero() {
  return (
    <LazyMotion features={domAnimation} strict>
    <section className="min-h-screen flex items-center pt-20 px-6">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">CATS</span>
            <Badge className="bg-sage/30 text-primary border-0 w-fit px-4 py-1.5 rounded-full text-sm font-medium">
              Culturally Adaptive Therapeutic System
            </Badge>
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-deep leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
            Guided recovery,{" "}
            <span className="text-primary">from home.</span>
          </h1>

          <p className="text-lg text-deep/60 leading-relaxed max-w-md">
            AI-powered rehabilitation with real-time posture feedback, culturally adapted for your language and region. Supervised by your physiotherapist.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20"
              asChild
            >
              <Link href="/onboarding">Start your recovery</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/5 rounded-full px-8 py-6 text-base font-semibold"
              asChild
            >
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            {trust.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-deep/60">
                <Icon className="w-4 h-4 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-muted to-background p-8 min-h-[480px] flex items-center justify-center border border-border">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-muted/50" />

            <div className="relative z-10 flex flex-col gap-4 w-full max-w-sm">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="bg-card rounded-2xl p-4 shadow-md border border-border"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ScanLine className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-deep/50">Knee flexion</p>
                    <p className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Week 4</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "72%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="bg-primary h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-primary font-semibold mt-1">Range of motion: 72 degrees</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="bg-card rounded-2xl p-4 shadow-md border border-border self-end w-64"
              >
                <p className="text-xs text-deep/50 mb-1">Posture feedback</p>
                <p className="text-sm text-deep font-medium">"Straighten your back slightly"</p>
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 4 ? "bg-primary" : "bg-muted"}`} />
                  ))}
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                className="bg-card rounded-2xl p-4 shadow-md border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-sage/40" />
                  <div>
                    <p className="text-xs font-semibold text-deep">Dr. Sarah Ahmed</p>
                    <p className="text-xs text-deep/50">Physiotherapist</p>
                  </div>
                  <Badge className="ml-auto bg-primary/10 text-primary border-0 text-xs">Online</Badge>
                </div>
                <p className="text-xs text-deep/60">"Good session today. Keep working on your knee exercises."</p>
              </motion.div>
            </div>
          </div>

          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/15 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        </motion.div>
      </div>
    </section>
    </LazyMotion>
  );
}
