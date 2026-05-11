"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, MessageCircle, FileText, Apple, Clock, Send, Loader2, UserX, Dumbbell, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: string;
  content: string;
  sender_role: "patient" | "physio";
  created_at: string;
  read: boolean;
}

interface Recommendation {
  id: string;
  type: string;
  detail: string;
  duration: string | null;
  created_at: string;
}

const typeIcon: Record<string, typeof FileText> = {
  Exercise: Dumbbell,
  Diet: Apple,
  Precaution: AlertTriangle,
  Pacing: Clock,
  Lifestyle: FileText,
};

const typeColor: Record<string, string> = {
  Exercise: "bg-primary/10 text-primary",
  Diet: "bg-sage/30 text-primary",
  Precaution: "bg-terracotta/10 text-terracotta",
  Pacing: "bg-terracotta/10 text-terracotta",
  Lifestyle: "bg-sage/30 text-primary",
};

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function TherapistPage() {
  const { user, t } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [physioName, setPhysioName] = useState<string | null>(null);
  const [physioId, setPhysioId] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // keep a ref so handleSend always has the latest physioId
  const physioIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user.id) { setLoading(false); return; }

    const load = async () => {
      // Step 1: get physio_id from physio_patients link (more reliable than plans.physio_id which
      // may be null if the physio couldn't update an existing patient-created plan due to RLS)
      const ppRes = await supabase
        .from("physio_patients")
        .select("physio_id")
        .eq("patient_id", user.id)
        .limit(1)
        .maybeSingle();

      const pid = (ppRes.data as { physio_id: string | null } | null)?.physio_id ?? null;
      setPhysioId(pid);
      physioIdRef.current = pid;

      // Step 2: fetch physio profile separately
      if (pid) {
        const profRes = await supabase
          .from("profiles")
          .select("name")
          .eq("id", pid)
          .maybeSingle();
        setPhysioName((profRes.data as { name: string } | null)?.name ?? null);
      }

      // Messages and recommendations in parallel
      const [msgRes, recRes] = await Promise.all([
        supabase
          .from("messages")
          .select("id, content, sender_role, created_at, read")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: true })
          .limit(50),
        supabase
          .from("recommendations")
          .select("id, type, detail, duration, created_at")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      setMessages((msgRes.data ?? []) as Message[]);
      setRecommendations((recRes.data ?? []) as Recommendation[]);
      setLoading(false);

      if (msgRes.data?.length) {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("patient_id", user.id)
          .eq("sender_role", "physio")
          .eq("read", false);
      }
    };

    load();

    const channel = supabase
      .channel(`therapist-msgs:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `patient_id=eq.${user.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    };
  }, [user.id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const pid = physioIdRef.current;
    if (!newMsg.trim() || !user.id || !pid) return;
    setSending(true);
    const optimistic: Message = {
      id: crypto.randomUUID(),
      content: newMsg.trim(),
      sender_role: "patient",
      created_at: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMsg("");
    try {
      await supabase.from("messages").insert({
        patient_id: user.id,
        physio_id: pid,
        content: optimistic.content,
        sender_role: "patient",
      });
    } catch { /* fail silently */ } finally {
      setSending(false);
    }
  };

  if (!loading && !physioId) {
    return (
      <div className="p-6 lg:p-10 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
          <UserX className="w-10 h-10 text-deep/20" />
        </div>
        <h2 className="text-xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>No Therapist Assigned</h2>
        <p className="text-sm text-deep/45 max-w-xs">Your account is not linked to a physiotherapist yet. Share your Patient ID with your clinic.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{t("therapist.title")}</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6 mb-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-sage/30 flex items-center justify-center text-2xl font-bold text-primary" aria-hidden>
            {physioName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
              {loading ? <span className="animate-pulse bg-muted rounded w-32 h-5 inline-block" /> : physioName}
            </h2>
            <p className="text-sm text-deep/50">{t("therapist.physiotherapist")}</p>
            <Badge className="bg-primary/10 text-primary border-0 text-xs mt-1">{t("therapist.care_team")}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button className="bg-primary text-white rounded-2xl h-12" asChild>
            <Link href="/patient/video">
              <Video className="w-4 h-4 mr-2" aria-hidden />
              {t("therapist.join_video")}
            </Link>
          </Button>
          <Button variant="outline" className="border-primary text-primary rounded-2xl h-12" onClick={() => document.getElementById("msg-input")?.focus()}>
            <MessageCircle className="w-4 h-4 mr-2" aria-hidden />
            {t("therapist.send_message")}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-5 flex flex-col"
        >
          <h3 className="font-bold text-deep mb-3" style={{ fontFamily: "var(--font-poppins)" }}>{t("therapist.messages")}</h3>
          <div
            className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-72 min-h-[120px]"
            role="log"
            aria-label="Message history"
            aria-live="polite"
          >
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="w-5 h-5 text-primary animate-spin" aria-label="Loading messages" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-xs text-deep/30 text-center py-6">{t("therapist.no_messages")}</p>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.sender_role === "patient" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender_role === "patient"
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-cream text-deep rounded-bl-sm"
                      }`}
                    >
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-0.5 ${m.sender_role === "patient" ? "text-white/50" : "text-deep/40"}`}>
                        {fmt(m.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={msgEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              id="msg-input"
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={t("therapist.message_placeholder")}
              aria-label="Message to therapist"
              disabled={!physioId}
              className="flex-1 h-10 rounded-2xl border border-border px-3 text-sm focus:outline-none focus:border-primary bg-cream disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending || !physioId}
              aria-label="Send message"
              className="bg-primary text-white rounded-2xl h-10 w-10 p-0 flex-shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-bold text-deep mb-3" style={{ fontFamily: "var(--font-poppins)" }}>{t("therapist.recommendations")}</h3>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="text-sm text-deep/30">{t("therapist.no_recommendations")}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recommendations.map(({ id, type, detail, duration, created_at }) => {
                const Icon = typeIcon[type] ?? FileText;
                const color = typeColor[type] ?? "bg-sage/30 text-primary";
                return (
                  <div key={id} className="bg-white rounded-2xl p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-muted text-deep/50 border-0 text-xs">{type}</Badge>
                        <span className="text-xs text-deep/30 ml-auto">{fmt(created_at)}</span>
                      </div>
                      <p className="text-sm font-medium text-deep truncate">{detail}</p>
                      {duration && <p className="text-xs text-deep/40 mt-0.5">{duration}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
