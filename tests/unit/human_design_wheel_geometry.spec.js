import { describe, expect, it } from 'vitest'
import {
  gateSegmentLayout,
  ichingLinesForGate,
  mandalaAngleForActivation,
  mandalaAngleForGate,
  mandalaAngleForLongitude,
  mandalaIndexForGate,
  planetGlyphLayout,
  planetGlyphRadii,
  referenceBrauliWheelPositions,
  wheelRingRadii,
  zodiacSegmentLayout,
} from '../../src/components/human-design/humanDesignWheelGeometry.js'
import { activationFromLongitude } from '../../src/lib/human-design/activations.js'
import { SKY_PLANETS, skyLongitudeForHumanDesignLongitude, skyLongitudeForPosition, skyRadiusForBounds } from '../../src/lib/sky/scene.js'

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
    expect(referenceBrauliWheelPositions.placements).toHaveLength(26)
    expect(referenceBrauliWheelPositions.placements).toContainEqual({ layer: 'personality', planet: 'Neptune', gate: 58, sign: '♑' })
    expect(referenceBrauliWheelPositions.placements).toContainEqual({ layer: 'design', planet: 'Mars', gate: 48, sign: '♎' })
    expect(mandalaAngleForActivation({ gate: 10, line: 3 })).toBeGreaterThan(-10)
    expect(mandalaAngleForActivation({ gate: 10, line: 3 })).toBeLessThan(10)
    expect(angularDistance(mandalaAngleForActivation({ gate: 49, line: 6 }), 308.90625)).toBeLessThan(0.001)
    expect(mandalaIndexForGate(49)).toBe(37)
  })

  it('maps Human Design sky background planets with the mandala orientation, not astrology wheel shift', () => {
    const aquariusSunLongitude = 323.5
    const skyLongitude = skyLongitudeForHumanDesignLongitude(aquariusSunLongitude)
    const screenAngle = (180 - skyLongitude + 360) % 360
    const rawLongitudeScreenAngle = (mandalaAngleForLongitude(aquariusSunLongitude) - 90 + 360) % 360
    const activationScreenAngle = (mandalaAngleForActivation(activationFromLongitude(aquariusSunLongitude)) - 90 + 360) % 360

    expect(angularDistance(screenAngle, activationScreenAngle)).toBeLessThan(0.001)
    expect(angularDistance(screenAngle, rawLongitudeScreenAngle)).toBeGreaterThan(1)
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

  it('uses photo texture specs for every sky planet while retaining halo colors', () => {
    expect(SKY_PLANETS).toHaveLength(10)
    expect(SKY_PLANETS.every(planet => planet.photo && planet.image?.startsWith('/planets/') && planet.texture?.length === 3 && planet.color)).toBe(true)
  })

  it('keeps gate dividers and reference rays on sector boundaries', () => {
    const [segment] = gateSegmentLayout({
      inner: wheelRingRadii.gateInner,
      outer: wheelRingRadii.gateOuter,
      labelRadius: 406,
    })

    expect(segment.dividerAngle).toBe(segment.startAngle)
    expect(segment.rayAngle).toBe(segment.startAngle)
    expect(segment.divider.a.radius).toBe(wheelRingRadii.zodiacInner)
    expect(segment.divider.b.radius).toBe(wheelRingRadii.outerBorder)
    expect(segment.ray.a.radius).toBeLessThan(segment.ray.b.radius)
    expect(segment.ray.b.radius).toBe(wheelRingRadii.zodiacInner)
  })

  it('draws I Ching hexagram lines from King Wen trigrams', () => {
    expect(ichingLinesForGate(1)).toEqual([false, false, false, false, false, false])
    expect(ichingLinesForGate(2)).toEqual([true, true, true, true, true, true])
    expect(ichingLinesForGate(44)).toEqual([false, false, false, false, false, true])
    expect(ichingLinesForGate(28)).toEqual([true, false, false, false, false, true])
  })

  it('stacks planet glyphs in predictable lanes close to the sign circle', () => {
    const layout = planetGlyphLayout([
      { layer: 'personality', planet: 'Mars', gate: 9, line: 1 },
      { layer: 'design', planet: 'Mercury', gate: 5, line: 4 },
      { layer: 'design', planet: 'Uranus', gate: 5, line: 6 },
      { layer: 'personality', planet: 'Saturn', gate: 9, line: 4 },
      { layer: 'design', planet: 'Sun', gate: 14, line: 2 },
    ])

    expect(layout.map(item => item.planet)).toEqual(['Mars', 'Mercury', 'Uranus', 'Saturn', 'Sun'])
    expect(layout.every(item => planetGlyphRadii.includes(item.radius))).toBe(true)
    expect(layout.every(item => item.radius < wheelRingRadii.zodiacInner)).toBe(true)
    expect(Math.max(...layout.map(item => item.radius))).toBe(planetGlyphRadii[0])
    expect(layout.filter(item => item.gate === 5).map(item => item.lane).sort()).toEqual([0, 1])
    expect(layout.filter(item => item.gate === 9).map(item => item.lane).sort()).toEqual([0, 1])
    expect(layout.find(item => item.gate === 14).lane).toBe(0)
  })

  it('keeps all planet glyphs for one gate on the sector midpoint angle', () => {
    const layout = planetGlyphLayout([
      { layer: 'personality', planet: 'Sun', gate: 44, line: 1 },
      { layer: 'design', planet: 'Venus', gate: 44, line: 6 },
      { layer: 'personality', planet: 'Moon', gate: 44, line: 3 },
    ])

    expect(layout.map(item => item.angle)).toEqual([
      mandalaAngleForGate(44),
      mandalaAngleForGate(44),
      mandalaAngleForGate(44),
    ])
    expect(new Set(layout.map(item => item.lane)).size).toBe(3)
    expect(new Set(layout.map(item => item.point.x)).size).toBe(3)
  })

  it('does not stack planets across neighboring gate sectors', () => {
    const layout = planetGlyphLayout([
      { layer: 'design', planet: 'SouthNode', gate: 44, line: 6 },
      { layer: 'personality', planet: 'SouthNode', gate: 28, line: 2 },
    ])

    expect(layout.map(item => item.lane)).toEqual([0, 0])
    expect(layout.map(item => item.radius)).toEqual([planetGlyphRadii[0], planetGlyphRadii[0]])
    expect(layout[0].angle).not.toBe(layout[1].angle)
  })
})
