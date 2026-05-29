import { norm180 } from './zodiac.js'

export const ASPECT_DEFS = [
  { type: 'conjunction', angle:   0, orb: 8, weight: 1.00 },
  { type: 'opposition',  angle: 180, orb: 8, weight: 0.94 },
  { type: 'trine',       angle: 120, orb: 7, weight: 0.82 },
  { type: 'square',      angle:  90, orb: 7, weight: 0.90 },
  { type: 'sextile',     angle:  60, orb: 5, weight: 0.64 },
  { type: 'quincunx',    angle: 150, orb: 3, weight: 0.54 }
]

const TIGHTER = new Set(['Chiron', 'NorthNode', 'SouthNode', 'Lilith'])

const orbFor = (def, a, b) =>
  TIGHTER.has(a) || TIGHTER.has(b) ? Math.max(2, def.orb - 3) : def.orb

const detect = (a, b) => {
  const sep = Math.abs(norm180(a.longitude - b.longitude))
  for (const d of ASPECT_DEFS) {
    const delta = Math.abs(sep - d.angle)
    const orb = orbFor(d, a.name, b.name)
    if (delta <= orb) {
      const rel       = a.speed - b.speed
      const direction = norm180(a.longitude - b.longitude) > 0 ? 1 : -1
      const strength  = Math.max(0, (1 - (delta / orb)) * d.weight)
      return {
        a: a.name,
        b: b.name,
        type: d.type,
        exact: d.angle,
        delta,
        orb,
        strength,
        applying: rel * direction < 0
      }
    }
  }
  return null
}

export const naturalAspects = (chart) => {
  const out = []
  const ps  = chart.positions
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++) {
      const asp = detect(ps[i], ps[j])
      if (asp) out.push(asp)
    }
  return out.sort((x, y) => x.delta - y.delta)
}

export const crossAspects = (a, b) => {
  const out = []
  for (const pa of a.positions)
    for (const pb of b.positions) {
      const asp = detect(pa, pb)
      if (asp) out.push(asp)
    }
  return out.sort((x, y) => x.delta - y.delta)
}
