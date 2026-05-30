import { degInSign, norm360, signIndex } from '../astro/zodiac.js'
import {
  NAKSHATRA_SPAN,
  NAKSHATRAS,
  PADA_SPAN,
  VIMSHOTTARI_SEQUENCE,
  VIMSHOTTARI_YEARS,
} from './constants.js'

const VIMSHOTTARI_YEAR_DAYS = 365.25636

export const nakshatraOf = (longitude) => {
  const normalized     = norm360(longitude)
  const index          = Math.floor(normalized / NAKSHATRA_SPAN)
  const nakshatraStart = index * NAKSHATRA_SPAN
  const pada           = Math.floor((normalized - nakshatraStart) / PADA_SPAN) + 1
  return {
    index,
    key: NAKSHATRAS[index],
    pada,
    lord:     VIMSHOTTARI_SEQUENCE[index % VIMSHOTTARI_SEQUENCE.length],
    offset:   normalized - nakshatraStart,
    fraction: (normalized - nakshatraStart) / NAKSHATRA_SPAN,
  }
}

export const navamsaSignIndex = (longitude) => {
  const rasi  = signIndex(longitude)
  const pada  = Math.floor(degInSign(longitude) / PADA_SPAN)
  const start = [0, 3, 6, 9].includes(rasi)
    ? rasi
    : [1, 4, 7, 10].includes(rasi)
      ? rasi + 8
      : rasi + 4
  return (start + pada) % 12
}

export const navamsaPlacements = (positions = []) =>
  positions.map(position => ({
    name:             position.name,
    longitude:        norm360(navamsaSignIndex(position.longitude) * 30 + degInSign(position.longitude) * 9),
    rasiSignIndex:    signIndex(position.longitude),
    navamsaSignIndex: navamsaSignIndex(position.longitude),
  }))

export const vimshottariDashas = (moonLongitude, birthJd, targetJd) => {
  const moonNakshatra  = nakshatraOf(moonLongitude)
  const startLordIndex = VIMSHOTTARI_SEQUENCE.indexOf(moonNakshatra.lord)
  const lordYears      = VIMSHOTTARI_YEARS[moonNakshatra.lord]
  const startJd        = birthJd - moonNakshatra.fraction * lordYears * VIMSHOTTARI_YEAR_DAYS
  const mahadashas     = []
  let cursor           = startJd

  for (let i = 0; i < VIMSHOTTARI_SEQUENCE.length + 1; i += 1) {
    const lord     = VIMSHOTTARI_SEQUENCE[(startLordIndex + i) % VIMSHOTTARI_SEQUENCE.length]
    const duration = VIMSHOTTARI_YEARS[lord] * VIMSHOTTARI_YEAR_DAYS
    const start    = cursor
    const end      = cursor + duration
    mahadashas.push({
      lord,
      startJd:     start,
      endJd:       end,
      antardashas: antardashasFor(lord, start, duration),
    })
    cursor = end
  }

  const activeMaha  = mahadashas.find(period => targetJd >= period.startJd && targetJd < period.endJd) || mahadashas[0]
  const activeAntar = activeMaha?.antardashas.find(period => targetJd >= period.startJd && targetJd < period.endJd) || activeMaha?.antardashas[0]

  return {
    moonNakshatra,
    mahadashas,
    active: activeMaha ? {
      mahadasha:  activeMaha.lord,
      antardasha: activeAntar?.lord || activeMaha.lord,
      startJd:    activeMaha.startJd,
      endJd:      activeMaha.endJd,
    } : null,
  }
}

const antardashasFor = (mahaLord, startJd, mahaDuration) => {
  const startIndex = VIMSHOTTARI_SEQUENCE.indexOf(mahaLord)
  const periods    = []
  let cursor       = startJd

  for (let i = 0; i < VIMSHOTTARI_SEQUENCE.length; i += 1) {
    const lord     = VIMSHOTTARI_SEQUENCE[(startIndex + i) % VIMSHOTTARI_SEQUENCE.length]
    const duration = mahaDuration * (VIMSHOTTARI_YEARS[lord] / 120)
    periods.push({ lord, startJd: cursor, endJd: cursor + duration })
    cursor += duration
  }

  return periods
}
