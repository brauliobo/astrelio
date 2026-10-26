import { describe, expect, it } from 'vitest'
import { norm180 } from '../../../src/lib/astro/zodiac.js'
import { localToJdUt, msToJd } from '../../../src/lib/astro/timezones.js'
import { activationFromLongitude } from '../../../src/lib/human-design/activations.js'
import { lifeCycles, lunarCycleGate, moonGateMap, nextMoonGateEntry } from '../../../src/lib/human-design/cycles.js'
import { bodyState, longitudeAt } from '../../../src/lib/human-design/sky.js'

const birthJd = localToJdUt('1986-02-12T18:10', -120)
const cycles  = lifeCycles(birthJd)
const find    = (id, n = 1) => cycles.find(cycle => cycle.id === id && cycle.n === n)

describe('life cycles', () => {
  it('orders the cycles by their first exact date', () => {
    const firsts = cycles.map(cycle => cycle.passes[0].jd)

    expect(cycles.map(cycle => `${cycle.id}:${cycle.n}`)).toEqual([
      'saturn_return:1', 'uranus_opposition:1', 'chiron_return:1', 'saturn_return:2', 'uranus_return:1',
    ])
    expect(firsts).toEqual([...firsts].sort((a, b) => a - b))
  })

  it('lands every pass exactly on the natal degree (or its opposite)', () => {
    for (const cycle of cycles) {
      for (const pass of cycle.passes) {
        const natal = longitudeAt(cycle.body, birthJd) + cycle.angle
        expect(Math.abs(norm180(longitudeAt(cycle.body, pass.jd) - natal))).toBeLessThan(1e-6)
      }
    }
  })

  it('places the returns at the expected ages', () => {
    const age = id => find(id).passes[0].ageYears

    expect(age('saturn_return')).toBeGreaterThan(28)
    expect(age('saturn_return')).toBeLessThan(31)
    expect(age('uranus_opposition')).toBeGreaterThan(38)
    expect(age('uranus_opposition')).toBeLessThan(45)
    expect(age('chiron_return')).toBeGreaterThan(48)
    expect(age('chiron_return')).toBeLessThan(53)
    expect(find('saturn_return', 2).passes[0].ageYears).toBeGreaterThan(57)
    expect(age('uranus_return')).toBeGreaterThan(82)
    expect(age('uranus_return')).toBeLessThan(86)
  })

  it('finds the 2015 Saturn return of the reference chart', () => {
    const years = find('saturn_return').passes.map(pass => new Date(pass.ms).getUTCFullYear())

    expect(years.every(year => year === 2015 || year === 2016)).toBe(true)
  })

  it('exposes jd and ms consistently', () => {
    const [pass] = find('chiron_return').passes

    expect(msToJd(pass.ms)).toBeCloseTo(pass.jd, 8)
  })
})

describe('lunar cycle gate', () => {
  const dateMs = Date.UTC(2024, 0, 15, 12, 0)

  it('reports the Moon activation at a moment', () => {
    const moon = lunarCycleGate(dateMs)
    const expected = activationFromLongitude(longitudeAt('Moon', msToJd(dateMs)))

    expect([moon.gate, moon.line, moon.color, moon.tone, moon.base]).toEqual(
      [expected.gate, expected.line, expected.color, expected.tone, expected.base],
    )
  })

  it('finds the next gate change at the exact boundary', () => {
    const { nextGateChange, gate } = lunarCycleGate(dateMs)
    const before = activationFromLongitude(longitudeAt('Moon', msToJd(nextGateChange.ms - 1000)))
    const after  = activationFromLongitude(longitudeAt('Moon', msToJd(nextGateChange.ms + 1000)))

    expect(before.gate).toBe(gate)
    expect(after.gate).toBe(nextGateChange.gate)
    expect(after.gate).not.toBe(gate)
    expect(nextGateChange.ms - dateMs).toBeLessThan(14 * 3_600_000)
  })

  it('finds the next line change within a couple of hours', () => {
    const { nextLineChange } = lunarCycleGate(dateMs)

    expect(nextLineChange.ms - dateMs).toBeLessThan(3 * 3_600_000)
  })

  it('maps 28 days of gates in order, about ten hours each', () => {
    const map = moonGateMap(dateMs)
    const hours = map.slice(1, -1).map(segment => segment.hours)

    expect(map.length).toBeGreaterThanOrEqual(64)
    expect(map.length).toBeLessThanOrEqual(68)
    expect(Math.min(...hours)).toBeGreaterThan(8)
    expect(Math.max(...hours)).toBeLessThan(13)
    map.slice(1).forEach((segment, index) => expect(segment.enterMs).toBe(map[index].exitMs))
    expect(new Set(map.slice(0, 64).map(segment => segment.gate)).size).toBe(64)
  })

  it('finds when the Moon next enters a given gate', () => {
    const entry = nextMoonGateEntry(41, dateMs)
    const probe = activationFromLongitude(bodyState('Moon', msToJd(entry.ms + 60_000)).longitude)

    expect(entry.ms).toBeGreaterThan(dateMs)
    expect(entry.ms - dateMs).toBeLessThan(28 * 86_400_000)
    expect(probe.gate).toBe(41)
    expect(probe.line).toBe(1)
  })
})
