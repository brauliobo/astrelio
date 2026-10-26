import { normalizeLocale } from '../../../i18n/locales.js'
import enFirst from './lines/en/gates-01-32.js'
import enLast from './lines/en/gates-33-64.js'
import ptFirst from './lines/pt-BR/gates-01-32.js'
import ptLast from './lines/pt-BR/gates-33-64.js'

const LINES = {
  en:      { ...enFirst, ...enLast },
  'pt-BR': { ...ptFirst, ...ptLast },
}

const LINE_NUMBERS = [1, 2, 3, 4, 5, 6]

/** `{ keynote, text }` of one gate line in the locale, falling back to English when the locale has no text for it. */
export const lineContent = (locale, gate, line) => {
  const key = `${gate}.${line}`
  return LINES[normalizeLocale(locale)][key] ?? LINES.en[key]
}

/** The six lines of a gate as `{ line, keynote, text }`. */
export const gateLines = (locale, gate) => LINE_NUMBERS.map(line => ({ line, ...lineContent(locale, gate, line) }))
