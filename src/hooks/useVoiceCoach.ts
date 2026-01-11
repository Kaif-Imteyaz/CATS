import { useCallback, useRef, useEffect } from 'react';

export type VoiceLanguage = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'pt-BR' | 'zh-CN' | 'ja-JP' | 'hi-IN';

export const VOICE_LANGUAGES: { code: VoiceLanguage; label: string; flag: string }[] = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  { code: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
];

// Translations for voice prompts
const translations: Record<VoiceLanguage, Record<string, string>> = {
  'en-US': {
    letsGo: "Let's go! Rep",
    lastRep: 'Last rep! Push through!',
    halfway: 'Halfway there!',
    repsComplete: 'reps done',
    setComplete: 'Great job! Set',
    complete: 'complete',
    restFor: 'Take a 30 second rest',
    secondRest: 'second rest',
    allSetsComplete: 'Amazing! You completed all',
    sets: 'sets',
    starting: 'Starting exercise. Get into position.',
    keepGoing: 'Keep going!',
    youGotThis: 'You got this!',
    niceForm: 'Nice form!',
    stayStrong: 'Stay strong!',
    greatWork: 'Great work!',
    skippingRest: "Skipping rest. Let's go!",
    secondsLeft: 'seconds left',
    go: 'Go!',
  },
  'es-ES': {
    letsGo: '¡Vamos! Rep',
    lastRep: '¡Última repetición! ¡Sigue!',
    halfway: '¡A mitad de camino!',
    repsComplete: 'repeticiones hechas',
    setComplete: '¡Buen trabajo! Serie',
    complete: 'completa',
    restFor: 'Descansa',
    secondRest: 'segundos',
    allSetsComplete: '¡Increíble! Completaste todas las',
    sets: 'series',
    starting: 'Iniciando ejercicio. Ponte en posición.',
    keepGoing: '¡Sigue así!',
    youGotThis: '¡Tú puedes!',
    niceForm: '¡Buena forma!',
    stayStrong: '¡Mantente fuerte!',
    greatWork: '¡Gran trabajo!',
    skippingRest: '¡Saltando descanso, vamos!',
    secondsLeft: 'segundos restantes',
    go: '¡Ya!',
  },
  'fr-FR': {
    letsGo: "C'est parti! Rep",
    lastRep: 'Dernière répétition! Courage!',
    halfway: 'À mi-chemin!',
    repsComplete: 'répétitions faites',
    setComplete: 'Bravo! Série',
    complete: 'terminée',
    restFor: 'Repos de',
    secondRest: 'secondes',
    allSetsComplete: 'Incroyable! Tu as complété toutes les',
    sets: 'séries',
    starting: "Début de l'exercice. Mets-toi en position.",
    keepGoing: 'Continue!',
    youGotThis: 'Tu peux le faire!',
    niceForm: 'Belle forme!',
    stayStrong: 'Reste fort!',
    greatWork: 'Excellent travail!',
    skippingRest: 'On saute le repos, allons-y!',
    secondsLeft: 'secondes restantes',
    go: 'Go!',
  },
  'de-DE': {
    letsGo: 'Los gehts! Rep',
    lastRep: 'Letzte Wiederholung! Durchhalten!',
    halfway: 'Halbzeit!',
    repsComplete: 'Wiederholungen geschafft',
    setComplete: 'Super! Satz',
    complete: 'abgeschlossen',
    restFor: 'Pause für',
    secondRest: 'Sekunden',
    allSetsComplete: 'Fantastisch! Du hast alle',
    sets: 'Sätze geschafft',
    starting: 'Übung beginnt. In Position gehen.',
    keepGoing: 'Weiter so!',
    youGotThis: 'Du schaffst das!',
    niceForm: 'Gute Form!',
    stayStrong: 'Bleib stark!',
    greatWork: 'Tolle Arbeit!',
    skippingRest: 'Pause überspringen, los!',
    secondsLeft: 'Sekunden übrig',
    go: 'Los!',
  },
  'pt-BR': {
    letsGo: 'Vamos lá! Rep',
    lastRep: 'Última repetição! Força!',
    halfway: 'Metade do caminho!',
    repsComplete: 'repetições feitas',
    setComplete: 'Ótimo trabalho! Série',
    complete: 'completa',
    restFor: 'Descanse',
    secondRest: 'segundos',
    allSetsComplete: 'Incrível! Você completou todas as',
    sets: 'séries',
    starting: 'Iniciando exercício. Entre em posição.',
    keepGoing: 'Continue!',
    youGotThis: 'Você consegue!',
    niceForm: 'Boa forma!',
    stayStrong: 'Fique forte!',
    greatWork: 'Ótimo trabalho!',
    skippingRest: 'Pulando descanso, vamos!',
    secondsLeft: 'segundos restantes',
    go: 'Vai!',
  },
  'zh-CN': {
    letsGo: '开始！第',
    lastRep: '最后一个！加油！',
    halfway: '完成一半了！',
    repsComplete: '次完成',
    setComplete: '很棒！第',
    complete: '组完成',
    restFor: '休息',
    secondRest: '秒',
    allSetsComplete: '太棒了！你完成了所有',
    sets: '组',
    starting: '开始练习，准备好姿势。',
    keepGoing: '继续加油！',
    youGotThis: '你可以的！',
    niceForm: '姿势很好！',
    stayStrong: '保持坚强！',
    greatWork: '做得好！',
    skippingRest: '跳过休息，走！',
    secondsLeft: '秒剩余',
    go: '开始！',
  },
  'ja-JP': {
    letsGo: 'さあ行こう！',
    lastRep: '最後の一回！頑張れ！',
    halfway: '半分達成！',
    repsComplete: '回完了',
    setComplete: 'よくできました！セット',
    complete: '完了',
    restFor: '休憩',
    secondRest: '秒',
    allSetsComplete: 'すごい！全',
    sets: 'セット完了',
    starting: 'エクササイズ開始。ポジションについて。',
    keepGoing: '続けて！',
    youGotThis: 'できるよ！',
    niceForm: 'いいフォーム！',
    stayStrong: '強く！',
    greatWork: 'いい仕事！',
    skippingRest: '休憩スキップ、行こう！',
    secondsLeft: '秒残り',
    go: '行こう！',
  },
  'hi-IN': {
    letsGo: 'चलो! रेप',
    lastRep: 'आखिरी रेप! हिम्मत रखो!',
    halfway: 'आधा हो गया!',
    repsComplete: 'रेप्स पूरे',
    setComplete: 'बहुत बढ़िया! सेट',
    complete: 'पूरा',
    restFor: 'आराम करो',
    secondRest: 'सेकंड',
    allSetsComplete: 'शानदार! तुमने सभी',
    sets: 'सेट पूरे किए',
    starting: 'व्यायाम शुरू। स्थिति में आओ।',
    keepGoing: 'जारी रखो!',
    youGotThis: 'तुम कर सकते हो!',
    niceForm: 'अच्छा फॉर्म!',
    stayStrong: 'मजबूत रहो!',
    greatWork: 'शानदार काम!',
    skippingRest: 'आराम छोड़ो, चलो!',
    secondsLeft: 'सेकंड बाकी',
    go: 'जाओ!',
  },
};

