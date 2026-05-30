import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    locale:      'pt-BR',
    houseSystem: 'placidus',
    zodiac:      'tropical',
    skyEnabled:  true,
    theme:       'dark',
    aspectSet:   'all',
    orbScale:    1,
    applyingOnly: false,
    includeModernPlanets: true
  }),
  getters: {
    aspectOptions: (state) => ({
      aspectSet: state.aspectSet,
      orbScale: state.orbScale,
      applyingOnly: state.applyingOnly,
      includeModernPlanets: state.includeModernPlanets,
    })
  },
  actions: {
    setLocale(l) { this.locale = l; localStorage.setItem('astrelio_locale', l) },
    normalize() {
      this.aspectSet ??= 'all'
      this.orbScale ??= 1
      this.applyingOnly ??= false
      this.includeModernPlanets ??= true
    },
    reset() {
      this.$reset()
      localStorage.removeItem('astrelio_locale')
    }
  },
  persist: { key: 'astrelio_settings' }
})
