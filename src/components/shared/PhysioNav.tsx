"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Video, ClipboardList, Settings,
  LogOut, Film, MessageSquare, ChevronLeft, Menu,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Logo from "@/components/shared/Logo";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/physio" },
  { icon: Users, label: "Patients", href: "/physio/patients" },
  { icon: ClipboardList, label: "Recommendations", href: "/physio/recommendations" },
  { icon: Video, label: "Sessions", href: "/physio/sessions" },
  { icon: Film, label: "Videos", href: "/physio/videos" },
  { icon: MessageSquare, label: "Messages", href: "/physio/messages" },
  { icon: Settings, label: "Settings", href: "/physio/settings" },
];

export default function PhysioNav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const displayName = user.name || "Physiotherapist";

  return (
    <>
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

      <aside className={`hidden md:flex flex-col bg-deep text-white border-r border-white/5 min-h-screen fixed left-0 top-0 z-40 transition-all duration-200 ${collapsed ? "w-16 p-3" : "w-64 p-6"}`}>
        {/* header: logo + collapse toggle */}
        <div className={`flex items-center mb-10 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} variant="light" />
              <div>
                <span className="text-xl font-bold" style={{ fontFamily: "var(--font-poppins)" }}>CATS</span>
                <span className="text-xs text-white/30 block -mt-1">Physio</span>
              </div>
            </Link>
          )}
          {collapsed && (
            <Link href="/" title="CATS Physio">
              <Logo size={28} variant="light" />
            </Link>
          )}
          <div className={`flex items-center gap-2 ${collapsed ? "flex-col" : ""}`}>
            {!collapsed && <NotificationBell />}
            <button
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
            >
              {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
            const active = path === href || (href !== "/physio" && path.startsWith(href));
            return (
              <Link key={href} href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all ${collapsed ? "justify-center" : ""} ${active ? "bg-primary text-white" : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1">
          {/* compact profile row */}
          <div className={`flex items-center gap-2.5 px-3 py-2.5 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-7 h-7 rounded-full bg-sage/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-primary">{displayName[0]?.toUpperCase()}</span>
            </div>
            {!collapsed && <span className="text-sm text-white/50 truncate">{displayName}</span>}
          </div>
          <button
            onClick={() => setLogoutOpen(true)}
            title={collapsed ? "Logout" : undefined}
            className={`w-full flex items-center px-3 py-3 rounded-2xl text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white transition-all ${collapsed ? "justify-center" : "gap-3"}`}>
            <LogOut className="w-5 h-5" />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-deep border-t border-white/10 px-2 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 6).map(({ icon: Icon, label, href }) => {
          const active = path === href || (href !== "/physio" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${active ? "text-primary" : "text-white/30"}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
