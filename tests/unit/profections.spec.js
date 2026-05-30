import { describe, it, expect } from 'vitest'
import { annualProfection, completedYearsOnDate, profectionHouseForAge } from '../../src/lib/astro/profections.js'

describe('annual profections', () => {
  it('counts completed civil years from the local birthday', () => {
    expect(completedYearsOnDate('1986-02-12T18:10', '2026-02-11')).toBe(39)
    expect(completedYearsOnDate('1986-02-12T18:10', '2026-02-12')).toBe(40)
  })

  it('rotates houses from the first house by age', () => {
    expect(profectionHouseForAge(0)).toBe(1)
    expect(profectionHouseForAge(11)).toBe(12)
    expect(profectionHouseForAge(12)).toBe(1)
    expect(profectionHouseForAge(40)).toBe(5)
  })

  it('derives profected sign and traditional time lord from the ascendant sign', () => {
    const profection = annualProfection(15, '1986-02-12T18:10', '2026-05-29')
    expect(profection).toMatchObject({
      age:            40,
      profectedHouse: 5,
      sign:           4,
      lord:           'Sun',
    })
  })
})
