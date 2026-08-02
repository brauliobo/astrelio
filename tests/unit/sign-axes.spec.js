import { describe, expect, it } from 'vitest'
import {
  analyzeSignAxes,
  oppositeSignIndex,
  signAxisFor,
} from '../../src/lib/astro/sign-axes.js'

describe('Tropical opposite-sign axes', () => {
  it('maps every sign to its normalized opposite', () => {
    expect(Array.from({ length: 12 }, (_, index) => oppositeSignIndex(index)))
      .toEqual([6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5])
    expect(oppositeSignIndex(-1)).toBe(5)
    expect(oppositeSignIndex(12)).toBe(6)
  })

  it('returns all six canonical metadata pairs from either side', () => {
    const expected = [
      ['aries_libra', 0, 6, 'cardinal', 'yang', ['fire', 'air']],
      ['taurus_scorpio', 1, 7, 'fixed', 'yin', ['earth', 'water']],
      ['gemini_sagittarius', 2, 8, 'mutable', 'yang', ['air', 'fire']],
      ['cancer_capricorn', 3, 9, 'cardinal', 'yin', ['water', 'earth']],
      ['leo_aquarius', 4, 10, 'fixed', 'yang', ['fire', 'air']],
      ['virgo_pisces', 5, 11, 'mutable', 'yin', ['earth', 'water']],
    ]

    expected.forEach(([id, primary, opposite, modality, polarity, elements]) => {
      const axis = signAxisFor(primary)
      expect(axis).toEqual({
        id,
        primarySignIndex:  primary,
        oppositeSignIndex: opposite,
        signIndices:       [primary, opposite],
        modality,
        polarity,
        elements,
      })
      expect(signAxisFor(opposite)).toBe(axis)
    })
  })

  it('computes deterministic weighted sides, totals, and balance', () => {
    const rows = analyzeSignAxes({
      positions: [
        { name: 'Mercury', longitude: 12 },
        { name: 'Moon', longitude: 188 },
        { name: 'Sun', longitude: 4 },
        { name: 'Chiron', longitude: 195 },
        { name: 'Ignored', longitude: Number.NaN },
      ],
    })

    expect(rows[0]).toMatchObject({
      id:          'aries_libra',
      totalWeight: 14,
      balance:     6 / 7,
      bothRepresented: true,
      sides: [
        { signIndex: 0, weight: 8, bodies: ['Sun', 'Mercury'] },
        { signIndex: 6, weight: 6, bodies: ['Moon', 'Chiron'] },
      ],
    })
    expect(rows).toHaveLength(6)
  })

  it('represents one-sided and empty axes without inventing balance', () => {
    const rows = analyzeSignAxes({ positions: [{ name: 'Venus', longitude: 35 }] })
    const oneSided = rows.find(row => row.id === 'taurus_scorpio')
    const empty    = rows.find(row => row.id === 'aries_libra')

    expect(oneSided).toMatchObject({
      totalWeight: 3,
      balance:     0,
      bothRepresented: false,
      sides: [
        { signIndex: 1, weight: 3, bodies: ['Venus'] },
        { signIndex: 7, weight: 0, bodies: [] },
      ],
    })
    expect(empty).toMatchObject({
      totalWeight: 0,
      balance:     0,
      bothRepresented: false,
    })
    expect(rows.slice(1).map(row => row.id)).toEqual([
      'aries_libra',
      'gemini_sagittarius',
      'cancer_capricorn',
      'leo_aquarius',
      'virgo_pisces',
    ])
  })
})
