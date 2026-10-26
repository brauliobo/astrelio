import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { buildHumanDesignChart } from '../../../src/lib/human-design/bodygraph.js'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'
import { referenceChart } from './reference-chart.js'

export const NOW = Date.UTC(2026, 9, 25, 12)

export const chart     = referenceChart()
export const reflector = buildHumanDesignChart({ id: 'refl', name: 'Reflector', isoLocal: '1990-09-16T09:00', tzOffsetMinutes: -180, lat: -23.5, lon: -46.6 })

export const mountView = (component, props = {}, locale = 'en') => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale, messages: { en, 'pt-BR': ptBR } })
  return mount(component, { props: { chart, now: NOW, ...props }, global: { plugins: [i18n, pinia] }, attachTo: document.body })
}
