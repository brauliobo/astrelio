import { describe, expect, it } from 'vitest'
import { CHANNEL_STREAMS } from '../../../src/lib/human-design/constants.js'
import { STREAM_BY_CHANNEL } from '../../../src/lib/human-design/gate-library.js'
import { lifeCyclesForChart, sensitivityForChart } from '../../../src/lib/human-design/bodygraph.js'
import { gateLines, lineContent } from '../../../src/lib/human-design/content/index.js'
import { referenceChart } from './reference-chart.js'

const chart = referenceChart()

describe('enriched Human Design chart', () => {
  it('carries the profile record of the Sun lines', () => {
    expect(chart.profileInfo).toMatchObject({ key: '6/2', id: '6_2', angle: 'left_angle', conscious: 6, unconscious: 2 })
  })

  it('carries a state per center with hanging gates as conditioning carriers', () => {
    const byKey = Object.fromEntries(chart.centerStates.map(center => [center.key, center]))

    expect(chart.centerStates).toHaveLength(9)
    expect(Object.values(byKey).filter(center => center.state === 'defined').map(center => center.key).sort())
      .toEqual(chart.centers.map(center => center.toLowerCase().replace(' ', '_')).sort())
    expect(byKey.head.state).toBe('open')
    expect(byKey.ajna).toMatchObject({ state: 'undefined', undefinedActivatedGates: [4, 24] })
  })

  it('carries variable details with shorthand, arrows and cognition', () => {
    const { arrows, shorthand, cognition } = chart.variableDetails

    expect(Object.keys(arrows)).toEqual(['digestion', 'environment', 'motivation', 'perspective'])
    expect(shorthand).toBe('PRR DLL')
    expect(cognition).toMatchObject({ tone: arrows.digestion.tone, key: 'outer_vision' })
  })

  it('limits transference to motivation and distraction to perspective', () => {
    const named = Object.fromEntries(chart.variables.map(variable => [variable.id, variable]))

    expect(named.motivation).toMatchObject({ transference: 'Guilt', distraction: '' })
    expect(named.perspective).toMatchObject({ transference: '', distraction: 'Probability' })
    expect(named.digestion).toMatchObject({ transference: '', distraction: '' })
    expect(named.environment).toMatchObject({ transference: '', distraction: '' })
  })

  it('keeps definition areas, split size and bridges on the chart', () => {
    expect(chart.definitionAreas).toHaveLength(3)
    expect(chart.splitSize).toBe('small')
    expect(chart.bridges).toEqual({ gates: expect.any(Array), channels: expect.any(Array) })
  })

  it('computes life cycles and sensitivity on demand, not while building the chart', () => {
    expect(chart).not.toHaveProperty('lifeCycles')
    expect(chart).not.toHaveProperty('sensitivity')
    expect(lifeCyclesForChart(chart).map(cycle => cycle.id)).toEqual(expect.arrayContaining(['saturn_return', 'chiron_return', 'uranus_opposition']))
    expect(sensitivityForChart(chart).rows).toHaveLength(26)
  })

  it('derives the stream of every channel from the channel table', () => {
    expect(STREAM_BY_CHANNEL).toEqual(CHANNEL_STREAMS)
    expect(chart.details.channels.every(channel => channel.stream === CHANNEL_STREAMS[channel.channel])).toBe(true)
  })
})

describe('line content', () => {
  it('serves every gate line per locale', () => {
    expect(lineContent('en', 1, 1)).toMatchObject({ keynote: expect.any(String), text: expect.any(String) })
    expect(lineContent('pt-BR', 1, 1).text).not.toBe(lineContent('en', 1, 1).text)
    expect(gateLines('pt-BR', 64).map(item => item.line)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('falls back to English for unsupported locales', () => {
    expect(lineContent('fr', 12, 3)).toEqual(lineContent('en', 12, 3))
    expect(lineContent('pt', 12, 3)).toEqual(lineContent('pt-BR', 12, 3))
  })
})
