import { norm360 } from '../astro/zodiac.js'
import { HD_GATE_ANCHOR_OFFSET } from './activations.js'
import { profileFor } from './profiles.js'
import { DAY_MINUTES, hdBodyStates, LEVELS, LEVEL_ARCS } from './sky.js'

export const DEFAULT_WINDOWS = [10, 60]

const LAYERS       = ['personality', 'design']
const CROSS_BODIES = ['Sun', 'Earth']

/**
 * Minutes since the activation entered, and until it leaves, its current cell at each level (first-order, from the speed;
 * rough for bodies close to a station or the wobbling true node).
 * `speedPerDay` is the activation's motion per day of *birth time* (negative when retrograde).
 * Uses the unrounded longitude: the mandala degrees on the activation are rounded to 1e-6 degrees.
 */
export const minutesToBoundary = (activation, speedPerDay) => {
  const perMinute = Math.abs(speedPerDay) / DAY_MINUTES
  const forward   = speedPerDay >= 0
  const rave      = norm360(activation.longitude + HD_GATE_ANCHOR_OFFSET)

  return Object.fromEntries(LEVELS.map((level) => {
    const passed     = rave % LEVEL_ARCS[level]
    const toEnd      = (LEVEL_ARCS[level] - passed) / perMinute
    const sinceStart = passed / perMinute

    return [level, { before: forward ? sinceStart : toEnd, after: forward ? toEnd : sinceStart }]
  }))
}

/** Design bodies move with design time, which tracks birth time by the ratio of the Sun's speeds at both moments. */
const birthTimeSpeeds = (chart) => {
  const personality = hdBodyStates(chart.birthJd)
  const design      = hdBodyStates(chart.designJd)
  const ratio       = personality.Sun.speed / design.Sun.speed

  return {
    personality: Object.fromEntries(Object.entries(personality).map(([name, body]) => [name, body.speed])),
    design:      Object.fromEntries(Object.entries(design).map(([name, body]) => [name, body.speed * ratio])),
  }
}

/** One row per activation (26 for a full chart) with its distance in minutes to every boundary. */
export const activationMargins = (chart) => {
  const speeds = birthTimeSpeeds(chart)

  return LAYERS.flatMap(layer => Object.entries(chart[layer]).map(([planet, activation]) => {
    const boundaries = minutesToBoundary(activation, speeds[layer][planet])
    const margins    = Object.fromEntries(LEVELS.map(level => [level, Math.min(boundaries[level].before, boundaries[level].after)]))

    return { layer, planet, gate: activation.gate, line: activation.line, speed: speeds[layer][planet], boundaries, margins }
  }))
}

const reaches = (row, level, minutes) => row.margins[level] <= minutes

const lineAlternatives = (row, minutes) => {
  const lines = [row.line]
  if (row.boundaries.line.before <= minutes) lines.push(row.line === 1 ? 6 : row.line - 1)
  if (row.boundaries.line.after <= minutes) lines.push(row.line === 6 ? 1 : row.line + 1)
  return lines
}

const profileAlternatives = (rows, minutes) => {
  const [personality, design] = LAYERS.map(layer => rows.find(row => row.layer === layer && row.planet === 'Sun'))
  const keys = lineAlternatives(personality, minutes).flatMap(p => lineAlternatives(design, minutes).map(d => profileFor(p, d)))

  return keys.filter(Boolean)
}

const arrowRows = (rows) => ({
  digestion:   rows.find(row => row.layer === 'design' && row.planet === 'Sun'),
  environment: rows.find(row => row.layer === 'design' && row.planet === 'NorthNode'),
  motivation:  rows.find(row => row.layer === 'personality' && row.planet === 'Sun'),
  perspective: rows.find(row => row.layer === 'personality' && row.planet === 'NorthNode'),
})

const windowReport = (rows, minutes) => {
  const reached      = level => rows.filter(row => reaches(row, level, minutes)).map(row => `${row.layer}.${row.planet}`)
  const alternatives = profileAlternatives(rows, minutes)
  const current      = alternatives[0]
  const crossGates   = rows.some(row => CROSS_BODIES.includes(row.planet) && reaches(row, 'gate', minutes))

  return {
    minutes,
    changes:   Object.fromEntries(LEVELS.map(level => [level, reached(level)])),
    profile:   alternatives.some(profile => profile.key !== current.key),
    cross:     crossGates || alternatives.some(profile => profile.angle !== current.angle),
    variables: Object.fromEntries(Object.entries(arrowRows(rows)).map(([id, row]) => [
      id,
      { color: reaches(row, 'color', minutes), tone: reaches(row, 'tone', minutes), base: reaches(row, 'base', minutes) },
    ])),
  }
}

/**
 * Which headline outputs could change if the birth time is off by up to N minutes either way.
 * `windows` maps N to { changes per level, profile, cross, variables per arrow }; `rows` has the per-activation margins.
 */
export const sensitivity = (chart, { windows = DEFAULT_WINDOWS } = {}) => {
  const rows = activationMargins(chart)

  return { rows, windows: Object.fromEntries(windows.map(minutes => [minutes, windowReport(rows, minutes)])) }
}
