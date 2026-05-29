import { computed } from 'vue'
import { computeChart } from '../lib/astro/ephemeris.js'
import { localToJdUt, offsetMinutesForPerson } from '../lib/astro/timezones.js'

/**
 * personGetter: a ref or computed yielding a person record (or null).
 * settings:     the Pinia settings store instance (read .zodiac / .houseSystem reactively).
 */
export const useNatalChart = (personGetter, settings) =>
  computed(() => {
    const p = personGetter.value
    if (!p) return null
    const jd = localToJdUt(p.isoLocal, offsetMinutesForPerson(p))
    return computeChart(jd, p.lat, p.lon, {
      zodiac:      settings.zodiac,
      houseSystem: settings.houseSystem
    })
  })
