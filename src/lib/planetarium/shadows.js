import { EARTH_RADIUS_KM, MOON_RADIUS_KM, SUN_RADIUS_KM, AU_KM } from './constants.js'

/**
 * Analytic shadow cones. Real shadow maps cannot span Sun-to-Neptune scales, and the cone geometry
 * is exactly what makes eclipses understandable: the umbra is a convergent cone, the penumbra a
 * divergent one, and an eclipse happens only when the other body enters them.
 */
export const umbraCone = (bodyRadiusKm, sunDistanceKm) => {
  const lengthKm = (bodyRadiusKm * sunDistanceKm) / (SUN_RADIUS_KM - bodyRadiusKm)
  return { lengthKm, baseRadiusKm: bodyRadiusKm, halfAngleRad: Math.atan2(bodyRadiusKm, lengthKm) }
}

export const penumbraCone = (bodyRadiusKm, sunDistanceKm, lengthKm) => {
  const growthPerKm = (SUN_RADIUS_KM + bodyRadiusKm) / sunDistanceKm
  return {
    lengthKm,
    baseRadiusKm: bodyRadiusKm,
    tipRadiusKm:  bodyRadiusKm + growthPerKm * lengthKm,
    halfAngleRad: Math.atan(growthPerKm),
  }
}

/** Umbra and penumbra radii on a plane at `alongKm` behind the occulting body. */
export const shadowRadiiAt = (bodyRadiusKm, sunDistanceKm, alongKm) => {
  const umbra = umbraCone(bodyRadiusKm, sunDistanceKm)
  return {
    umbraKm:    bodyRadiusKm * (1 - alongKm / umbra.lengthKm),
    penumbraKm: bodyRadiusKm + alongKm * (SUN_RADIUS_KM + bodyRadiusKm) / sunDistanceKm,
  }
}

export const earthShadow = (sunDistanceAu) => umbraCone(EARTH_RADIUS_KM, sunDistanceAu * AU_KM)
export const moonShadow  = (sunDistanceAu) => umbraCone(MOON_RADIUS_KM, sunDistanceAu * AU_KM)
