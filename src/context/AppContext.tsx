"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import i18n from "@/lib/i18n";

export type Lang = "en" | "hi" | "ur";
export type CultureMode = "standard" | "elder" | "youth";
export type Theme = "light" | "dark" | "contrast";
export type VoicePersona = "april" | "kai";

export interface AppConfig {
  lang: Lang;
  cultureMode: CultureMode;
  elderMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  darkMode: boolean;
  theme: Theme;
  fontSize: "normal" | "large" | "xlarge";
  voicePersona: VoicePersona;
}

export interface UserProfile {
  id: string | null;
  name: string;
  role: "patient" | "physio" | null;
  loggedIn: boolean;
}

interface AppContextType {
  config: AppConfig;
  user: UserProfile;
  token: string | undefined;
  authLoading: boolean;
  setLang: (l: Lang) => void;
  setCultureMode: (m: CultureMode) => void;
  setTheme: (t: Theme) => void;
  toggleElder: () => void;
  toggleHighContrast: () => void;
  toggleDarkMode: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (s: AppConfig["fontSize"]) => void;
  setVoicePersona: (p: VoicePersona) => void;
  logout: () => Promise<void>;
  t: (key: string) => string;
}

const defaultConfig: AppConfig = {
  lang: "en", cultureMode: "standard", elderMode: false,
  highContrast: false, reducedMotion: false, darkMode: false, theme: "light", fontSize: "normal",
  voicePersona: "april",
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [supaUser, setSupaUser] = useState<{ id: string; name: string; role: "patient" | "physio" | null } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("cats-config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.theme) {
          parsed.theme = parsed.darkMode ? "dark" : parsed.highContrast ? "contrast" : "light";
        }
        setConfig(parsed);
      } catch { /* corrupt config */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cats-config", JSON.stringify(config));

    const html = document.documentElement;
    html.setAttribute("dir", config.lang === "ur" ? "rtl" : "ltr");
    html.setAttribute("lang", config.lang);
    html.classList.toggle("dark", config.theme === "dark");
    html.classList.toggle("contrast", config.theme === "contrast");
    html.classList.toggle("elder", config.elderMode);

    html.style.setProperty(
      "--motion",
      config.reducedMotion ? "none" : "all 0.3s ease"
    );
    if (config.reducedMotion) {
      html.setAttribute("data-reduced-motion", "true");
    } else {
      html.removeAttribute("data-reduced-motion");
    }

    if (i18n.isInitialized && i18n.language !== config.lang) {
      i18n.changeLanguage(config.lang);
    }
  }, [config]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) { setAuthLoading(false); return; }

    const syncProfile = async (user: { id: string; email: string | null; user_metadata: Record<string, unknown> }) => {
      const meta = user.user_metadata as { name?: unknown; role?: unknown; lang?: unknown; region?: unknown; age?: unknown };
      const name = typeof meta.name === "string" ? meta.name : user.email?.split("@")[0] ?? "";
      const role = meta.role === "physio" ? "physio" : "patient";
      const lang = ["en", "hi", "ur"].includes(meta.lang as string) ? (meta.lang as string) : "en";
      const region = typeof meta.region === "string" ? meta.region : "";
      const age = Number(meta.age);
      const profileFields: Record<string, unknown> = {
        id: user.id,
        name,
        role,
        lang,
        region,
      };
      if (Number.isFinite(age) && age > 0 && age < 130) {
        profileFields.age = age;
      }
      const { error } = await supabase.from("profiles").upsert(profileFields, { onConflict: "id" });
      if (error) console.error("Profile sync failed:", error.message);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setToken(data.session?.access_token);
      setSupaUser(u ? {
        id: u.id,
        name: u.user_metadata?.name ?? u.email?.split("@")[0] ?? "",
        role: u.user_metadata?.role ?? null,
      } : null);
      if (u) await syncProfile(u as { id: string; email: string | null; user_metadata: Record<string, unknown> });
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setToken(session?.access_token);
      setSupaUser(u ? {
        id: u.id,
        name: u.user_metadata?.name ?? u.email?.split("@")[0] ?? "",
        role: u.user_metadata?.role ?? null,
      } : null);
      if (u) syncProfile(u as { id: string; email: string | null; user_metadata: Record<string, unknown> });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const user: UserProfile = {
    id: supaUser?.id ?? null,
    name: supaUser?.name ?? "",
    role: supaUser?.role ?? null,
    loggedIn: !!supaUser,
  };

  const setLang = (lang: Lang) => setConfig((c) => ({ ...c, lang }));
  const setCultureMode = (cultureMode: CultureMode) => setConfig((c) => ({
    ...c, cultureMode, elderMode: cultureMode === "elder",
    fontSize: cultureMode === "elder" ? "large" : "normal",
  }));
  const setTheme = (theme: Theme) => setConfig((c) => ({
    ...c, theme,
    darkMode: theme === "dark",
    highContrast: theme === "contrast",
    elderMode: theme === "contrast" ? true : c.elderMode,
    fontSize: theme === "contrast" && c.fontSize === "normal" ? "large" : c.fontSize,
  }));
  const toggleElder = () => setConfig((c) => ({
    ...c, elderMode: !c.elderMode, fontSize: !c.elderMode ? "large" : "normal",
  }));
  const toggleHighContrast = () => setConfig((c) => {
    const next = c.theme !== "contrast" ? "contrast" : "light";
    return { ...c, theme: next, highContrast: next === "contrast", darkMode: false };
  });
  const toggleDarkMode = () => setConfig((c) => {
    const next = c.theme !== "dark" ? "dark" : "light";
    return { ...c, theme: next, darkMode: next === "dark", highContrast: false };
  });
  const toggleReducedMotion = () => setConfig((c) => ({ ...c, reducedMotion: !c.reducedMotion }));
  const setFontSize = (fontSize: AppConfig["fontSize"]) => setConfig((c) => ({ ...c, fontSize }));
  const setVoicePersona = (voicePersona: VoicePersona) => setConfig((c) => ({ ...c, voicePersona }));

  const logout = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { supabase } = await import("@/lib/supabaseClient");
      await supabase.auth.signOut();
    }
    setSupaUser(null);
    setToken(undefined);
  };

  const t = (key: string): string => {
    if (!i18n.isInitialized) {
      return key.split(".").pop() ?? key;
    }
    const val = i18n.t(key, { ns: "common", lng: config.lang });
    return typeof val === "string" ? val : key;
  };

  return (
    <AppContext.Provider value={{
      config, user, token, authLoading,
      setLang, setCultureMode, setTheme, toggleElder, toggleHighContrast,
      toggleDarkMode, toggleReducedMotion, setFontSize, setVoicePersona, logout, t,
    }}>
      <div style={{ fontSize: config.fontSize === "xlarge" ? "20px" : config.fontSize === "large" ? "18px" : "16px" }}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
