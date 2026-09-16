import { describe, expect, it, vi } from 'vitest'
import { Raycaster, Vector2 } from 'three'
import { createOrreryScene } from '../../../src/components/planetarium/scenes/orrery.js'
import { AU_KM, SUN_RADIUS_KM } from '../../../src/lib/planetarium/constants.js'
import { helioEcliptic, sunwardOf } from '../../../src/lib/planetarium/ephemeris3d.js'
import { MOON_BY_NAME, moonPosition } from '../../../src/lib/planetarium/moons.js'
import { bodyNameOf } from '../../../src/lib/planetarium/sceneGraph.js'

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


const state = {
  scaleMode:        'compressed',
  sizeExaggeration: 4000,
  timeMs:           Date.parse('2024-04-08T18:17:00Z'),
  showOrbits:       false,
  showLabels:       true,
  showStarMap:      false,
  showMoons:        false,
  focusBody:        '',
}

describe('orrery sun', () => {
  it('draws the sun in real proportion to the planets and still raycasts from the system view', () => {
    const orrery = createOrreryScene()
    orrery.camera.position.set(0, 108, 129)
    orrery.camera.lookAt(0, 0, 0)
    orrery.camera.updateMatrixWorld()
    orrery.update(state)

    const sun = orrery.bodies.get('Sun')
    expect(sun.scale.x).toBeCloseTo((SUN_RADIUS_KM / AU_KM) * 4000, 6)
    expect(sun.userData.pickHalo.userData.bodyName).toBe('Sun')

    const raycaster = new Raycaster()
    raycaster.setFromCamera(new Vector2(0, 0), orrery.camera)
    const hit = raycaster.intersectObjects(orrery.pickables, true)[0]
    expect(bodyNameOf(hit?.object)).toBe('Sun')

    orrery.update({ ...state, scaleMode: 'true' })
    expect(sun.scale.x).toBeCloseTo(SUN_RADIUS_KM / AU_KM, 8)
    expect(sun.userData.pickHalo.scale.x).toBeGreaterThan(1)
    raycaster.setFromCamera(new Vector2(0, 0), orrery.camera)
    expect(bodyNameOf(raycaster.intersectObjects(orrery.pickables, true)[0]?.object)).toBe('Sun')
    orrery.dispose()
  })

  it('lights planets, rings, and moons from the true sunward vector', () => {
    const orrery = createOrreryScene()
    orrery.update({ ...state, showMoons: true, focusBody: 'Jupiter' })
    const when = new Date(state.timeMs)

    const earthToward = sunwardOf(helioEcliptic('Earth', when))
    const earthDir    = orrery.bodies.get('Earth').material.uniforms.sunDirection.value
    expect(earthDir.x).toBeCloseTo(earthToward.x, 5)
    expect(earthDir.y).toBeCloseTo(earthToward.y, 5)
    expect(earthDir.z).toBeCloseTo(earthToward.z, 5)
    expect(orrery.bodies.get('Earth').userData.clouds.material.uniforms.sunDirection.value.x).toBeCloseTo(earthToward.x, 5)

    const saturnToward = sunwardOf(helioEcliptic('Saturn', when))
    expect(orrery.bodies.get('Saturn').userData.rings.material.uniforms.sunDirection.value.x).toBeCloseTo(saturnToward.x, 5)

    const europa = orrery.bodies.get('Europa')
    expect(europa.visible).toBe(true)
    const parent = helioEcliptic('Jupiter', when)
    const offset = moonPosition(MOON_BY_NAME.get('Europa'), when)
    const moonToward = sunwardOf({
      x: parent.x + offset.x,
      y: parent.y + offset.y,
      z: parent.z + offset.z,
    })
    const moonDir = europa.material.uniforms.sunDirection.value
    expect(moonDir.x).toBeCloseTo(moonToward.x, 5)
    expect(moonDir.y).toBeCloseTo(moonToward.y, 5)
    expect(moonDir.z).toBeCloseTo(moonToward.z, 5)
    orrery.dispose()
  })
})
