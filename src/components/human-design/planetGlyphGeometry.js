import { mandalaAngleForGate, polar } from './wheelCore.js'
import { evenlySpacedRadii, RADIAL_ALIGNMENT } from '../../lib/chart/radialSpacing.js'

export const planetGlyphBand = { inner: 152, outer: 342 }

const normalizedAngle = angle => ((angle % 360) + 360) % 360

export const planetGlyphLayout = (activations = [], { alignment = RADIAL_ALIGNMENT.OUTER } = {}) => {
  const sorted = activations
    .map((item, sourceIndex) => ({
      ...item,
      sourceIndex,
      angle: mandalaAngleForGate(item.gate),
    }))
    .filter(item => Number.isFinite(item.angle))
    .sort((a, b) => normalizedAngle(a.angle) - normalizedAngle(b.angle) || a.sourceIndex - b.sourceIndex)
  const gateGroups = new Map()
  sorted.forEach((item) => {
    if (!gateGroups.has(item.gate)) gateGroups.set(item.gate, [])
    gateGroups.get(item.gate).push(item)
  })
  const radiiBySource = new Map()
  gateGroups.forEach((items) => {
    const radii = evenlySpacedRadii(items.length, {
      inner:      planetGlyphBand.inner,
      outer:      planetGlyphBand.outer,
      single:     planetGlyphBand.outer,
      itemSize:   32,
      itemGap:    6,
      alignment,
    })
    items.forEach((item, index) => radiiBySource.set(item.sourceIndex, radii[index]))
  })
  const gateCounts = new Map()
  const placed = []
  for (const item of sorted) {
    const count = gateCounts.get(item.gate) || 0
    const radius = radiiBySource.get(item.sourceIndex)
    gateCounts.set(item.gate, count + 1)
    placed.push({
      ...item,
      lane:  count,
      radius,
      point: polar(radius, item.angle),
    })
  }

  return placed.sort((a, b) => a.sourceIndex - b.sourceIndex)
}
