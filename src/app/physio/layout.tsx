"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import PhysioNav from "@/components/shared/PhysioNav";
import OfflineBanner from "@/components/shared/OfflineBanner";

export default function PhysioLayout({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cats-sidebar-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("cats-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  useEffect(() => {
    if (!authLoading && !user.loggedIn) router.replace("/auth");
    if (!authLoading && user.loggedIn && user.role === "patient") router.replace("/patient");
  }, [authLoading, user.loggedIn, user.role, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F0F2F0] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F0F2F0]">
      <OfflineBanner />
      <PhysioNav collapsed={collapsed} onToggle={toggleSidebar} />
      <main className={`flex-1 transition-all duration-200 ${collapsed ? "md:ml-16" : "md:ml-64"} pb-20 md:pb-0`}>
        {children}
      </main>
    </div>
  );
}
