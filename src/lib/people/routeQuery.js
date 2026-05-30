import { ianaOffsetMinutes } from '../astro/timezones.js'

const QUERY_KEYS   = ['name', 'place', 'date', 'time', 'lat', 'lon', 'zone', 'tz']
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/

const firstValue = (value) => Array.isArray(value) ? value[0] : value

const textValue = (query, key) => {
  const value = firstValue(query[key])
  return typeof value === 'string' ? value.trim() : ''
}

const numberValue = (query, key) => {
  const value = Number(firstValue(query[key]))
  return Number.isFinite(value) ? value : null
}

const formatNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? String(Math.round(number * 1_000_000) / 1_000_000) : undefined
}

const isValidCoordinate = (value, min, max) =>
  value !== null && value >= min && value <= max

const cleanQuery = (query) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''))

const coordinateMatches = (a, b) =>
  Math.abs(Number(a) - Number(b)) < 0.000001

export const hasPersonRouteQuery = (query = {}) =>
  QUERY_KEYS.some((key) => firstValue(query[key]) !== undefined)

export const personToRouteQuery = (person) => {
  if (!person) return {}

  const [date = '', timeWithSeconds = ''] = String(person.isoLocal || '').split('T')
  const time = timeWithSeconds.slice(0, 5)

  return cleanQuery({
    name:  person.name,
    place: person.placeLabel,
    date,
    time,
    lat:  formatNumber(person.lat),
    lon:  formatNumber(person.lon),
    zone: person.ianaZone,
    tz:   Number.isFinite(Number(person.tzOffsetMinutes)) ? String(Number(person.tzOffsetMinutes)) : undefined,
  })
}

export const natalRouteForPerson = (person) => ({
  name:  'natal',
  query: personToRouteQuery(person),
})

export const samePersonRouteData = (a, b) => {
  if (!a || !b) return false

  return a.name === b.name &&
    a.isoLocal === b.isoLocal &&
    a.placeLabel === b.placeLabel &&
    coordinateMatches(a.lat, b.lat) &&
    coordinateMatches(a.lon, b.lon) &&
    (a.ianaZone || null) === (b.ianaZone || null) &&
    Number(a.tzOffsetMinutes || 0) === Number(b.tzOffsetMinutes || 0)
}

export const personFromRouteQuery = (query = {}) => {
  const name       = textValue(query, 'name')
  const placeLabel = textValue(query, 'place')
  const date       = textValue(query, 'date')
  const time       = textValue(query, 'time')
  const lat        = numberValue(query, 'lat')
  const lon        = numberValue(query, 'lon')
  const ianaZone   = textValue(query, 'zone')
  const tzOffset   = numberValue(query, 'tz')

  if (!name || !placeLabel || !DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) return null
  if (!isValidCoordinate(lat, -90, 90) || !isValidCoordinate(lon, -180, 180)) return null

  const isoLocal      = `${date}T${time}`
  let tzOffsetMinutes = tzOffset ?? 0
  let resolvedZone    = ianaZone || null

  if (ianaZone) {
    try {
      tzOffsetMinutes = ianaOffsetMinutes(isoLocal, ianaZone)
    } catch {
      if (tzOffset === null) return null
      resolvedZone = null
    }
  }

  return {
    id: 'route-chart',
    name,
    isoLocal,
    placeLabel,
    lat,
    lon,
    ianaZone: resolvedZone,
    tzOffsetMinutes,
    shared: true,
  }
}
