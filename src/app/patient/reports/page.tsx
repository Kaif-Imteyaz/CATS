"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, Activity, CheckCircle, Printer, TrendingDown, Minus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import type { WeeklyReport } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

interface PainEntry { level: number; logged_at: string; }
interface PainWeek { label: string; avg: number | null; entries: PainEntry[]; }

function scoreLabel(score: number): { badge: string; color: string } {
  if (score >= 85) return { badge: "Excellent", color: "bg-primary/10 text-primary" };
  if (score >= 70) return { badge: "Good", color: "bg-sage/30 text-primary" };
  return { badge: "Fair", color: "bg-terracotta/10 text-terracotta" };
}

export default function Reports() {
  const { user, token } = useApp();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [painWeeks, setPainWeeks] = useState<[PainWeek, PainWeek] | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user.id || !token) { setLoading(false); return; }
    api.reports.weekly(user.id, token)
      .then((r) => { setReport(r); setLoading(false); })
      .catch((err) => { 
        console.error("Report error:", err);
        setError(`Could not load report. ${err.message ? `(${err.message})` : ""}`); 
        setLoading(false); 
      });
  },[user.id, token]);

   useEffect(() => {
     if (!user.id || !token) return;

   const loadPainLogs = async () => {
     try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data } = await supabase
        .from("pain_logs")
        .select("level, logged_at")
        .eq("patient_id", user.id)
        .gte("logged_at", twoWeeksAgo.toISOString())
        .order("logged_at", { ascending: true });

      if (!data?.length) return;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const entries = data as PainEntry[];
      const thisWeek = entries.filter((e) => new Date(e.logged_at) >= weekAgo);
      const lastWeek = entries.filter((e) => new Date(e.logged_at) < weekAgo);

      const avg = (arr: PainEntry[]) =>
        arr.length
          ? Math.round((arr.reduce((s, e) => s + e.level, 0) / arr.length) * 10) / 10
          : null;

      setPainWeeks([
        { label: "This week", avg: avg(thisWeek), entries: thisWeek },
        { label: "Last week", avg: avg(lastWeek), entries: lastWeek },
      ]);
    } catch (err) {
      console.error("Pain logs error:", err);
    }
  };
  void loadPainLogs();
}, [user.id, token]);
    
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="h-9 w-32 bg-deep/10 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-48 bg-deep/5 rounded animate-pulse" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 mb-6 animate-pulse">
            <div className="h-6 w-24 bg-deep/10 rounded mb-4" />
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[0, 1, 2, 3].map((j) => <div key={j} className="h-20 bg-deep/5 rounded-2xl" />)}
            </div>
            <div className="h-16 bg-deep/5 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  const hasReport = report && report.stats;
  const { badge, color } = hasReport ? scoreLabel(report.stats.avg_score) : { badge: "—", color: "" };

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#print-report) { display: none !important; }
          #print-report { display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-6 lg:p-10 max-w-4xl mx-auto" id="print-report" ref={printRef}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>Reports</h1>
            <p className="text-deep/50 text-sm mt-1">Weekly AI-generated recovery summaries</p>
          </div>
          {hasReport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              aria-label="Print or save report as PDF"
              className="text-deep/40 hover:text-primary no-print"
            >
              <Printer className="w-4 h-4 mr-2" aria-hidden />Print PDF
            </Button>
          )}
        </motion.div>

        {error && (
          <div className="bg-terracotta/10 text-terracotta rounded-2xl p-4 mb-6 text-sm">{error}</div>
        )}

        {!hasReport && !error && (
          <div className="bg-white rounded-3xl p-10 text-center">
            <FileText className="w-10 h-10 text-deep/10 mx-auto mb-3" aria-hidden />
            <p className="text-sm text-deep/40">No report available yet. Complete a full week of sessions.</p>
          </div>
        )}

        {painWeeks && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 mb-6">
            <h3 className="font-bold text-deep mb-4" style={{ fontFamily: "var(--font-poppins)" }}>Pain Trend</h3>
            {(() => {
              const [thisW, lastW] = painWeeks;
              const diff = thisW.avg !== null && lastW.avg !== null ? Math.round((thisW.avg - lastW.avg) * 10) / 10 : null;
              const improved = diff !== null && diff < 0;
              const worsened = diff !== null && diff > 0;
              return (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[thisW, lastW].map((w) => (
                      <div key={w.label} className="bg-cream rounded-2xl p-4 text-center">
                        <p className="text-2xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
                          {w.avg !== null ? `${w.avg}/10` : "—"}
                        </p>
                        <p className="text-xs text-deep/40 mt-1">{w.label} avg</p>
                      </div>
                    ))}
                  </div>
                  {diff !== null && (
                    <div className={`flex items-center gap-2 rounded-2xl p-3 text-sm font-medium ${
                      improved ? "bg-primary/10 text-primary" : worsened ? "bg-terracotta/10 text-terracotta" : "bg-muted text-deep/50"
                    }`}>
                      {improved ? <TrendingDown className="w-4 h-4 flex-shrink-0" /> : worsened ? <TrendingUp className="w-4 h-4 flex-shrink-0" /> : <Minus className="w-4 h-4 flex-shrink-0" />}
                      {improved ? `Pain reduced by ${Math.abs(diff)} points this week.` : worsened ? `Pain increased by ${diff} points this week.` : "Pain unchanged this week."}
                    </div>
                  )}
                  {thisW.entries.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-deep/40 uppercase tracking-wide font-semibold">Daily logs</p>
                      {thisW.entries.slice(-7).map((e) => {
                        const bar = e.level <= 3 ? "bg-primary" : e.level <= 6 ? "bg-amber-400" : "bg-terracotta";
                        return (
                          <div key={e.logged_at} className="flex items-center gap-3">
                            <span className="text-xs text-deep/40 w-16 flex-shrink-0">
                              {new Date(e.logged_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                            <div className="flex-1 bg-cream rounded-full h-2">
                              <div className={`${bar} h-2 rounded-full transition-all`} style={{ width: `${e.level * 10}%` }} />
                            </div>
                            <span className="text-xs font-bold text-deep w-8 text-right">{e.level}/10</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        )}

        {hasReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-deep text-lg" style={{ fontFamily: "var(--font-poppins)" }}>
                    Week of {report.week_start}
                  </h3>
                  <Badge className={`border-0 ${color}`}>{badge}</Badge>
                </div>
                <p className="text-xs text-deep/40">AI-generated weekly summary</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                aria-label="Download this report as PDF"
                className="text-deep/40 hover:text-primary no-print"
              >
                <Download className="w-4 h-4" aria-hidden />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { icon: Activity, label: "Posture", val: `${report.stats.avg_score}%` },
                { icon: TrendingUp, label: "Sessions", val: `${report.stats.total_sessions}` },
                { icon: CheckCircle, label: "Completion", val: `${Math.round(report.stats.completion_rate * 100)}%` },
                { icon: FileText, label: "Avg Pain", val: `${report.stats.avg_pain}/10` },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="bg-cream rounded-2xl p-3 text-center">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-1" aria-hidden />
                  <p className="text-sm font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>{val}</p>
                  <p className="text-xs text-deep/40">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-cream rounded-2xl p-4 mb-3">
              <p className="text-xs font-semibold text-deep/50 mb-1 uppercase tracking-wide">AI Summary</p>
              <p className="text-sm text-deep/70 leading-relaxed">"{report.ai_summary}"</p>
            </div>

            {report.recommendations?.length > 0 && (
              <div className="bg-cream rounded-2xl p-4">
                <p className="text-xs font-semibold text-deep/50 mb-2 uppercase tracking-wide">Recommendations</p>
                <ul className="space-y-1">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-deep/70 flex items-start gap-2">
                      <span className="text-primary mt-0.5 flex-shrink-0">·</span>{rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
