"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, FileText } from "lucide-react";

export type LegalType = "privacy" | "terms" | "disclaimer" | null;

interface Props {
  which: LegalType;
  onClose: () => void;
}

const DATA_COLLECT = [
  { label: "Account data", text: "Name, email, age, preferred language." },
  { label: "Health context", text: "Pain areas, mobility level, and lifestyle notes entered during onboarding." },
  { label: "Session data", text: "Exercise activity, rep counts, posture scores, session duration, and pain log entries." },
  { label: "Device data", text: "Browser type, operating system, and device identifiers for analytics and error tracking." },
];

const DATA_SHARE = [
  { name: "Supabase", desc: "Database and authentication provider." },
  { name: "Anthropic", desc: "For AI plan generation — only anonymised health context is sent, no personal identifiers." },
  { name: "Your physiotherapist", desc: "If you are part of a supervised plan." },
];

const TERMS = [
  { id: "1", title: "Acceptance", body: "By creating an account or using CATS, you agree to these Terms. If you do not agree, do not use the platform." },
  { id: "2", title: "Eligibility", body: "You must be 18 or older to use CATS independently. Users under 18 require consent and supervision from a parent, guardian, or licensed healthcare provider." },
  { id: "3", title: "What CATS is", body: "CATS is an assistive wellness and rehabilitation support platform providing posture analysis, exercise guidance, movement tracking, and physiotherapy plan tools. CATS is not a medical device and does not provide medical diagnosis, treatment, or clinical care." },
  { id: "4", title: "User responsibilities", body: "You are responsible for providing accurate information during onboarding, consulting a licensed healthcare professional before starting any exercise program, stopping activity if you experience pain or adverse symptoms, and keeping your account credentials secure." },
  { id: "5", title: "Medical limitation", body: "Movement analysis and exercise guidance are algorithmically generated and may not be appropriate for every individual. CATS does not replace a physiotherapist, doctor, or other healthcare professional. Do not use CATS in a medical emergency." },
  { id: "6", title: "Camera usage", body: "CATS requires camera access to run pose estimation. No raw video is stored without explicit consent. See our Privacy Policy for how camera-derived data is handled." },
  { id: "7", title: "Intellectual property", body: "All software, algorithms, designs, and content on CATS are proprietary. You may not copy, modify, reverse engineer, sublicense, or commercially redistribute any part of the platform without written permission." },
  { id: "8", title: "Limitation of liability", body: "Physical exercise carries inherent risks. CATS and its operators are not liable for injuries, damages, or medical complications arising from use of the platform. Use is at your own risk." },
  { id: "9", title: "Account termination", body: "We reserve the right to suspend or terminate accounts that violate these Terms, misuse the platform, or engage in prohibited conduct." },
  { id: "10", title: "Changes", body: "We may update these Terms at any time. Continued use after changes constitutes acceptance. Material changes will be communicated within the platform." },
  { id: "11", title: "Governing law", body: "These Terms are governed by the laws of the jurisdiction in which CATS is registered. Disputes will be resolved through the applicable courts of that jurisdiction." },
  { id: "12", title: "Contact", body: "Questions about these Terms: legal@cats.health" },
];

