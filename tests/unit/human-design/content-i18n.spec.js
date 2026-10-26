import { describe, expect, it } from 'vitest'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'
import { CHANNELS, HD_AUTHORITIES, INCARNATION_QUARTERS } from '../../../src/lib/human-design/constants.js'
import { CENTER_MODEL } from '../../../src/lib/human-design/centers.js'
import { LIFE_CYCLES } from '../../../src/lib/human-design/cycles.js'
import { LINE_ARCHETYPES, LINE_6_STAGES, PROFILE_ANGLES, PROFILES } from '../../../src/lib/human-design/profiles.js'
import { ARROWS, TONE_NAMES } from '../../../src/lib/human-design/variables.js'

const locales = { en, 'pt-BR': ptBR }
const slug    = name => name.toLowerCase().replace(/[-\s]+/g, '_')

const leaves = (value, path = '') =>
  typeof value === 'object' ? Object.entries(value).flatMap(([key, child]) => leaves(child, `${path}.${key}`)) : [[path, value]]

const shape = value => leaves(value).map(([path]) => path)

describe('human_design.content', () => {
  it('has the same key tree in both locales', () => {
    expect(shape(ptBR.human_design.content)).toEqual(shape(en.human_design.content))
  })

  describe.each(Object.entries(locales))('%s', (_name, messages) => {
    const content = messages.human_design.content

    it('has no empty strings', () => {
      leaves(content).forEach(([path, value]) => {
        expect(typeof value, path).toBe('string')
        expect(value.trim(), path).not.toBe('')
      })
    })

    it('covers the ids exported by the engine modules', () => {
      const circuits = [...new Set(CHANNELS.flatMap(channel => [channel.circuit, channel.subCircuit]))].map(slug)

      expect(Object.keys(content.profiles).sort()).toEqual(Object.values(PROFILES).map(profile => profile.id).sort())
      expect(Object.keys(content.profiles)).toHaveLength(12)
      expect(Object.keys(content.line_archetypes)).toEqual(Object.keys(LINE_ARCHETYPES))
      expect(Object.keys(content.line6_stages)).toEqual(LINE_6_STAGES.map(stage => stage.id))
      expect(Object.keys(content.centers).sort()).toEqual(CENTER_MODEL.map(center => center.key).sort())
      expect(Object.keys(content.centers)).toHaveLength(9)
      expect(Object.keys(content.cycles).sort()).toEqual([...new Set(LIFE_CYCLES.map(cycle => cycle.id)), 'lunar'].sort())
      expect(Object.keys(content.circuits_info).sort()).toEqual([...new Set(circuits)].sort())
      expect(Object.keys(content.crosses).sort()).toEqual(Object.keys(PROFILE_ANGLES).sort())
      expect(Object.keys(content.quarters).sort()).toEqual(INCARNATION_QUARTERS.map(quarter => slug(quarter.name)).sort())
      expect(Object.keys(content.authorities).sort()).toEqual(HD_AUTHORITIES.map(slug).sort())
      expect(Object.keys(content.variables.cognition)).toEqual(TONE_NAMES.design.map(tone => tone.key))
      expect(Object.keys(content.variables.areas)).toEqual(ARROWS.map(arrow => arrow.id))
      ARROWS.forEach(arrow => expect(Object.keys(content.variables.colors[arrow.id])).toEqual(['1', '2', '3', '4', '5', '6']))
    })
  })
})
