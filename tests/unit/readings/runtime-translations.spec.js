import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'
import { tropicalReadingDocument } from '../../../src/lib/astro/interpretations.js'
import { deriveHumanDesignGraph } from '../../../src/lib/human-design/bodygraph.js'
import { buildHumanDesignReadingDocument } from '../../../src/lib/human-design/interpretations.js'
import {
  localizeReadingParams,
  normalizeReadingDocument,
  translateReadingToken,
} from '../../../src/lib/readings/presentation.js'
import { buildVedicReadingDocument } from '../../../src/lib/vedic/reading.js'
import { vedicChartFixture } from '../vedic/fixtures.js'

const activation = (planet, gate, line, color = 1, tone = 1, base = 1) => ({
  planet,
  gate,
  line,
  color,
  tone,
  base,
  longitude: 0,
  progress:  0,
})

const tropicalChart = () => ({
  zodiac:    'tropical',
  ascendant: 0,
  mc:        90,
  cusps:     Array.from({ length: 12 }, (_, index) => index * 30),
  positions: [
    ['Sun', 5],
    ['Moon', 185],
    ['Mercury', 20],
    ['Venus', 140],
    ['Mars', 95],
    ['Jupiter', 260],
    ['Saturn', 300],
    ['Uranus', 45],
    ['Neptune', 75],
    ['Pluto', 210],
    ['NorthNode', 160],
    ['SouthNode', 340],
    ['Chiron', 225],
    ['Lilith', 275],
  ].map(([name, longitude]) => ({ name, longitude, latitude: 0, speed: 1, retrograde: false })),
})

const tropicalAspects = () => [
  { a: 'Sun',     b: 'Moon',    type: 'opposition', delta: 0.2, strength: 0.91, applying: true },
  { a: 'Sun',     b: 'Mars',    type: 'square',     delta: 0.4, strength: 0.84, applying: false },
  { a: 'Moon',    b: 'Mars',    type: 'square',     delta: 0.5, strength: 0.82, applying: true },
  { a: 'Mercury', b: 'Venus',  type: 'trine',      delta: 0.3, strength: 0.79, applying: true },
  { a: 'Mercury', b: 'Jupiter', type: 'trine',      delta: 0.7, strength: 0.73, applying: false },
  { a: 'Venus',   b: 'Jupiter', type: 'trine',      delta: 0.8, strength: 0.71, applying: true },
]

const humanDesignChart = () => deriveHumanDesignGraph({
  personId:   'runtime-reading-fixture',
  personName: 'Runtime Reading Fixture',
  birthJd:    2460677,
  designJd:   2460589,
  lat:        0,
  lon:        0,
  personality: {
    Sun:   activation('Sun', 23, 6, 2, 5, 1),
    Earth: activation('Earth', 43, 6, 2, 5, 1),
  },
  design: {
    Sun:   activation('Sun', 23, 2, 3, 3, 5),
    Earth: activation('Earth', 43, 2, 3, 3, 5),
  },
})

const readingDocuments = () => ({
  tropical: tropicalReadingDocument(tropicalChart(), tropicalAspects()),
  vedic:    buildVedicReadingDocument(vedicChartFixture()),
  design:   buildHumanDesignReadingDocument(humanDesignChart()),
})

const translationTokens = (value, tokens = []) => {
  if (Array.isArray(value)) value.forEach(item => translationTokens(item, tokens))
  else if (value && typeof value === 'object') {
    if (typeof value.key === 'string' && value.params && typeof value.params === 'object') tokens.push(value)
    Object.values(value).forEach(item => translationTokens(item, tokens))
  }
  return tokens
}

const renderedStrings = (value, strings = []) => {
  if (typeof value === 'string') strings.push(value)
  else if (Array.isArray(value)) value.forEach(item => renderedStrings(item, strings))
  else if (value && typeof value === 'object') Object.values(value).forEach(item => renderedStrings(item, strings))
  return strings
}

const translator = locale => createI18n({
  legacy:         false,
  locale,
  fallbackLocale: false,
  messages:       { en, 'pt-BR': ptBR },
}).global.t

const forbiddenRuntimeOutput = /(?:\[object Object\]|\b(?:readings|vedic|human_design|planets|zodiac)\.[a-z0-9_.-]+)/i

const escapedRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const containsCanonicalValue = (text, value) => new RegExp(
  `(?<![\\p{L}\\p{N}_])${escapedRegExp(value)}(?![\\p{L}\\p{N}_])`,
  'u'
).test(text)

describe('runtime reading translations', () => {
  it.each(['en', 'pt-BR'])('renders every emitted token from actual documents in %s', locale => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const t    = translator(locale)

    try {
      for (const [modality, document] of Object.entries(readingDocuments())) {
        const tokens = translationTokens(document)
        const keys   = [...new Set(tokens.map(token => token.key))]
        const tokenOutput = tokens.map(token => translateReadingToken(token, t))
        const normalized  = normalizeReadingDocument(document, t)
        const output      = [...tokenOutput, ...renderedStrings(normalized)]

        expect(keys.length, `${modality} dynamic token keys`).toBeGreaterThan(0)
        expect(tokenOutput, `${modality} emitted tokens`).toHaveLength(tokens.length)
        expect(output.every(value => typeof value === 'string' && value.length > 0), modality).toBe(true)
        expect(output.join('\n'), modality).not.toMatch(forbiddenRuntimeOutput)

        if (locale === 'pt-BR') {
          const enT = translator('en')
          for (const token of tokens) {
            const english    = localizeReadingParams(token.params, enT, token.key)
            const portuguese = localizeReadingParams(token.params, t, token.key)
            const text       = translateReadingToken(token, t)
            for (const name of Object.keys(english)) {
              if (typeof english[name] !== 'string' || english[name] === portuguese[name]) continue
              expect(
                containsCanonicalValue(text, english[name]),
                `${token.key} leaked canonical ${name}=${english[name]}`
              ).toBe(false)
            }
          }
        }
      }

      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })
})
