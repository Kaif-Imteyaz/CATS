"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Activity, TrendingUp, FileText, User, Stethoscope,
  LogOut, ChevronLeft, ChevronRight, Menu, X, Flame,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Logo from "@/components/shared/Logo";
import NotificationBell from "./NotificationBell";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

const NAV_ITEMS = [
  { icon: Home, key: "nav.home", href: "/patient" },
  { icon: Activity, key: "nav.exercises", href: "/patient/exercises" },
  { icon: TrendingUp, key: "nav.progress", href: "/patient/progress" },
  { icon: FileText, key: "nav.reports", href: "/patient/reports" },
  { icon: Stethoscope, key: "nav.therapist", href: "/patient/therapist" },
  { icon: User, key: "nav.profile", href: "/patient/profile" },
];

function calcStreak(sessions: { completed_at: string }[]): number {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map((s) => new Date(s.completed_at).toDateString()));
  const d = new Date();
  // If no session today, allow checking from yesterday (streak shouldn't reset until tomorrow)
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

export default function PatientNav() {
  const path = usePathname();
  const router = useRouter();
  const { t, logout, user } = useApp();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      document.getElementById("patient-main")?.style.setProperty("margin-left", next ? "64px" : "256px");
      return next;
    });
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      const el = document.getElementById("patient-main");
      if (el && mq.matches) el.style.marginLeft = collapsed ? "64px" : "256px";
      else if (el) el.style.marginLeft = "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [collapsed]);

  useEffect(() => {
    if (!user.id) return;
    const load = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const { data } = await supabase
        .from("sessions")
        .select("completed_at")
        .eq("patient_id", user.id)
        .gte("completed_at", since.toISOString());
      setStreak(calcStreak(data ?? []));
    };
    load();

    const ch = supabase
      .channel(`nav-streak:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sessions", filter: `patient_id=eq.${user.id}` },
        () => load())
      .subscribe();
    channelRef.current = ch;
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, [user.id]);

  const [logoutOpen, setLogoutOpen] = useState(false);

  const SidebarContent = ({ onClick }: { onClick?: () => void }) => (
    <>
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, key, href }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClick}
              title={collapsed ? t(key) : undefined}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all ${
                active ? "bg-primary text-white" : "text-deep/60 hover:bg-cream hover:text-deep"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t(key)}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        {!collapsed && (
          <div className="bg-cream rounded-2xl p-4">
            <p className="text-xs font-semibold text-deep mb-1">Recovery Streak</p>
            <p className="text-2xl font-bold flex items-center gap-1.5" style={{ fontFamily: "var(--font-poppins)" }}>
              {streak >= 12 ? (
                <span className="relative inline-flex">
                  <span className="animate-ping absolute inline-flex w-full h-full rounded-full opacity-25 bg-orange-400" />
                  <span>🔥</span>
                </span>
              ) : (
                <Flame className="w-5 h-5 text-terracotta" />
              )}
              <span className={streak >= 12 ? "text-orange-500" : "text-primary"}>
                {streak} {streak === 1 ? "Day" : "Days"}
              </span>
            </p>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            {streak >= 12 ? (
              <span className="text-xl">🔥</span>
            ) : (
              <Flame className="w-5 h-5 text-terracotta" />
            )}
          </div>
        )}
        <button
          onClick={() => setLogoutOpen(true)}
          title={collapsed ? t("nav.logout") : undefined}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-2xl text-sm font-medium transition-all text-deep/50 hover:bg-red-50 hover:text-red-500 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && t("nav.logout")}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-border px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-cream transition-colors"
        >
          <Menu className="w-5 h-5 text-deep" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs" style={{ fontFamily: "var(--font-poppins)" }}>C</span>
          </div>
          <span className="text-base font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>CATS</span>
        </Link>
        <NotificationBell />
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <Logo size={28} />
                <span className="text-lg font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>CATS</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-cream">
                <X className="w-4 h-4 text-deep/50" />
              </button>
            </div>
            <SidebarContent onClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {logoutOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setLogoutOpen(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-deep text-lg mb-1.5" style={{ fontFamily: "var(--font-poppins)" }}>Sign out?</h3>
            <p className="text-sm text-deep/50 mb-6 leading-relaxed">You'll be returned to the home screen and will need to sign in again.</p>
            <div className="flex gap-3">
              <button onClick={() => setLogoutOpen(false)} className="flex-1 py-3.5 rounded-2xl bg-cream text-deep font-semibold text-sm hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => { logout(); router.push("/"); }} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-border min-h-screen fixed left-0 top-0 z-40 p-4 transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}>
        <div className={`flex items-center mb-8 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-lg font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>CATS</span>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-cream text-deep/40 hover:text-deep transition-colors flex-shrink-0"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
}
