"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Film, Upload, Trash2, Plus, Loader2, ExternalLink } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, VideoRecord } from "@/lib/api";

const PAIN_AREAS = [
  { value: "lower_back", label: "Lower Back" },
  { value: "knee", label: "Knee" },
  { value: "shoulder", label: "Shoulder" },
  { value: "neck", label: "Neck" },
  { value: "posture", label: "Posture" },
  { value: "breathing", label: "Breathing" },
];

const AGE_PRESETS = [
  { label: "18–39", min: 18, max: 39 },
  { label: "40–49", min: 40, max: 49 },
  { label: "50–59", min: 50, max: 59 },
  { label: "60–69", min: 60, max: 69 },
  { label: "70+", min: 70, max: 999 },
];

const DEFAULT_FORM = { pain_area: "lower_back", age_min: 18, age_max: 39, title: "", url: "" };

const MAX_VIDEO_MB = 200;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

export default function PhysioVideos() {
  const { token } = useApp();
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.video.list(token).then(setVideos).finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || submitting) return;
    setSubmitting(true);
    try {
      let videoUrl = form.url;

      if (file) {
        const { supabase } = await import("@/lib/supabaseClient");
        const path = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const { data: up, error } = await supabase.storage
          .from("exercise-videos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        videoUrl = supabase.storage.from("exercise-videos").getPublicUrl(up.path).data.publicUrl;
      }

      if (!videoUrl) return;

      const fd = new FormData();
      fd.append("pain_area", form.pain_area);
      fd.append("age_min", String(form.age_min));
      fd.append("age_max", String(form.age_max));
      fd.append("title", form.title);
      fd.append("url", videoUrl);

      const created = await api.video.upload(fd, token);
      setVideos((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(DEFAULT_FORM);
      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await api.video.remove(id, token);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch {}
  };

  const grouped = videos.reduce<Record<string, VideoRecord[]>>((acc, v) => {
    acc[v.pain_area] = acc[v.pain_area] ?? [];
    acc[v.pain_area].push(v);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            Exercise Videos
          </h1>
          <p className="text-deep/50 text-sm mt-1">AI-generated and uploaded exercise demos</p>
        </div>
        <Button
          onClick={() => setShowForm((p) => !p)}
          className="bg-primary text-white rounded-2xl gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Upload
        </Button>
      </motion.div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 mb-6 border border-border space-y-4"
        >
          <h3 className="font-bold text-deep">Upload Exercise Video</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="video-pain-area" className="text-xs font-semibold text-deep/60 mb-1 block">Pain Area</label>
              <select
                id="video-pain-area"
                value={form.pain_area}
                onChange={(e) => setForm((p) => ({ ...p, pain_area: e.target.value }))}
                className="w-full border border-border rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {PAIN_AREAS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-deep/60 mb-1 block" id="age-group-label">Age Group</label>
              <div className="flex gap-2 flex-wrap" role="group" aria-labelledby="age-group-label">
                {AGE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, age_min: p.min, age_max: p.max }))}
                    aria-pressed={form.age_min === p.min}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      form.age_min === p.min ? "bg-primary text-white" : "bg-muted text-deep/60 hover:bg-sage/20"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="video-title" className="text-xs font-semibold text-deep/60 mb-1 block">Title</label>
            <input
              id="video-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Lower Back Stretch-50-60 yrs"
              className="w-full border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label htmlFor="video-file" className="text-xs font-semibold text-deep/60 mb-1 block">
              Video <span className="text-deep/30 font-normal">(max {MAX_VIDEO_MB} MB)</span>
            </label>
            <div className="space-y-2">
              <input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > MAX_VIDEO_BYTES) {
                    setFileError(`File too large. Maximum size is ${MAX_VIDEO_MB} MB.`);
                    setFile(null);
                    e.target.value = "";
                    return;
                  }
                  setFileError(null);
                  setFile(f);
                  if (f) setForm((p) => ({ ...p, url: "" }));
                }}
                className="w-full text-sm text-deep/60 border border-border rounded-2xl px-3 py-2.5 file:mr-3 file:rounded-full file:border-0 file:bg-primary file:text-white file:text-xs file:px-3 file:py-1 file:cursor-pointer"
              />
              {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
              <p className="text-xs text-deep/30 text-center">or paste a video URL</p>
              <input
                aria-label="Video URL"
                type="url"
                value={form.url}
                onChange={(e) => {
                  setForm((p) => ({ ...p, url: e.target.value }));
                  if (e.target.value) { setFile(null); setFileError(null); }
                }}
                placeholder="https://..."
                disabled={!!file}
                className="w-full border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={submitting || (!file && !form.url)}
              className="bg-primary text-white rounded-2xl gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {submitting ? "Uploading…" : "Save Video"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-2xl">
              Cancel
            </Button>
          </div>
        </motion.form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20">
          <Film className="w-12 h-12 text-deep/10 mx-auto mb-3" />
          <p className="text-sm text-deep/30">No videos yet.</p>
          <p className="text-xs text-deep/20 mt-1">Upload one or AI will generate them when patients open exercises.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([area, vids], gi) => (
            <motion.div
              key={area}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
            >
              <h3 className="font-bold text-deep mb-3 capitalize" style={{ fontFamily: "var(--font-poppins)" }}>
                {area.replace(/_/g, " ")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vids.map((v) => (
                  <div key={v.id} className="bg-white rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`text-xs border-0 ${
                        v.source === "ai" ? "bg-primary/10 text-primary" : "bg-sage/30 text-deep"
                      }`}>
                        {v.source === "ai" ? "AI Generated" : "Uploaded"}
                      </Badge>
                      <Badge className="text-xs border-0 bg-muted text-deep/60">
                        {v.age_min}–{v.age_max === 999 ? "70+" : `${v.age_max}`} yrs
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-deep line-clamp-2 mb-3">{v.title}</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Watch
                      </a>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="ml-auto text-deep/20 hover:text-red-500 transition-colors p-1"
                        aria-label="Delete video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
