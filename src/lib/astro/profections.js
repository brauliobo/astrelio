import { DateTime } from 'luxon'
import { signIndex } from './zodiac.js'

export const TRADITIONAL_SIGN_RULERS = [
  'Mars',
  'Venus',
  'Mercury',
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Saturn',
  'Jupiter',
]

export const profectionHouseForAge = (age) => {
  const normalized = ((Math.trunc(age) % 12) + 12) % 12
  return normalized + 1
}

const validBirthdayInYear = (birth, year) => {
  const anniversary = DateTime.utc(year, birth.month, birth.day)
  if (anniversary.isValid) return anniversary
  return DateTime.utc(year, 2, 28)
}

export const completedYearsOnDate = (birthIsoLocal, targetIsoDate) => {
  const birth = DateTime.fromISO(birthIsoLocal, { zone: 'utc' })
  const target = DateTime.fromISO(targetIsoDate.slice(0, 10), { zone: 'utc' })
  if (!birth.isValid) throw new Error(`invalid birth ISO: ${birthIsoLocal}`)
  if (!target.isValid) throw new Error(`invalid target date: ${targetIsoDate}`)

  let years = target.year - birth.year
  if (target < validBirthdayInYear(birth, target.year)) years -= 1
  return Math.max(0, years)
}

export const annualProfection = (ascendantLongitude, birthIsoLocal, targetIsoDate) => {
  const age = completedYearsOnDate(birthIsoLocal, targetIsoDate)
  const profectedHouse = profectionHouseForAge(age)
  const ascSignIndex = signIndex(ascendantLongitude)
  const sign = (ascSignIndex + age) % 12

  return {
    age,
    cycle: Math.floor(age / 12) + 1,
    profectedHouse,
    sign,
    lord: TRADITIONAL_SIGN_RULERS[sign],
  }
}
