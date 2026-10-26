import { describe, expect, it } from 'vitest'
import { localToJdUt } from '../../../src/lib/astro/timezones.js'
import { activationCode, activationFromLongitude, activationsForChart, personalityDesignCharts } from '../../../src/lib/human-design/activations.js'
import { buildHumanDesignChart } from '../../../src/lib/human-design/bodygraph.js'
import { activationMargins, minutesToBoundary, sensitivity } from '../../../src/lib/human-design/sensitivity.js'
import { PROFILES, profileFor } from '../../../src/lib/human-design/profiles.js'
import { bisect, LEVELS } from '../../../src/lib/human-design/sky.js'

const referencePerson = {
  id: 'ref-person', name: 'Bráulio Oliveira', isoLocal: '1986-02-12T18:10', ianaZone: 'America/Sao_Paulo',
  tzOffsetMinutes: -120, lat: -23.18, lon: -45.88, placeLabel: 'São José dos Campos, SP - Brasil',
}

const chart   = buildHumanDesignChart(referencePerson)
const rows    = activationMargins(chart)
const birthJd = localToJdUt(referencePerson.isoLocal, referencePerson.tzOffsetMinutes)

const cellAt = (layer, planet, level, minutes) => {
  const { personalityChart, designChart } = personalityDesignCharts(birthJd + minutes / 1440, referencePerson.lat, referencePerson.lon)
  const activation = activationsForChart(layer === 'design' ? designChart : personalityChart)[planet]
  return activationCode(activation).split('.').slice(0, LEVELS.indexOf(level) + 1).join('.')
}

describe('minutesToBoundary', () => {
  const gate41 = longitude => ({ longitude })

  it('measures a prograde cell from both ends', () => {
    const { gate, line } = minutesToBoundary(gate41(302 + 1), 1.44)

    expect(gate.before).toBeCloseTo(1000)
    expect(gate.after).toBeCloseTo(4625)
    expect(line.after).toBeCloseTo(((360 / 384) - (1 % (360 / 384))) / 1.44 * 1440)
  })

  it('swaps before and after for retrograde motion', () => {
    const { gate } = minutesToBoundary(gate41(302 + 1), -1.44)

    expect(gate.after).toBeCloseTo(1000)
    expect(gate.before).toBeCloseTo(4625)
  })
})

describe('activationMargins', () => {
  it('covers the 26 activations of the reference chart', () => {
    expect(rows).toHaveLength(26)
    expect(rows.every(row => LEVELS.every(level => row.margins[level] >= 0))).toBe(true)
  })

  it('has nested margins: a gate boundary is also a line, color, tone and base boundary', () => {
    for (const row of rows) {
      LEVELS.slice(1).forEach((level, index) => expect(row.margins[level]).toBeLessThanOrEqual(row.margins[LEVELS[index]] + 1e-6))
    }
  })

  it('sees a base flip within minutes for the personality Sun and design Sun', () => {
    const sun = layer => rows.find(row => row.layer === layer && row.planet === 'Sun')

    expect(sun('personality').margins.base).toBeLessThan(10)
    expect(sun('design').margins.base).toBeLessThan(10)
  })

  it('predicts real cell changes when the birth time is moved past the margin', () => {
    let checked = 0

    // the first-order estimate degrades for near-stationary bodies, where the speed changes within the margin
    for (const row of rows.filter(r => Math.abs(r.speed) > 0.25)) {
      for (const level of LEVELS) {
        const { before, after } = row.boundaries[level]
        const now = cellAt(row.layer, row.planet, level, 0)
        if (after < 120) {
          expect(cellAt(row.layer, row.planet, level, after * 1.02 + 0.05)).not.toBe(now)
          expect(cellAt(row.layer, row.planet, level, after * 0.98 - 0.05)).toBe(now)
          checked += 1
        }
        if (before < 120) {
          expect(cellAt(row.layer, row.planet, level, -(before * 1.02 + 0.05))).not.toBe(now)
          expect([row.layer, row.planet, level, before, cellAt(row.layer, row.planet, level, -(before * 0.98 - 0.05))]).toEqual([row.layer, row.planet, level, before, now])
          checked += 1
        }
      }
    }

    expect(checked).toBeGreaterThan(20)
  })
})

describe('sensitivity', () => {
  const report = sensitivity(chart)

  it('reports the default 10 and 60 minute windows', () => {
    expect(Object.keys(report.windows)).toEqual(['10', '60'])
    expect(report.windows[10].minutes).toBe(10)
  })

  it('widens monotonically with the window', () => {
    for (const level of LEVELS) {
      expect(report.windows[60].changes[level].length).toBeGreaterThanOrEqual(report.windows[10].changes[level].length)
    }
  })

  it('flags the Moon first: it crosses lines within an hour but the Sun does not cross a gate', () => {
    expect(report.windows[60].changes.line).toContain('personality.Moon')
    expect(report.windows[60].changes.gate).not.toContain('personality.Sun')
    expect(report.windows[60].profile).toBe(false)
    expect(report.windows[60].cross).toBe(false)
  })

  it('flags the variables whose tone or base can flip', () => {
    expect(report.windows[10].variables.motivation.base).toBe(true)
    expect(report.windows[10].variables.digestion.base).toBe(true)
  })

  const profileAt = longitude =>
    profileFor(activationFromLongitude(longitude).line, activationFromLongitude(longitude - 88).line)?.key

  const transitionWhere = (changesAngle) => {
    for (let longitude = 0; longitude < 360; longitude += 0.005) {
      const [before, after] = [profileAt(longitude), profileAt(longitude + 0.005)]
      const angle           = key => PROFILES[key]?.angle
      if (before && after && before !== after && (angle(before) !== angle(after)) === changesAngle) {
        return bisect(x => (profileAt(x) === before ? -1 : 1), longitude, longitude + 0.005)
      }
    }
  }

  const nearTransition = (boundary) => {
    const longitude = boundary - 0.0004
    const swapped   = { ...chart, personality: { ...chart.personality, Sun: activationFromLongitude(longitude) },
                                  design:      { ...chart.design, Sun: activationFromLongitude(longitude - 88) } }
    return sensitivity(swapped, { windows: [10] }).windows[10]
  }

  it('flags the profile, but not the cross, when only the profile changes inside the same angle', () => {
    const report = nearTransition(transitionWhere(false))

    expect(report.profile).toBe(true)
    expect(report.cross).toBe(false)
  })

  it('flags the cross when a profile change crosses angles', () => {
    const report = nearTransition(transitionWhere(true))

    expect(report.profile).toBe(true)
    expect(report.cross).toBe(true)
  })
})
