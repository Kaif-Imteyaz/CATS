import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service — CATS",
};

const sections = [
  { id: "1", title: "Acceptance", body: "By creating an account or using CATS, you agree to these Terms. If you do not agree, do not use the platform." },
  { id: "2", title: "Eligibility", body: "You must be 18 or older to use CATS independently. Users under 18 require consent and supervision from a parent, guardian, or licensed healthcare provider. By using CATS, you confirm you meet these requirements." },
  { id: "3", title: "What CATS is", body: "CATS is an assistive wellness and rehabilitation support platform providing posture analysis, exercise guidance, movement tracking, and physiotherapy plan tools. CATS is not a medical device and does not provide medical diagnosis, treatment, or clinical care." },
  { id: "4", title: "User responsibilities", body: "You are responsible for providing accurate information during onboarding, consulting a licensed healthcare professional before starting any exercise program, stopping activity if you experience pain or adverse symptoms, and keeping your account credentials secure." },
  { id: "5", title: "Medical limitation", body: "Movement analysis and exercise guidance are algorithmically generated and may not be appropriate for every individual. CATS does not replace a physiotherapist, doctor, or other healthcare professional. Do not use CATS in a medical emergency." },
  { id: "6", title: "Camera usage", body: "CATS requires camera access to run pose estimation. No raw video is stored without explicit consent. See our Privacy Policy for how camera-derived data is handled." },
  { id: "7", title: "Intellectual property", body: "All software, algorithms, designs, and content on CATS are proprietary. You may not copy, modify, reverse engineer, sublicense, or commercially redistribute any part of the platform without written permission." },
  { id: "8", title: "Limitation of liability", body: "Physical exercise carries inherent risks. CATS and its operators are not liable for injuries, damages, or medical complications arising from use of the platform. Use is at your own risk. CATS provides no warranties, express or implied, regarding fitness for any purpose or medical accuracy." },
  { id: "9", title: "Account termination", body: "We reserve the right to suspend or terminate accounts that violate these Terms, misuse the platform, or engage in prohibited conduct." },
  { id: "10", title: "Changes", body: "We may update these Terms at any time. Continued use after changes constitutes acceptance. Material changes will be communicated within the platform." },
  { id: "11", title: "Governing law", body: "These Terms are governed by the laws of the jurisdiction in which CATS is registered. Disputes will be resolved through the applicable courts of that jurisdiction." },
  { id: "12", title: "Contact", body: "Questions about these Terms: legal@cats.health" },
];

export default function TermsPage() {
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
          <div className="w-10 h-10 rounded-2xl bg-sage/30 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-deep" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
              Terms of Service
            </h1>
            <p className="text-sm text-deep/40">Last updated May 2026</p>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map(({ id, title, body }) => (
            <div key={id} className="bg-white rounded-2xl p-5 border border-border">
              <h2 className="font-bold text-deep text-sm mb-2">{id}. {title}</h2>
              <p className="text-sm text-deep/65 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex gap-4 text-xs text-deep/40">
          <Link href="/disclaimer" className="hover:text-deep transition-colors">Medical Disclaimer</Link>
          <Link href="/privacy" className="hover:text-deep transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
