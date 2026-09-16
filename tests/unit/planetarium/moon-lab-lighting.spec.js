import { describe, expect, it, vi } from 'vitest'
import { createMoonLabScene } from '../../../src/components/planetarium/scenes/moonLab.js'
import { AU_KM, EARTH_RADIUS_KM } from '../../../src/lib/planetarium/constants.js'
import { geoEcliptic, lengthAu } from '../../../src/lib/planetarium/ephemeris3d.js'
import { shadowFactorAt } from '../../../src/lib/planetarium/shadows.js'

vi.mock('../../../src/lib/planetarium/labels.js', async () => {
  const { Sprite, SpriteMaterial } = await import('three')
  return {
    makeLabel: () => {
      const sprite = new Sprite(new SpriteMaterial())
      sprite.material.map = { image: { width: 64, height: 32 } }
      return sprite
    },
  }
})

const TOTAL_LUNAR = Date.parse('2025-03-14T06:58:42Z')

const state = {
  view:        'eclipses',
  scaleMode:   'true',
  timeMs:      TOTAL_LUNAR,
  showOrbits:  false,
  showLabels:  false,
  showStarMap: false,
  showShadows: true,
  shadowFocus: 'lunar',
}

describe('moon lab lighting', () => {
  it('drops Earth\'s umbra onto the Moon at a total lunar eclipse', () => {
    const lab = createMoonLabScene()
    lab.update(state)
    const moon = lab.bodies.get('Moon')
    const when = new Date(TOTAL_LUNAR)
    const sun  = geoEcliptic('Sun', when)
    const geo  = geoEcliptic('Moon', when)

    expect(moon.material.uniforms.hasOccult.value).toBe(1)
    expect(moon.material.uniforms.occultRadius.value).toBeCloseTo(lab.bodies.get('Earth').scale.x, 6)
    expect(shadowFactorAt({
      point:         { x: geo.x * AU_KM, y: geo.y * AU_KM, z: geo.z * AU_KM },
      occultRadius:  EARTH_RADIUS_KM,
      sunDirection:  sun,
      sunDistance:   lengthAu(sun) * AU_KM,
    })).toBe(1)

    lab.update({ ...state, view: 'moon', scaleMode: 'compressed' })
    expect(moon.material.uniforms.hasOccult.value).toBe(0)
    lab.dispose()
  })

  it('plants Earth\'s umbra on the Moon\'s near face while they intersect', () => {
    const lab = createMoonLabScene()
    lab.update(state)
    const moon = lab.bodies.get('Moon')
    const umbra = lab.hoverables().find(item => item.userData.kind === 'umbra' && item.userData.bodyName === 'Earth')
    expect(umbra).toBeTruthy()
    expect(umbra.scale.x).toBeCloseTo(4.51, 1)
    expect(umbra.position.length()).toBeLessThan(moon.position.length())
    expect(umbra.position.length()).toBeGreaterThan(moon.position.length() - moon.scale.x * 1.4)

    lab.update({ ...state, timeMs: Date.parse('2025-06-15T00:00:00Z'), shadowFocus: 'all' })
    expect(lab.bodies.get('Moon').material.uniforms.hasOccult.value).toBe(0)
    const faint = lab.hoverables().find(item => item.userData.kind === 'umbra' && item.userData.bodyName === 'Earth')
    expect(faint?.visible).toBe(true)
    expect(faint.material.opacity).toBeLessThan(0.15)
    lab.dispose()
  })

  it('plants the Moon\'s umbra on Earth\'s sunlit face at a total solar eclipse', () => {
    const lab = createMoonLabScene()
    lab.update({ ...state, timeMs: Date.parse('2024-04-08T18:17:19Z'), shadowFocus: 'solar' })
    const earth = lab.bodies.get('Earth')
    expect(earth.material.uniforms.hasOccult.value).toBe(1)
    expect(earth.material.uniforms.occultCopper.value).toBe(0)
    const umbra = lab.hoverables().find(item => item.userData.kind === 'umbra' && item.userData.bodyName === 'Moon')
    expect(umbra).toBeTruthy()
    expect(umbra.position.length()).toBeCloseTo(earth.scale.x, 0)
    lab.dispose()
  })
})
