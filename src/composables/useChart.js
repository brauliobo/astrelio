import { computed } from 'vue'
import { computeChart } from '../lib/astro/ephemeris.js'
import { localToJdUt, offsetMinutesForPerson } from '../lib/astro/timezones.js'

/**
 * personGetter: a ref or computed yielding a person record (or null).
 * settings:     the Pinia settings store instance (read .zodiac / .houseSystem reactively).
 */
export const useNatalChartState = (personGetter, settings) => {
  const result = computed(() => {
    const p = personGetter.value
    if (!p) return { chart: null, error: null }

    try {
      const jd = localToJdUt(p.isoLocal, offsetMinutesForPerson(p))
      return {
        chart: computeChart(jd, p.lat, p.lon, settings.chartOptions || {
          zodiac:      settings.zodiac,
          houseSystem: settings.houseSystem,
          nodeMode:    settings.nodeMode,
        }),
        error: null,
      }
    } catch (error) {
      return { chart: null, error }
    }
  })

  return {
    chart: computed(() => result.value.chart),
    error: computed(() => result.value.error),
  }
}

export const useNatalChart = (personGetter, settings) =>
  useNatalChartState(personGetter, settings).chart
