import { defineStore } from 'pinia'
import { detectLocale, normalizeLocale } from '../i18n/locales.js'

export const SETTING_PRESETS = {
  simple: {
    houseSystem:          'equal',
    zodiac:               'tropical',
    nodeMode:             'mean',
    skyEnabled:           false,
    aspectSet:            'major',
    orbScale:             0.75,
    applyingOnly:         false,
    includeModernPlanets: false
  },
  traditional: {
    houseSystem:          'whole_sign',
    zodiac:               'tropical',
    nodeMode:             'mean',
    skyEnabled:           false,
    aspectSet:            'major',
    orbScale:             1,
    applyingOnly:         true,
    includeModernPlanets: false
  },
  modern: {
    houseSystem:          'placidus',
    zodiac:               'tropical',
    nodeMode:             'mean',
    skyEnabled:           true,
    aspectSet:            'all',
    orbScale:             1,
    applyingOnly:         false,
    includeModernPlanets: true
  },
  technical: {
    houseSystem:          'regiomontanus',
    zodiac:               'sidereal',
    nodeMode:             'mean',
    skyEnabled:           true,
    aspectSet:            'all',
    orbScale:             1.25,
    applyingOnly:         false,
    includeModernPlanets: true
  },
  print: {
    houseSystem:          'placidus',
    zodiac:               'tropical',
    nodeMode:             'mean',
    skyEnabled:           false,
    aspectSet:            'major',
    orbScale:             0.75,
    applyingOnly:         false,
    includeModernPlanets: true
  }
}

export const SETTING_PRESET_KEYS = Object.keys(SETTING_PRESETS)

const PRESET_FIELDS = [
  'houseSystem',
  'zodiac',
  'nodeMode',
  'skyEnabled',
  'aspectSet',
  'orbScale',
  'applyingOnly',
  'includeModernPlanets'
]

const matchesPreset = (state, preset) =>
  PRESET_FIELDS.every((field) => state[field] === preset[field])

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    locale:               detectLocale(),
    houseSystem:          'placidus',
    zodiac:               'tropical',
    nodeMode:             'mean',
    skyEnabled:           true,
    theme:                'dark',
    aspectSet:            'all',
    orbScale:             1,
    applyingOnly:         false,
    includeModernPlanets: true,
    planetGlyphRenderer:  'svg',
    vedic:                {
      ayanamsha:            'lahiri',
      houseMode:            'whole_sign',
      nodeMode:             'mean',
      includeModernPlanets: false,
      interpretationStyle:  'classical'
    }
  }),
  getters: {
    activePreset: (state) =>
      Object.entries(SETTING_PRESETS).find(([, preset]) => matchesPreset(state, preset))?.[0] || 'custom',
    aspectOptions: (state) => ({
      aspectSet:            state.aspectSet,
      orbScale:             state.orbScale,
      applyingOnly:         state.applyingOnly,
      includeModernPlanets: state.includeModernPlanets,
    }),
    chartOptions: (state) => ({
      zodiac:      state.zodiac,
      houseSystem: state.houseSystem,
      nodeMode:    state.nodeMode === 'true' ? 'true' : 'mean',
    })
  },
  actions: {
    setLocale(l) {
      const locale = normalizeLocale(l)
      this.locale  = locale
      localStorage.setItem('astrelio_locale', locale)
    },
    normalize() {
      this.locale = normalizeLocale(this.locale)
      this.aspectSet ??= 'all'
      this.nodeMode = this.nodeMode === 'true' ? 'true' : 'mean'
      this.orbScale ??= 1
      this.applyingOnly ??= false
      this.includeModernPlanets ??= true
      this.planetGlyphRenderer ||= 'svg'
      if (!['svg', 'utf8', 'text'].includes(this.planetGlyphRenderer)) this.planetGlyphRenderer = 'svg'
      this.vedic ??= {}
      this.vedic.ayanamsha ||= 'lahiri'
      this.vedic.houseMode ||= 'whole_sign'
      this.vedic.nodeMode ||= 'mean'
      this.vedic.includeModernPlanets ??= false
      this.vedic.interpretationStyle ||= 'classical'
      if (!['dark', 'light'].includes(this.theme)) this.theme = 'dark'
    },
    setTheme(theme) {
      this.theme = theme === 'light' ? 'light' : 'dark'
    },
    toggleTheme() {
      this.setTheme(this.theme === 'light' ? 'dark' : 'light')
    },
    applyPreset(presetKey) {
      const preset = SETTING_PRESETS[presetKey]
      if (!preset) return
      this.$patch({ ...preset })
    },
    reset() {
      this.$reset()
      localStorage.removeItem('astrelio_locale')
    }
  },
  persist: { key: 'astrelio_settings' }
})
