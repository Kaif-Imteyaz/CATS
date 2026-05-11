"use client";
import { motion } from "framer-motion";
import { ClipboardList, Dumbbell, BarChart2 } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Tell us about yourself",
    desc: "Share your pain areas, how you move, and what you're recovering from. This gives your physiotherapist and CATS a starting point.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Dumbbell,
    step: "02",
    title: "Get a plan built for you",
    desc: "Your physiotherapist reviews your information and sets up a rehabilitation plan. CATS walks you through each exercise at home.",
    color: "bg-terracotta/10 text-terracotta",
  },
  {
    icon: BarChart2,
    step: "03",
    title: "Follow along and improve",
    desc: "Your camera measures joint angles and counts your reps. Feedback is given in real time. Progress is visible to your physiotherapist.",
    color: "bg-sage/30 text-primary",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-semibold text-sm mb-3 uppercase tracking-widest">Getting Started</p>
          <h2 className="text-4xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            Three simple steps
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, step, title, desc, color }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <span className="absolute top-6 right-6 text-6xl font-bold text-muted/50" style={{ fontFamily: "var(--font-poppins)" }}>
                {step}
              </span>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${color}`}>
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-deep mb-3" style={{ fontFamily: "var(--font-poppins)" }}>{title}</h3>
              <p className="text-deep/60 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
