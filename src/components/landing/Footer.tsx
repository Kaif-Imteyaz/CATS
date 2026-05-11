"use client";
import { useState } from "react";
import Link from "next/link";
import LegalModal, { LegalType } from "@/components/shared/LegalModal";
import Logo from "@/components/shared/Logo";
import { Globe, ShieldCheck, HeartPulse } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "mailto:hello@cats.health" },
];

const legalLinks: { label: string; which: LegalType }[] = [
  { label: "Privacy Policy", which: "privacy" },
  { label: "Terms of Service", which: "terms" },
  { label: "Medical Disclaimer", which: "disclaimer" },
];

const langs = ["English", "हिन्दी", "اردو"];

const pillars = [
  { icon: Globe, text: "Multilingual" },
  { icon: HeartPulse, text: "Physio-supervised" },
  { icon: ShieldCheck, text: "Secure & private" },
];

export default function Footer() {
  const [modal, setModal] = useState<LegalType>(null);

  return (
    <footer className="bg-deep text-white">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <Logo size={32} variant="light" />
              <div>
                <span className="text-xl font-bold leading-none" style={{ fontFamily: "var(--font-poppins)" }}>CATS</span>
                <span className="block text-[10px] text-white/30 tracking-widest uppercase leading-none mt-0.5">Culturally Adaptive Therapeutic System</span>
              </div>
            </div>
            <p className="text-white/45 text-sm leading-relaxed mb-5 max-w-xs">
              AI-powered rehabilitation guided by real physiotherapists - adapted for your culture, language, and recovery goals.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {langs.map((l) => (
                <span key={l} className="text-xs font-medium text-white/50 bg-white/8 px-3 py-1 rounded-full">{l}</span>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {pillars.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-white/35">
                  <Icon className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div>
              <p className="font-semibold text-xs text-white/40 uppercase tracking-widest mb-4">Platform</p>
              <ul className="space-y-3">
                {navLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-white/55 text-sm hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-xs text-white/40 uppercase tracking-widest mb-4">Legal</p>
              <ul className="space-y-3">
                {legalLinks.map(({ label, which }) => (
                  <li key={label}>
                    <button onClick={() => setModal(which)} className="text-white/55 text-sm hover:text-white transition-colors text-left">
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-white/20 text-xs max-w-lg leading-relaxed">
            CATS provides assistive movement tracking for wellness only. Not a medical device. Not a substitute for professional medical advice. Always consult a licensed healthcare professional before starting any rehabilitation programme.
          </p>
          <p className="text-white/20 text-xs flex-shrink-0">© 2026 CATS</p>
        </div>
      </div>

      <LegalModal which={modal} onClose={() => setModal(null)} />
    </footer>
  );
}
