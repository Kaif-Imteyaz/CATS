import { useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { translations, type SupportedLanguage } from '@/data/translations';

export function useTranslation() {
  const { userProfile } = useAppStore();
  const language = (userProfile.language || 'en-US') as SupportedLanguage;

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations['en-US'][key] || key;
  }, [language]);

  const getTimeOfDayGreeting = useCallback((): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
  }, [t]);

  return { t, language, getTimeOfDayGreeting };
}
