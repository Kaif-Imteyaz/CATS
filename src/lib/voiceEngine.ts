import type { Lang } from "@/store/languageStore";
import type { VoicePersona } from "@/context/AppContext";

const VOICE_MESSAGES: Record<Lang, Record<string, string>> = {
  en: {
    "Good posture. Continue slowly.": "Good posture. Continue slowly.",
    "Good. Hold and lower slowly.": "Good. Hold and lower slowly.",
    "Great leg extension. Hold steady.": "Great extension. Hold steady.",
    "Good extension. Hold 5 seconds.": "Good extension. Hold for 5 seconds.",
    "Perfect squat depth. Rise slowly.": "Perfect depth. Rise slowly.",
    "Good lunge. Keep torso upright.": "Good lunge. Keep your back straight.",
    "Good shoulder height. Hold 2 seconds.": "Good shoulder height. Hold.",
    "Good lateral raise. Lower slowly.": "Good raise. Lower slowly.",
    "Full press. Lower with control.": "Full press. Lower with control.",
    "Good rotation. Hold gently.": "Good rotation. Hold gently.",
    "Good curl. Lower with control.": "Good curl. Lower with control.",
    "Good stretch. Hold 20 seconds.": "Good stretch. Hold for 20 seconds.",
    "Good leg raise. Hold 3 seconds.": "Good leg raise. Hold.",
    "Good chest expansion. Breathe deeply.": "Good chest opening. Breathe deeply.",
    "Good row. Release slowly.": "Good row. Release slowly.",
    "Good stretch. Hold and breathe.": "Good stretch. Breathe and hold.",
    "Good bicep stretch. Hold steady.": "Good bicep stretch. Hold steady.",
    "Good pelvic tilt. Engage your core.": "Good pelvic tilt. Hold and breathe.",
    "Lift your knee higher.": "Lift your knee a little higher.",
    "Extend your leg more.": "Extend your leg further.",
    "Straighten your knee fully.": "Straighten your knee fully.",
    "Bend deeper. Aim for 90°.": "Bend a little deeper.",
    "Lower your back knee further.": "Lower your back knee further.",
    "Raise your arm to shoulder height.": "Raise your arm to shoulder height.",
    "Lift your arm higher to the side.": "Lift your arm higher to the side.",
    "Press higher. Extend your elbow.": "Press higher. Extend fully.",
    "Rotate your arm inward further.": "Rotate your arm inward further.",
    "Curl your arm up further.": "Curl your arm up further.",
    "Push your hip forward more.": "Push your hip forward more.",
    "Raise your leg higher.": "Raise your leg higher.",
    "Open your chest wider.": "Open your chest wider.",
    "Pull further back. Squeeze shoulders.": "Pull further back. Squeeze your shoulder blades.",
    "Reach your elbow higher.": "Reach your elbow higher overhead.",
    "Open your chest and arm more.": "Open your chest and arm more.",
    "Tilt your pelvis further.": "Tilt your pelvis further.",
    "Hold. Don't overextend.": "Hold. Don't overextend.",
    "Don't hyperextend the knee.": "Don't lock the knee. Ease back.",
    "Don't lock the knee out.": "Ease back. Don't lock the knee.",
    "Good depth. Hold and rise.": "Good depth. Hold and rise.",
    "Good depth. Hold position.": "Good depth. Hold your position.",
    "Slow down. Control the movement.": "Slow down. Control the movement.",
    "Don't go above shoulder level.": "Don't raise above shoulder level.",
    "Slow down at the top.": "Slow down at the top.",
    "Don't force past your range.": "Don't force it. Work within your range.",
    "Lower slowly. Control the weight.": "Lower slowly with control.",
    "Hold. You've reached good range.": "Hold. You have reached good range.",
    "Don't over-raise. Keep hips level.": "Keep your hips level.",
    "Ease back. Don't strain.": "Ease back. Don't strain.",
    "Hold. Good range.": "Hold. Good range.",
    "Straighten your shoulders.": "Straighten your shoulders.",
    "Keep your hips level.": "Keep your hips level.",
    "Slow down. Don't overextend.": "Slow down. Don't overextend.",
    "Extend your range of motion.": "Extend a little further.",
    "Position yourself in frame.": "Please position yourself in front of the camera.",
    "session_start": "Let's begin your recovery session. Take it slow.",
    "session_midway": "You're halfway there. Keep going.",
    "safety_briefing": "Please use a clean flat surface, avoid heavy lifting, stay hydrated, use proper support, and stop immediately if pain increases.",
    "low_light_warning": "Low light detected. Please move to a brighter area.",
    "no_pose_warning": "Camera cannot see you. Move back and face the camera directly.",
    "session_start_elder": "Hello. We will go very gently today. No rush at all.",
    "rep_done": "Well done. Rest for a moment.",
    "session_end": "Excellent session today. You are making great progress.",
    "rep_1": "One",
    "rep_2": "Two",
    "rep_3": "Three",
    "rep_4": "Four",
    "rep_5": "Five, halfway there",
    "rep_6": "Six",
    "rep_7": "Seven",
    "rep_8": "Eight",
    "rep_9": "Nine, one more to go",
    "rep_complete": "Complete! Great job",
  },
  hi: {
    "Good posture. Continue slowly.": "बहुत अच्छा। धीरे-धीरे जारी रखें।",
    "Good. Hold and lower slowly.": "अच्छा। रोकें और धीरे नीचे लाएं।",
    "Great leg extension. Hold steady.": "बढ़िया। पैर सीधा रखें।",
    "Lift your knee higher.": "घुटना थोड़ा ऊपर उठाएं।",
    "Extend your leg more.": "पैर और सीधा करें।",
    "Raise your arm to shoulder height.": "हाथ कंधे की ऊंचाई तक उठाएं।",
    "Good stretch. Hold 20 seconds.": "अच्छा। 20 सेकंड रोकें।",
    "Raise your leg higher.": "पैर ऊपर उठाएं।",
    "Straighten your shoulders.": "अपने कंधे सीधे करें।",
    "Keep your hips level.": "अपने कूल्हे सीधे रखें।",
    "Slow down. Don't overextend.": "धीरे करें। ज्यादा मत खींचें।",
    "Position yourself in frame.": "कैमरे के सामने खड़े हों।",
    "session_start": "नमस्ते। आज हम धीरे-धीरे व्यायाम करेंगे।",
    "session_midway": "आप आधे रास्ते पर हैं। जारी रखें।",
    "safety_briefing": "कृपया साफ़ सपाट सतह का उपयोग करें, भारी उठाने से बचें, हाइड्रेट रहें, सही समर्थन का उपयोग करें, और दर्द बढ़े तो तुरंत रुकें।",
    "low_light_warning": "रोशनी कम है। किसी रोशनीदार जगह पर जाएं।",
    "no_pose_warning": "कैमरा आपको नहीं देख पा रहा। पीछे जाएं और सामने आएं।",
    "session_start_elder": "नमस्ते। आज बहुत आराम से करेंगे। कोई जल्दी नहीं।",
    "rep_done": "शाबाश। थोड़ा आराम करें।",
    "session_end": "आज का सत्र बहुत अच्छा रहा।",
    "rep_1": "एक",
    "rep_2": "दो",
    "rep_3": "तीन",
    "rep_4": "चार",
    "rep_5": "पाँच, आधा रास्ता तय हो गया",
    "rep_6": "छः",
    "rep_7": "सात",
    "rep_8": "आठ",
    "rep_9": "नौ, एक और",
    "rep_complete": "पूरा हुआ! बहुत अच्छा",
  },
  ur: {
    "Good posture. Continue slowly.": "بہت اچھا۔ آہستہ جاری رکھیں۔",
    "Good. Hold and lower slowly.": "اچھا۔ روکیں اور آہستہ نیچے لائیں۔",
    "Lift your knee higher.": "گھٹنا تھوڑا اوپر اٹھائیں۔",
    "Raise your arm to shoulder height.": "ہاتھ کندھے کی اونچائی تک اٹھائیں۔",
    "Good stretch. Hold 20 seconds.": "اچھا۔ 20 سیکنڈ روکیں۔",
    "Raise your leg higher.": "اپنی ٹانگ تھوڑی اوپر اٹھائیں۔",
    "Straighten your shoulders.": "اپنے کندھے سیدھے کریں۔",
    "Keep your hips level.": "اپنے کولہے سیدھے رکھیں۔",
    "Slow down. Don't overextend.": "آہستہ کریں۔ زیادہ نہ کھینچیں۔",
    "Position yourself in frame.": "کیمرے کے سامنے کھڑے ہوں۔",
    "session_start": "السلام علیکم۔ آج ہم آہستہ ورزش کریں گے۔",
    "session_midway": "آپ آدھے راستے پر ہیں۔ جاری رکھیں۔",
    "safety_briefing": "براہ کرم صاف سطح استعمال کریں، بھاری اٹھانے سے گریز کریں، پانی پیتے رہیں، مناسب معاونت استعمال کریں، اور درد بڑھے تو فوری رک جائیں۔",
    "low_light_warning": "روشنی کم ہے۔ روشن جگہ پر جائیں۔",
    "no_pose_warning": "کیمرہ آپ کو نہیں دیکھ سکتا۔ پیچھے ہٹیں اور سامنے آئیں۔",
    "session_start_elder": "السلام علیکم۔ آج بہت آرام سے کریں گے۔",
    "rep_done": "شاباش۔ تھوڑا آرام کریں۔",
    "session_end": "آج کا سیشن بہت اچھا رہا۔",
    "rep_1": "ایک",
    "rep_2": "دو",
    "rep_3": "تین",
    "rep_4": "چار",
    "rep_5": "پانچ، آدھا راستہ تے گیا",
    "rep_6": "چھ",
    "rep_7": "سات",
    "rep_8": "آٹھ",
    "rep_9": "نو، ایک اور",
    "rep_complete": "مکمل! بہترین کام",
  },
};

