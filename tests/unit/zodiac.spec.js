import { describe, it, expect } from 'vitest'
import { norm360, norm180, signIndex, degInSign } from '../../src/lib/astro/zodiac.js'

describe('zodiac', () => {
  it('norm360 wraps correctly', () => {
    expect(norm360(0)).toBe(0)
    expect(norm360(360)).toBe(0)
    expect(norm360(-30)).toBe(330)
    expect(norm360(720 + 45)).toBe(45)
  })

  it('norm180 returns signed delta', () => {
    expect(norm180(0)).toBe(0)
    expect(norm180(190)).toBe(-170)
    expect(norm180(-190)).toBe(170)
    expect(norm180(180)).toBe(180)
  })

  it('signIndex maps to 12 signs', () => {
    expect(signIndex(0)).toBe(0)
    expect(signIndex(29.99)).toBe(0)
    expect(signIndex(30)).toBe(1)
    expect(signIndex(359.9)).toBe(11)
  })

  it('degInSign returns 0..30', () => {
    expect(degInSign(35.5)).toBeCloseTo(5.5, 6)
    expect(degInSign(0)).toBe(0)
  })
})
