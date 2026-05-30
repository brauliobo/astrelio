import { computeChart, sunLongitude } from '../astro/ephemeris.js'
import { norm180, norm360 } from '../astro/zodiac.js'
import { GATE_ORDER, HD_PLANETS } from './constants.js'

export const HD_GATE_ANCHOR_OFFSET = 58
const GATE_ARC_DEGREES             = 360 / 64
const LINE_ARC_DEGREES             = GATE_ARC_DEGREES / 6
const COLOR_ARC_DEGREES            = LINE_ARC_DEGREES / 6
const TONE_ARC_DEGREES             = COLOR_ARC_DEGREES / 6
const BASE_ARC_DEGREES             = TONE_ARC_DEGREES / 5

const roundDegree = value => Number(value.toFixed(6))

export const channelKey = (a, b) =>
  [Number(a), Number(b)].sort((left, right) => left - right).join('-')

export const activationFromLongitude = (longitude) => {
  const degrees     = norm360(longitude + HD_GATE_ANCHOR_OFFSET)
  const percentage  = degrees / 360
  const gateIndex   = Math.floor(percentage * 64)
  const gateStart   = gateIndex * GATE_ARC_DEGREES
  const withinGate  = degrees - gateStart
  const lineIndex   = Math.floor(withinGate / LINE_ARC_DEGREES)
  const lineStart   = gateStart + (lineIndex * LINE_ARC_DEGREES)
  const withinLine  = degrees - lineStart
  const colorIndex  = Math.floor(withinLine / COLOR_ARC_DEGREES)
  const colorStart  = lineStart + (colorIndex * COLOR_ARC_DEGREES)
  const withinColor = degrees - colorStart
  const toneIndex   = Math.floor(withinColor / TONE_ARC_DEGREES)
  const toneStart   = colorStart + (toneIndex * TONE_ARC_DEGREES)
  const withinTone  = degrees - toneStart
  const baseIndex   = Math.floor(withinTone / BASE_ARC_DEGREES)
  const baseStart   = toneStart + (baseIndex * BASE_ARC_DEGREES)

  return {
    gate:      GATE_ORDER[gateIndex],
    line:      lineIndex + 1,
    color:     colorIndex + 1,
    tone:      toneIndex + 1,
    base:      baseIndex + 1,
    longitude: norm360(longitude),
    progress:  percentage,
    mandala:   {
      raveLongitude: roundDegree(degrees),
      gateIndex,
      gateStart:       roundDegree(gateStart),
      gateEnd:         roundDegree(gateStart + GATE_ARC_DEGREES),
      gateDegrees:     roundDegree(withinGate),
      lineDegrees:     roundDegree(withinLine),
      colorDegrees:    roundDegree(withinColor),
      toneDegrees:     roundDegree(withinTone),
      baseDegrees:     roundDegree(degrees - baseStart),
      gateArcDegrees:  GATE_ARC_DEGREES,
      lineArcDegrees:  LINE_ARC_DEGREES,
      colorArcDegrees: COLOR_ARC_DEGREES,
      toneArcDegrees:  TONE_ARC_DEGREES,
      baseArcDegrees:  BASE_ARC_DEGREES,
    },
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
  const sun       = positions.get('Sun')
  const rows      = []

  for (const planet of HD_PLANETS) {
    if (planet === 'Earth') {
      if (sun) {
        rows.push({
          name:       'Earth',
          longitude:  norm360(sun.longitude + 180),
          latitude:   -sun.latitude,
          speed:      sun.speed,
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
    zodiac:      'tropical',
    houseSystem: 'whole_sign',
    nodeMode:    'true',
  })
  const designJd    = designJdForPersonalitySun(jdUt)
  const designChart = computeChart(designJd, lat, lon, {
    zodiac:      'tropical',
    houseSystem: 'whole_sign',
    nodeMode:    'true',
  })

  return {
    personalityChart,
    designChart,
    designJd,
  }
}
