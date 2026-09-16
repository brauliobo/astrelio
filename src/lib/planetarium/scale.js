import { AU_KM, SUN_RADIUS_KM } from './constants.js'

// Scene units are AU in true scale. Compressed scale maps radial distance through a log curve so
// Mercury and Neptune are legible in one frame, while keeping angles and orbit shapes untouched.
const COMPRESSION_A0 = 0.35
const COMPRESSION_K  = 12

export const compressRadius = (au, { a0 = COMPRESSION_A0, k = COMPRESSION_K } = {}) =>
  k * Math.log1p(Math.max(0, au) / a0)

export const expandRadius = (units, { a0 = COMPRESSION_A0, k = COMPRESSION_K } = {}) =>
  a0 * (Math.exp(Math.max(0, units) / k) - 1)

/** Scale a scene-frame position vector under the active distance mode. */
export const scalePosition = (vector, { mode = 'compressed', unitsPerAu = 1, ...options } = {}) => {
  const radius = Math.hypot(vector.x, vector.y, vector.z)
  if (mode === 'true' || radius === 0) {
    return { x: vector.x * unitsPerAu, y: vector.y * unitsPerAu, z: vector.z * unitsPerAu }
  }

  const factor = compressRadius(radius, options) / radius
  return { x: vector.x * factor, y: vector.y * factor, z: vector.z * factor }
}

export const bodyRadiusUnits = (radiusKm, { unitsPerAu = 1, exaggeration = 1, minUnits = 0 } = {}) =>
  Math.max(minUnits, (radiusKm / AU_KM) * unitsPerAu * Math.max(1, exaggeration))

/** Mercury perihelion: the inner wall of the compressed orrery. */
export const MERCURY_PERIHELION_AU = 0.3075

/**
 * Same exaggeration as the planets would make the photosphere swallow Mercury, because distances
 * are compressed while radii are not. Cap the disc inside Mercury's perihelion so every planet
 * stays in view; true scale still uses the real radius.
 */
export const compressedSunRadius = (exaggeration = 1) => {
  const proportional = bodyRadiusUnits(SUN_RADIUS_KM, { exaggeration })
  return Math.min(proportional, compressRadius(MERCURY_PERIHELION_AU) * 0.45)
}

/** World radius large enough to click from `cameraDistance` without enlarging the drawn body. */
export const pickRadiusUnits = (trueRadius, cameraDistance, { apparent = 0.01 } = {}) =>
  Math.max(trueRadius, Math.max(0, cameraDistance) * apparent)

/**
 * Camera distance that fills `fill` of the vertical FOV with a body of `radius`.
 * Compressed moon systems sit just outside the exaggerated disc, so they can pull the camera back.
 * True-scale moon systems are AU-wide and would shrink the planet to a speck.
 */
export const focusDistance = (radius, { fovDeg = 45, fill = 0.34, moonReach = 0, trueScale = false } = {}) => {
  const half = ((fovDeg * Math.PI) / 180) * Math.min(0.85, Math.max(0.08, fill)) / 2
  const body = Math.max(0, radius) / Math.max(Math.tan(half), 1e-6)
  if (trueScale) return Math.max(body, radius * 3)
  return Math.max(body, Math.max(0, moonReach) * 3.2)
}
