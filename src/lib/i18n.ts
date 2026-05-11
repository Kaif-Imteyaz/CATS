import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "@/locales/en/common.json";
import hiCommon from "@/locales/hi/common.json";
import urCommon from "@/locales/ur/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      hi: { common: hiCommon },
      ur: { common: urCommon },
    },
    defaultNS: "common",
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "ur"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "cats-lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
