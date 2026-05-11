"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/shared/Logo";

type Mode = "login" | "signup";
type Role = "patient" | "physio";
type Lang = "en" | "hi" | "ur";

const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "ur", label: "اردو" },
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const ageValue = age ? Number(age) : undefined;
        const metadata: Record<string, unknown> = { name, role, lang, region };
        if (ageValue && ageValue > 0 && ageValue < 130) metadata.age = ageValue;
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        });
        if (err) throw err;
        if (data.session) {
          router.push(role === "patient" ? "/onboarding" : "/physio");
        } else {
          setError("Please check your email and confirm your account before continuing.");
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        const userRole = data.user?.user_metadata?.role;
        router.push(userRole === "physio" ? "/physio" : "/patient");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-deep/50 hover:text-deep mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Logo size={36} />
            <span className="text-xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>CATS</span>
          </div>
          <h1 className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-deep/50 mt-1">
            {mode === "login" ? "Sign in to continue your recovery." : "Start your recovery journey."}
          </p>
        </div>

        <div className="flex bg-muted rounded-2xl p-1 mb-6">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                mode === m ? "bg-white text-deep shadow-sm" : "text-deep/50"
              }`}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {mode === "signup" && (
              <>
                <div>
                  <Label className="text-sm font-semibold text-deep mb-2 block">Full Name</Label>
                  <Input
                    required
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-2xl border-border focus:border-primary"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-deep mb-2 block">I am a</Label>
                  <div className="flex gap-3">
                    {(["patient", "physio"] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 py-3 rounded-2xl text-sm font-semibold capitalize transition-all border-2 ${
                          role === r ? "border-primary bg-primary/5 text-primary" : "border-border text-deep/50 hover:border-primary/30"
                        }`}
                      >
                        {r === "physio" ? "Physiotherapist" : "Patient"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-deep mb-2 block">Language</Label>
                  <div className="flex gap-2">
                    {LANGS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLang(l.value)}
                        className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all border-2 ${
                          lang === l.value ? "border-primary bg-primary/5 text-primary" : "border-border text-deep/50 hover:border-primary/30"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-deep mb-2 block">Age</Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    placeholder="Your age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-12 rounded-2xl border-border focus:border-primary"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-deep mb-2 block">City / Country (optional)</Label>
                  <Input
                    list="location-suggestions"
                    placeholder="e.g. Delhi, India"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="h-12 rounded-2xl border-border focus:border-primary"
                  />
                  <datalist id="location-suggestions">
                    <option value="Delhi, India" />
                    <option value="Mumbai, India" />
                    <option value="Bangalore, India" />
                    <option value="New York, USA" />
                    <option value="London, UK" />
                    <option value="Dubai, UAE" />
                  </datalist>
                </div>
              </>
            )}

            <div>
              <Label className="text-sm font-semibold text-deep mb-2 block">Email</Label>
              <Input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl border-border focus:border-primary"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-deep mb-2 block">Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-2xl border-border focus:border-primary pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-deep/40 hover:text-deep transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-full h-12 text-sm font-semibold mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
