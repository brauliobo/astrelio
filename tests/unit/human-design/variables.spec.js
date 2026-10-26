import { describe, expect, it } from 'vitest'
import { buildHumanDesignChart } from '../../../src/lib/human-design/bodygraph.js'
import {
  ARROW_COLORS, orientationForTone, pairedColor, parseVariableShorthand, TONE_NAMES,
  variablesForChart, variableShorthand, VARIABLE_COMBINATIONS,
} from '../../../src/lib/human-design/variables.js'

const referencePerson = {
  id: 'ref-person', name: 'Bráulio Oliveira', isoLocal: '1986-02-12T18:10', ianaZone: 'America/Sao_Paulo',
  tzOffsetMinutes: -120, lat: -23.18, lon: -45.88, placeLabel: 'São José dos Campos, SP - Brasil',
}

const activation = (color, tone, base = 1) => ({ gate: 1, line: 1, color, tone, base })

describe('variable naming tables', () => {
  it('has six colors per arrow with a left and right sub-variant', () => {
    for (const colors of Object.values(ARROW_COLORS)) {
      expect(colors).toHaveLength(6)
      colors.forEach(color => expect(color.left.key).not.toBe(color.right.key))
    }
    expect(ARROW_COLORS.digestion.map(color => color.name)).toEqual(['Appetite', 'Taste', 'Thirst', 'Touch', 'Sound', 'Light'])
    expect(ARROW_COLORS.digestion[2]).toMatchObject({ left: { name: 'Hot' }, right: { name: 'Cold' } })
    expect(ARROW_COLORS.motivation[1]).toMatchObject({ left: { key: 'theist' }, right: { key: 'anti_theist' } })
  })

  it('names the six senses on the design side and the awareness tones on the personality side', () => {
    expect(TONE_NAMES.design.map(tone => tone.key)).toEqual(['smell', 'taste', 'outer_vision', 'inner_vision', 'feeling', 'touch'])
    expect(TONE_NAMES.personality.map(tone => tone.key)).toEqual(
      ['security', 'uncertainty', 'action', 'meditation', 'judgment', 'acceptance'],
    )
  })

  it('points tones 1-3 left and 4-6 right', () => {
    expect([1, 2, 3, 4, 5, 6].map(orientationForTone)).toEqual(['left', 'left', 'left', 'right', 'right', 'right'])
  })

  it('pairs colors 1-4, 2-5 and 3-6', () => {
    expect([1, 2, 3, 4, 5, 6].map(pairedColor)).toEqual([4, 5, 6, 1, 2, 3])
  })
})

describe('shorthand and combinations', () => {
  it('encodes P<motivation><perspective> D<digestion><environment>', () => {
    const orientations = { motivation: 'right', perspective: 'left', digestion: 'left', environment: 'right' }

    expect(variableShorthand(orientations)).toBe('PRL DLR')
    expect(parseVariableShorthand('PRL DLR')).toEqual(orientations)
  })

  it('lists the 16 combinations with unique keys and poles', () => {
    const combinations = Object.values(VARIABLE_COMBINATIONS)

    expect(combinations).toHaveLength(16)
    expect(Object.keys(VARIABLE_COMBINATIONS)).toContain('prl_dlr')
    expect(VARIABLE_COMBINATIONS.pll_dll).toMatchObject({ leftCount: 4, personality: 'active', design: 'active' })
    expect(VARIABLE_COMBINATIONS.prr_drr).toMatchObject({ leftCount: 0, personality: 'passive', design: 'passive' })
    expect(VARIABLE_COMBINATIONS.prl_dlr).toMatchObject({ leftCount: 2, personality: 'mixed', design: 'mixed' })
  })
})

describe('variablesForChart', () => {
  it('reads each arrow from its canon activation', () => {
    const chart = {
      design:      { Sun: activation(3, 1), NorthNode: activation(6, 4) },
      personality: { Sun: activation(2, 5), NorthNode: activation(5, 2) },
    }
    const { arrows, shorthand, cognition, transference, distraction } = variablesForChart(chart)

    expect(arrows.digestion).toMatchObject({ colorKey: 'thirst', variantKey: 'digestion.thirst.hot', orientation: 'left', toneKey: 'smell' })
    expect(arrows.environment).toMatchObject({ colorKey: 'shores', variantName: 'Artificial', orientation: 'right' })
    expect(arrows.motivation).toMatchObject({ colorKey: 'hope', variantName: 'Anti-Theist', toneKey: 'judgment' })
    expect(arrows.perspective).toMatchObject({ colorKey: 'probability', variantName: 'Focused' })
    expect(shorthand).toBe('PRL DLR')
    expect(cognition).toEqual({ tone: 1, key: 'smell', name: 'Smell' })
    expect(transference).toEqual({ color: 5, colorKey: 'guilt', colorName: 'Guilt' })
    expect(distraction.colorKey).toBe('possibility')
  })

  it('derives the reference chart variables from its activations', () => {
    const chart = buildHumanDesignChart(referencePerson)
    const vars  = variablesForChart(chart)

    expect(chart.design.Sun.color).toBe(3)
    expect(vars.arrows.digestion).toMatchObject({ color: 3, tone: 3, base: 5, colorKey: 'thirst', orientation: 'left' })
    expect(vars.arrows.motivation).toMatchObject({ color: 2, tone: 5, colorKey: 'hope', orientation: 'right' })
    expect(vars.arrows.environment).toMatchObject({ gate: 24, line: 2, orientation: 'left' })
    expect(vars.arrows.perspective).toMatchObject({ gate: 27, line: 1 })
    expect(vars.cognition.key).toBe('outer_vision')
    expect(vars.combination.shorthand).toBe(vars.shorthand)
  })

  it('shares color, tone and base between Sun and Earth', () => {
    const chart = buildHumanDesignChart(referencePerson)

    for (const layer of [chart.design, chart.personality]) {
      expect([layer.Earth.line, layer.Earth.color, layer.Earth.tone, layer.Earth.base]).toEqual(
        [layer.Sun.line, layer.Sun.color, layer.Sun.tone, layer.Sun.base],
      )
    }
  })
})
