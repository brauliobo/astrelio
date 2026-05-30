import { naturalAspects } from '../../../lib/astro/aspects.js'
import { norm360 } from '../../../lib/astro/zodiac.js'

export { norm360 }

export const VIEWBOX_SIZE = 520
export const CENTER = VIEWBOX_SIZE / 2

// Shared geometry constants keep all SVG layers aligned on one coordinate system.
export const WHEEL_RADII = {
  zodiacOuter: 188,
  zodiacInner: 160,
  houseOuter: 156,
  houseInner: 70,
  aspect: 66,
  center: 70,
}

export const ASPECT_COLORS = {
  opposition: 'var(--aspect-opposition)',
  trine: 'var(--aspect-trine)',
  square: 'var(--aspect-square)',
  sextile: 'var(--aspect-sextile)',
  quincunx: 'var(--aspect-quincunx)',
}

export const PLANET_SYMBOLS = {
  Sun: '☉',
  Earth: '⊕',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  NorthNode: '☊',
  SouthNode: '☋',
  Lilith: '⚸',
  Chiron: '⚷',
}

export const PLANET_COLORS = {
  Sun: 'var(--chart-sun-color)',
  Moon: 'var(--chart-ink)',
  Mercury: 'var(--chart-ink)',
  Venus: 'var(--chart-ink)',
  Mars: 'var(--chart-ink)',
  Jupiter: 'var(--chart-ink)',
  Saturn: 'var(--chart-ink)',
  Uranus: 'var(--chart-ink)',
  Neptune: 'var(--chart-ink)',
  Pluto: 'var(--chart-ink)',
  NorthNode: 'var(--chart-ink)',
  SouthNode: 'var(--chart-ink)',
  Lilith: 'var(--chart-ink)',
  Chiron: 'var(--chart-ink)',
}

const PLANET_ORDER = new Map(Object.keys(PLANET_SYMBOLS).map((name, index) => [name, index]))
const PLANET_CLUSTER_GAP = 10.5
const PLANET_GLYPH_RADIUS_PADDING = 5
const PLANET_LANE_RATIOS = {
  1: [0.7],
  2: [0.56, 0.8],
  3: [0.44, 0.68, 0.92],
  4: [0.32, 0.52, 0.72, 0.92],
  5: [0.2, 0.38, 0.56, 0.74, 0.92],
}

export const ZODIAC_SIGNS = [
  '♈︎',
  '♉︎',
  '♊︎',
  '♋︎',
  '♌︎',
  '♍︎',
  '♎︎',
  '♏︎',
  '♐︎',
  '♑︎',
  '♒︎',
  '♓︎',
]

export const polarPoint = (radius, longitude, cx = CENTER, cy = CENTER) => {
  const angle = (180 - longitude) * Math.PI / 180
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

export const radialTrianglePath = (longitude, tipRadius, baseRadius, halfWidth, cx = CENTER, cy = CENTER) => {
  const angle = (180 - longitude) * Math.PI / 180
  const tangent = { x: -Math.sin(angle), y: Math.cos(angle) }
  const tip = polarPoint(tipRadius, longitude, cx, cy)
  const base = polarPoint(baseRadius, longitude, cx, cy)
  const left = {
    x: base.x + tangent.x * halfWidth,
    y: base.y + tangent.y * halfWidth,
  }
  const right = {
    x: base.x - tangent.x * halfWidth,
    y: base.y - tangent.y * halfWidth,
  }

  return `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`
}

export const ringSectorPath = (innerRadius, outerRadius, startLongitude, endLongitude) => {
  const start = norm360(startLongitude)
  const span = norm360(endLongitude - startLongitude) || 360
  const end = start + span
  const outerStart = polarPoint(outerRadius, start)
  const outerEnd = polarPoint(outerRadius, end)
  const innerEnd = polarPoint(innerRadius, end)
  const innerStart = polarPoint(innerRadius, start)
  const largeArc = span > 180 ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

export const midpointLongitude = (start, end) =>
  norm360(start + (norm360(end - start) / 2))

export const degreeLabel = (longitude) =>
  Math.floor(norm360(longitude) % 30).toString()

export const chartToMap = (chart, index = 0, options = {}) => ({
  id: options.id || chart?.id || `chart-${index}`,
  chart,
  label: options.label || '',
  color: options.color || (index === 0 ? 'var(--chart-ink)' : 'var(--chart-overlay-ink)'),
  aspectColors: { ...ASPECT_COLORS, ...(options.aspectColors || {}) },
  showHouses: options.showHouses ?? index === 0,
  showHouseLabels: options.showHouseLabels ?? index === 0,
  showAspects: options.showAspects ?? index === 0,
  showAngles: options.showAngles ?? index === 0,
  planetBand: options.planetBand || null,
  planetSymbols: options.planetSymbols || null,
  planetColors: options.planetColors || null,
  planetLabels: options.planetLabels || null,
})

export const mapsFromProps = ({ natal, overlay, charts }) => {
  if (Array.isArray(charts) && charts.length) {
    return charts
      .map((entry, index) => {
        const chart = entry?.positions ? entry : entry?.chart
        return chart ? chartToMap(chart, index, entry?.positions ? {} : entry) : null
      })
      .filter(Boolean)
  }

  const maps = []
  if (natal) maps.push(chartToMap(natal, 0, { id: 'natal' }))
  if (overlay) {
    maps.push(chartToMap(overlay, 1, {
      id: 'overlay',
      color: 'var(--chart-overlay-accent)',
      showHouses: false,
      showHouseLabels: false,
      showAspects: false,
      showAngles: false,
    }))
  }
  return maps
}

export const planetBandFor = (map, index, count) => {
  if (map.planetBand) return map.planetBand
  if (count <= 1) return { inner: 78, outer: 150, tickRadius: WHEEL_RADII.houseOuter - 4 }

  const trackWidth = 13
  const gap = 4
  const outer = WHEEL_RADII.houseOuter - 4 - (index * (trackWidth + gap))
  const inner = Math.max(WHEEL_RADII.houseInner + 2, outer - trackWidth)
  return { inner, outer }
}

export const clusteredPlanets = (positions, symbols = PLANET_SYMBOLS) => {
  const sorted = positions
    .filter(p => symbols[p.name])
    .map(p => ({ ...p, longitude: norm360(p.longitude) }))
    .sort((a, b) =>
      a.longitude - b.longitude ||
      (PLANET_ORDER.get(a.name) ?? Number.MAX_SAFE_INTEGER) - (PLANET_ORDER.get(b.name) ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name)
    )

  const clusters = []
  for (const planet of sorted) {
    const last = clusters[clusters.length - 1]
    if (last && planet.longitude - last[last.length - 1].longitude < PLANET_CLUSTER_GAP) last.push(planet)
    else clusters.push([planet])
  }

  if (clusters.length > 1) {
    const first = clusters[0]
    const last = clusters[clusters.length - 1]
    if (first[0].longitude + 360 - last[last.length - 1].longitude < PLANET_CLUSTER_GAP) {
      clusters[0] = [...last, ...first]
      clusters.pop()
    }
  }

  return clusters
}

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value))

