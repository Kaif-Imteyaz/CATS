"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is CATS a medical device?",
    a: "No. CATS is an assistive wellness and rehabilitation support platform. It is not a medical device, does not provide diagnosis or clinical treatment, and does not replace a physiotherapist or doctor.",
  },
  {
    q: "Who is CATS designed for?",
    a: "CATS is built for patients undergoing physiotherapy or movement rehabilitation, and for physiotherapists managing patient recovery remotely. Users must be 18 or older, or supervised by a licensed professional.",
  },
  {
    q: "Does CATS record my camera footage?",
    a: "No. All pose estimation happens on your device. No raw video is transmitted or stored — only derived data like joint angles and posture scores.",
  },
  {
    q: "How does the rep counting work?",
    a: "CATS uses a joint-angle state machine. For each exercise, it tracks the angle at the target joint (e.g. hip flexion for a knee raise). A rep is counted when the angle moves from start → peak → back to start.",
  },
  {
    q: "Can my physiotherapist see my progress?",
    a: "Yes, if you're on a supervised plan. Your physiotherapist can view session history, set custom range-of-motion targets per exercise, and annotate your recovery plan.",
  },
  {
    q: "What exercises are supported?",
    a: "CATS supports 25+ exercises across Knee, Hip, Shoulder, Ankle, and Core categories. Your physiotherapist assigns exercises to your plan, and you can browse the full library with ROM ranges.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit (HTTPS/TLS). The database uses row-level security — you can only access your own data. Passwords are never stored in plaintext.",
  },
  {
    q: "Do I need special equipment?",
    a: "No. A device with a front-facing camera is all you need. CATS works on phones, tablets, and laptops. No sensors, wearables, or subscriptions required.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-primary font-semibold text-sm mb-3 uppercase tracking-widest">FAQ</p>
          <h2 className="text-4xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            Common Questions
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="font-semibold text-deep text-sm">{q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-deep/40 flex-shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-deep/60 leading-relaxed border-t border-border pt-4">
                  {a}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
