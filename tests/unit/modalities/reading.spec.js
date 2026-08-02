import { describe, expect, it } from 'vitest'
import { naturalAspects } from '../../../src/lib/astro/aspects.js'
import { tropicalReadingDocument } from '../../../src/lib/astro/interpretations.js'
import {
  HUMAN_DESIGN_READING_SCHEMA,
  HUMAN_DESIGN_READING_VERSION,
  buildHumanDesignReadingDocument,
} from '../../../src/lib/human-design/interpretations.js'
import {
  getModality,
  modalityChart,
  modalityConnection,
  modalityInterpretation,
  modalityReading,
  modalities,
} from '../../../src/lib/modalities/index.js'
import { buildVedicReadingDocument } from '../../../src/lib/vedic/reading.js'

const person = {
  id:              'modality-reference',
  isoLocal:        '1986-02-12T18:10',
  tzOffsetMinutes: -120,
  lat:             -23.18,
  lon:             -45.88,
}

const tropicalChart = {
  zodiac:    'tropical',
  ascendant: 0,
  mc:        90,
  cusps:     Array.from({ length: 12 }, (_, index) => index * 30),
  positions: [
    { name: 'Sun', longitude: 5, latitude: 0, speed: 1, retrograde: false },
    { name: 'Moon', longitude: 185, latitude: 0, speed: 1, retrograde: false },
    { name: 'Mars', longitude: 95, latitude: 0, speed: 1, retrograde: false },
  ],
}

const renderedFields = new Set(['content', 'label', 'text', 'title'])

const renderedProse = (value, path = []) => {
  if (Array.isArray(value)) return value.flatMap((item, index) => renderedProse(item, [...path, index]))
  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = [...path, key]
    const match     = renderedFields.has(key) && typeof child === 'string'
      ? [childPath.join('.')]
      : []
    return [...match, ...renderedProse(child, childPath)]
  })
}

describe('modality reading adapters', () => {
  it('builds the Tropical document from natural aspects and reading settings', () => {
    const settings = { aspectOptions: { orbScale: 0.5 }, aspectLimit: 1 }
    const expected = tropicalReadingDocument(
      tropicalChart,
      naturalAspects(tropicalChart, settings.aspectOptions),
      settings
    )

    expect(modalities.astrology.reading(tropicalChart, person, settings)).toEqual(expected)
    expect(modalityReading('astrology', tropicalChart, person, settings)).toEqual(expected)
    expect(expected.completeness.included.aspects).toBe(1)
  })

  it('returns the canonical Human Design document without treating person as a translator', () => {
    const chart    = modalityChart('humanDesign', person)
    const expected = buildHumanDesignReadingDocument(chart)
    const document = modalityReading('humanDesign', chart, person, { ignored: true })

    expect(document).toEqual(expected)
    expect(document).toMatchObject({
      schema:          HUMAN_DESIGN_READING_SCHEMA,
      schemaVersion:   HUMAN_DESIGN_READING_VERSION,
      languageNeutral: true,
    })
  })

  it('keeps Vedic chart creation async and reads a resolved chart synchronously', async () => {
    const chartPromise = modalityChart('vedic', person, {
      ayanamsha: 'lahiri',
      houseMode: 'whole_sign',
      nodeMode:  'mean',
    })

    expect(chartPromise).toBeInstanceOf(Promise)

    const chart    = await chartPromise
    const document = modalityReading('vedic', chart, person)

    expect(document).not.toBeInstanceOf(Promise)
    expect(document).toEqual(buildVedicReadingDocument(chart))
    expect(document).toMatchObject({
      schemaVersion:   'vedic-reading-document.v1',
      languageNeutral: true,
      chartId:         'vedic-modality-reference',
    })
  })

  it('falls back to Tropical and preserves the interpretation alias', () => {
    const expected = modalityReading('astrology', tropicalChart, person)

    expect(getModality('unsupported')).toBe(modalities.astrology)
    expect(modalityReading('unsupported', tropicalChart, person)).toEqual(expected)
    expect(modalityInterpretation('unsupported', tropicalChart, person)).toEqual(expected)
  })

  it('returns language-neutral tokens instead of rendered prose for every modality', async () => {
    const charts = {
      astrology:   tropicalChart,
      humanDesign: modalityChart('humanDesign', person),
      vedic:       await modalityChart('vedic', person),
    }

    for (const [id, chart] of Object.entries(charts)) {
      expect(renderedProse(modalityReading(id, chart, person)), id).toEqual([])
    }
  })

  it('preserves connection APIs', () => {
    const humanDesignChart = modalityChart('humanDesign', person)

    expect(modalityConnection('astrology', null, null)).toEqual({ aspects: [] })
    expect(modalityConnection('vedic', null, null)).toEqual({ aspects: [] })
    expect(modalityConnection('humanDesign', humanDesignChart, humanDesignChart)).toEqual(
      modalities.humanDesign.connection(humanDesignChart, humanDesignChart)
    )
  })
})
