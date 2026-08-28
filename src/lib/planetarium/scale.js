import { AU_KM } from './constants.js'

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
