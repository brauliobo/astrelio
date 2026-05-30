import { secondaryProgression } from './progressions.js'
import { norm180, norm360 } from './zodiac.js'

export const SOLAR_ARC_SYMBOLIC_SPEED = 1 / 365.25

const body = (chart, name) => chart.positions.find(p => p.name === name)

export const solarArcDegrees = (natalChart, progressedChart) => {
  const natalSun = body(natalChart, 'Sun')
  const progressedSun = body(progressedChart, 'Sun')
  if (!natalSun || !progressedSun) throw new Error('solar arc requires Sun positions')
  return norm180(progressedSun.longitude - natalSun.longitude)
}

export const solarArcChart = (natalChart, arcDegrees) => ({
  ...natalChart,
  technique: 'solar_arc',
  solarArc: arcDegrees,
  ascendant: norm360(natalChart.ascendant + arcDegrees),
  mc: norm360(natalChart.mc + arcDegrees),
  fortune: typeof natalChart.fortune === 'number' ? norm360(natalChart.fortune + arcDegrees) : natalChart.fortune,
  spirit: typeof natalChart.spirit === 'number' ? norm360(natalChart.spirit + arcDegrees) : natalChart.spirit,
  vertex: typeof natalChart.vertex === 'number' ? norm360(natalChart.vertex + arcDegrees) : natalChart.vertex,
  eastPoint: typeof natalChart.eastPoint === 'number' ? norm360(natalChart.eastPoint + arcDegrees) : natalChart.eastPoint,
  cusps: natalChart.cusps.map(cusp => norm360(cusp + arcDegrees)),
  positions: natalChart.positions.map(position => ({
    ...position,
    longitude: norm360(position.longitude + arcDegrees),
    speed: Math.sign(arcDegrees || 1) * SOLAR_ARC_SYMBOLIC_SPEED,
    retrograde: arcDegrees < 0,
  })),
})

export const solarArcDirections = (
  natalChart,
  natalJdUt,
  forDateMs,
  birthMs,
  lat,
  lon,
  opts
) => {
  const progressed = secondaryProgression(natalJdUt, forDateMs, birthMs, lat, lon, opts)
  return solarArcChart(natalChart, solarArcDegrees(natalChart, progressed))
}
