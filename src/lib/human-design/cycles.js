import { jdToMs, msToJd } from '../astro/timezones.js'
import { norm180, norm360 } from '../astro/zodiac.js'
import { activationFromLongitude, HD_GATE_ANCHOR_OFFSET } from './activations.js'
import { GATE_ORDER } from './constants.js'
import { bisect, bodyState, crossings, LEVEL_ARCS, longitudeAt } from './sky.js'

const YEAR_DAYS = 365.25

/** Mean cycle lengths; the real crossing is searched within +-WINDOW of n * years because orbits are eccentric. */
export const LIFE_CYCLES = [
  { id: 'saturn_return',     body: 'Saturn', angle: 0,   n: 1, years: 29.457, step: 5 },
  { id: 'saturn_return',     body: 'Saturn', angle: 0,   n: 2, years: 29.457, step: 5 },
  { id: 'chiron_return',     body: 'Chiron', angle: 0,   n: 1, years: 50.7,   step: 8 },
  { id: 'uranus_opposition', body: 'Uranus', angle: 180, n: 1, years: 42.0,   step: 20 },
  { id: 'uranus_return',     body: 'Uranus', angle: 0,   n: 1, years: 84.0,   step: 20 },
]

const WINDOW      = 0.12
const SETTLE_DAYS = 1e-4 // step past an exact boundary so the Moon is unambiguously inside the new cell

const passFor = (birthJd, jd) => ({ jd, ms: jdToMs(jd), ageYears: (jd - birthJd) / YEAR_DAYS })

const cycleWindow = ({ n, years }, birthJd) => {
  const center = birthJd + n * years * YEAR_DAYS
  const span   = n * years * YEAR_DAYS * WINDOW
  return [center - span, center + span]
}

/** Exact passes (a retrograde body may cross the natal degree up to three times) of one cycle. */
export const cyclePasses = (cycle, birthJd) => {
  const target     = norm360(longitudeAt(cycle.body, birthJd) + cycle.angle)
  const [from, to] = cycleWindow(cycle, birthJd)

  return crossings(cycle.body, target, from, to, cycle.step).map(jd => passFor(birthJd, jd))
}

/** Saturn/Chiron/Uranus returns and the Uranus opposition from the birth moment, ordered by date. */
export const lifeCycles = (birthJd, cycles = LIFE_CYCLES) =>
  cycles
    .map(cycle => ({ id: cycle.id, n: cycle.n, body: cycle.body, angle: cycle.angle, passes: cyclePasses(cycle, birthJd) }))
    .sort((a, b) => a.passes[0].jd - b.passes[0].jd)

const nextBoundaryLongitude = (longitude, arc) =>
  norm360((Math.floor(norm360(longitude + HD_GATE_ANCHOR_OFFSET) / arc) + 1) * arc - HD_GATE_ANCHOR_OFFSET)

/** Next ms at which the Moon enters a new cell of `level` (the Moon never turns retrograde). */
export const moonNextChange = (jdUt, level = 'gate') => {
  const { longitude, speed } = bodyState('Moon', jdUt)
  const arc    = LEVEL_ARCS[level]
  const target = nextBoundaryLongitude(longitude, arc)
  const ahead  = norm360(target - longitude)
  const gap    = jd => norm180(longitudeAt('Moon', jd) - target)
  const exact  = bisect(gap, jdUt, jdUt + (ahead / speed) * 1.5 + 1e-6)

  return { jd: exact, ms: jdToMs(exact), after: activationFromLongitude(target + 1e-6) }
}

/** Moon gate, line, color, tone and base at a moment, plus when the gate and line next change. */
export const lunarCycleGate = (dateMs) => {
  const jd   = msToJd(dateMs)
  const moon = bodyState('Moon', jd)
  const gate = moonNextChange(jd, 'gate')
  const line = moonNextChange(jd, 'line')

  return {
    ms:             dateMs,
    ...activationFromLongitude(moon.longitude),
    speed:          moon.speed,
    nextGateChange: { ms: gate.ms, gate: gate.after.gate },
    nextLineChange: { ms: line.ms, gate: line.after.gate, line: line.after.line },
  }
}

/** Moon gate sequence from startMs over `days` (Reflector lunar cycle); the first segment starts at startMs. */
export const moonGateMap = (startMs, days = 28) => {
  const endMs    = startMs + days * 86_400_000
  const segments = []
  let enterMs    = startMs
  let gate       = lunarCycleGate(startMs).gate

  while (enterMs < endMs) {
    const change = moonNextChange(msToJd(enterMs) + SETTLE_DAYS, 'gate')
    segments.push({ gate, enterMs, exitMs: change.ms, hours: (change.ms - enterMs) / 3_600_000 })
    enterMs = change.ms
    gate    = change.after.gate
  }

  return segments
}

/** When the Moon next enters `gate` after afterMs (the Moon needs about 27.3 days for the whole wheel). */
export const nextMoonGateEntry = (gate, afterMs) => {
  const start   = norm360(GATE_ORDER.indexOf(gate) * LEVEL_ARCS.gate - HD_GATE_ANCHOR_OFFSET)
  const jd      = msToJd(afterMs)
  const [exact] = crossings('Moon', start, jd, jd + 28, 0.5)

  return { gate, ms: jdToMs(exact) }
}
