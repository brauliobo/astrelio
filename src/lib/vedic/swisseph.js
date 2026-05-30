import SwissEph from 'swisseph-wasm'

let instancePromise = null

export const getSwissEph = async () => {
  if (!instancePromise) {
    instancePromise = (async () => {
      const swe = new SwissEph()
      await swe.initSwissEph()
      return swe
    })()
  }
  return instancePromise
}

export const AYANAMSHA_MODE = {
  lahiri: 'SE_SIDM_LAHIRI',
  raman: 'SE_SIDM_RAMAN',
  krishnamurti: 'SE_SIDM_KRISHNAMURTI',
  fagan_bradley: 'SE_SIDM_FAGAN_BRADLEY',
}

export const setAyanamsha = (swe, ayanamsha = 'lahiri') => {
  const constantName = AYANAMSHA_MODE[ayanamsha] || AYANAMSHA_MODE.lahiri
  swe.set_sid_mode(swe[constantName], 0, 0)
}

export const siderealFlags = (swe) =>
  swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL
