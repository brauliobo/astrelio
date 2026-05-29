import { createI18n } from 'vue-i18n'
import ptBR from './pt-BR.json'
import en from './en.json'

const detect = () => {
  const stored = localStorage.getItem('astrelio_locale')
  if (stored === 'pt-BR' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detect(),
  fallbackLocale: 'pt-BR',
  messages: { 'pt-BR': ptBR, en }
})
