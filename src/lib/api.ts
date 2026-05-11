const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Opts = RequestInit & { token?: string };

async function req<T>(path: string, opts: Opts = {}): Promise<T> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("offline");
  }
  const { token, ...rest } = opts;
  const isForm = rest.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export interface TherapyRequest {
  patient_id: string;
  name: string;
  age: number;
  pain_areas: string[];
  mobility_level: string;
  lifestyle_notes?: string;
  lang?: string;
}

export interface ExercisePlan {
  name: string;
  tag: string;
  duration_min: number;
  difficulty: string;
  target: string;
  instructions: string;
}

export interface TherapyPlan {
  patient_id: string;
  plan_id: string;
  exercises: ExercisePlan[];
  notes: string;
  goals: string[];
}

export interface SessionSaveRequest {
  patient_id: string;
  plan_id?: string;
  exercise_tag: string;
  reps: number;
  score: number;
  posture_data?: Record<string, unknown>;
  duration_seconds: number;
}

export interface WeeklyReport {
  patient_id: string;
  week_start: string;
  stats: {
    avg_score: number;
    total_sessions: number;
    total_reps: number;
    avg_pain: number;
    completion_rate: number;
    posture_trend: number[];
  };
  ai_summary: string;
  recommendations: string[];
}

export interface PostureRequest {
  landmarks: Record<number, { x: number; y: number; z: number; visibility: number }>;
  exercise_tag: string;
  patient_id?: string;
  session_id?: string;
}

export interface PostureResult {
  score: number;
  feedback: string[];
  type: "correct" | "warning" | "error";
  metrics: {
    shoulder_angle: number;
    knee_angle: number;
    hip_alignment: number;
    symmetry: number;
  };
}

export interface Message {
  id: string;
  patient_id: string;
  physio_id: string;
  sender_role: "patient" | "physio";
  content: string;
  read: boolean;
  created_at: string;
}

export interface ScheduledSession {
  id: string;
  physio_id: string;
  patient_id: string;
  datetime: string;
  type: "video" | "in-person" | "phone";
  status: "scheduled" | "completed" | "cancelled";
  room_code: string | null;
  notes: string;
  profiles?: { name: string };
}

export interface ScheduleCreateRequest {
  physio_id: string;
  patient_id: string;
  datetime: string;
  type: "video" | "in-person" | "phone";
  notes?: string;
}

export interface VideoRecord {
  id: string;
  status: "pending" | "ready" | "failed";
  url: string;
  title: string;
  pain_area: string;
  age_min: number;
  age_max: number;
  source: "ai" | "physio";
}

export const api = {
  therapy: {
    generate: (body: TherapyRequest, token: string) =>
      req<TherapyPlan>("/therapy/generate", { method: "POST", body: JSON.stringify(body), token }),
    stream: async (
      body: TherapyRequest,
      token: string,
      onDelta: (text: string) => void,
      onDone: (plan: TherapyPlan) => void,
    ): Promise<void> => {
      const res = await fetch(`${BASE}/therapy/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const chunk = JSON.parse(line.slice(6));
            if (chunk.type === "delta") onDelta(chunk.text);
            else if (chunk.type === "done") onDone(chunk.plan);
          } catch { /* malformed */ }
        }
      }
    },
  },
  session: {
    save: (body: SessionSaveRequest, token: string) =>
      req<{ id: string; message: string }>("/session/save", { method: "POST", body: JSON.stringify(body), token }),
    logPain: (body: { patient_id: string; level: number; session_id?: string; note?: string }, token: string) =>
      req<{ message: string }>("/session/pain-log", { method: "POST", body: JSON.stringify(body), token }),
  },
  reports: {
    weekly: (patientId: string, token: string) =>
      req<WeeklyReport>(`/reports/weekly/${patientId}`, { token }),
  },
  posture: {
    analyze: (body: PostureRequest, token: string) =>
      req<PostureResult>("/posture/analyze", { method: "POST", body: JSON.stringify(body), token }),
  },
  messages: {
    list: (patientId: string, token: string) =>
      req<Message[]>(`/messages/${patientId}`, { token }),
    send: (body: { patient_id: string; physio_id: string; content: string; sender_role: "patient" | "physio" }, token: string) =>
      req<Message>("/messages/send", { method: "POST", body: JSON.stringify(body), token }),
    markRead: (patientId: string, physioId: string, token: string) =>
      req<{ message: string }>(`/messages/${patientId}/read?physio_id=${physioId}`, { method: "PATCH", token }),
  },
  schedule: {
    forPhysio: (physioId: string, token: string) =>
      req<ScheduledSession[]>(`/schedule/physio/${physioId}`, { token }),
    forPatient: (patientId: string, token: string) =>
      req<ScheduledSession[]>(`/schedule/patient/${patientId}`, { token }),
    create: (body: ScheduleCreateRequest, token: string) =>
      req<ScheduledSession>("/schedule/create", { method: "POST", body: JSON.stringify(body), token }),
    cancel: (sessionId: string, token: string) =>
      req<{ message: string }>(`/schedule/${sessionId}/cancel`, { method: "PATCH", token }),
  },
  video: {
    exercise: (painArea: string, age: number, token: string, lang = "en", region = "") =>
      req<VideoRecord>(`/videos/exercise?pain_area=${encodeURIComponent(painArea)}&age=${age}&lang=${lang}&region=${encodeURIComponent(region)}`, { token }),
    status: (id: string, token: string) =>
      req<VideoRecord>(`/videos/status/${id}`, { token }),
    upload: (form: FormData, token: string) =>
      req<VideoRecord>("/videos/upload", { method: "POST", body: form, token }),
    list: (token: string) =>
      req<VideoRecord[]>("/videos/list", { token }),
    remove: (id: string, token: string) =>
      req<{ message: string }>(`/videos/${id}`, { method: "DELETE", token }),
  },
};
