import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'

import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'
import ruRU from './locales/ru-RU.json'
import frFR from './locales/fr-FR.json'
import deDE from './locales/de-DE.json'
import ptBR from './locales/pt-BR.json'

const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
  'de-DE': { translation: deDE },
  'ru-RU': { translation: ruRU },
  'fr-FR': { translation: frFR },
  'pt-BR': { translation: ptBR },
}

// Determine initial language
function detectInitialLang(): string {
  try {
    const navLang = navigator.language || 'en-US'
    if (navLang.startsWith('zh')) return 'zh-CN'
    // Check for exact match in resources
    const exact = Object.keys(resources).find((k) => k === navLang)
    if (exact) return exact
    // Check language-only match
    const prefix = navLang.split('-')[0]
    const match = Object.keys(resources).find((k) => k.startsWith(prefix))
    if (match) return match
  } catch {
    // fallback
  }
  return 'en-US'
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLang(),
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false, // React already escapes
    prefix: '{',
    suffix: '}',
  },
  returnObjects: false,
})

// Re-export useTranslation for React components
export { useTranslation }

// Direct access to i18n instance for non-component code
export default i18n
