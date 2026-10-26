import { describe, expect, it } from 'vitest'
import { computeChart } from '../../../src/lib/astro/ephemeris.js'
import { activationCode, activationFromLongitude, activationsForChart, hdActivationAt } from '../../../src/lib/human-design/activations.js'
import { buildHumanDesignChart, buildHumanDesignTransitChart, humanDesignTransitConnection } from '../../../src/lib/human-design/bodygraph.js'
import { HD_PLANETS } from '../../../src/lib/human-design/constants.js'

const referencePerson = {
  id:              'ref-person',
  name:            'Bráulio Oliveira',
  isoLocal:        '1986-02-12T18:10',
  ianaZone:        'America/Sao_Paulo',
  tzOffsetMinutes: -120,
  lat:             -23.18,
  lon:             -45.88,
  placeLabel:      'São José dos Campos, SP - Brasil',
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

  it('derives the reference chart topology from the gate graph', () => {
    const chart = buildHumanDesignChart(referencePerson)

    expect(chart.gates).toEqual([...chart.gates].sort((a, b) => a - b))
    expect(chart.centers).toEqual(['Ego', 'G', 'Root', 'Sacral', 'Solar Plexus', 'Spleen'])
    expect(chart.definitionAreas).toHaveLength(3)
    expect(chart.splitSize).toBe('small')
    expect(chart.bridges.gates.map(bridge => bridge.gate)).toEqual(expect.arrayContaining([52, 57, 18, 50, 38]))
    expect(chart.motorsToThroat).toEqual([])
    expect([chart.strategy, chart.signature, chart.notSelfTheme]).toEqual(['Wait to respond', 'Satisfaction', 'Frustration'])
    expect(chart.details.gates.find(gate => gate.gate === 14).center).toBe('Sacral')
    expect(chart.details.gates.find(gate => gate.gate === 4).center).toBe('Ajna')
  })
})

describe('Human Design next activation changes', () => {
  const dateMs  = Date.UTC(2026, 0, 1, 12)
  const transit = buildHumanDesignTransitChart(dateMs, 0, 0)

  it('computes single-body activations identical to the full chart', () => {
    const full = activationsForChart(computeChart(transit.birthJd, 0, 0, { zodiac: 'tropical', houseSystem: 'whole_sign', nodeMode: 'true' }))

    for (const planet of HD_PLANETS) expect(activationCode(hdActivationAt(planet, transit.birthJd))).toBe(activationCode(full[planet]))
  })

  it('finds a future line and gate change for every body, including the outer planets', () => {
    const connection = humanDesignTransitConnection({ gates: [], channels: [] }, transit)
    const planets    = level => connection[level].map(change => change.planet).sort()

    expect(planets('nextLineChanges')).toEqual([...HD_PLANETS].sort())
    expect(planets('nextGateChanges')).toEqual([...HD_PLANETS].sort())
    for (const change of [...connection.nextLineChanges, ...connection.nextGateChanges]) {
      expect(change.dateMs).toBeGreaterThan(dateMs)
      expect(activationCode(change.from)).not.toBe(activationCode(change.to))
    }
  })

  it('lands each change on the first cell boundary after the start', () => {
    const connection = humanDesignTransitConnection({ gates: [], channels: [] }, transit)

    for (const change of connection.nextLineChanges) {
      const before = hdActivationAt(change.planet, change.jdUt - 1e-6)
      expect([before.gate, before.line]).toEqual([change.from.gate, change.from.line])
      expect([change.to.gate, change.to.line]).not.toEqual([change.from.gate, change.from.line])
    }
    expect(connection.nextColorToneBaseChanges.length).toBeGreaterThan(0)
  })
})
