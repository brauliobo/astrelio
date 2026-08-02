import { naturalAspects } from '../astro/aspects.js'
import { computeChart } from '../astro/ephemeris.js'
import { synastryAspects } from '../astro/synastry.js'
import { localToJdUt, offsetMinutesForPerson } from '../astro/timezones.js'
import { tropicalReadingDocument } from '../astro/interpretations.js'
import { buildHumanDesignChart } from '../human-design/bodygraph.js'
import { humanDesignConnection } from '../human-design/connections.js'
import { buildHumanDesignReadingDocument, humanDesignConnectionInsights } from '../human-design/interpretations.js'
import { buildVedicChart } from '../vedic/chart.js'
import { buildVedicReadingDocument } from '../vedic/reading.js'

/**
 * Modality adapters keep product surfaces decoupled from calculation engines.
 * Each modality owns its chart, reading, and relationship connection.
 */
const astrologyChart = (person, settings = {}) => {
  if (!person) return null
  const jd = localToJdUt(person.isoLocal, offsetMinutesForPerson(person))
  return computeChart(jd, person.lat, person.lon, {
    zodiac:      settings.zodiac || 'tropical',
    houseSystem: settings.houseSystem || 'placidus',
    nodeMode:    settings.nodeMode,
  })
}

export const modalities = {
  astrology: {
    id:         'astrology',
    chart:      astrologyChart,
    reading:    (chart, _person, settings = {}) => tropicalReadingDocument(
      chart,
      chart ? naturalAspects(chart, settings.aspectOptions) : [],
      settings
    ),
    connection: (chartA, chartB, settings = {}) => ({
      aspects: chartA && chartB ? synastryAspects(chartA, chartB, settings.aspectOptions) : [],
    }),
  },
  humanDesign: {
    id:                 'humanDesign',
    chart:              buildHumanDesignChart,
    reading:            buildHumanDesignReadingDocument,
    connection:         humanDesignConnection,
    connectionInsights: humanDesignConnectionInsights,
  },
  vedic: {
    id:         'vedic',
    chart:      buildVedicChart,
    reading:    buildVedicReadingDocument,
    connection: () => ({ aspects: [] }),
  },
}

export const modalityIds = Object.keys(modalities)

export const getModality = (id) => modalities[id] || modalities.astrology

export const modalityChart = (id, person, settings) =>
  getModality(id).chart(person, settings)

export const modalityConnection = (id, chartA, chartB, settings) =>
  getModality(id).connection(chartA, chartB, settings)

export const modalityReading = (id, chart, person, settings) =>
  getModality(id).reading(chart, person, settings)

export const modalityInterpretation = (id, chart, person, settings) =>
  modalityReading(id, chart, person, settings)
