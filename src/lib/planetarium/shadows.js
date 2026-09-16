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

export const asUnit = (vector) => {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length, length }
}

/** First and last hits of a unit ray `origin + t * direction` on a sphere, or null. */
export const raySphere = (origin, direction, center, radius) => {
  const dx = origin.x - center.x
  const dy = origin.y - center.y
  const dz = origin.z - center.z
  const b = dx * direction.x + dy * direction.y + dz * direction.z
  const c = dx * dx + dy * dy + dz * dz - radius * radius
  const disc = b * b - c
  if (disc < 0) return null
  const root = Math.sqrt(disc)
  return { tNear: -b - root, tFar: -b + root }
}

/**
 * Where a caster's shadow meets another body. Units must match throughout.
 * `sunDirection` points toward the Sun. `stampAlong` is the near face of the target when the axis
 * hits it, otherwise the target's centre distance — that is where the cone should stop.
 */
export const shadowProjection = ({
  caster,
  casterRadius,
  target,
  targetRadius,
  sunDirection,
  sunDistance,
}) => {
  const sun = asUnit(sunDirection)
  const away = { x: -sun.x, y: -sun.y, z: -sun.z }
  const dx = target.x - caster.x
  const dy = target.y - caster.y
  const dz = target.z - caster.z
  const alongSun = dx * sun.x + dy * sun.y + dz * sun.z
  const along = -alongSun
  const radial = Math.hypot(dx - sun.x * alongSun, dy - sun.y * alongSun, dz - sun.z * alongSun)
  const reach = Math.hypot(dx, dy, dz)
  const umbra = umbraCone(casterRadius, sunDistance)
  const sphere = raySphere(caster, away, target, targetRadius)
  const tNear = sphere && sphere.tNear > 1e-6 ? sphere.tNear : null
  const nightSide = along + targetRadius > 0
  const stampAlong = nightSide ? (tNear ?? Math.max(along - targetRadius, 0)) : reach
  const sampleAlong = Math.max(tNear ?? (nightSide ? along - targetRadius : reach), 0)
  const stamp = shadowRadiiAt(casterRadius, sunDistance, Math.max(stampAlong, 0))
  const sample = shadowRadiiAt(casterRadius, sunDistance, sampleAlong)
  const umbraR = Math.max(0, sample.umbraKm)
  const penumbraR = Math.max(0, sample.penumbraKm)
  const closest = Math.max(0, radial - targetRadius)
  const umbraHit = nightSide && umbraR > 0 && closest <= umbraR
  const penumbraHit = nightSide && closest <= penumbraR

  return {
    hits: umbraHit || penumbraHit,
    umbra: umbraHit,
    penumbra: penumbraHit,
    nightSide,
    along: Math.max(along, 0),
    radial,
    stampAlong,
    drawAlong: stampAlong,
    umbraLength: umbra.lengthKm,
    umbraDrawTo: Math.min(umbra.lengthKm, Math.max(stampAlong, 0)),
    umbraKm: Math.max(0, stamp.umbraKm),
    penumbraKm: Math.max(0, stamp.penumbraKm),
  }
}

export const shadowIntersection = (args) => {
  const projection = shadowProjection(args)
  return {
    hits: projection.hits,
    umbra: projection.umbra,
    penumbra: projection.penumbra,
    along: projection.along,
    radial: projection.radial,
    umbraKm: projection.umbraKm,
    penumbraKm: projection.penumbraKm,
  }
}

/**
 * How deep a point sits in an occulting body's shadow: 1 in the umbra, 0 in sunlight, a blend
 * across the penumbra. `sunDirection` points toward the Sun; every length shares one unit.
 */
export const shadowFactorAt = ({
  point,
  occultCenter = { x: 0, y: 0, z: 0 },
  occultRadius,
  sunDirection,
  sunDistance,
}) => {
  const dx = point.x - occultCenter.x
  const dy = point.y - occultCenter.y
  const dz = point.z - occultCenter.z
  const sunLength = Math.hypot(sunDirection.x, sunDirection.y, sunDirection.z) || 1
  const sx = sunDirection.x / sunLength
  const sy = sunDirection.y / sunLength
  const sz = sunDirection.z / sunLength
  const alongSun = dx * sx + dy * sy + dz * sz
  const along = -alongSun
  if (along <= 0) return 0

  const dist = Math.hypot(dx - sx * alongSun, dy - sy * alongSun, dz - sz * alongSun)
  const radii = shadowRadiiAt(occultRadius, sunDistance, along)
  const umbra = Math.max(radii.umbraKm, 0)
  if (dist <= umbra) return 1
  if (dist >= radii.penumbraKm) return 0
  return (radii.penumbraKm - dist) / Math.max(radii.penumbraKm - umbra, 1e-6)
}
