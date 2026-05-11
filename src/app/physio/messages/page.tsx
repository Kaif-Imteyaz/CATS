"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

interface PatientItem { id: string; name: string; unread: number; }
interface MsgRow { id: string; patient_id: string; physio_id: string; sender_role: "patient" | "physio"; content: string; read: boolean; created_at: string; }

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function PhysioMessages() {
  const { user } = useApp();
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user.id) return;
    (async () => {
      const planRes = await supabase.from("plans")
        .select("patient_id, profiles!patient_id(name)")
        .eq("physio_id", user.id).eq("active", true);

      const unreadRes = await supabase.from("messages")
        .select("patient_id")
        .eq("physio_id", user.id).eq("sender_role", "patient").eq("read", false);

      const unreadCounts: Record<string, number> = {};
      (unreadRes.data ?? []).forEach((r) => {
        unreadCounts[r.patient_id] = (unreadCounts[r.patient_id] ?? 0) + 1;
      });

      const list = ((planRes.data ?? []) as unknown as Array<{ patient_id: string; profiles: { name: string } | null }>)
        .map((p) => ({ id: p.patient_id, name: p.profiles?.name ?? "Patient", unread: unreadCounts[p.patient_id] ?? 0 }));

      setPatients(list);
      if (list.length) setSelectedId(list[0].id);
      setLoadingPatients(false);
    })();
  }, [user.id]);

  useEffect(() => {
    if (!selectedId || !user.id) return;
    setLoadingMsgs(true);
    setMessages([]);

    (async () => {
      const { data } = await supabase.from("messages")
        .select("*").eq("patient_id", selectedId).eq("physio_id", user.id)
        .order("created_at", { ascending: true }).limit(50);
      setMessages((data ?? []) as MsgRow[]);
      setLoadingMsgs(false);

      await supabase.from("messages").update({ read: true })
        .eq("patient_id", selectedId).eq("physio_id", user.id).eq("sender_role", "patient");

      setPatients((ps) => ps.map((p) => p.id === selectedId ? { ...p, unread: 0 } : p));
    })();

    const channel = supabase.channel(`physio-msg-${selectedId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `physio_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new as MsgRow;
        if (msg.patient_id !== selectedId) {
          setPatients((ps) => ps.map((p) => p.id === msg.patient_id ? { ...p, unread: p.unread + 1 } : p));
          return;
        }
        setMessages((m) => [...m, msg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedId || !user.id || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    await supabase.from("messages").insert({
      patient_id: selectedId, physio_id: user.id,
      sender_role: "physio", content,
    });
    setSending(false);
  };

  const selectedName = patients.find((p) => p.id === selectedId)?.name ?? "Patient";

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">

      {/* patient list */}
      <aside className="w-full md:w-72 bg-white border-r border-border/40 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-border/40">
          <h1 className="text-xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Messages</h1>
          <p className="text-xs text-deep/40 mt-0.5">Patient conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingPatients ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-[#F5F7F5] rounded-2xl animate-pulse" />)}
            </div>
          ) : patients.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-deep/10 mx-auto mb-2" />
              <p className="text-sm text-deep/30">No patients linked.</p>
            </div>
          ) : patients.map((p) => (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors border-b border-border/20 ${selectedId === p.id ? "bg-primary/5" : "hover:bg-[#F5F7F5]"}`}>
              <div className="w-10 h-10 rounded-2xl bg-sage/30 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold text-deep truncate ${selectedId === p.id ? "text-primary" : ""}`}>{p.name}</p>
              </div>
              {p.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {p.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* thread */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7F5]">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-deep/10 mx-auto mb-3" />
              <p className="text-sm text-deep/30">Select a patient to view messages.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-border/40 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sage/30 flex items-center justify-center text-sm font-bold text-primary">
                {selectedName[0]}
              </div>
              <div>
                <p className="font-semibold text-deep text-sm">{selectedName}</p>
                <p className="text-xs text-deep/35">Patient</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-deep/30">No messages yet. Start the conversation.</p>
                </div>
              ) : messages.map((msg, i) => {
                const isPhysio = msg.sender_role === "physio";
                const showDate = i === 0 || fmtDate(msg.created_at) !== fmtDate(messages[i - 1].created_at);
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="text-[10px] font-medium text-deep/30 bg-white rounded-full px-3 py-1">{fmtDate(msg.created_at)}</span>
                      </div>
                    )}
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isPhysio ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${isPhysio ? "bg-primary text-white rounded-br-sm" : "bg-white text-deep rounded-bl-sm border border-border/40"}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isPhysio ? "text-white/60" : "text-deep/35"}`}>{fmt(msg.created_at)}</p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

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
          </>
        )}
      </div>
    </div>
  );
}
