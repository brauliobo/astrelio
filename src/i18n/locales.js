export const SUPPORTED_LOCALES = ['pt-BR', 'en']

export const normalizeLocale = locale => {
  if (locale === 'pt-BR' || locale === 'en') return locale
  return String(locale || '').toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

export const detectLocale = () => {
  const stored = globalThis.localStorage?.getItem('astrelio_locale')
  if (stored) return normalizeLocale(stored)
  return normalizeLocale(globalThis.navigator?.language)
}
