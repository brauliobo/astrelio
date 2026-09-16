import { describe, expect, it, vi } from 'vitest'
import { Raycaster, Vector2, Vector3 } from 'three'
import { createOrreryScene } from '../../../src/components/planetarium/scenes/orrery.js'
import { createMoonLabScene } from '../../../src/components/planetarium/scenes/moonLab.js'

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

const orreryState = {
  scaleMode:        'compressed',
  sizeExaggeration: 4000,
  timeMs:           Date.parse('2024-04-08T18:17:00Z'),
  showOrbits:       true,
  showLabels:       false,
  showStarMap:      false,
  showMoons:        true,
  focusBody:        'Jupiter',
}

describe('orbit hover targets', () => {
  it('exposes planet and moon orbits for picking and skips them when orbits are hidden', () => {
    const orrery = createOrreryScene()
    orrery.update(orreryState)

    const earth = orrery.hoverables().find(line => line.userData.bodyName === 'Earth')
    const io    = orrery.hoverables().find(line => line.userData.bodyName === 'Io')
    expect(earth.userData.kind).toBe('orbit')
    expect(earth.userData.periodDays).toBeCloseTo(365.256, 3)
    expect(io.visible).toBe(true)
    expect(io.userData.periodDays).toBeCloseTo(1.769, 3)

    orrery.update({ ...orreryState, showOrbits: false })
    expect(orrery.hoverables().some(line => line.userData.bodyName === 'Earth')).toBe(false)
    orrery.dispose()
  })

  it('raycasts Earth\'s orbit from a close camera', () => {
    const orrery = createOrreryScene()
    orrery.update({ ...orreryState, showMoons: false, focusBody: '' })
    const earth = orrery.hoverables().find(line => line.userData.bodyName === 'Earth')
    const attr  = earth.geometry.attributes.position
    const index = 12
    const point = new Vector3(attr.getX(index), attr.getY(index), attr.getZ(index))

    orrery.camera.position.copy(point).add(new Vector3(0, 0.35, 0.02))
    orrery.camera.lookAt(point)
    orrery.camera.updateMatrixWorld()
    earth.updateMatrixWorld()

    const raycaster = new Raycaster()
    raycaster.params.Line.threshold = 0.08
    raycaster.setFromCamera(new Vector2(0, 0), orrery.camera)
    const hit = raycaster.intersectObjects(orrery.hoverables(), false)[0]
    expect(hit?.object.userData.bodyName).toBe('Earth')
    orrery.dispose()
  })

  it('tags the lunar orbit and ecliptic in the moon lab', () => {
    const lab = createMoonLabScene()
    lab.update({
      view:        'moon',
      scaleMode:   'compressed',
      timeMs:      Date.parse('2024-04-08T18:17:00Z'),
      showOrbits:  true,
      showLabels:  false,
      showStarMap: false,
      showShadows: false,
    })
    const kinds = lab.hoverables().map(line => line.userData.kind)
    expect(kinds).toContain('orbit')
    expect(kinds).toContain('ecliptic')
    expect(lab.hoverables().find(line => line.userData.kind === 'orbit').userData.bodyName).toBe('Moon')
    lab.dispose()
  })
})
