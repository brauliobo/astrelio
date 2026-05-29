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
    .sort((a, b) => a.longitude - b.longitude)

  const clusters = []
  for (const planet of sorted) {
    const last = clusters[clusters.length - 1]
    if (last && planet.longitude - last[last.length - 1].longitude < 8) last.push(planet)
    else clusters.push([planet])
  }

  if (clusters.length > 1) {
    const first = clusters[0]
    const last = clusters[clusters.length - 1]
    if (first[0].longitude + 360 - last[last.length - 1].longitude < 8) {
      clusters[0] = [...last, ...first]
      clusters.pop()
    }
  }

  return clusters
}

export const planetPlacements = (chart, wheelShift, band) => {
  const placements = []
  for (const cluster of clusteredPlanets(chart.positions || [])) {
    const mid = (cluster.length - 1) / 2
    cluster.forEach((planet, index) => {
      const radius = Math.max(
        band.inner,
        Math.min(band.outer, band.inner + ((band.outer - band.inner) / 2) + (index - mid) * 14)
      )
      const longitude = norm360(planet.longitude + wheelShift)
      placements.push({
        planet,
        longitude,
        radius,
        point: polarPoint(radius, longitude),
        tick: polarPoint(WHEEL_RADII.houseOuter - 4, longitude),
      })
    })
  }
  return placements
}

export const placementMap = (placements) =>
  new Map(placements.map(item => [item.planet.name, item]))

export const naturalAspectLines = (chart, wheelShift, radius = WHEEL_RADII.aspect) => {
  const byName = new Map((chart.positions || []).map(item => [item.name, item]))
  return naturalAspects(chart)
    .map((aspect) => {
      const a = byName.get(aspect.a)
      const b = byName.get(aspect.b)
      return {
        aspect,
        a,
        b,
        start: a ? polarPoint(radius, norm360(a.longitude + wheelShift)) : null,
        end: b ? polarPoint(radius, norm360(b.longitude + wheelShift)) : null,
      }
    })
    .filter(line => line.a && line.b)
}
