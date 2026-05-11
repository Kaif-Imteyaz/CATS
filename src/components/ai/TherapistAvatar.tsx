"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Volume2 } from "lucide-react";

const GREETINGS: Record<string, Record<string, string>> = {
  en: {
    standard: "Hello! Let's begin your recovery session. Take it nice and slow.",
    elder: "Hello. I'm here to guide you gently through today's exercises. No rush at all.",
    youth: "Hey! Ready to crush your recovery session? Let's go!",
  },
  hi: {
    standard: "नमस्ते! आज हम धीरे-धीरे व्यायाम करेंगे।",
    elder: "नमस्ते। मैं आपको आज के व्यायाम में आराम से मार्गदर्शन करूंगी।",
    youth: "नमस्ते! आज का सत्र शुरू करते हैं!",
  },
  ur: {
    standard: "السلام علیکم! آج ہم آہستہ ورزش کریں گے۔",
    elder: "السلام علیکم۔ میں آپ کو آج کی ورزش میں آہستہ رہنمائی کروں گی۔",
    youth: "ہیلو! آج کا سیشن شروع کرتے ہیں!",
  },
};

const AVATAR_COLORS = {
  standard: "from-primary/20 to-sage/30",
  elder: "from-sage/30 to-primary/10",
  youth: "from-terracotta/20 to-primary/20",
};

interface Props {
  autoPlay?: boolean;
  onDone?: () => void;
}

export default function TherapistAvatar({ autoPlay = false, onDone }: Props) {
  const { config } = useApp();
  const [speaking, setSpeaking] = useState(autoPlay);
  const [done, setDone] = useState(false);

  const greeting = GREETINGS[config.lang]?.[config.cultureMode] ?? GREETINGS.en.standard;

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setTimeout(() => {
      setSpeaking(false);
      setDone(true);
      onDone?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [autoPlay]);

  return (
    <div className="relative">
      <div className={`bg-gradient-to-br ${AVATAR_COLORS[config.cultureMode]} rounded-3xl p-6 flex flex-col items-center gap-4`}>
        <div className="relative">
          <div className={`rounded-full flex items-center justify-center ${config.elderMode ? "w-24 h-24" : "w-20 h-20"} bg-white/40`}>
            <span className={config.elderMode ? "text-5xl" : "text-4xl"}>👩‍⚕️</span>
          </div>
          {speaking && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute -inset-2 rounded-full border-2 border-primary/30"
            />
          )}
          {speaking && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Volume2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="font-bold text-deep text-sm" style={{ fontFamily: "var(--font-poppins)" }}>Dr. Sarah Ahmed</p>
          <p className="text-xs text-deep/50">
            {config.lang === "hi" ? "फिजियोथेरेपिस्ट" : config.lang === "ur" ? "فزیوتھراپسٹ" : "Physiotherapist"}
          </p>
        </div>

        <AnimatePresence>
          {speaking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl rounded-tl-none p-4 max-w-xs shadow-sm"
            >
              <p className={`text-deep leading-relaxed ${config.elderMode ? "text-base" : "text-sm"}`}>{greeting}</p>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!speaking && (
          <button
            onClick={() => { setSpeaking(true); setTimeout(() => setSpeaking(false), 4000); }}
            className="text-xs text-deep/40 hover:text-primary transition-colors underline underline-offset-2"
          >
            Replay greeting
          </button>
        )}
      </div>
    </div>
  );
}
