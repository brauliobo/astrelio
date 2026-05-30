import SwissEph from 'swisseph-wasm'

export const swiss = new SwissEph()
await swiss.initSwissEph()

export const SWISS_FLAGS = swiss.SEFLG_SWIEPH | swiss.SEFLG_SPEED

export const SWISS_BODY = {
  Sun: swiss.SE_SUN,
  Moon: swiss.SE_MOON,
  Mercury: swiss.SE_MERCURY,
  Venus: swiss.SE_VENUS,
  Mars: swiss.SE_MARS,
  Jupiter: swiss.SE_JUPITER,
  Saturn: swiss.SE_SATURN,
  Uranus: swiss.SE_URANUS,
  Neptune: swiss.SE_NEPTUNE,
  Pluto: swiss.SE_PLUTO,
  NorthNodeMean: swiss.SE_MEAN_NODE,
  NorthNodeTrue: swiss.SE_TRUE_NODE,
  Lilith: swiss.SE_MEAN_APOG,
  Chiron: swiss.SE_CHIRON,
}

export const AYANAMSHA_MODE = {
  lahiri: swiss.SE_SIDM_LAHIRI,
  raman: swiss.SE_SIDM_RAMAN,
  krishnamurti: swiss.SE_SIDM_KRISHNAMURTI,
  fagan_bradley: swiss.SE_SIDM_FAGAN_BRADLEY,
}

export const setSwissAyanamsha = (ayanamsha = 'lahiri') => {
  swiss.set_sid_mode(AYANAMSHA_MODE[ayanamsha] ?? AYANAMSHA_MODE.lahiri, 0, 0)
}

export const swissFlags = ({ sidereal = false } = {}) =>
  SWISS_FLAGS | (sidereal ? swiss.SEFLG_SIDEREAL : 0)

export const swissPosition = (body, jd, flags = SWISS_FLAGS) =>
  swiss.calc_ut(jd, body, flags)

export const swissHouses = (jd, lat, lon, houseSystem, flags = 0) =>
  flags
    ? swiss.houses_ex(jd, flags, lat, lon, houseSystem)
    : swiss.houses(jd, lat, lon, houseSystem)

export const swissJulday = (date = new Date()) =>
  swiss.julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  )
