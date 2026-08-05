import { describe, expect, it } from 'vitest'
import {
  ELEMENT_KEYS,
  ELEMENT_SIGN_INDICES,
  RELATED_ELEMENTS,
  SAME_ELEMENT_SIGN_INDICES,
  SIGN_ELEMENTS,
  elementForSign,
  relatedElementsFor,
  signIndicesForElement,
} from '../../src/lib/astro/elements.js'

describe('canonical tropical elements', () => {
  it('maps all twelve normalized tropical sign indices to their elements', () => {
    expect(ELEMENT_KEYS).toEqual(['fire', 'earth', 'air', 'water'])
    expect(SIGN_ELEMENTS).toEqual([
      'fire', 'earth', 'air', 'water',
      'fire', 'earth', 'air', 'water',
      'fire', 'earth', 'air', 'water',
    ])
    expect(Array.from({ length: 12 }, (_, index) => elementForSign(index)))
      .toEqual([...SIGN_ELEMENTS])
    expect(elementForSign(-1)).toBe('water')
    expect(elementForSign(12)).toBe('fire')
    expect(elementForSign(25.8)).toBe('earth')
  })

  it('exposes element groups and sign-indexed same-element groups', () => {
    expect(ELEMENT_SIGN_INDICES).toEqual({
      fire:  [0, 4, 8],
      earth: [1, 5, 9],
      air:   [2, 6, 10],
      water: [3, 7, 11],
    })
    expect(SAME_ELEMENT_SIGN_INDICES).toEqual([
      [0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11],
      [0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11],
      [0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11],
    ])
    for (const element of ELEMENT_KEYS)
      expect(signIndicesForElement(element)).toEqual(ELEMENT_SIGN_INDICES[element])
  })

  it('exposes symmetric related-element pairs', () => {
    expect(RELATED_ELEMENTS).toEqual({
      fire:  ['air'],
      earth: ['water'],
      air:   ['fire'],
      water: ['earth'],
    })
    expect(relatedElementsFor('Fire')).toEqual(['air'])
    expect(relatedElementsFor('earth')).toEqual(['water'])
    expect(relatedElementsFor('unknown')).toEqual([])
  })
})
