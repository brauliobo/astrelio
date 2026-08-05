import { elementForSign, normalizeSignIndex } from './elements.js'

export const PLANET_WEIGHTS = {
  Sun:       5,
  Moon:      5,
  Mercury:   3,
  Venus:     3,
  Mars:      3,
  Jupiter:   2,
  Saturn:    2,
  Uranus:    1,
  Neptune:   1,
  Pluto:     1,
  NorthNode: 1,
  SouthNode: 1,
  Lilith:    1,
  Chiron:    1,
}

const SIGN_AXES = [
  { id: 'aries_libra',       modality: 'cardinal', polarity: 'yang' },
  { id: 'taurus_scorpio',    modality: 'fixed',    polarity: 'yin' },
  { id: 'gemini_sagittarius', modality: 'mutable', polarity: 'yang' },
  { id: 'cancer_capricorn',   modality: 'cardinal', polarity: 'yin' },
  { id: 'leo_aquarius',       modality: 'fixed',    polarity: 'yang' },
  { id: 'virgo_pisces',       modality: 'mutable', polarity: 'yin' },
].map((axis, primarySignIndex) => ({
  ...axis,
  primarySignIndex,
  oppositeSignIndex: primarySignIndex + 6,
  signIndices:       [primarySignIndex, primarySignIndex + 6],
  elements:          [elementForSign(primarySignIndex), elementForSign(primarySignIndex + 6)],
}))

const signIndexForLongitude = longitude => {
  const normalized = ((longitude % 360) + 360) % 360
  return Math.floor(normalized / 30)
}

export const oppositeSignIndex = index => {
  const normalized = normalizeSignIndex(index)
  return (normalized + 6) % 12
}

export const signAxisFor = index => {
  const normalized = normalizeSignIndex(index)
  return SIGN_AXES[normalized < 6 ? normalized : normalized - 6]
}

export const analyzeSignAxes = chart => {
  const bodiesBySign = Array.from({ length: 12 }, () => [])

  for (const body of chart?.positions || []) {
    if (!Number.isFinite(body.longitude)) continue

    const signIndex = signIndexForLongitude(body.longitude)
    bodiesBySign[signIndex].push({
      name:   body.name,
      weight: PLANET_WEIGHTS[body.name] || 1,
    })
  }

  return SIGN_AXES.map((axis, canonicalOrder) => {
    const sides = axis.signIndices.map(signIndex => {
      const bodies = bodiesBySign[signIndex]
        .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name))

      return {
        signIndex,
        weight: bodies.reduce((sum, body) => sum + body.weight, 0),
        bodies: bodies.map(body => body.name),
      }
    })
    const totalWeight = sides[0].weight + sides[1].weight

    return {
      ...axis,
      sides,
      totalWeight,
      balance: totalWeight
        ? 2 * Math.min(sides[0].weight, sides[1].weight) / totalWeight
        : 0,
      bothRepresented: sides.every(side => side.weight > 0),
      canonicalOrder,
    }
  })
    .sort((a, b) => b.totalWeight - a.totalWeight || a.canonicalOrder - b.canonicalOrder)
    .map(({ canonicalOrder: _canonicalOrder, ...axis }) => axis)
}
