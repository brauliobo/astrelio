import { computeChart, sunLongitude } from '../astro/ephemeris.js'
import { norm180, norm360 } from '../astro/zodiac.js'
import { GATE_ORDER, HD_PLANETS } from './constants.js'

export const HD_GATE_ANCHOR_OFFSET = 58

export const channelKey = (a, b) =>
  [Number(a), Number(b)].sort((left, right) => left - right).join('-')

export const activationFromLongitude = (longitude) => {
  const degrees = norm360(longitude + HD_GATE_ANCHOR_OFFSET)
  const percentage = degrees / 360

  return {
    gate: GATE_ORDER[Math.floor(percentage * 64)],
    line: (Math.floor(percentage * 384) % 6) + 1,
    color: (Math.floor(percentage * 2304) % 6) + 1,
    tone: (Math.floor(percentage * 13824) % 6) + 1,
    base: (Math.floor(percentage * 69120) % 5) + 1,
    longitude: norm360(longitude),
    progress: percentage,
  }
}

export const activationCode = (activation) =>
  `${activation.gate}.${activation.line}.${activation.color}.${activation.tone}.${activation.base}`

export const designJdForPersonalitySun = (jdUt) => {
  const target = norm360(sunLongitude(jdUt) - 88)
  let designJd = jdUt - 88

  for (let i = 0; i < 8; i += 1) {
    const delta = norm180(sunLongitude(designJd) - target)
    designJd -= delta / 0.985647
  }

  return designJd
}

const positionsByName = (chart) =>
  new Map((chart?.positions || []).map(position => [position.name, position]))

export const hdPositionsForChart = (chart) => {
  const positions = positionsByName(chart)
  const sun = positions.get('Sun')
  const rows = []

  for (const planet of HD_PLANETS) {
    if (planet === 'Earth') {
      if (sun) {
        rows.push({
          name: 'Earth',
          longitude: norm360(sun.longitude + 180),
          latitude: -sun.latitude,
          speed: sun.speed,
          retrograde: sun.retrograde,
        })
      }
      continue
    }

    const position = positions.get(planet)
    if (position) rows.push(position)
  }

  return rows
}

export const activationsForChart = (chart) =>
  Object.fromEntries(hdPositionsForChart(chart).map(position => [
    position.name,
    {
      planet: position.name,
      ...activationFromLongitude(position.longitude),
    },
  ]))

export const personalityDesignCharts = (jdUt, lat, lon) => {
  const personalityChart = computeChart(jdUt, lat, lon, {
    zodiac: 'tropical',
    houseSystem: 'whole_sign',
    nodeMode: 'true',
  })
  const designJd = designJdForPersonalitySun(jdUt)
  const designChart = computeChart(designJd, lat, lon, {
    zodiac: 'tropical',
    houseSystem: 'whole_sign',
    nodeMode: 'true',
  })

  return {
    personalityChart,
    designChart,
    designJd,
  }
}
