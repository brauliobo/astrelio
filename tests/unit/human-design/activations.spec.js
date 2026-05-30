import { describe, expect, it } from 'vitest'
import { activationCode, activationFromLongitude } from '../../../src/lib/human-design/activations.js'
import { buildHumanDesignChart } from '../../../src/lib/human-design/bodygraph.js'

const referencePerson = {
  id: 'ref-person',
  name: 'Bráulio Oliveira',
  isoLocal: '1986-02-12T18:10',
  ianaZone: 'America/Sao_Paulo',
  tzOffsetMinutes: -120,
  lat: -23.18,
  lon: -45.88,
  placeLabel: 'São José dos Campos, SP - Brasil',
}

describe('Human Design activations', () => {
  it('maps the 2 Aquarius anchor to Gate 41 line 1', () => {
    const activation = activationFromLongitude(302)

    expect(activation.gate).toBe(41)
    expect(activation.line).toBe(1)
    expect(activation.color).toBe(1)
    expect(activation.tone).toBe(1)
    expect(activation.base).toBe(1)
    expect(activationCode(activation)).toBe('41.1.1.1.1')
  })

  it('wraps longitudes around the mandala without changing the code', () => {
    expect(activationCode(activationFromLongitude(302))).toBe(activationCode(activationFromLongitude(-58)))
  })

  it('matches the mybodygraph reference activations for the saved chart', () => {
    const chart = buildHumanDesignChart(referencePerson)

    expect(activationCode(chart.design.Sun)).toBe('14.2.3.3.5')
    expect(`${chart.design.NorthNode.gate}.${chart.design.NorthNode.line}`).toBe('24.2')
    expect(`${chart.design.SouthNode.gate}.${chart.design.SouthNode.line}`).toBe('44.2')
    expect(activationCode(chart.personality.Sun)).toBe('49.6.2.5.1')
    expect(`${chart.personality.NorthNode.gate}.${chart.personality.NorthNode.line}`).toBe('27.1')
    expect(`${chart.personality.SouthNode.gate}.${chart.personality.SouthNode.line}`).toBe('28.1')
    expect(`${chart.personality.Moon.gate}.${chart.personality.Moon.line}`).toBe('21.1')
    expect(chart.channels).toEqual(['10-34', '19-49', '26-44'])
    expect(chart.type).toBe('Generator')
    expect(chart.authority).toBe('Emotional')
    expect(chart.profile).toBe('6 / 2')
    expect(chart.definition).toBe('Triple Split Definition')
  })
})
