// Brazil 1986-02-12 was on DST (Horário de Verão) → UTC-2
export const REF_PERSON = {
  id:              'ref-person',
  name:            'Bráulio',
  isoLocal:        '1986-02-12T18:10',
  tzOffsetMinutes: -120,
  lat:             -23.18,
  lon:             -45.88,
  placeLabel:      'São José dos Campos, SP — Brasil',
  createdAt:       1234567890
}

export const SECOND_PERSON = {
  id:              'second-person',
  name:            'Maria',
  isoLocal:        '1990-07-15T08:30',
  tzOffsetMinutes: -180,
  lat:             -23.5505,
  lon:             -46.6333,
  placeLabel:      'São Paulo, SP — Brasil',
  createdAt:       1234567891
}

// Seed only if missing — reloading the page reruns addInitScript and would otherwise overwrite test-induced state changes.
export const seedPeople = async (page, list = [REF_PERSON]) => {
  await page.addInitScript((value) => {
    if (!localStorage.getItem('astrelio_people')) {
      localStorage.setItem('astrelio_people', JSON.stringify(value))
    }
  }, { list })
}

export const seedSettings = async (page, locale = 'pt-BR') => {
  await page.addInitScript((loc) => {
    if (!localStorage.getItem('astrelio_locale'))   localStorage.setItem('astrelio_locale', loc)
    if (!localStorage.getItem('astrelio_settings')) localStorage.setItem('astrelio_settings', JSON.stringify({
      locale:               loc,
      houseSystem:          'placidus',
      zodiac:               'tropical',
      skyEnabled:           false,
      theme:                'dark',
      aspectSet:            'all',
      orbScale:             1,
      applyingOnly:         false,
      includeModernPlanets: true
    }))
  }, locale)
}

export const seedSession = async (page, activeId, compareId = null, options = {}) => {
  await page.addInitScript(([a, c, opts]) => {
    const value = {
      activePersonId:    a,
      comparePersonId:   c,
      transitDateMs:     opts.transitDateMs ?? null,
      progressionDateMs: opts.progressionDateMs ?? null,
    }
    window.__ASTRELIO_SEED_SESSION__ = value
    if (!localStorage.getItem('session')) localStorage.setItem('session', JSON.stringify(value))
  }, [activeId, compareId, options])
}