const LANG_CODES: Record<Lang, string> = {
  en: "en-US",
  hi: "hi-IN",
  ur: "ur-PK",
};

const PERSONA_SETTINGS: Record<VoicePersona, { pitch: number; rate: number }> = {
  april: { pitch: 1.15, rate: 0.92 },
  kai: { pitch: 0.88, rate: 0.85 },
};

let current: SpeechSynthesisUtterance | null = null;

export function speak(message: string, lang: Lang = "en", mode = "standard", persona: VoicePersona = "april"): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const text = VOICE_MESSAGES[lang]?.[message] ?? message;

  if (current) window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_CODES[lang];

  const ps = PERSONA_SETTINGS[persona];
  u.rate = mode === "elder" ? 0.75 : ps.rate;
  u.pitch = mode === "elder" ? 0.9 : ps.pitch;
  u.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const langCode = LANG_CODES[lang];
  const matched = voices.filter((v) => v.lang.startsWith(langCode.split("-")[0]));
  if (matched.length > 1) {
    u.voice = persona === "april" ? (matched[0] ?? null) : (matched[matched.length - 1] ?? null);
  } else if (matched.length === 1) {
    u.voice = matched[0];
  }

  current = u;
  window.speechSynthesis.speak(u);
}

export function speakRaw(text: string, lang: Lang = "en", mode = "standard", persona: VoicePersona = "april"): void {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  if (current) window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_CODES[lang];
  const ps = PERSONA_SETTINGS[persona];
  u.rate = mode === "elder" ? 0.75 : ps.rate;
  u.pitch = mode === "elder" ? 0.9 : ps.pitch;
  u.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const matched = voices.filter((v) => v.lang.startsWith(LANG_CODES[lang].split("-")[0]));
  if (matched.length > 1) {
    u.voice = persona === "april" ? (matched[0] ?? null) : (matched[matched.length - 1] ?? null);
  } else if (matched.length === 1) {
    u.voice = matched[0];
  }
  current = u;
  window.speechSynthesis.speak(u);
}

export function stopVoice(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    current = null;
  }
}

export async function speakElevenLabs(text: string, voiceId: string, apiKey: string): Promise<void> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.6, similarity_boost: 0.8 },
    }),
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
  audio.onended = () => URL.revokeObjectURL(url);
}
