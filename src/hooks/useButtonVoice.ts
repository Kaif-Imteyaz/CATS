import { useCallback, useRef } from 'react';
import { useAppStore } from '../stores/appStore';

const buttonDescriptions: Record<string, Record<string, string>> = {
  'en-US': {
    'start-session': 'Start your exercise session',
    'view-exercises': 'View all exercises',
    'view-progress': 'View your progress and stats',
    'view-profile': 'Open your profile settings',
    'view-stories': 'Listen to patient success stories',
    'notifications': 'View your notifications and messages',
    'listen-doctor': 'Listen to your doctor recommendations',
    'skip-rest': 'Skip the rest period',
    'end-session': 'End the current session',
    'start-exercise': 'Begin this exercise',
  },
  'es-ES': {
    'start-session': 'Iniciar tu sesión de ejercicios',
    'view-exercises': 'Ver todos los ejercicios',
    'view-progress': 'Ver tu progreso y estadísticas',
    'view-profile': 'Abrir configuración de perfil',
    'view-stories': 'Escuchar historias de éxito de pacientes',
    'notifications': 'Ver tus notificaciones y mensajes',
    'listen-doctor': 'Escuchar las recomendaciones del doctor',
    'skip-rest': 'Saltar el período de descanso',
    'end-session': 'Terminar la sesión actual',
    'start-exercise': 'Comenzar este ejercicio',
  },
  'hi-IN': {
    'start-session': 'अपना व्यायाम सत्र शुरू करें',
    'view-exercises': 'सभी व्यायाम देखें',
    'view-progress': 'अपनी प्रगति और आंकड़े देखें',
    'view-profile': 'अपनी प्रोफ़ाइल सेटिंग्स खोलें',
    'view-stories': 'मरीजों की सफलता की कहानियां सुनें',
    'notifications': 'अपनी सूचनाएं और संदेश देखें',
    'listen-doctor': 'अपने डॉक्टर की सिफारिशें सुनें',
    'skip-rest': 'आराम की अवधि छोड़ें',
    'end-session': 'वर्तमान सत्र समाप्त करें',
    'start-exercise': 'यह व्यायाम शुरू करें',
  },
  'zh-CN': {
    'start-session': '开始您的锻炼课程',
    'view-exercises': '查看所有练习',
    'view-progress': '查看您的进度和统计数据',
    'view-profile': '打开您的个人资料设置',
    'view-stories': '收听患者成功故事',
    'notifications': '查看您的通知和消息',
    'listen-doctor': '收听医生的建议',
    'skip-rest': '跳过休息时间',
    'end-session': '结束当前课程',
    'start-exercise': '开始此练习',
  },
};

export function useButtonVoice() {
  const { userProfile } = useAppStore();
  const lastSpokenRef = useRef<string>('');
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const speak = useCallback((buttonId: string) => {
    if (!userProfile.voiceAccessibility) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Prevent speaking the same thing twice in quick succession
    if (lastSpokenRef.current === buttonId) return;
    lastSpokenRef.current = buttonId;
    setTimeout(() => { lastSpokenRef.current = ''; }, 2000);

    const lang = userProfile.language;
    const descriptions = buttonDescriptions[lang] || buttonDescriptions['en-US'];
    const text = descriptions[buttonId] || buttonDescriptions['en-US'][buttonId];

    if (!text) return;

    synthRef.current = window.speechSynthesis;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find a voice for the language
    const voices = synthRef.current.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
    if (voice) utterance.voice = voice;

    synthRef.current.speak(utterance);
  }, [userProfile.voiceAccessibility, userProfile.language]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  return { speak, stop };
}