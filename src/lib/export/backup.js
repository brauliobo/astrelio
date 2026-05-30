export const BACKUP_VERSION = 1
export const BACKUP_APP = 'astrelio'

const SETTINGS_KEYS = [
  'locale',
  'houseSystem',
  'zodiac',
  'nodeMode',
  'skyEnabled',
  'theme',
  'aspectSet',
  'orbScale',
  'applyingOnly',
  'includeModernPlanets',
]

const clonePlain = (value) => JSON.parse(JSON.stringify(value))

const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value)

const normalizePerson = (person) => {
  if (!isRecord(person)) return null
  if (!person.id || !person.name || !person.isoLocal || !person.placeLabel) return null

  const normalized = {
    id: String(person.id),
    name: String(person.name),
    isoLocal: String(person.isoLocal),
    tzOffsetMinutes: Number(person.tzOffsetMinutes),
    lat: Number(person.lat),
    lon: Number(person.lon),
    placeLabel: String(person.placeLabel),
    createdAt: Number(person.createdAt || Date.now()),
  }

  if (![normalized.tzOffsetMinutes, normalized.lat, normalized.lon, normalized.createdAt].every(Number.isFinite)) {
    return null
  }

  return normalized
}

const normalizeSettings = (settings = {}) => {
  const normalized = {}

  SETTINGS_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) normalized[key] = clonePlain(settings[key])
  })

  return normalized
}

export const createBackup = ({ people, settings }) => ({
  app: BACKUP_APP,
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  people: clonePlain(people.list || []),
  settings: normalizeSettings(settings),
})

export const parseBackupJson = (text) => {
  let parsed

  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('invalid_json')
  }

  return normalizeBackup(parsed)
}

export const normalizeBackup = (payload) => {
  if (!isRecord(payload)) throw new Error('invalid_backup')
  if (payload.app && payload.app !== BACKUP_APP) throw new Error('unsupported_backup')
  if (payload.version && payload.version > BACKUP_VERSION) throw new Error('unsupported_backup')

  const rawPeople = Array.isArray(payload.people) ? payload.people : payload.people?.list
  const people = Array.isArray(rawPeople) ? rawPeople.map(normalizePerson).filter(Boolean) : null

  if (!people) throw new Error('invalid_backup')

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    importedAt: new Date().toISOString(),
    people,
    settings: normalizeSettings(payload.settings || {}),
  }
}

export const applyBackup = ({ backup, people, settings }) => {
  people.$patch({ list: backup.people })
  settings.$patch(backup.settings)

  if (settings.locale) localStorage.setItem('astrelio_locale', settings.locale)
}
