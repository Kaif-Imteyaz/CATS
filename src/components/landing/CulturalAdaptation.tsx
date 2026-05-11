"use client";
import { motion } from "framer-motion";
import { Globe, Languages, Home, Heart } from "lucide-react";

const features = [
  { icon: Languages, title: "Multiple languages", desc: "English, Hindi, Urdu, with more being added" },
  { icon: Home, title: "No equipment needed", desc: "Exercises designed for home use, any room, any setup" },
  { icon: Globe, title: "Works anywhere", desc: "Low-end phones, slow connections, basic cameras" },
  { icon: Heart, title: "Familiar communication", desc: "Guidance adapted to your language and background" },
];

export default function CulturalAdaptation() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-sage/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary font-semibold text-sm mb-3 uppercase tracking-widest">Built for everyone</p>
            <h2 className="text-4xl font-bold text-deep mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
              Works in your language, from your home
            </h2>
            <p className="text-deep/60 leading-relaxed mb-8">
              You do not need a gym or a clinical setting to follow your rehabilitation plan. CATS works without special equipment and supports multiple languages so guidance feels natural.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-card rounded-2xl p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-deep text-sm mb-1" style={{ fontFamily: "var(--font-poppins)" }}>{title}</h3>
                  <p className="text-xs text-deep/50">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-card rounded-3xl p-8 shadow-sm">
              <p className="text-sm font-semibold text-deep/50 mb-4">Example session</p>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary font-bold">C</span>
                  </div>
                  <div className="bg-cream rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
                    <p className="text-sm text-deep">नमस्ते। आज हम धीरे-धीरे कंधे की कसरत करेंगे।</p>
                    <p className="text-xs text-deep/40 mt-1">Namaste. Today we start with gentle shoulder movements.</p>
                  </div>
                </div>
                <div className="bg-cream rounded-2xl p-4">
                  <p className="text-xs text-deep/50 mb-2">Session settings</p>
                  <div className="flex flex-wrap gap-2">
                    {["Chair-based", "Slower pace", "Hindi audio", "Home environment"].map(t => (
                      <span key={t} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 items-center p-3 bg-sage/20 rounded-2xl">
                  <Globe className="w-4 h-4 text-primary" />
                  <p className="text-xs text-deep/70">Age 72. Knee osteoarthritis. Hindi. Limited mobility.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
