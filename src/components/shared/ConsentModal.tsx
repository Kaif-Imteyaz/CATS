"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "cats_camera_consent_v1";

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ onAccept, onDecline }: ConsentModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h2 className="font-bold text-deep" id="consent-title" style={{ fontFamily: "var(--font-poppins)" }}>
                Before you continue
              </h2>
            </div>
            <button
              onClick={onDecline}
              aria-label="Decline and exit"
              className="text-deep/25 hover:text-deep transition-colors p-1"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <div className="bg-cream rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-start gap-2.5">
                <Camera className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-deep/65 leading-relaxed">
                  CATS uses your camera for real-time pose tracking. No video is recorded or stored.
                  Pose data is processed on your device only.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-deep/65 leading-relaxed">
                  CATS is not a medical device. Posture analysis and exercise guidance are assistive only.
                  Consult a healthcare professional before starting any rehabilitation program.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-deep/35 mb-4 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link href="/terms" target="_blank" className="text-primary underline hover:no-underline">Terms</Link>
            {", "}
            <Link href="/privacy" target="_blank" className="text-primary underline hover:no-underline">Privacy Policy</Link>
            {", and "}
            <Link href="/disclaimer" target="_blank" className="text-primary underline hover:no-underline">Medical Disclaimer</Link>.
          </p>

          <div className="flex gap-2.5">
            <Button
              onClick={onAccept}
              className="flex-1 bg-primary text-white rounded-xl h-10 text-sm"
            >
              Accept & Continue
            </Button>
            <Button
              onClick={onDecline}
              variant="ghost"
              className="flex-1 rounded-xl h-10 text-sm text-deep/50"
            >
              Exit
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useConsentGate(): {
  consentGiven: boolean;
  showModal: boolean;
  requestConsent: () => void;
  handleAccept: () => void;
  handleDecline: () => void;
} {
  const [consentGiven, setConsentGiven] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted") setConsentGiven(true);
  }, []);

  const requestConsent = () => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted") {
      setConsentGiven(true);
    } else {
      setShowModal(true);
    }
  };

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setConsentGiven(true);
    setShowModal(false);
  };

  const handleDecline = () => {
    setShowModal(false);
  };

  return { consentGiven, showModal, requestConsent, handleAccept, handleDecline };
}
