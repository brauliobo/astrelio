import { DateTime } from 'luxon'

export const msToJd = (ms) => ms / 86_400_000 + 2440587.5
export const jdToMs = (jd) => (jd - 2440587.5) * 86_400_000
export const jdNow  = ()   => msToJd(Date.now())

const LEGACY_CITY_ZONES = [
  [/manaus/i, 'America/Manaus'],
  [/sydney/i, 'Australia/Sydney'],
  [/tokyo/i, 'Asia/Tokyo'],
  [/berlin/i, 'Europe/Berlin'],
  [/paris/i, 'Europe/Paris'],
  [/london/i, 'Europe/London'],
  [/lisboa/i, 'Europe/Lisbon'],
  [/los angeles/i, 'America/Los_Angeles'],
  [/new york/i, 'America/New_York'],
  [/buenos aires/i, 'America/Argentina/Buenos_Aires'],
  [/brasil|brazil/i, 'America/Sao_Paulo'],
]

/** ISO local string + offset minutes → UT JD. */
export const localToJdUt = (isoLocal, tzOffsetMinutes) => {
  return msToJd(localToUtcMs(isoLocal, tzOffsetMinutes))
}

/** Resolve IANA tz name + ISO local → offset in minutes (handles historical DST). */
export const ianaOffsetMinutes = (isoLocal, ianaZone) => {
  const dt = DateTime.fromISO(isoLocal, { zone: ianaZone })
  return dt.isValid ? dt.offset : 0
}

export const inferIanaZone = (placeLabel = '') => {
  const normalized = placeLabel.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return LEGACY_CITY_ZONES.find(([pattern]) => pattern.test(normalized))?.[1] || null
}

export const offsetMinutesForPerson = (person) => {
  const zone = person?.ianaZone || inferIanaZone(person?.placeLabel)
  if (zone) return ianaOffsetMinutes(person.isoLocal, zone)
  return person?.tzOffsetMinutes || 0
}

export const localToUtcMs = (isoLocal, tzOffsetMinutes) => {
  const dt = DateTime.fromISO(isoLocal, { zone: 'utc' })
  if (!dt.isValid) throw new Error(`invalid ISO: ${isoLocal}`)
  return dt.toMillis() - tzOffsetMinutes * 60_000
}
