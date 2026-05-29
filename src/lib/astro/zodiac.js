export const norm360 = (deg) => {
  const d = deg % 360
  return d < 0 ? d + 360 : d
}

export const norm180 = (deg) => {
  let d = deg % 360
  if (d > 180)  d -= 360
  if (d < -180) d += 360
  return d
}

export const signIndex = (lon) => Math.floor(norm360(lon) / 30)
export const degInSign = (lon) => norm360(lon) % 30

/** Lahiri ayanamsa for Julian Date in TT (close enough to UT for the supported range). */
export const lahiriAyanamsa = (jd) => {
  const T = (jd - 2451545) / 36525
  return 23.85 + (50.29 / 3600) * (jd - 2451545) / 365.25 + 0.000111 * T * T
}

export const toSidereal = (lon, jd) => norm360(lon - lahiriAyanamsa(jd))
