import { describe, expect, it } from 'vitest'
import { buildVedicReadingDocument } from '../../../src/lib/vedic/reading.js'
import { vedicChartFixture } from './fixtures.js'

const translationTokens = (value, tokens = []) => {
  if (Array.isArray(value)) value.forEach(item => translationTokens(item, tokens))
  else if (value && typeof value === 'object') {
    if (typeof value.key === 'string' && value.params && typeof value.params === 'object') tokens.push(value)
    Object.values(value).forEach(item => translationTokens(item, tokens))
  }
  return tokens
}

describe('Vedic psychological ReadingDocument', () => {
  it('is deterministic, normalized, and language-neutral', () => {
    const first = buildVedicReadingDocument(vedicChartFixture())
    const second = buildVedicReadingDocument(vedicChartFixture())

    expect(first).toEqual(second)
    expect(first).toMatchObject({
      schemaVersion: 'vedic-reading-document.v1',
      languageNeutral: true,
      chartId: 'vedic-fixture',
    })
    expect(first.chapters.map(chapter => chapter.id)).toEqual([
      'identity',
      'emotional_life',
      'cognition',
      'relationships',
      'agency',
      'meaning',
      'growth',
      'current_context',
    ])
    expect(translationTokens(first).every(item => item.key.startsWith('vedic.reading.'))).toBe(true)
    expect(JSON.stringify(first)).not.toContain('interpretation')
  })

  it('provides prominence, resources, and resolvable evidence IDs', () => {
    const document = buildVedicReadingDocument(vedicChartFixture())
    const evidenceIds = new Set(document.evidence.map(item => item.id))
    const references = [
      ...document.chapters.flatMap(chapter => chapter.insights),
      ...document.prominence,
      ...document.strengths,
      ...document.challenges,
      ...document.practices,
    ].flatMap(item => item.evidenceIds)

    expect(document.prominence[0].body).toBe('Sun')
    expect(document.strengths.map(item => item.id)).toEqual(expect.arrayContaining(['strengths:Sun', 'strengths:Moon']))
    expect(document.challenges.map(item => item.id)).toContain('challenges:Mars')
    expect(document.practices).toHaveLength(3)
    expect(references.every(id => evidenceIds.has(id))).toBe(true)
    expect(document.evidence).toContainEqual(expect.objectContaining({ id: 'node-axis', type: 'node_axis' }))
    expect(document.evidence).toContainEqual(expect.objectContaining({ id: 'vimshottari:current', type: 'vimshottari' }))
  })

  it('uses flat scalar sign and house parameters for the node axis', () => {
    const document = buildVedicReadingDocument(vedicChartFixture())
    const nodeEvidence = document.evidence.find(item => item.id === 'node-axis')
    const nodeInsight  = document.chapters
      .flatMap(chapter => chapter.insights)
      .find(item => item.id === 'insight:node-axis')
    const expectedParams = {
      rahuSignIndex: 10,
      rahuHouse:     11,
      ketuSignIndex: 4,
      ketuHouse:     5,
    }

    expect(nodeEvidence.label.params).toEqual(expectedParams)
    expect(nodeInsight.text.params).toEqual(expectedParams)
    expect(Object.values(nodeEvidence.label.params).every(value => value === null || typeof value !== 'object')).toBe(true)
  })
})
