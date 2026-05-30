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
  houseInner: 104,
  aspect: 100,
  center: 104,
}

export const ASPECT_COLORS = {
  opposition: '#22c55e',
  trine: '#22c55e',
  square: '#f97316',
  sextile: '#38bdf8',
  quincunx: '#f59e0b',
}

export const PLANET_SYMBOLS = {
  Sun: '☉',
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
}

export const PLANET_COLORS = {
  Sun: '#ff2d2d',
  Moon: '#111827',
  Mercury: '#111827',
  Venus: '#111827',
  Mars: '#111827',
  Jupiter: '#111827',
  Saturn: '#111827',
  Uranus: '#111827',
  Neptune: '#111827',
  Pluto: '#111827',
  NorthNode: '#111827',
  SouthNode: '#111827',
  Lilith: '#111827',
}

const PLANET_ORDER = new Map(Object.keys(PLANET_SYMBOLS).map((name, index) => [name, index]))
const PLANET_CLUSTER_GAP = 8
const GLYPH_MIN_SEPARATION = 6.8
const DEGREE_LABEL_CLUSTER_LIMIT = 2

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
  color: options.color || (index === 0 ? '#111827' : '#334155'),
  aspectColors: { ...ASPECT_COLORS, ...(options.aspectColors || {}) },
  showHouses: options.showHouses ?? index === 0,
  showHouseLabels: options.showHouseLabels ?? index === 0,
  showAspects: options.showAspects ?? index === 0,
  showAngles: options.showAngles ?? index === 0,
  planetBand: options.planetBand || null,
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
      color: '#0f766e',
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
  if (count <= 1) return { inner: 134, outer: 150 }

  const trackWidth = 13
  const gap = 4
  const outer = WHEEL_RADII.houseOuter - 4 - (index * (trackWidth + gap))
  const inner = Math.max(WHEEL_RADII.houseInner + 2, outer - trackWidth)
  return { inner, outer }
}

export const clusteredPlanets = (positions) => {
  const sorted = positions
    .filter(p => PLANET_SYMBOLS[p.name])
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

const unwrappedClusterLongitudes = (cluster) => {
  const longitudes = []
  for (const planet of cluster) {
    let longitude = planet.longitude
    const previous = longitudes[longitudes.length - 1]
    while (previous !== undefined && longitude < previous) longitude += 360
    longitudes.push(longitude)
  }
  return longitudes
}

const visualLongitudesForCluster = (cluster) => {
  const longitudes = unwrappedClusterLongitudes(cluster)
  if (longitudes.length <= 1) return longitudes

  const span = longitudes[longitudes.length - 1] - longitudes[0]
  const visualSpan = Math.max(span, (longitudes.length - 1) * GLYPH_MIN_SEPARATION)
  const center = (longitudes[0] + longitudes[longitudes.length - 1]) / 2
  const start = center - visualSpan / 2

  return longitudes.map((_, index) => start + index * (visualSpan / (longitudes.length - 1)))
}

const RADIUS_LANES = [0, -1, 1, -0.45, 0.45, -0.75, 0.75, -0.25, 0.25]

const radiusLaneFor = (index, count) => {
  if (count <= 1) return 0
  if (count === 2) return [-0.75, 0.75][index]
  return RADIUS_LANES[index % RADIUS_LANES.length]
}

const radiusForClusterIndex = (index, count, band) => {
  const midpoint = band.inner + ((band.outer - band.inner) / 2)
  const spread = (band.outer - band.inner) / 2
  return clamp(midpoint + radiusLaneFor(index, count) * spread, band.inner, band.outer)
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

export const planetPlacements = (chart, wheelShift, band) => {
  const placements = []
  for (const cluster of clusteredPlanets(chart.positions || [])) {
    const glyphLongitudes = visualLongitudesForCluster(cluster)
    cluster.forEach((planet, index) => {
      const radius = radiusForClusterIndex(index, cluster.length, band)
      const longitude = norm360(planet.longitude + wheelShift)
      const glyphLongitude = norm360(glyphLongitudes[index] + wheelShift)
      const glyphPoint = polarPoint(radius, glyphLongitude)
      placements.push({
        planet,
        longitude,
        glyphLongitude,
        radius,
        clusterSize: cluster.length,
        laneIndex: index,
        isCrowded: cluster.length > DEGREE_LABEL_CLUSTER_LIMIT,
        showDegreeLabel: cluster.length <= DEGREE_LABEL_CLUSTER_LIMIT,
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
