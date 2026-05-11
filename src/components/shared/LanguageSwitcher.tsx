"use client";
import { useState } from "react";
import { useApp, type Lang } from "@/context/AppContext";
import { Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const LANGS: { code: Lang; label: string; native: string; notice: string }[] = [
  { code: "en", label: "English", native: "EN", notice: "" },
  { code: "hi", label: "Hindi", native: "हि", notice: "भाषा हिन्दी में बदल गई।" },
  { code: "ur", label: "Urdu", native: "اُر", notice: "زبان اردو میں تبدیل ہو گئی۔" },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { config, setLang } = useApp();
  const [notice, setNotice] = useState("");

  const handleChange = (code: Lang) => {
    setLang(code);
    const msg = LANGS.find((l) => l.code === code)?.notice ?? "";
    if (msg) {
      setNotice(msg);
      setTimeout(() => setNotice(""), 3000);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <div className="flex items-center gap-1 bg-white/10 rounded-2xl p-1">
          {LANGS.map(({ code, native }) => (
            <button
              key={code}
              onClick={() => handleChange(code)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                config.lang === code ? "bg-primary text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {native}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-full mt-2 right-0 bg-deep text-white text-xs px-3 py-1.5 rounded-xl shadow-lg z-50 whitespace-nowrap"
              role="status"
              aria-live="polite"
            >
              {notice}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-deep/40" />
        <div className="flex gap-1">
          {LANGS.map(({ code, label, native }) => (
            <button
              key={code}
              onClick={() => handleChange(code)}
              title={label}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                config.lang === code
                  ? "bg-primary text-white"
                  : "bg-muted text-deep/50 hover:bg-sage/20 hover:text-deep"
              }`}
            >
              {native}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {notice && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs text-primary font-medium"
            role="status"
            aria-live="polite"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