function PrivacyContent() {
  return (
    <div className="space-y-6 text-sm text-deep/70 leading-relaxed">
      <section>
        <h2 className="font-bold text-deep mb-3">What we collect</h2>
        <div className="space-y-2">
          {DATA_COLLECT.map(({ label, text }) => (
            <div key={label} className="flex gap-3 p-3 bg-muted/50 rounded-xl border border-border">
              <span className="font-semibold text-deep flex-shrink-0 w-28">{label}</span>
              <span className="text-deep/60">{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-deep mb-3">Camera and pose data</h2>
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-2">
          <p className="font-semibold text-deep">No raw video is recorded or stored.</p>
          <p className="text-deep/60">
            The camera feed is processed entirely on your device. Only derived data — joint angles, posture scores,
            rep counts — is saved. Camera footage never leaves your device.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-deep mb-3">What we do not collect</h2>
        <ul className="space-y-1.5 text-deep/60">
          {["Raw camera footage", "Facial recognition data", "Medical records", "Payment information"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-deep mb-3">Data sharing</h2>
        <p className="mb-3">We do not sell your data. We share data only with:</p>
        <div className="space-y-2">
          {DATA_SHARE.map(({ name, desc }) => (
            <div key={name} className="flex gap-3 p-3 bg-muted/50 rounded-xl border border-border">
              <span className="font-semibold text-deep flex-shrink-0">{name}</span>
              <span className="text-deep/60">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-deep mb-3">Security</h2>
        <p>All data is encrypted in transit (HTTPS/TLS). Database access is restricted by row-level security policies. Passwords are never stored in plaintext.</p>
      </section>

      <section>
        <h2 className="font-bold text-deep mb-3">Your rights</h2>
        <p>You may request access to, correction of, or deletion of your personal data at any time. Contact us at <span className="text-primary font-medium">privacy@cats.health</span>.</p>
      </section>

      <p className="text-xs text-deep/30">Last updated May 2026</p>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-3">
      {TERMS.map(({ id, title, body }) => (
        <div key={id} className="bg-muted/50 rounded-xl p-4 border border-border">
          <h2 className="font-bold text-deep text-sm mb-1.5">{id}. {title}</h2>
          <p className="text-sm text-deep/65 leading-relaxed">{body}</p>
        </div>
      ))}
      <p className="text-xs text-deep/30 pt-2">Last updated May 2026</p>
    </div>
  );
}

function DisclaimerContent() {
  return (
    <div className="space-y-5 text-sm text-deep/70 leading-relaxed">
      <div className="bg-terracotta/8 border border-terracotta/20 rounded-2xl px-5 py-4">
        <p className="text-sm font-semibold text-terracotta">
          CATS is not a medical device and does not provide medical diagnosis, treatment, or clinical care.
        </p>
      </div>

      <p>
        CATS is an assistive wellness and rehabilitation support platform. Exercise recommendations, posture analysis,
        range of motion measurements, rep counting, and AI-generated movement insights are provided for informational
        and assistive purposes only.
      </p>

      <p>
        These outputs are algorithmically generated and may not be accurate for every individual, body type, condition,
        or use environment.
      </p>

      <div className="bg-muted/50 rounded-2xl p-5 border border-border space-y-3">
        <p className="font-semibold text-deep text-sm">Before starting, you should know:</p>
        <ul className="space-y-2 text-deep/60">
          {[
            "Consult a licensed healthcare professional or physiotherapist before starting any exercise or rehabilitation program.",
            "This is especially important if you have an existing injury, chronic condition, recent surgery, or are returning to activity after illness.",
            "If you experience pain, dizziness, shortness of breath, or any sudden symptom during exercise, stop immediately and seek medical attention.",
            "Do not use CATS during a medical emergency. Call your local emergency services.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-terracotta flex-shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p>
        By using CATS, you acknowledge and accept all associated risks of physical exercise and waive any claims
        against CATS and its operators for injuries or medical complications arising from platform use.
      </p>

      <p className="text-xs text-deep/30">Last updated May 2026</p>
    </div>
  );
}

const CONFIG: Record<NonNullable<LegalType>, { title: string; icon: typeof Shield; iconClass: string }> = {
  privacy: { title: "Privacy Policy", icon: Shield, iconClass: "text-primary" },
  terms: { title: "Terms of Service", icon: FileText, iconClass: "text-deep" },
  disclaimer: { title: "Medical Disclaimer", icon: AlertTriangle, iconClass: "text-terracotta" },
};

export default function LegalModal({ which, onClose }: Props) {
  if (!which) return null;
  const { title, icon: Icon, iconClass } = CONFIG[which];

  return (
    <Dialog open={!!which} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-row items-center gap-3 space-y-0">
          <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 ${iconClass}`}>
            <Icon className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-lg font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            {title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="px-6 py-5 max-h-[calc(85vh-80px)]">
          {which === "privacy" && <PrivacyContent />}
          {which === "terms" && <TermsContent />}
          {which === "disclaimer" && <DisclaimerContent />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
