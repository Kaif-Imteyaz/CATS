/**
 * Web Speech API — voice recognition utility
 * Uses browser-native webkitSpeechRecognition / SpeechRecognition (free, no API key)
 */

import type { Lang } from "@/store/languageStore";

const LANG_MAP: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ur: "ur-PK",
};

type RecognitionCallback = (transcript: string, isFinal: boolean) => void;

interface SpeechRecognitionAPI extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

function getRecognitionConstructor(): (new () => SpeechRecognitionAPI) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionAPI }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionAPI }).webkitSpeechRecognition ||
    null
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionConstructor() !== null;
}

let activeRecognition: SpeechRecognitionAPI | null = null;

export function startSpeechRecognition(
  lang: Lang,
  onResult: RecognitionCallback,
  onError?: (err: string) => void
): void {
  const Ctor = getRecognitionConstructor();
  if (!Ctor) {
    onError?.("Speech recognition not supported in this browser.");
    return;
  }

  stopSpeechRecognition();

  const recognition = new Ctor();
  recognition.lang = LANG_MAP[lang];
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      onResult(transcript, result.isFinal);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    onError?.(event.error);
  };

  recognition.onend = () => {
    activeRecognition = null;
  };

  recognition.start();
  activeRecognition = recognition;
}

export function stopSpeechRecognition(): void {
  if (activeRecognition) {
    activeRecognition.abort();
    activeRecognition = null;
  }
}
