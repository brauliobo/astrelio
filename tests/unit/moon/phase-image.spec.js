import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MoonPhaseImage from '../../../src/components/sky/MoonPhaseImage.vue'
import { moonPhaseLighting, moonPhaseLitPoints } from '../../../src/lib/sky/moonPhase.js'

const boundsForPhase = (phase) => {
  const xs = moonPhaseLitPoints(phase).map(point => point.x)
  return {
    min: Math.min(...xs),
    max: Math.max(...xs),
  }
}

describe('moon phase lighting', () => {
  it('computes expected illumination for cardinal phases', () => {
    expect(moonPhaseLighting(0).illumination).toBeCloseTo(0)
    expect(moonPhaseLighting(0.25).illumination).toBeCloseTo(0.5)
    expect(moonPhaseLighting(0.5).illumination).toBeCloseTo(1)
    expect(moonPhaseLighting(0.75).illumination).toBeCloseTo(0.5)
  })

  it('builds lit masks on the waxing and waning sides', () => {
    expect(boundsForPhase(0).min).toBeCloseTo(50)
    expect(boundsForPhase(0.25).min).toBeCloseTo(50)
    expect(boundsForPhase(0.25).max).toBeCloseTo(100)
    expect(boundsForPhase(0.5).min).toBeCloseTo(0)
    expect(boundsForPhase(0.5).max).toBeCloseTo(100)
    expect(boundsForPhase(0.75).min).toBeCloseTo(0)
    expect(boundsForPhase(0.75).max).toBeCloseTo(50)
  })

  it('renders the moon image with phase data and size controls', () => {
    const wrapper = mount(MoonPhaseImage, {
      props: {
        phase: 0.25,
        size:  44,
        light: 0.8,
        alt:   'First quarter moon',
      },
    })

    const root = wrapper.get('[data-testid="moon-phase-image"]')
    expect(root.attributes('aria-label')).toBe('First quarter moon')
    expect(root.attributes('data-phase')).toBe('0.250')
    expect(root.attributes('data-illumination')).toBe('0.500')
    expect(root.attributes('style')).toContain('--moon-size: 44px')
    expect(wrapper.get('clipPath path').attributes('d')).toContain('M ')
  })
})
