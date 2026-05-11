export interface RecoveryDataPoint {
  week: number;
  posture: number;
  rom: number;
  pain: number;
  adherence: number;
}

export interface Prediction {
  week: number;
  posture: number;
  rom: number;
  pain: number;
  confidence: number;
  projected: true;
}

export interface RecoveryInsight {
  type: "positive" | "warning" | "critical";
  message: string;
  metric: string;
}

export function predictRecovery(data: RecoveryDataPoint[], weeksAhead = 4): Prediction[] {
  if (data.length < 2) return [];

  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  const postureGain = last.posture - prev.posture;
  const romGain = last.rom - prev.rom;
  const painDrop = prev.pain - last.pain;

  const adherenceFactor = last.adherence / 100;

  return Array.from({ length: weeksAhead }, (_, i) => {
    const w = i + 1;
    const decay = Math.pow(0.85, w);

    return {
      week: last.week + w,
      posture: Math.min(100, last.posture + postureGain * adherenceFactor * w * decay),
      rom: Math.min(100, last.rom + romGain * adherenceFactor * w * decay),
      pain: Math.max(0, last.pain - painDrop * adherenceFactor * w * decay),
      confidence: Math.round(90 - w * 8),
      projected: true,
    };
  });
}

export function generateInsights(data: RecoveryDataPoint[]): RecoveryInsight[] {
  if (data.length < 2) return [];

  const last = data[data.length - 1];
  const first = data[0];
  const insights: RecoveryInsight[] = [];

  const romTotal = last.rom - first.rom;
  if (romTotal > 15) insights.push({ type: "positive", message: `ROM improved by ${romTotal.toFixed(0)}% since start`, metric: "ROM" });
  else if (romTotal < 5) insights.push({ type: "warning", message: "ROM progress is slow — consider plan adjustment", metric: "ROM" });

  if (last.adherence >= 85) insights.push({ type: "positive", message: "High adherence driving recovery", metric: "Adherence" });
  else if (last.adherence < 50) insights.push({ type: "critical", message: "Low adherence — intervention recommended", metric: "Adherence" });

  if (last.pain <= 3) insights.push({ type: "positive", message: "Pain well managed — maintenance phase approaching", metric: "Pain" });
  else if (last.pain >= 7) insights.push({ type: "critical", message: "High pain levels — reassess therapy intensity", metric: "Pain" });

  return insights;
}
