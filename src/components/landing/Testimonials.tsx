"use client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Maria González",
    role: "Knee recovery",
    text: "After my surgery I was worried about exercising on my own. CATS kept me on track and my physiotherapist could see my progress without me needing to come in every week.",
    stars: 5,
    weeks: "6 weeks",
  },
  {
    name: "Ahmed Khan",
    role: "Lower back pain",
    text: "Being able to follow along in Hindi made a real difference. The instructions were clear and I never felt lost during a session.",
    stars: 5,
    weeks: "4 weeks",
  },
  {
    name: "Priya Sharma",
    role: "Shoulder rehabilitation",
    text: "My physiotherapist updated my plan based on what she saw in my sessions. That kind of back-and-forth is hard to get when you're doing home rehab.",
    stars: 5,
    weeks: "8 weeks",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6 bg-card">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-semibold text-sm mb-3 uppercase tracking-widest">What people say</p>
          <h2 className="text-4xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            From people using CATS
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map(({ name, role, text, stars, weeks }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-cream rounded-3xl p-7 flex flex-col gap-4"
            >
              <div className="flex gap-1">
                {Array(stars).fill(0).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-terracotta text-terracotta" />
                ))}
              </div>
              <p className="text-deep/70 leading-relaxed text-sm flex-1">"{text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{name[0]}</span>
                </div>
                <div>
                  <p className="font-bold text-deep text-sm" style={{ fontFamily: "var(--font-poppins)" }}>{name}</p>
                  <p className="text-xs text-deep/50">{role}</p>
                </div>
                <span className="ml-auto text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">{weeks}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
