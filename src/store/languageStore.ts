import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "en" | "hi" | "ur";

const BROWSER_LANG_MAP: Record<string, Lang> = {
  en: "en",
  "en-IN": "en",
  "en-US": "en",
  "en-GB": "en",
  hi: "hi",
  "hi-IN": "hi",
  ur: "ur",
  "ur-PK": "ur",
  "ur-IN": "ur",
};

function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const nav = navigator.language || (navigator as { userLanguage?: string }).userLanguage || "en";
  return BROWSER_LANG_MAP[nav] ?? BROWSER_LANG_MAP[nav.split("-")[0]] ?? "en";
}

interface LanguageStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      lang: detectBrowserLang(),
      setLang: (lang) => set({ lang }),
    }),
    {
      name: "cats-lang",
    }
  )
);
