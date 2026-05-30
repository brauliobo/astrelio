import { mandalaAngleForGate, polar } from './wheelCore.js'

export const planetGlyphRadii = [342, 304, 266, 228, 190, 152]

const normalizedAngle = angle => ((angle % 360) + 360) % 360

export const planetGlyphLayout = (activations = []) => {
  const sorted = activations
    .map((item, sourceIndex) => ({
      ...item,
      sourceIndex,
      angle: mandalaAngleForGate(item.gate),
    }))
    .filter(item => Number.isFinite(item.angle))
    .sort((a, b) => normalizedAngle(a.angle) - normalizedAngle(b.angle) || a.sourceIndex - b.sourceIndex)

  const placed = []
  const gateCounts = new Map()
  for (const item of sorted) {
    const count = gateCounts.get(item.gate) || 0
    const lane = Math.min(count, planetGlyphRadii.length - 1)
    gateCounts.set(item.gate, count + 1)
    placed.push({
      ...item,
      lane,
      radius: planetGlyphRadii[lane],
      point: polar(planetGlyphRadii[lane], item.angle),
    })
  }

  return placed.sort((a, b) => a.sourceIndex - b.sourceIndex)
}
