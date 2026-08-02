import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import {
  localizeReadingParams,
  normalizeReadingDocument,
  translateReadingToken,
} from '../../../src/lib/readings/presentation.js'
import {
  humanDesignDocument,
  messages,
  tropicalDocument,
  vedicDocument,
} from './fixtures.js'

const translator = locale => createI18n({ legacy: false, locale, messages }).global.t

describe('reading presentation adapter', () => {
  it.each(['en', 'pt-BR'])('localizes canonical parameters before interpolation in %s', locale => {
    const t = translator(locale)
    const text = translateReadingToken({
      key:    'test.params',
      params: {
        body:       'Sun',
        bodies:     ['Sun', 'Moon'],
        signIndex:  0,
        dignity:    'exalted',
        nakshatra:  'rohini',
        mahadasha:  'jupiter',
        type:        'generator',
        authority:   'emotional',
        definition:  'single',
        center:      'sacral',
        circuit:     'individual',
        layer:       'personality',
        geometry:    'right_angle',
        quarter:     'Initiation',
        orientation: 'left',
      },
    }, t)

    if (locale === 'en')
      expect(text).toBe('Sun;Sun, Moon;Aries;exalted;Rohini;Jupiter;Generator;Emotional;Single Definition;Sacral;Individual;Personality;Right Angle Cross;Initiation;Left')
    else
      expect(text).toBe('Sol;Sol e Lua;Áries;exaltado;Rohini;Júpiter;Gerador;Emocional;Definição Simples;Sacral;Individual;Personalidade;Cruz de Ângulo Direito;Iniciação;Esquerda')
  })

  it('normalizes all three variants and preserves evidence references', () => {
    const t        = translator('en')
    const tropical = normalizeReadingDocument(tropicalDocument, t)
    const vedic    = normalizeReadingDocument(vedicDocument, t)
    const design   = normalizeReadingDocument(humanDesignDocument, t)

    expect(tropical).toMatchObject({
      title:    'Tropical psychological reading',
      themes:   [{ text: 'Sun is prominent', evidence: [{ id: 'placement:sun', text: 'Sun in Aries, house 1' }] }],
      chapters: [{ id: 'core_identity', items: [{ text: 'Sun in Aries' }] }],
    })
    expect(tropical.chapters).toHaveLength(1)
    expect(vedic).toMatchObject({
      title:      'Vedic reading',
      prominence: [{ text: '#1 Sun', evidence: [{ id: 'placement:sun' }] }],
      chapters:   [{ items: [{ text: 'Sun in Aries, exalted, Rohini' }] }],
    })
    expect(design).toMatchObject({
      title:      'Human Design reading',
      themes:     [{ text: 'Type: Generator' }],
      prominence: [{ text: 'Individual circuit (1)' }],
      chapters:   [{ items: [{ text: 'Generator decisions use Emotional authority.' }] }],
      caveats:    ['Exact birth time is required.'],
    })
    expect(design.guidance.strengths[0]).toMatchObject({
      text:     'Generator mechanics support decisions.',
      evidence: [{ id: 'mechanics:type' }],
    })
    expect(tropical.themes[0].evidence[0].text).not.toContain('placement:sun')
  })

  it('returns an empty presentation for absent optional sections without fallback prose', () => {
    const t = translator('en')
    const reading = normalizeReadingDocument({
      schemaVersion: 1,
      title:         { key: 'readings.presentation.titles.tropical', params: {} },
    }, t)

    expect(reading).toEqual({
      title:      'Tropical reading',
      themes:     [],
      prominence: [],
      chapters:   [],
      guidance:   { strengths: [], challenges: [], practices: [] },
      caveats:    [],
    })
  })

  it('localizes distribution and unavailable values through translation keys', () => {
    const t = translator('en')
    expect(localizeReadingParams({
      category:  'element',
      dominant:  'fire',
      signIndex: null,
    }, t)).toEqual({
      category:  'Element',
      dominant:  'Fire',
      signIndex: 'Unavailable',
    })
  })
})
