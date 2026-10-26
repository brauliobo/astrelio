import { describe, expect, it } from 'vitest'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'
import { CENTER_MODEL } from '../../../src/lib/human-design/centers.js'
import { CHANNELS, HD_AUTHORITIES, HD_DEFINITIONS, HD_TYPES, INCARNATION_QUARTERS } from '../../../src/lib/human-design/constants.js'
import { LIFE_CYCLES } from '../../../src/lib/human-design/cycles.js'
import { humanDesignContentKey, humanDesignValueKey } from '../../../src/lib/human-design/labels.js'
import { LINE_6_STAGES, LINE_ARCHETYPES, PROFILE_ANGLES, PROFILES } from '../../../src/lib/human-design/profiles.js'
import { buildHumanDesignReadingDocument } from '../../../src/lib/human-design/readings/document.js'
import { ARROWS, TONE_NAMES } from '../../../src/lib/human-design/variables.js'
import { referenceChart } from './reference-chart.js'

const SENSITIVITY_FIELDS = ['gate', 'line', 'color', 'tone', 'base', 'profile', 'cross', 'type', 'authority']

const LOCALES = { en, 'pt-BR': ptBR }

const unique = values => [...new Set(values)]

const slug = value => value.toLowerCase().replace(/[-\s]+/g, '_')

const keys = (prefix, ids, fields) => ids.flatMap(id => fields.map(field => humanDesignContentKey(...prefix, id, field)))

const resolve = (messages, key) => key.split('.').reduce((node, part) => node?.[part], messages)

const tokensIn = (value, tokens = []) => {
  if (Array.isArray(value)) value.forEach(item => tokensIn(item, tokens))
  else if (value && typeof value === 'object') {
    if (typeof value.key === 'string' && value.params) tokens.push(value.key)
    Object.values(value).forEach(item => tokensIn(item, tokens))
  }
  return tokens
}

const ids = {
  types:       HD_TYPES.map(type => humanDesignValueKey('type', type)),
  authorities: HD_AUTHORITIES.map(authority => humanDesignValueKey('authority', authority)),
  definitions: HD_DEFINITIONS.map(definition => humanDesignValueKey('definition', definition)),
  circuits:    unique(CHANNELS.flatMap(channel => [humanDesignValueKey('circuit', channel.circuit), humanDesignValueKey('subCircuit', channel.subCircuit)])),
  areas:       ARROWS.map(arrow => arrow.id),
  profiles:    Object.values(PROFILES).map(profile => profile.id),
  lines:       Object.keys(LINE_ARCHETYPES),
  centers:     CENTER_MODEL.map(center => center.key),
  cycles:      unique(LIFE_CYCLES.map(cycle => cycle.id)),
}

const schemeKeys = () => [
  ...keys(['types'], ids.types, ['aura', 'strategy', 'signature', 'not_self', 'summary', 'guidance']),
  ...keys(['authorities'], ids.authorities, ['how', 'practice']),
  ...keys(['definitions'], ids.definitions, ['summary']),
  ...['small', 'large'].map(size => humanDesignContentKey('split_size', size)),
  humanDesignContentKey('bridge', 'summary'),
  ...keys(['profiles'], ids.profiles, ['name', 'summary']),
  ...keys(['line_archetypes'], ids.lines, ['name', 'summary']),
  ...keys(['line6_stages'], LINE_6_STAGES.map(stage => stage.id), ['summary']),
  ...keys(['centers'], ids.centers, ['biology', 'role', 'defined', 'undefined', 'not_self_question', 'healthy']),
  ...keys(['center_states'], ['defined', 'undefined', 'open'], ['label', 'summary']),
  ...keys(['variables', 'areas'], ids.areas, ['summary']),
  ...ids.areas.flatMap(area => keys(['variables', 'colors', area], [1, 2, 3, 4, 5, 6], ['summary'])),
  ...['left', 'right'].flatMap(side => keys(['variables', 'arrows', side], ids.areas, ['summary'])),
  ...keys(['variables', 'cognition'], TONE_NAMES.design.map(tone => tone.key), ['name', 'summary']),
  humanDesignContentKey('variables', 'shorthand', 'note'),
  ...keys(['circuits_info'], ids.circuits, ['summary']),
  ...keys(['crosses'], Object.keys(PROFILE_ANGLES), ['summary']),
  ...keys(['quarters'], INCARNATION_QUARTERS.map(quarter => slug(quarter.name)), ['summary']),
  ...keys(['relationships'], ['electromagnetic', 'companionship', 'compromise', 'dominance'], ['name', 'summary']),
  humanDesignContentKey('relationships', 'composite', 'summary'),
  ...keys(['cycles'], ids.cycles, ['name', 'summary']),
  humanDesignContentKey('cycles', 'lunar', 'summary'),
  humanDesignContentKey('sensitivity', 'title'),
  humanDesignContentKey('sensitivity', 'note'),
  ...SENSITIVITY_FIELDS.map(field => humanDesignContentKey('sensitivity', 'fields', field)),
]

describe('human_design.content i18n coverage', () => {
  it.each(Object.keys(LOCALES))('defines every key of the content scheme in %s', (locale) => {
    const missing = schemeKeys().filter(key => typeof resolve(LOCALES[locale], key) !== 'string')

    expect(missing).toEqual([])
  })

  it.each(Object.keys(LOCALES))('defines every token key of the reference chart reading in %s', (locale) => {
    const emitted = unique(tokensIn(buildHumanDesignReadingDocument(referenceChart())))
    const missing = emitted.filter(key => typeof resolve(LOCALES[locale], key) !== 'string')

    expect(emitted.some(key => key.startsWith('human_design.content.'))).toBe(true)
    expect(missing).toEqual([])
  })

  it('covers the 12 profiles, 36 channels worth of circuits and the five types', () => {
    expect(ids.profiles).toHaveLength(12)
    expect(ids.types).toHaveLength(5)
    expect(ids.circuits.sort()).toEqual([
      'centering', 'collective_abstract', 'collective_logic', 'defense', 'ego', 'individual', 'integration', 'knowing', 'sensing', 'tribal', 'understanding',
    ])
  })
})
