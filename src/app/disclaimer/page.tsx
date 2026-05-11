import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Medical Disclaimer — CATS",
};

export default function DisclaimerPage() {
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
          <div className="w-10 h-10 rounded-2xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-terracotta" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
              Medical Disclaimer
            </h1>
            <p className="text-sm text-deep/40">Last updated May 2026</p>
          </div>
        </div>

        <div className="bg-terracotta/8 border border-terracotta/20 rounded-2xl px-5 py-4 mb-8">
          <p className="text-sm font-semibold text-terracotta">
            CATS is not a medical device and does not provide medical diagnosis, treatment, or clinical care.
          </p>
        </div>

        <div className="space-y-6 text-sm text-deep/70 leading-relaxed">
          <p>
            CATS (Culturally Adaptive Therapy System) is an assistive wellness and rehabilitation support platform.
            Exercise recommendations, posture analysis, range of motion measurements, rep counting, and AI-generated
            movement insights are provided for informational and assistive purposes only.
          </p>

          <p>
            These outputs are algorithmically generated and may not be accurate for every individual, body type,
            condition, or use environment. Results may vary depending on camera quality, lighting conditions,
            body positioning, clothing, background, and the limitations of computer vision algorithms.
          </p>

          <div className="bg-white rounded-2xl p-5 border border-border space-y-3">
            <p className="font-semibold text-deep text-sm">Before starting, you should know:</p>
            <ul className="space-y-2 text-deep/60">
              <li className="flex gap-2"><span className="text-terracotta flex-shrink-0">•</span>Consult a licensed healthcare professional or physiotherapist before starting any exercise or rehabilitation program.</li>
              <li className="flex gap-2"><span className="text-terracotta flex-shrink-0">•</span>This is especially important if you have an existing injury, chronic condition, recent surgery, or are returning to activity after illness.</li>
              <li className="flex gap-2"><span className="text-terracotta flex-shrink-0">•</span>If you experience pain, dizziness, shortness of breath, or any sudden symptom during exercise, stop immediately and seek medical attention.</li>
              <li className="flex gap-2"><span className="text-terracotta flex-shrink-0">•</span>Do not use CATS during a medical emergency. Call your local emergency services.</li>
            </ul>
          </div>

          <p>
            By using CATS, you acknowledge and accept all associated risks of physical exercise and waive any claims
            against CATS and its operators for injuries or medical complications arising from platform use.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex gap-4 text-xs text-deep/40">
          <Link href="/privacy" className="hover:text-deep transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-deep transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
