const FULL_TURN = Math.PI * 2

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value))

export const normalizeMoonPhase = (phaseFraction = 0) => {
  const numeric = Number.isFinite(phaseFraction) ? phaseFraction : 0
  return ((numeric % 1) + 1) % 1
}

export const moonPhaseLighting = (phaseFraction = 0, light = 1) => {
  const phase        = normalizeMoonPhase(phaseFraction)
  const intensity    = clamp(Number.isFinite(light) ? light : 1, 0, 1.8)
  const illumination = (1 - Math.cos(phase * FULL_TURN)) / 2

  return {
    phase,
    illumination,
    waxing:      phase > 0 && phase < 0.5,
    glowAlpha:   clamp((0.08 + illumination * 0.28) * intensity, 0, 0.62),
    litAlpha:    clamp((0.72 + illumination * 0.28) * intensity, 0, 1),
    shadowAlpha: clamp((0.82 - illumination * 0.34) * intensity, 0, 0.92),
    rimAlpha:    clamp((0.28 + illumination * 0.22) * intensity, 0, 0.72),
  }
}

export const moonPhaseLitPoints = (phaseFraction = 0, size = 100, steps = 72) => {
  const phase        = normalizeMoonPhase(phaseFraction)
  const safeSize     = Math.max(1, size)
  const radius       = safeSize / 2
  const center       = radius
  const segmentCount = Math.max(12, steps)
  const cosPhase     = Math.cos(phase * FULL_TURN)
  const points       = []

  const edgePoint = (index, side) => {
    const y    = -radius + (index / segmentCount) * safeSize
    const xArc = Math.sqrt(Math.max(0, radius * radius - y * y))
    return {
      x: center + side * xArc,
      y: center + y,
    }
  }

  const terminatorPoint = (index, multiplier) => {
    const y    = -radius + (index / segmentCount) * safeSize
    const xArc = Math.sqrt(Math.max(0, radius * radius - y * y))
    return {
      x: center + multiplier * xArc,
      y: center + y,
    }
  }

  if (phase < 0.5) {
    for (let index = 0; index <= segmentCount; index += 1) points.push(edgePoint(index, 1))
    for (let index = segmentCount; index >= 0; index -= 1) points.push(terminatorPoint(index, cosPhase))
    return points
  }

  for (let index = 0; index <= segmentCount; index += 1) points.push(edgePoint(index, -1))
  for (let index = segmentCount; index >= 0; index -= 1) points.push(terminatorPoint(index, -cosPhase))
  return points
}

export const moonPhaseLitPathData = (phaseFraction = 0, size = 100, steps = 72) => {
  const points = moonPhaseLitPoints(phaseFraction, size, steps)
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(3)} ${point.y.toFixed(3)}`)
    .join(' ')
    .concat(' Z')
}