interface VoiceCoachOptions {
  enabled: boolean;
  volume?: number;
  rate?: number;
  pitch?: number;
  language?: VoiceLanguage;
}

export function useVoiceCoach(options: VoiceCoachOptions) {
  const { enabled, volume = 1, rate = 1, pitch = 1, language = 'en-US' } = options;
  const lastSpokenRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);

  const t = useCallback((key: string) => {
    return translations[language]?.[key] || translations['en-US'][key] || key;
  }, [language]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, options?: { force?: boolean; debounceMs?: number }) => {
    if (!enabled) return;
    
    const { force = false, debounceMs = 3000 } = options || {};
    const now = Date.now();
    
    if (!force && text === lastSpokenRef.current && now - lastSpokenTimeRef.current < debounceMs) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = language;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    lastSpokenRef.current = text;
    lastSpokenTimeRef.current = now;
    
    window.speechSynthesis.speak(utterance);
  }, [enabled, volume, rate, pitch, language]);

  const speakRep = useCallback((rep: number, total: number) => {
    if (rep === 1) {
      speak(`${t('letsGo')} ${rep}`, { force: true });
    } else if (rep === total) {
      speak(t('lastRep'), { force: true });
    } else if (rep === Math.floor(total / 2)) {
      speak(`${t('halfway')} ${rep} ${t('repsComplete')}`, { force: true });
    } else {
      speak(`${rep}`, { force: true, debounceMs: 500 });
    }
  }, [speak, t]);

  const speakSetComplete = useCallback((set: number, totalSets: number, restSeconds: number) => {
    if (set < totalSets) {
      speak(`${t('setComplete')} ${set} ${t('complete')}. ${t('restFor')} ${restSeconds} ${t('secondRest')}.`, { force: true });
    } else {
      speak(`${t('allSetsComplete')} ${totalSets} ${t('sets')}!`, { force: true });
    }
  }, [speak, t]);

  const speakRestCountdown = useCallback((seconds: number) => {
    if (seconds === 10) {
      speak(`10 ${t('secondsLeft')}`, { force: true });
    } else if (seconds === 5) {
      speak('5', { force: true });
    } else if (seconds === 3) {
      speak('3', { force: true });
    } else if (seconds === 2) {
      speak('2', { force: true });
    } else if (seconds === 1) {
      speak('1', { force: true });
    } else if (seconds === 0) {
      speak(t('go'), { force: true });
    }
  }, [speak, t]);

  const speakFormFeedback = useCallback((feedback: { type: string; message: string }) => {
    if (feedback.type === 'error') {
      speak(feedback.message, { debounceMs: 5000 });
    } else if (feedback.type === 'warning') {
      speak(feedback.message, { debounceMs: 4000 });
    }
  }, [speak]);

  const speakStart = useCallback(() => {
    speak(t('starting'), { force: true });
  }, [speak, t]);

  const speakEncouragement = useCallback(() => {
    const phrases = [
      t('keepGoing'),
      t('youGotThis'),
      t('niceForm'),
      t('stayStrong'),
      t('greatWork'),
    ];
    speak(phrases[Math.floor(Math.random() * phrases.length)], { debounceMs: 10000 });
  }, [speak, t]);

  const speakSkipRest = useCallback(() => {
    speak(t('skippingRest'), { force: true });
  }, [speak, t]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return {
    speak,
    speakRep,
    speakSetComplete,
    speakRestCountdown,
    speakFormFeedback,
    speakStart,
    speakEncouragement,
    speakSkipRest,
    cancel,
  };
}
