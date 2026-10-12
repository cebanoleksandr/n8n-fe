import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

export const languages = ['en', 'ru'] as const

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

// Translations live in public/locales/<lng>/translation.json and load on demand;
// components suspend until they arrive (see the Suspense in App).
void i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: languages,
    fallbackLng: 'en',
    // "ru-RU" from the browser loads "ru".
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'flow:language',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
