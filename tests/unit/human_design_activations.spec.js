import { describe, expect, it } from 'vitest'
import { activationCode, activationFromLongitude } from '../../src/lib/human-design/activations.js'

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
})
