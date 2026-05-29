import { computeChart } from './ephemeris.js'
import { msToJd } from './timezones.js'

export const transitsFor = (forDateMs, lat, lon, opts) =>
  computeChart(msToJd(forDateMs), lat, lon, opts)
