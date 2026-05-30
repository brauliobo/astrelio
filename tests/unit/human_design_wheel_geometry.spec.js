import { describe, expect, it } from 'vitest'
import { mandalaAngleForActivation, mandalaAngleForLongitude, mandalaIndexForGate, referenceBrauliWheelPositions, zodiacSegmentLayout } from '../../src/components/human-design/humanDesignWheelGeometry.js'
import { skyLongitudeForHumanDesignLongitude, skyLongitudeForPosition, skyRadiusForBounds } from '../../src/lib/sky/scene.js'

const angularDistance = (a, b) => {
  const diff = Math.abs(a - b) % 360
  return Math.min(diff, 360 - diff)
}

describe('Human Design wheel geometry', () => {
  it('rotates the zodiac background to the Human Design mandala so Sun gate 49 sits in Aquarius', () => {
    const sunAngle = mandalaAngleForActivation({ gate: 49, line: 6 })
    const aquarius = zodiacSegmentLayout().find(segment => segment.sign === '♒')

    expect(aquarius).toBeTruthy()
    expect(angularDistance(sunAngle, aquarius.midAngle)).toBeLessThan(8)
  })

  it('matches the extracted reference orientation for 1986-02-12 18:10 São José dos Campos', () => {
    const [personalitySun, designSun] = referenceBrauliWheelPositions.placements

    expect(referenceBrauliWheelPositions.person.isoLocal).toBe('1986-02-12T18:10')
    expect(personalitySun).toMatchObject({ layer: 'personality', planet: 'Sun', gate: 49, sign: '♒' })
    expect(designSun).toMatchObject({ layer: 'design', planet: 'Sun', gate: 14, sign: '♐' })
    expect(mandalaAngleForActivation({ gate: 10, line: 3 })).toBeGreaterThan(-10)
    expect(mandalaAngleForActivation({ gate: 10, line: 3 })).toBeLessThan(10)
    expect(angularDistance(mandalaAngleForActivation({ gate: 49, line: 6 }), 308.90625)).toBeLessThan(0.001)
    expect(mandalaIndexForGate(49)).toBe(37)
  })

  it('maps Human Design sky background planets with the mandala orientation, not astrology wheel shift', () => {
    const aquariusSunLongitude = 323.5
    const skyLongitude = skyLongitudeForHumanDesignLongitude(aquariusSunLongitude)
    const screenAngle = (180 - skyLongitude + 360) % 360
    const mandalaScreenAngle = (mandalaAngleForLongitude(aquariusSunLongitude) - 90 + 360) % 360

    expect(angularDistance(screenAngle, mandalaScreenAngle)).toBeLessThan(0.001)
    expect(skyLongitudeForPosition({ longitude: aquariusSunLongitude, mode: 'humanDesign', wheelShift: 120 }))
      .toBe(skyLongitude)
    expect(skyLongitude).not.toBe((aquariusSunLongitude + 120) % 360)
  })

  it('caps the sky background to the viewport width while preserving center alignment', () => {
    const radius = skyRadiusForBounds({
      chartRadius: 450,
      maxRadius: 1200,
      viewportWidth: 1440,
    })

    expect(radius).toBeLessThanOrEqual(1440 * 0.48)
    expect(radius).toBeGreaterThan(600)
  })
})
