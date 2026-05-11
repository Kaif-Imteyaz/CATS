import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — CATS",
};

const sections = [
  {
    title: "What we collect",
    content: [
      { label: "Account data", text: "Name, email, age, preferred language." },
      { label: "Health context", text: "Pain areas, mobility level, and lifestyle notes entered during onboarding." },
      { label: "Session data", text: "Exercise activity, rep counts, posture scores, session duration, and pain log entries." },
      { label: "Device data", text: "Browser type, operating system, and device identifiers for analytics and error tracking." },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-deep/50 hover:text-deep mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
              Privacy Policy
            </h1>
            <p className="text-sm text-deep/40">Last updated May 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-sm text-deep/70 leading-relaxed">
          <section>
            <h2 className="font-bold text-deep mb-3">What we collect</h2>
            <div className="space-y-2">
              {sections[0].content.map(({ label, text }) => (
                <div key={label} className="flex gap-3 p-3 bg-white rounded-xl border border-border">
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
                The camera feed is processed entirely on your device using on-device machine learning.
                Only derived data — joint angles, posture scores, rep counts — is saved to your account.
                Camera footage never leaves your device.
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
            <h2 className="font-bold text-deep mb-3">How we use your data</h2>
            <ul className="space-y-1.5 text-deep/60">
              {[
                "To generate and personalise your rehabilitation plan",
                "To track your exercise progress over time",
                "To give your physiotherapist visibility into your sessions",
                "To improve platform accuracy and recommendations",
              ].map((item) => (
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
              {[
                { name: "Supabase", desc: "Database and authentication provider." },
                { name: "Anthropic", desc: "For AI plan generation — only anonymised health context is sent, no personal identifiers." },
                { name: "Your physiotherapist", desc: "If you are part of a supervised plan." },
              ].map(({ name, desc }) => (
                <div key={name} className="flex gap-3 p-3 bg-white rounded-xl border border-border">
                  <span className="font-semibold text-deep flex-shrink-0">{name}</span>
                  <span className="text-deep/60">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-bold text-deep mb-3">Security</h2>
            <p>
              All data is encrypted in transit (HTTPS/TLS). Database access is restricted by row-level security
              policies. Passwords are never stored in plaintext.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-deep mb-3">Your rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any time.
              Contact us at <span className="text-primary font-medium">privacy@cats.health</span>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex gap-4 text-xs text-deep/40">
          <Link href="/disclaimer" className="hover:text-deep transition-colors">Medical Disclaimer</Link>
          <Link href="/terms" className="hover:text-deep transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
