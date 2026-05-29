import { norm360 } from './zodiac.js'

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

const obliquity = (jd) => {
  const T = (jd - 2451545) / 36525
  return 23.43929111 - 0.0130041667 * T - 1.6e-7 * T * T + 5.0361e-7 * T * T * T
}

/** Greenwich Mean Sidereal Time, degrees. */
const gmst = (jd) => {
  const T = (jd - 2451545) / 36525
  const θ = 280.46061837
          + 360.98564736629 * (jd - 2451545)
          + T * T * (0.000387933 - T / 38_710_000)
  return norm360(θ)
}

/** Local Sidereal Time, degrees. */
export const lst = (jd, lonDeg) => norm360(gmst(jd) + lonDeg)

const ascMcRaw = (jd, lat, lon) => {
  const armc = lst(jd, lon) * D2R
  const obl  = obliquity(jd) * D2R
  const φ    = lat * D2R
  const mc   = norm360(Math.atan2(Math.sin(armc), Math.cos(armc) * Math.cos(obl)) * R2D)
  // Meeus 13.5; atan2 form needs sign flip on both args to land on the ASC (not DESC)
  const y    = Math.cos(armc)
  const x    = -(Math.sin(armc) * Math.cos(obl) + Math.tan(φ) * Math.sin(obl))
  const asc  = norm360(Math.atan2(y, x) * R2D)
  return { ascendant: asc, mc, armc, obl, φ }
}

const longitudeFromRightAscension = (ra, obl) =>
  norm360(Math.atan2(Math.sin(ra) / Math.cos(obl), Math.cos(ra)) * R2D)

const declinationFromLongitude = (lambda, obl) =>
  Math.asin(Math.sin(lambda) * Math.sin(obl))

const ascensionalDifference = (lambda, obl, phi) =>
  Math.asin(Math.tan(phi) * Math.tan(declinationFromLongitude(lambda, obl, phi)))

const placidusCusp = (armc, obl, phi, baseDeg, fraction) => {
  let lambda = longitudeFromRightAscension(armc + baseDeg * D2R, obl) * D2R
  for (let i = 0; i < 12; i++) {
    const ra = armc + baseDeg * D2R + fraction * ascensionalDifference(lambda, obl, phi)
    lambda = longitudeFromRightAscension(ra, obl) * D2R
  }
  return norm360(lambda * R2D)
}

export const ascMc = (jd, lat, lon) => {
  const { ascendant, mc } = ascMcRaw(jd, lat, lon)
  return { ascendant, mc }
}

const equalCusps = (asc) =>
  Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30))

const wholeSignCusps = (asc) => {
  const start = Math.floor(asc / 30) * 30
  return Array.from({ length: 12 }, (_, i) => norm360(start + i * 30))
}

/** Porphyry: trisect each quadrant between ASC, IC, DESC, MC. */
const porphyryCusps = (asc, mc) => {
  const ic   = norm360(mc + 180)
  const desc = norm360(asc + 180)
  const arc1 = norm360(ic   - asc)
  const arc2 = norm360(desc - ic)
  const arc3 = norm360(mc   - desc)
  const arc4 = norm360(asc  - mc)
  return [
    asc,
    norm360(asc + arc1 / 3),
    norm360(asc + 2 * arc1 / 3),
    ic,
    norm360(ic + arc2 / 3),
    norm360(ic + 2 * arc2 / 3),
    desc,
    norm360(desc + arc3 / 3),
    norm360(desc + 2 * arc3 / 3),
    mc,
    norm360(mc + arc4 / 3),
    norm360(mc + 2 * arc4 / 3)
  ]
}

/** Placidus by Newton iteration (Meeus ch. 13). Falls back to Porphyry above |lat|>66°. */
const placidusCusps = (jd, lat, lon) => {
  const { ascendant, mc, armc, obl, φ } = ascMcRaw(jd, lat, lon)
  if (Math.abs(lat) > 66) return porphyryCusps(ascendant, mc)
  const cusps = new Array(12)
  cusps[0] = ascendant
  cusps[9] = mc
  cusps[3] = norm360(mc + 180)
  cusps[6] = norm360(ascendant + 180)
  cusps[10] = placidusCusp(armc, obl, φ, 30, 1 / 3)
  cusps[11] = placidusCusp(armc, obl, φ, 60, 2 / 3)
  cusps[1]  = placidusCusp(armc, obl, φ, 120, 2 / 3)
  cusps[2]  = placidusCusp(armc, obl, φ, 150, 1 / 3)
  cusps[4] = norm360(cusps[10] + 180)
  cusps[5] = norm360(cusps[11] + 180)
  cusps[7] = norm360(cusps[1]  + 180)
  cusps[8] = norm360(cusps[2]  + 180)
  return cusps
}

/** Koch: approximated via Porphyry; precise port can replace this. */
const kochCusps = (jd, lat, lon) => {
  const { ascendant, mc } = ascMcRaw(jd, lat, lon)
  return porphyryCusps(ascendant, mc)
}

const regiomontanusCusps = (jd, lat, lon) => {
  const { armc, obl, φ } = ascMcRaw(jd, lat, lon)
  const cusps = []
  for (let h = 0; h < 12; h++) {
    const H    = armc + ((h - 9) * Math.PI / 6)
    const sinλ = Math.sin(H) * Math.cos(obl) + Math.tan(φ) * Math.sin(obl)
    const cosλ = Math.cos(H)
    cusps.push(norm360(Math.atan2(sinλ, cosλ) * R2D))
  }
  return cusps
}

const QUADRANT = new Set(['placidus', 'koch', 'porphyry', 'regiomontanus'])

export const calcHouses = (system, jd, lat, lon) => {
  const { ascendant, mc } = ascMcRaw(jd, lat, lon)
  let cusps
  switch (system) {
    case 'placidus':      cusps = placidusCusps(jd, lat, lon); break
    case 'koch':          cusps = kochCusps(jd, lat, lon); break
    case 'porphyry':      cusps = porphyryCusps(ascendant, mc); break
    case 'regiomontanus': cusps = regiomontanusCusps(jd, lat, lon); break
    case 'equal':         cusps = equalCusps(ascendant); break
    case 'whole_sign':    cusps = wholeSignCusps(ascendant); break
    default:              cusps = equalCusps(ascendant)
  }
  if (QUADRANT.has(system)) {
    cusps[0] = ascendant
    cusps[9] = mc
    cusps[3] = norm360(mc + 180)
    cusps[6] = norm360(ascendant + 180)
  }
  return { ascendant, mc, cusps }
}

export const houseOf = (lon, cusps) => {
  const L = norm360(lon)
  for (let i = 0; i < 12; i++) {
    const a    = cusps[i]
    const b    = cusps[(i + 1) % 12]
    const span = norm360(b - a) || 360
    const off  = norm360(L - a)
    if (off < span) return i + 1
  }
  return 1
}
