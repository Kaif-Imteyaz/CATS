"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="bg-[#F0F2F0] rounded-2xl p-3">
      <p className="text-[10px] font-semibold text-deep/40 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-bold text-deep">{value}</p>
    </div>
  );
}

export default function PhysioSettings() {
  const { user } = useApp();

  const [data, setData] = useState({ name: "", email: "", region: "" });
  const [loading, setLoading] = useState(true);

  const [pwd, setPwd] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!user.id) return;
    (async () => {
      const [profileRes, authRes] = await Promise.all([
        supabase.from("profiles").select("name, region").eq("id", user.id).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      const p = profileRes.data;
      setData({
        name: p?.name ?? user.name ?? "",
        email: authRes.data.user?.email ?? "",
        region: p?.region ?? "",
      });
      setLoading(false);
    })();
  }, [user.id, user.name]);

  const handlePasswordUpdate = async () => {
    if (pwd.length < 8) { setPwdMsg({ ok: false, text: "Min 8 characters." }); return; }
    if (pwd !== pwdConfirm) { setPwdMsg({ ok: false, text: "Passwords do not match." }); return; }
    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setPwdSaving(false);
    if (error) { setPwdMsg({ ok: false, text: error.message }); }
    else { setPwdMsg({ ok: true, text: "Password updated." }); setPwd(""); setPwdConfirm(""); }
    setTimeout(() => setPwdMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Profile & Settings</h1>
        <p className="text-sm text-deep/40 mt-1">Your account details</p>
      </motion.div>

      {/* identity */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {data.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-bold text-deep text-lg" style={{ fontFamily: "var(--font-poppins)" }}>{data.name}</p>
            <p className="text-sm text-deep/40">{data.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary uppercase tracking-wide">
              Physiotherapist
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name" value={data.name} />
          <Field label="Email" value={data.email} />
          <Field label="Role" value="Physiotherapist" />
          <Field label="Region" value={data.region} />
        </div>
      </motion.div>

      {/* password */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="bg-white rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Change Password</h3>

        <div className="relative">
          <Input type={showPwd ? "text" : "password"} value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="h-12 rounded-2xl border-border pr-10" />
          <button onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-deep/40 hover:text-deep"
            aria-label={showPwd ? "Hide password" : "Show password"}>
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input type={showPwd ? "text" : "password"} value={pwdConfirm}
          onChange={(e) => setPwdConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="h-12 rounded-2xl border-border" />

        {pwdMsg && (
          <p className={`text-xs font-medium ${pwdMsg.ok ? "text-primary" : "text-red-500"}`}>{pwdMsg.text}</p>
        )}

        <Button onClick={handlePasswordUpdate} disabled={pwdSaving || !pwd}
          className="bg-deep text-white rounded-full px-6 w-full sm:w-auto">
          {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {pwdSaving ? "Updating…" : "Update Password"}
        </Button>
      </motion.div>
    </div>
  );
}
