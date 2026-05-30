import { norm180 } from './zodiac.js'

export const ASPECT_DEFS = [
  { type: 'conjunction', angle:   0, orb: 8, weight: 1.00 },
  { type: 'opposition',  angle: 180, orb: 8, weight: 0.94 },
  { type: 'trine',       angle: 120, orb: 7, weight: 0.82 },
  { type: 'square',      angle:  90, orb: 7, weight: 0.90 },
  { type: 'sextile',     angle:  60, orb: 5, weight: 0.64 },
  { type: 'quincunx',    angle: 150, orb: 3, weight: 0.54 }
]

const TIGHTER = new Set([
  'Chiron',
  'NorthNode',
  'SouthNode',
  'Lilith',
  'Ascendant',
  'Midheaven',
  'Fortune',
  'Spirit',
  'Vertex',
  'EastPoint',
])
const MODERN = new Set(['Uranus', 'Neptune', 'Pluto', 'Chiron', 'Lilith'])
const MAJOR_TYPES = new Set(['conjunction', 'opposition', 'trine', 'square', 'sextile'])

export const DEFAULT_ASPECT_OPTIONS = {
  aspectSet: 'all',
  orbScale: 1,
  applyingOnly: false,
  includeModernPlanets: true,
}

export const aspectOptionsFromSettings = (settings = {}) => ({
  aspectSet: settings.aspectSet || DEFAULT_ASPECT_OPTIONS.aspectSet,
  orbScale: Number(settings.orbScale || DEFAULT_ASPECT_OPTIONS.orbScale),
  applyingOnly: !!settings.applyingOnly,
  includeModernPlanets: settings.includeModernPlanets ?? DEFAULT_ASPECT_OPTIONS.includeModernPlanets,
})

const orbFor = (def, a, b) =>
  TIGHTER.has(a) || TIGHTER.has(b) ? Math.max(2, def.orb - 3) : def.orb

const enabledDefs = (opts) =>
  ASPECT_DEFS.filter(def => opts.aspectSet !== 'major' || MAJOR_TYPES.has(def.type))

const includeBody = (name, opts) =>
  opts.includeModernPlanets || !MODERN.has(name)

export const isAspectBodyEnabled = (name, options = DEFAULT_ASPECT_OPTIONS) =>
  includeBody(name, aspectOptionsFromSettings(options))

const detect = (a, b, options = DEFAULT_ASPECT_OPTIONS) => {
  const opts = aspectOptionsFromSettings(options)
  if (!includeBody(a.name, opts) || !includeBody(b.name, opts)) return null

  const sep = Math.abs(norm180(a.longitude - b.longitude))
  for (const d of enabledDefs(opts)) {
    const delta = Math.abs(sep - d.angle)
    const orb = orbFor(d, a.name, b.name) * opts.orbScale
    if (delta <= orb) {
      const rel       = a.speed - b.speed
      const direction = norm180(a.longitude - b.longitude) > 0 ? 1 : -1
      const strength  = Math.max(0, (1 - (delta / orb)) * d.weight)
      const applying  = rel * direction < 0
      if (opts.applyingOnly && !applying) return null
      return {
        a: a.name,
        b: b.name,
        type: d.type,
        exact: d.angle,
        delta,
        orb,
        strength,
        applying
      }
    }
  }
  return null
}

export const aspectBetween = detect

export const naturalAspects = (chart, options = DEFAULT_ASPECT_OPTIONS) => {
  const out = []
  const ps  = chart.positions
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++) {
      const asp = detect(ps[i], ps[j], options)
      if (asp) out.push(asp)
    }
  return out.sort((x, y) => x.delta - y.delta)
}

export const crossAspects = (a, b, options = DEFAULT_ASPECT_OPTIONS) => {
  const out = []
  for (const pa of a.positions)
    for (const pb of b.positions) {
      const asp = detect(pa, pb, options)
      if (asp) out.push(asp)
    }
  return out.sort((x, y) => x.delta - y.delta)
}
