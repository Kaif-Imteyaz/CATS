"use client";
import { useApp, Theme } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { Accessibility, X, Sun, Moon, Eye, Type, Zap } from "lucide-react";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "contrast", icon: Eye, label: "Contrast" },
];

export default function AccessibilityPanel() {
  const { config, setTheme, toggleElder, setFontSize, setCultureMode } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
        aria-label="Accessibility settings"
      >
        <Accessibility className="w-5 h-5 text-white" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed bottom-24 right-4 md:bottom-20 md:right-6 z-50 bg-white rounded-3xl shadow-xl p-5 w-72"
              role="dialog"
              aria-labelledby="a11y-panel-title"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-deep text-sm" id="a11y-panel-title" style={{ fontFamily: "var(--font-poppins)" }}>Accessibility</h3>
                <button onClick={() => setOpen(false)} className="text-deep/30 hover:text-deep" aria-label="Close accessibility panel">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-deep/40 mb-2 uppercase tracking-wide" id="lang-label">Language</p>
                  <LanguageSwitcher />
                </div>

                <div>
                  <p className="text-xs font-semibold text-deep/40 mb-2 uppercase tracking-wide" id="mode-label">Mode</p>
                  <div className="flex gap-2" role="group" aria-labelledby="mode-label">
                    {(["standard", "elder", "youth"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setCultureMode(m)}
                        aria-pressed={config.cultureMode === m}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                          config.cultureMode === m ? "bg-primary text-white" : "bg-muted text-deep/50 hover:bg-sage/20"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-deep/40 mb-2 uppercase tracking-wide flex items-center gap-1" id="fontsize-label">
                    <Type className="w-3 h-3" aria-hidden="true" /> Font Size
                  </p>
                  <div className="flex gap-2" role="group" aria-labelledby="fontsize-label">
                    {(["normal", "large", "xlarge"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFontSize(s)}
                        aria-pressed={config.fontSize === s}
                        aria-label={s === "xlarge" ? "Extra large font" : s === "large" ? "Large font" : "Normal font"}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                          config.fontSize === s ? "bg-primary text-white" : "bg-muted text-deep/50 hover:bg-sage/20"
                        }`}
                      >
                        {s === "xlarge" ? "XL" : s === "large" ? "L" : "A"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-deep/40 mb-2 uppercase tracking-wide" id="theme-label">Theme</p>
                  <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="theme-label">
                    {THEMES.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        aria-pressed={config.theme === value}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all border ${
                          config.theme === value
                            ? "bg-primary text-white border-primary"
                            : "bg-muted text-deep/50 border-transparent hover:bg-sage/20"
                        }`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                        <span className="text-xs font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={toggleElder}
                  aria-pressed={config.elderMode}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    config.elderMode ? "bg-primary/10 text-primary" : "bg-muted text-deep/50 hover:bg-sage/20"
                  }`}
                >
                  <Zap className="w-4 h-4" aria-hidden="true" />
                  <span className="text-xs font-semibold">Elder Mode</span>
                  <div className={`ml-auto w-8 h-4 rounded-full transition-all ${config.elderMode ? "bg-primary" : "bg-muted-foreground/30"}`} aria-hidden="true">
                    <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-all ${config.elderMode ? "ml-4" : "ml-0.5"}`} />
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
