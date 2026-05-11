"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_role: "patient" | "physio";
}

export default function NotificationBell() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user.id) return;

    const load = () =>
      supabase
        .from("messages")
        .select("id, content, read, created_at, sender_role")
        .eq("patient_id", user.id)
        .eq("sender_role", "physio")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => { if (data) setMsgs(data as Message[]); });

    load();

    const ch = supabase
      .channel(`notif-msgs:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `patient_id=eq.${user.id}`,
      }, (payload) => {
        const m = payload.new as Message;
        if (m.sender_role === "physio") setMsgs((prev) => [m, ...prev]);
      })
      .subscribe();

    channelRef.current = ch;
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, [user.id]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const markRead = async () => {
    const ids = msgs.filter((m) => !m.read).map((m) => m.id);
    if (!ids.length) return;
    setMsgs((prev) => prev.map((m) => ({ ...m, read: true })));
    await supabase.from("messages").update({ read: true }).in("id", ids);
  };

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) markRead();
  };

  const unread = msgs.filter((m) => !m.read).length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5 text-deep/60" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-deep">Notifications</span>
              {unread > 0 && (
                <button onClick={markRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {msgs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-deep/40">No notifications</div>
              ) : (
                msgs.map((m) => (
                  <div key={m.id} className={`px-4 py-3 flex gap-3 items-start ${!m.read ? "bg-primary/5" : ""}`}>
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!m.read ? "bg-primary" : "bg-transparent"}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sage/20 text-deep flex items-center gap-1">
                          <MessageCircle className="w-2.5 h-2.5" />Physio
                        </span>
                        <span className="text-[10px] text-deep/30 ml-auto">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-deep/70 line-clamp-2">{m.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
