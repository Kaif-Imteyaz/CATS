"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Video, Copy, Check, ArrowLeft, Mic, MicOff, VideoOff, PhoneOff, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

type CallState = "idle" | "connecting" | "connected" | "failed";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function generateRoomCode(): string {
  const prefixes = ["KN", "SH", "HI", "AN", "BA"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${digits}`;
}

export default function VideoCall() {
  const { user, t } = useApp();

  const [joinCode, setJoinCode] = useState("");
  const [myCode] = useState(() => generateRoomCode());
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof import("@/lib/supabaseClient").supabase.channel> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    channelRef.current?.unsubscribe();
    channelRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startCall = useCallback(async (roomCode: string, isInitiator: boolean) => {
    setCallState("connecting");
    setActiveRoom(roomCode);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      setCallState("failed");
      return;
    }

    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setCallState("connected");
      }
    };

    const { supabase } = await import("@/lib/supabaseClient");
    const channel = supabase.channel(`video:${roomCode}`, { config: { broadcast: { self: false } } });
    channelRef.current = channel;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        channel.send({
          type: "broadcast",
          event: "ice",
          payload: { candidate: candidate.toJSON(), from: user.id },
        });
      }
    };

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (payload.from === user.id) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({ type: "broadcast", event: "answer", payload: { sdp: answer, from: user.id } });
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (payload.from === user.id) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      })
      .on("broadcast", { event: "ice" }, async ({ payload }) => {
        if (payload.from === user.id) return;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch { /* stale candidate */ }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: "broadcast", event: "offer", payload: { sdp: offer, from: user.id } });
        }
      });
  }, [user.id]);

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    startCall(joinCode.trim().toUpperCase(), true);
  };

  const handleWait = () => {
    startCall(myCode, false);
  };

  const handleEndCall = () => {
    cleanup();
    setCallState("idle");
    setActiveRoom(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted((m) => !m);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = camOff; });
    setCamOff((c) => !c);
  };

  if (callState !== "idle") {
    return (
      <div className="min-h-screen bg-deep text-white flex flex-col p-4" role="main" aria-label="Video call">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {callState === "connected" ? (
              <Badge className="bg-green-500/20 text-green-400 border-0 flex items-center gap-1">
                <Wifi className="w-3 h-3" aria-hidden="true" />
                {t("video.connected")}
              </Badge>
            ) : callState === "failed" ? (
              <Badge className="bg-red-500/20 text-red-400 border-0 flex items-center gap-1">
                <WifiOff className="w-3 h-3" aria-hidden="true" />
                Failed
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-0 animate-pulse">
                {t("video.connecting")}
              </Badge>
            )}
            {activeRoom && <span className="text-white/40 text-sm">{activeRoom}</span>}
          </div>
          <Button
            onClick={handleEndCall}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full px-4"
            aria-label={t("video.end_call")}
          >
            <PhoneOff className="w-4 h-4 mr-2" aria-hidden="true" />
            {t("video.end_call")}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="bg-white/5 rounded-3xl overflow-hidden relative aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              aria-label="Remote video"
            />
            {callState !== "connected" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sage/30 flex items-center justify-center mx-auto mb-3 animate-pulse">
                    <Video className="w-8 h-8 text-sage" aria-hidden="true" />
                  </div>
                  <p className="text-white/50 text-sm">{t("video.connecting")}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-3xl overflow-hidden relative aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              aria-label={t("video.you")}
            />
            <Badge className="absolute top-3 right-3 bg-primary/20 text-primary border-0">
              {t("video.you")}
            </Badge>
            {camOff && (
              <div className="absolute inset-0 bg-deep/80 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-white/40" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-red-500/30 text-red-400" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
            aria-label={muted ? t("video.mic_off") : t("video.mic_on")}
          >
            {muted ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
          </button>
          <button
            onClick={toggleCam}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOff ? "bg-red-500/30 text-red-400" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
            aria-label={camOff ? t("video.cam_off") : t("video.cam_on")}
          >
            {camOff ? <VideoOff className="w-5 h-5" aria-hidden="true" /> : <Video className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-white/30">{t("video.in_session")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/patient"
          className="inline-flex items-center gap-1.5 text-sm text-deep/50 hover:text-deep mb-6 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-sm space-y-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
              {t("video.join")}
            </h1>
            <p className="text-sm text-deep/50 mt-1">{t("video.enter_code")}</p>
          </div>

          <div className="space-y-3">
            <Input
              placeholder={t("video.code_placeholder")}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="h-14 rounded-2xl border-border focus:border-primary text-center text-lg font-bold tracking-widest"
              maxLength={7}
              aria-label="Room code"
              autoComplete="off"
            />
            <Button
              onClick={handleJoin}
              disabled={!joinCode.trim()}
              className="w-full bg-primary text-white rounded-full h-14 text-base font-semibold"
            >
              {t("video.join_call")}
            </Button>
          </div>

          <div className="border-t border-border pt-5 space-y-3">
            <p className="text-xs text-deep/40 text-center">{t("video.your_code")}</p>
            <div className="flex items-center gap-3 bg-cream rounded-2xl p-4">
              <span
                className="flex-1 text-center text-xl font-bold text-deep tracking-widest"
                style={{ fontFamily: "var(--font-poppins)" }}
                aria-label={`Your room code: ${myCode}`}
              >
                {myCode}
              </span>
              <button
                onClick={handleCopy}
                className="text-primary hover:text-primary/70 transition-colors"
                aria-label={t("video.copy_code")}
              >
                {copied
                  ? <Check className="w-5 h-5" aria-hidden="true" />
                  : <Copy className="w-5 h-5" aria-hidden="true" />
                }
              </button>
            </div>
            <Button
              onClick={handleWait}
              variant="outline"
              className="w-full rounded-full h-12 border-primary/30 text-primary hover:bg-primary/5"
            >
              Wait for physio to join
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