const safePlanetBand = (band) => {
  const padding = band.glyphPadding ?? PLANET_GLYPH_RADIUS_PADDING
  const inner = band.inner + padding
  const outer = band.outer - padding

  if (inner <= outer) return { inner, outer }

  const midpoint = band.inner + ((band.outer - band.inner) / 2)
  return { inner: midpoint, outer: midpoint }
}

const radiusRatioFor = (index, count) => {
  const ratios = PLANET_LANE_RATIOS[count]
  if (ratios) return ratios[index]

  const start = 0.12
  const end = 0.94
  return start + ((end - start) * index / (count - 1))
}

const radiusForClusterIndex = (index, count, band) => {
  const safeBand = safePlanetBand(band)
  const spread = safeBand.outer - safeBand.inner
  return clamp(safeBand.inner + (spread * radiusRatioFor(index, count)), safeBand.inner, safeBand.outer)
}

const labelPlacement = (glyphPoint, glyphLongitude) => {
  const angle = (180 - glyphLongitude) * Math.PI / 180
  const radial = { x: Math.cos(angle), y: Math.sin(angle) }
  const labelAnchor = radial.x < -0.25 ? 'end' : radial.x > 0.25 ? 'start' : 'middle'
  const horizontalNudge = labelAnchor === 'start' ? 5 : labelAnchor === 'end' ? -5 : 0
  const labelOffset = {
    x: radial.x * 12 + horizontalNudge,
    y: radial.y * 10 - 3,
  }

  return {
    labelAnchor,
    labelPoint: {
      x: glyphPoint.x + labelOffset.x,
      y: glyphPoint.y + labelOffset.y,
    },
    retrogradePoint: {
      x: glyphPoint.x + labelOffset.x,
      y: glyphPoint.y + labelOffset.y + 9,
    },
  }
}

export const planetPlacements = (chart, wheelShift, band, symbols = PLANET_SYMBOLS) => {
  const placements = []
  for (const cluster of clusteredPlanets(chart.positions || [], symbols)) {
    cluster.forEach((planet, index) => {
      const radius = radiusForClusterIndex(index, cluster.length, band)
      const longitude = norm360(planet.longitude + wheelShift)
      const glyphLongitude = longitude
      const glyphPoint = polarPoint(radius, glyphLongitude)
      placements.push({
        planet,
        longitude,
        glyphLongitude,
        radius,
        clusterSize: cluster.length,
        laneIndex: index,
        isCrowded: cluster.length > 1,
        showDegreeLabel: true,
        point: polarPoint(radius, longitude),
        glyphPoint,
        ...labelPlacement(glyphPoint, glyphLongitude),
        tick: polarPoint(band.tickRadius || WHEEL_RADII.houseOuter - 4, longitude),
      })
    })
  }
  return placements
}

export const placementMap = (placements) =>
  new Map(placements.map(item => [item.planet.name, item]))

export const naturalAspectLines = (chart, wheelShift, radius = WHEEL_RADII.aspect, placements = []) => {
  const byName = new Map((chart.positions || []).map(item => [item.name, item]))
  const byPlacement = placementMap(placements)
  return naturalAspects(chart)
    .map((aspect) => {
      const a = byName.get(aspect.a)
      const b = byName.get(aspect.b)
      const placedA = byPlacement.get(aspect.a)
      const placedB = byPlacement.get(aspect.b)
      return {
        aspect,
        a,
        b,
        start: placedA?.point || (a ? polarPoint(radius, norm360(a.longitude + wheelShift)) : null),
        end: placedB?.point || (b ? polarPoint(radius, norm360(b.longitude + wheelShift)) : null),
      }
    })
    .filter(line => line.a && line.b)
}
