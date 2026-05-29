import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    locale:      'pt-BR',
    houseSystem: 'placidus',
    zodiac:      'tropical',
    skyEnabled:  true,
    theme:       'dark'
  }),
  actions: {
    setLocale(l) { this.locale = l; localStorage.setItem('astrelio_locale', l) },
    reset() {
      this.$reset()
      localStorage.removeItem('astrelio_locale')
    }
  },
  persist: { key: 'astrelio_settings' }
})
