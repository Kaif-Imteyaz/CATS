"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import PatientNav from "@/components/shared/PatientNav";
import AccessibilityPanel from "@/components/shared/AccessibilityPanel";
import OfflineBanner from "@/components/shared/OfflineBanner";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user.loggedIn) router.replace("/auth");
  }, [authLoading, user.loggedIn, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <OfflineBanner />
      <PatientNav />
      <main
        className="flex-1 pb-20 pt-14 md:pt-0 md:pb-0 transition-[margin] duration-200"
        id="patient-main"
      >
        {children}
      </main>
      <AccessibilityPanel />
    </div>
  );
}
