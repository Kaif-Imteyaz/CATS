"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Check, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import type { TherapyPlan } from "@/lib/api";

const painAreas = ["Shoulder", "Knee", "Lower Back", "Hip", "Neck", "Ankle", "Wrist", "Full Body"];
const mobilityLevels = ["Fully Mobile", "Slightly Limited", "Moderately Limited", "Very Limited", "Bed Rest"];
const languages = ["English", "Hindi", "Urdu", "Punjabi", "Bengali"];
const steps = ["Personal Info", "Pain Areas", "Mobility", "Lifestyle", "Done"];

export default function Onboarding() {
  const router = useRouter();
  const { user, token, config, authLoading } = useApp();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!authLoading && !user.loggedIn) router.replace("/auth");
  }, [authLoading, user.loggedIn, router]);
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [plan, setPlan] = useState<TherapyPlan | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [data, setData] = useState({
    name: user.name || "",
    age: "",
    language: "English",
    painAreas: [] as string[],
    mobility: "",
    lifestyle: "",
    envTags: [] as string[],
  });

  const togglePain = (area: string) =>
    setData((d) => ({
      ...d,
      painAreas: d.painAreas.includes(area)
        ? d.painAreas.filter((a) => a !== area)
        : [...d.painAreas, area],
    }));

  const handleGenerate = async () => {
    if (!user.id || !token) { setStep(4); return; }
    setGenerating(true);
    setStreamText("");
    setStep(4);

    const langMap: Record<string, "en" | "hi" | "ur"> = { English: "en", Hindi: "hi", Urdu: "ur" };
    const langCode = langMap[data.language] ?? "en";
    const { supabase } = await import("@/lib/supabaseClient");
    await supabase.from("profiles").upsert({
      id: user.id,
      name: data.name,
      age: Number(data.age) || null,
      lang: langCode,
      pain_areas: data.painAreas,
      role: "patient",
    }, { onConflict: "id" });

    try {
      await api.therapy.stream(
        {
          patient_id: user.id,
          name: data.name,
          age: Number(data.age) || 30,
          pain_areas: data.painAreas,
          mobility_level: data.mobility,
          lifestyle_notes: [data.lifestyle, data.envTags.length ? `Environment: ${data.envTags.join(", ")}` : ""].filter(Boolean).join(". "),
          lang: config.lang,
        },
        token,
        (text) => setStreamText((s) => s + text),
        (result) => { setPlan(result); setStreamText(""); },
      );
    } catch {
      setStreamText("");
    } finally {
      setGenerating(false);
    }
  };

  const handleNext = () => {
    if (step === 3) { handleGenerate(); return; }
    if (step < 3) setStep((s) => s + 1);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-deep/50 hover:text-deep mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back to home
        </Link>

        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white scale-110" : "bg-muted text-deep/30"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 transition-all ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl p-8 shadow-sm"
          >
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Welcome to CATS</h2>
                <p className="text-deep/50 text-sm">Tell us about yourself to personalize your recovery.</p>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-deep mb-2 block">Your Name</Label>
                    <Input placeholder="Full name" value={data.name} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} className="h-14 rounded-2xl border-border focus:border-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-deep mb-2 block">Age</Label>
                    <Input placeholder="Your age" type="number" value={data.age} onChange={(e) => setData((d) => ({ ...d, age: e.target.value }))} className="h-14 rounded-2xl border-border focus:border-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-deep mb-2 block">Preferred Language</Label>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang) => (
                        <button key={lang} onClick={() => setData((d) => ({ ...d, language: lang }))}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.language === lang ? "bg-primary text-white" : "bg-cream text-deep/60 hover:bg-sage/20"}`}>
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      CATS is an assistive wellness platform, not a medical device. Exercise guidance is
                      algorithmically generated and may not be accurate for every individual.
                      Consult a licensed healthcare professional before starting any rehabilitation program.
                    </p>
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className="mt-0.5 accent-primary flex-shrink-0"
                      aria-label="I understand CATS is not a medical device"
                    />
                    <span className="text-xs text-amber-800 leading-relaxed select-none">
                      I understand CATS is not a substitute for professional medical care and I take responsibility for my use of the platform.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Pain Areas</h2>
                <p className="text-deep/50 text-sm">Select all areas where you experience pain or discomfort.</p>
                <div className="flex flex-wrap gap-3">
                  {painAreas.map((area) => (
                    <button key={area} onClick={() => togglePain(area)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${data.painAreas.includes(area) ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-cream text-deep/60 hover:bg-sage/20"}`}>
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Mobility Level</h2>
                <p className="text-deep/50 text-sm">How would you describe your current mobility?</p>
                <div className="space-y-3">
                  {mobilityLevels.map((level) => (
                    <button key={level} onClick={() => setData((d) => ({ ...d, mobility: level }))}
                      className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-medium transition-all ${data.mobility === level ? "bg-primary text-white" : "bg-cream text-deep/70 hover:bg-sage/20"}`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Lifestyle & Setup</h2>
                <p className="text-deep/50 text-sm">Help us tailor exercises to your home environment.</p>
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-deep mb-2 block">Home Setup</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Chair available", "Floor space", "Small room", "Garden/Outdoor", "No equipment"].map((opt) => (
                      <button key={opt}
                        onClick={() => setData((d) => ({
                          ...d,
                          envTags: d.envTags.includes(opt) ? d.envTags.filter((t) => t !== opt) : [...d.envTags, opt],
                        }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          data.envTags.includes(opt) ? "bg-primary text-white" : "bg-cream text-deep/60 hover:bg-primary/10 hover:text-primary"
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <Label className="text-sm font-semibold text-deep mb-2 block mt-4">Additional Notes</Label>
                  <textarea
                    placeholder="Any specific conditions, allergies, or requests..."
                    value={data.lifestyle}
                    onChange={(e) => setData((d) => ({ ...d, lifestyle: e.target.value }))}
                    className="w-full h-28 rounded-2xl border border-border p-4 text-sm text-deep bg-cream resize-none focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
                  Your Plan is Ready, {data.name || "Friend"}!
                </h2>
                <div className="text-deep/60 text-sm text-left bg-cream rounded-2xl p-4 min-h-[60px]">
                  {generating && !streamText ? (
                    <span className="flex items-center gap-2 text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Generating your plan…
                    </span>
                  ) : streamText ? (
                    <span>{streamText}<span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" aria-hidden="true" /></span>
                  ) : plan?.notes ? (
                    plan.notes
                  ) : (
                    "AI has generated your personalized recovery plan."
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {data.painAreas.map((a) => <Badge key={a} className="bg-primary/10 text-primary border-0">{a}</Badge>)}
                  {data.mobility && <Badge className="bg-sage/30 text-deep border-0">{data.mobility}</Badge>}
                </div>
                {plan?.goals?.length ? (
                  <div className="text-left space-y-2">
                    <p className="text-xs font-semibold text-deep/50 uppercase tracking-wide">Goals</p>
                    {plan.goals.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-deep">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />{g}
                      </div>
                    ))}
                  </div>
                ) : null}
                <Button className="bg-primary text-white rounded-full px-8 py-6 text-base w-full" onClick={() => router.push("/patient")}>
                  Go to Dashboard
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step < 4 && (
          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="text-deep/50 hover:text-deep">
              <ChevronLeft className="w-4 h-4 mr-1" />Back
            </Button>
            <Button
              className="bg-primary text-white rounded-full px-6"
              onClick={handleNext}
              disabled={generating || (step === 0 && !disclaimerAccepted)}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {generating ? "Generating..." : step === 3 ? "Generate Plan" : "Continue"}
              {!generating && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
