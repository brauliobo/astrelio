import { createI18n } from 'vue-i18n'
import ptBR from './pt-BR.json'
import en from './en.json'
import { detectLocale } from './locales.js'

export const i18n = createI18n({
  legacy:         false,
  locale:         detectLocale(),
  fallbackLocale: 'pt-BR',
  messages:       { 'pt-BR': ptBR, en }
})
