import { aspectBetween, isAspectBodyEnabled } from './aspects.js'
import { norm360 } from './zodiac.js'

export const ASPECTARIAN_POINT_ORDER = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'NorthNode',
  'Lilith',
  'Chiron',
  'Ascendant',
  'Midheaven',
  'Fortune',
]

export const ASPECTARIAN_BODY_ORDER = ASPECTARIAN_POINT_ORDER
  .filter(name => !['Ascendant', 'Midheaven', 'Fortune'].includes(name))

const pointSortIndex = new Map(ASPECTARIAN_POINT_ORDER.map((name, index) => [name, index]))

const bodyByName = (chart, name) =>
  chart?.positions?.find(position => position.name === name) || null

export const fortuneLongitude = (chart) => {
  const sun = bodyByName(chart, 'Sun')
  const moon = bodyByName(chart, 'Moon')
  if (!chart || !sun || !moon || typeof chart.ascendant !== 'number') return null
  return norm360(chart.ascendant + moon.longitude - sun.longitude)
}

const syntheticPoint = (name, longitude) => longitude === null || longitude === undefined
  ? null
  : {
    name,
    longitude: norm360(longitude),
    latitude: 0,
    speed: 0,
    motion: 'direct',
    stationary: false,
    retrograde: false,
    synthetic: true,
  }

export const chartAspectPoints = (chart, options = {}) => {
  if (!chart) return []
  const includeAngles = options.includeAngles ?? true
  const includeFortune = options.includeFortune ?? true

  const byName = new Map((chart.positions || [])
    .filter(position => pointSortIndex.has(position.name))
    .map(position => [position.name, position]))

  if (includeAngles) {
    byName.set('Ascendant', syntheticPoint('Ascendant', chart.ascendant))
    byName.set('Midheaven', syntheticPoint('Midheaven', chart.mc))
  }
  if (includeFortune) byName.set('Fortune', syntheticPoint('Fortune', fortuneLongitude(chart)))

  return ASPECTARIAN_POINT_ORDER
    .map(name => byName.get(name))
    .filter(Boolean)
    .filter(point => isAspectBodyEnabled(point.name, options))
    .sort((a, b) => pointSortIndex.get(a.name) - pointSortIndex.get(b.name))
}

export const aspectMatrix = (baseChart, comparisonChart = null, options = {}) => {
  const columns = chartAspectPoints(baseChart, options)
  const sameChart = !comparisonChart || comparisonChart === baseChart
  const rows = sameChart
    ? columns
    : chartAspectPoints(comparisonChart, { ...options, includeAngles: false, includeFortune: false })
  const matrixOptions = { ...options, aspectSet: 'major', applyingOnly: false }

  return {
    columns,
    rows: rows.map((rowPoint, rowIndex) => ({
      point: rowPoint,
      cells: columns.map((columnPoint, columnIndex) => {
        if (sameChart && columnIndex >= rowIndex) return null
        const aspect = aspectBetween(columnPoint, rowPoint, matrixOptions)
        if (!aspect) return null
        return {
          ...aspect,
          column: columnPoint.name,
          row: rowPoint.name,
          sameChart,
        }
      }),
    })),
  }
}
