import { computeChart } from './ephemeris.js'

/** Secondary progressions: 1 day after birth = 1 year of life. */
export const secondaryProgression = (natalJdUt, forDateMs, birthMs, lat, lon, opts) => {
  const yearsElapsed = (forDateMs - birthMs) / (365.25 * 86_400_000)
  return computeChart(natalJdUt + yearsElapsed, lat, lon, opts)
}
