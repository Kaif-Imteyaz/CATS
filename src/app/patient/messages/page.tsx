"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

interface MsgRow { id: string; patient_id: string; physio_id: string; sender_role: "patient" | "physio"; content: string; read: boolean; created_at: string; }

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function PatientMessages() {
  const { user } = useApp();
  const [physioId, setPhysioId] = useState<string | null>(null);
  const [physioName, setPhysioName] = useState("Physiotherapist");
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user.id) return;
    (async () => {
      const planRes = await supabase.from("plans")
        .select("physio_id, profiles!physio_id(name)")
        .eq("patient_id", user.id).eq("active", true).maybeSingle();

      const pid = (planRes.data as unknown as { physio_id: string | null; profiles: { name: string } | null } | null)?.physio_id ?? null;
      const pname = (planRes.data as unknown as { physio_id: string | null; profiles: { name: string } | null } | null)?.profiles?.name ?? "Physiotherapist";

      setPhysioId(pid);
      setPhysioName(pname);

      if (!pid) { setLoading(false); return; }

      const { data } = await supabase.from("messages")
        .select("*").eq("patient_id", user.id).eq("physio_id", pid)
        .order("created_at", { ascending: true }).limit(50);
      setMessages((data ?? []) as MsgRow[]);
      setLoading(false);

      await supabase.from("messages").update({ read: true })
        .eq("patient_id", user.id).eq("physio_id", pid).eq("sender_role", "physio");

      const channel = supabase.channel(`patient-msg-${user.id}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
          filter: `patient_id=eq.${user.id}`,
        }, (payload) => {
          setMessages((m) => [...m, payload.new as MsgRow]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    })();
  }, [user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !physioId || !user.id || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    await supabase.from("messages").insert({
      patient_id: user.id, physio_id: physioId,
      sender_role: "patient", content,
    });
    setSending(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F5F7F5]">

      {/* header */}
      <div className="bg-white border-b border-border/40 px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
          {physioName[0]}
        </div>
        <div>
          <p className="font-semibold text-deep text-sm">{physioName}</p>
          <p className="text-xs text-deep/35">Your Physiotherapist</p>
        </div>
      </div>

      {/* thread */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : !physioId ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-deep/10 mx-auto mb-3" />
            <p className="text-sm text-deep/30">No physiotherapist assigned yet.</p>
            <p className="text-xs text-deep/20 mt-1">Complete onboarding to get linked to a physio.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-deep/30">No messages yet. Say hello!</p>
          </div>
        ) : messages.map((msg, i) => {
          const isPatient = msg.sender_role === "patient";
          const showDate = i === 0 || fmtDate(msg.created_at) !== fmtDate(messages[i - 1].created_at);
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="text-[10px] font-medium text-deep/30 bg-white rounded-full px-3 py-1">{fmtDate(msg.created_at)}</span>
                </div>
              )}
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${isPatient ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${isPatient ? "bg-primary text-white rounded-br-sm" : "bg-white text-deep rounded-bl-sm border border-border/40"}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isPatient ? "text-white/60" : "text-deep/35"}`}>{fmt(msg.created_at)}</p>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      {physioId && (
        <div className="bg-white border-t border-border/40 p-4">
          <div className="flex items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 h-11 rounded-2xl border border-border px-4 text-sm text-deep bg-[#F5F7F5] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-transparent placeholder:text-deep/30"
            />
            <button onClick={sendMessage} disabled={!input.trim() || sending}
              className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-40">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
