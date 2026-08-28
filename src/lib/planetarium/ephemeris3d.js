import {
  AngleBetween,
  Body,
  Constellation,
  Ecliptic,
  EquatorFromVector,
  GeoVector,
  HelioVector,
  Illumination,
  Libration,
  MakeTime,
  Observer,
  RotateVector,
  RotationAxis,
  Rotation_EQD_EQJ,
  Rotation_EQJ_ECL,
  SiderealTime,
} from 'astronomy-engine'

const ECL_FROM_EQJ = Rotation_EQJ_ECL()

export const DEG = Math.PI / 180

const bodyOf = name => Body[name]

export const astroTime = value => MakeTime(value instanceof Date ? value : new Date(value))

// Scene frame: ecliptic J2000 with three.js Y as the north ecliptic pole (right-handed).
const toScene = vector => ({ x: vector.x, y: vector.z, z: -vector.y })

const eclipticVector = vector => toScene(RotateVector(ECL_FROM_EQJ, vector))

/** Convert any EQJ vector (for example a moon state vector) into scene coordinates. */
export const eclipticVectorOf = vector => eclipticVector(vector)

export const helioEcliptic = (name, date) => eclipticVector(HelioVector(bodyOf(name), astroTime(date)))

export const geoEcliptic = (name, date) => eclipticVector(GeoVector(bodyOf(name), astroTime(date), true))

export const lengthAu = vector => Math.hypot(vector.x, vector.y, vector.z)

export const distanceAu = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

// Heliocentric position of every rendered body, Moon included, in one pass.
export const heliocentricPositions = (names, date) => {
  const time = astroTime(date)
  return new Map(names.map(name => [name, name === 'Sun' ? { x: 0, y: 0, z: 0 } : helioEcliptic(name, time)]))
}

export const illuminationOf = (name, date) => {
  const info = Illumination(bodyOf(name), astroTime(date))
  return {
    magnitude:      info.mag,
    phaseAngle:     info.phase_angle,
    phaseFraction:  info.phase_fraction,
    helioDistanceAu: info.helio_dist,
    geoDistanceAu:  info.geo_dist,
    ringTilt:       info.ring_tilt ?? null,
  }
}

export const librationOf = (date) => {
  const info = Libration(astroTime(date).date)
  return {
    latitudeDeg:  info.elat,
    longitudeDeg: info.elon,
    distanceKm:   info.dist_km,
    diameterDeg:  info.diam_deg,
  }
}

export const eclipticLongitudeOf = (name, date) =>
  Ecliptic(GeoVector(bodyOf(name), astroTime(date), true)).elon

export const eclipticLatitudeOf = (name, date) =>
  Ecliptic(GeoVector(bodyOf(name), astroTime(date), true)).elat

export const constellationOf = (name, date) => {
  const equator = EquatorFromVector(GeoVector(bodyOf(name), astroTime(date), true))
  return Constellation(equator.ra, equator.dec).name
}

export const separationDeg = (a, b, date) => {
  const time = astroTime(date)
  return AngleBetween(GeoVector(bodyOf(a), time, true), GeoVector(bodyOf(b), time, true))
}

/** Apparent radius of a body as seen from Earth, in degrees. */
export const apparentRadiusDeg = (name, radiusKm, date) => {
  const distanceKm = lengthAu(geoEcliptic(name, date)) * 149597870.7
  return Math.asin(Math.min(1, radiusKm / distanceKm)) / DEG
}

export const observerOf = ({ latitude, longitude, elevation = 0 }) =>
  new Observer(Number(latitude) || 0, Number(longitude) || 0, Number(elevation) || 0)

const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})

const scaled = (vector, factor) => ({ x: vector.x * factor, y: vector.y * factor, z: vector.z * factor })

const added = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })

/**
 * Body-fixed axes in scene coordinates, following the IAU convention: Z is the north pole, X the
 * prime meridian rotated by the spin angle W from the equator's ascending node on the EQJ equator.
 * This is what makes continents, terminators and the Moon's tidal lock land where they really are.
 */
export const orientationBasis = (name, date) => {
  if (name === 'Earth') return earthBasis(astroTime(date))

  const axis  = RotationAxis(bodyOf(name), astroTime(date))
  const raRad = axis.ra * 15 * DEG
  const spin  = axis.spin * DEG
  const north = { x: axis.north.x, y: axis.north.y, z: axis.north.z }
  const node  = { x: -Math.sin(raRad), y: Math.cos(raRad), z: 0 }
  const prime = added(scaled(node, Math.cos(spin)), scaled(cross(north, node), Math.sin(spin)))

  return {
    x: eclipticVector(prime),
    y: eclipticVector(cross(north, prime)),
    z: eclipticVector(north),
  }
}

/**
 * Earth is oriented from Greenwich apparent sidereal time instead of the linear IAU spin model, so
 * the day/night terminator and sub-solar point stay accurate to the second.
 */
const earthBasis = (time) => {
  const angle    = SiderealTime(time) * 15 * DEG
  const toEqj    = Rotation_EQD_EQJ(time)
  const prime    = RotateVector(toEqj, { x: Math.cos(angle), y: Math.sin(angle), z: 0 })
  const north    = RotateVector(toEqj, { x: 0, y: 0, z: 1 })
  return {
    x: eclipticVector(prime),
    y: eclipticVector(cross(north, prime)),
    z: eclipticVector(north),
  }
}

/** Equatorial J2000 axes in scene coordinates, used to orient the star map. */
export const equatorialBasis = () => ({
  x: eclipticVector({ x: 1, y: 0, z: 0 }),
  y: eclipticVector({ x: 0, y: 1, z: 0 }),
  z: eclipticVector({ x: 0, y: 0, z: 1 }),
})
