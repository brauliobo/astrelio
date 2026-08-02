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
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'

const translator = locale => createI18n({ legacy: false, locale, messages }).global.t
const fullTranslator = locale => createI18n({
  legacy:   false,
  locale,
  messages: { en, 'pt-BR': ptBR },
}).global.t

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

  it.each([
    [
      'en',
      'The Aries–Libra axis links complementary priorities: Sun, Mercury represent the Aries side and Moon represent the Libra side.',
      'Aries ↔ Libra complementary sign axis',
    ],
    [
      'pt-BR',
      'O eixo Áries–Libra reúne prioridades complementares: Sol, Mercúrio representam o lado de Áries e Lua representam o lado de Libra.',
      'Eixo complementar de signos Áries ↔ Libra',
    ],
  ])('localizes sign-axis theme bodies and factual evidence in %s', (locale, expectedTheme, expectedEvidence) => {
    const t     = fullTranslator(locale)
    const token = {
      key:    'readings.tropical.summary.sign_axis.aries_libra',
      params: {
        primarySignIndex:  0,
        oppositeSignIndex: 6,
        primaryBodies:     ['Sun', 'Mercury'],
        oppositeBodies:    ['Moon'],
      },
    }
    const reading = normalizeReadingDocument({
      title:   { key: 'readings.tropical.document.title', params: {} },
      summary: { themes: [{ id: 'theme:sign-axis:aries_libra', token, evidenceIds: ['sign-axis:aries_libra'] }] },
      evidence: [{
        id:    'sign-axis:aries_libra',
        kind:  'sign_axis',
        facts: { primarySignIndex: 0, oppositeSignIndex: 6 },
      }],
    }, t)

    expect(translateReadingToken(token, t)).toBe(expectedTheme)
    expect(reading.themes[0]).toMatchObject({
      text:     expectedTheme,
      evidence: [{ id: 'sign-axis:aries_libra', text: expectedEvidence }],
    })
  })

  it.each([
    ['en', ['Sun', 'Aries', 'house 1']],
    ['pt-BR', ['Sol', 'Áries', 'casa 1']],
  ])('derives localized placement keywords in deterministic evidence order in %s', (locale, labels) => {
    const t        = fullTranslator(locale)
    const tropical = normalizeReadingDocument({
      ...tropicalDocument,
      strengths:  [],
      challenges: [],
      practices:  [],
    }, t)
    const vedic    = normalizeReadingDocument(vedicDocument, t)
    const tropicalKeywords = tropical.chapters[0].items[0].keywords
    const vedicKeywords    = vedic.chapters[0].items[0].keywords

    expect(tropicalKeywords.map(item => item.label)).toEqual(labels)
    expect(tropicalKeywords.map(item => item.id)).toEqual(['body:Sun', 'sign:0', 'house:1'])
    expect(tropicalKeywords[1].highlight.wheel).toMatchObject({
      kind:              'sign',
      id:                'sign-0',
      signIndex:         0,
      oppositeSignIndex: 6,
      axisId:            'aries_libra',
      relatedIds:        ['sign-6'],
      axis:              { signIndices: [0, 6] },
    })
    expect(vedicKeywords.map(item => item.label)).toEqual(labels)
    expect(vedicKeywords[1].highlight.wheel).toEqual({ kind: 'sign', id: 'sign-0', signIndex: 0 })
  })

  it.each([
    ['en', ['Sun', 'Opposition', 'Moon']],
    ['pt-BR', ['Sol', 'Oposição', 'Lua']],
  ])('uses a real localized aspect record for aspect keywords in %s', (locale, labels) => {
    const t       = fullTranslator(locale)
    const reading = normalizeReadingDocument({
      title: { key: 'readings.presentation.titles.tropical', params: {} },
      chapters: [{
        id:    'integration',
        title: { key: 'readings.presentation.sections.themes', params: {} },
        items: [{
          id:          'aspect-row',
          token:       { key: 'readings.tropical.items.aspect.opposition', params: { a: 'Sun', b: 'Moon' } },
          evidenceIds: ['aspect:sun-moon-opposition'],
        }],
      }],
      evidence: [{
        id:    'aspect:sun-moon-opposition',
        kind:  'aspect',
        facts: { a: 'Sun', b: 'Moon', type: 'opposition', delta: 0.2 },
      }],
    }, t)
    const keywords = reading.chapters[0].items[0].keywords

    expect(keywords.map(item => item.label)).toEqual(labels)
    expect(keywords[1]).toMatchObject({
      id:   'Sun-Moon-opposition',
      kind: 'aspect',
      highlight: {
        bodies:    ['Sun', 'Moon'],
        aspectKey: 'Sun-Moon-opposition',
        aspect:    { a: 'Sun', b: 'Moon', type: 'opposition' },
      },
    })
  })

  it.each([
    ['en', ['Sacral', 'Inspiration', '23: Assimilation', 'Sun in the Personality layer activates Gate 23, line 6.']],
    ['pt-BR', ['Sacral', 'Inspiração', '23: Assimilação', 'Sol na camada de Personalidade ativa o Portão 23, linha 6.']],
  ])('derives Human Design center, channel, gate, and activation highlights in %s', (locale, labels) => {
    const t       = fullTranslator(locale)
    const reading = normalizeReadingDocument({
      schema: 'human-design.reading-document',
      title:  { key: 'readings.presentation.titles.human_design', params: {} },
      chapters: [{
        id:          'structure',
        title:       { key: 'readings.presentation.sections.themes', params: {} },
        overview:    { key: 'readings.presentation.titles.human_design', params: {} },
        evidenceIds: ['center:sacral', 'channel:1-8', 'gate:23', 'activation:personality:sun'],
      }],
      evidence: [
        { id: 'center:sacral', kind: 'center', path: 'centers.sacral', facts: { defined: true } },
        { id: 'channel:1-8', kind: 'channel', path: 'channels.1-8', facts: { gates: [1, 8] } },
        { id: 'gate:23', kind: 'gate', path: 'gates.23', facts: { gate: 23, lines: [6] } },
        {
          id:   'activation:personality:sun',
          kind: 'activation',
          path: 'personality.sun',
          facts: { gate: 23, line: 6, color: 2, tone: 5, base: 1 },
        },
      ],
    }, t)
    const keywords = reading.chapters[0].items[0].keywords

    expect(keywords.map(item => item.label)).toEqual(labels)
    expect(keywords.map(item => item.highlight.hd)).toEqual([
      { type: 'center', value: 'sacral' },
      { type: 'channel', value: '1-8' },
      { type: 'gate', value: 23 },
      {
        type:         'gate',
        value:        23,
        activationId: 'activation:personality:sun',
        layer:        'personality',
        body:         'Sun',
        line:         6,
        color:        2,
        tone:         5,
        base:         1,
      },
    ])
  })

  it('deduplicates semantic keywords while preserving first evidence order', () => {
    const t       = fullTranslator('en')
    const reading = normalizeReadingDocument({
      title:   { key: 'readings.presentation.titles.tropical', params: {} },
      summary: {
        themes: [{
          token:       { key: 'readings.presentation.titles.tropical', params: {} },
          evidenceIds: ['placement:sun:first', 'placement:sun:second'],
        }],
      },
      evidence: [
        { id: 'placement:sun:first', kind: 'placement', facts: { body: 'Sun', signIndex: 0, house: 1 } },
        { id: 'placement:sun:second', kind: 'placement', facts: { body: 'Sun', signIndex: 0, house: 1 } },
      ],
    }, t)

    expect(reading.themes[0].keywords.map(item => item.id)).toEqual(['body:Sun', 'sign:0', 'house:1'])
  })

  it.each([
    ['en', ['Sun', 'Moon', 'Leo', 'house 5', 'Aries', 'Mercury', 'Libra']],
    ['pt-BR', ['Sol', 'Lua', 'Leão', 'casa 5', 'Áries', 'Mercúrio', 'Libra']],
  ])('extracts configuration and sign-axis participants without reordering in %s', (locale, labels) => {
    const t       = fullTranslator(locale)
    const reading = normalizeReadingDocument({
      title:   { key: 'readings.presentation.titles.tropical', params: {} },
      summary: {
        themes: [{
          token:       { key: 'readings.presentation.titles.tropical', params: {} },
          evidenceIds: ['configuration:stellium', 'sign-axis:aries-libra'],
        }],
      },
      evidence: [
        {
          id:    'configuration:stellium',
          kind:  'configuration',
          facts: { bodies: ['Sun', 'Moon'], signIndex: 4, house: 5 },
        },
        {
          id:    'sign-axis:aries-libra',
          kind:  'sign_axis',
          facts: {
            primarySignIndex:  0,
            oppositeSignIndex: 6,
            sides: [
              { signIndex: 0, bodies: ['Sun', 'Mercury'] },
              { signIndex: 6, bodies: ['Moon'] },
            ],
          },
        },
      ],
    }, t)

    expect(reading.themes[0].keywords.map(item => item.label)).toEqual(labels)
    expect(reading.themes[0].keywords.map(item => item.id)).toEqual([
      'body:Sun',
      'body:Moon',
      'sign:4',
      'house:5',
      'sign:0',
      'body:Mercury',
      'sign:6',
    ])
  })

  it.each([
    ['en', 'Mercury and Mercuryish; Mercury.', ['Mercury', 'Mercury']],
    ['pt-BR', 'Mercúrio e Mercúriozinho; Mercúrio.', ['Mercúrio', 'Mercúrio']],
  ])('segments every exact semantic occurrence with Unicode-safe boundaries in %s', (locale, text, matches) => {
    const t       = translator(locale)
    const reading = normalizeReadingDocument({
      title:   { key: 'readings.presentation.titles.tropical', params: {} },
      summary: {
        themes: [{
          token:       { key: 'test.segment_boundary', params: {} },
          evidenceIds: ['placement:mercury'],
        }],
      },
      evidence: [{
        id:    'placement:mercury',
        kind:  'placement',
        facts: { body: 'Mercury', signIndex: 0, house: 1 },
      }],
    }, t)
    const row         = reading.themes[0]
    const interactive = row.segments.filter(segment => segment.keyword)

    expect(row.segments.map(segment => segment.text).join('')).toBe(text)
    expect(interactive.map(segment => segment.text)).toEqual(matches)
    expect(interactive.map(segment => segment.keyword.id)).toEqual(['body:Mercury', 'body:Mercury'])
    expect(row.segments.some(segment => segment.text.includes(locale === 'en' ? 'Mercuryish' : 'Mercúriozinho'))).toBe(true)
  })

  it.each(['en', 'pt-BR'])('preserves exact row text and omits absent evidence labels from segments in %s', locale => {
    const t       = translator(locale)
    const reading = normalizeReadingDocument(tropicalDocument, t)
    const theme   = reading.themes[0]
    const chapter = reading.chapters[0].items[0]

    expect(theme.segments.map(segment => segment.text).join('')).toBe(theme.text)
    expect(chapter.segments.map(segment => segment.text).join('')).toBe(chapter.text)
    expect(theme.segments.filter(segment => segment.keyword).map(segment => segment.keyword.id)).toEqual(['body:Sun'])
    expect(chapter.segments.filter(segment => segment.keyword).map(segment => segment.keyword.id)).toEqual(['body:Sun', 'sign:0'])
  })
})
