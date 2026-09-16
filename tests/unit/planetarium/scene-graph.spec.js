import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { BODY_BY_NAME } from '../../../src/lib/planetarium/constants.js'
import { planetMesh } from '../../../src/lib/planetarium/materials.js'
import {
  bodyNameOf,
  circlePoints,
  equatorialSide,
  pathLine,
  placeAlong,
  setLinePoints,
  terminatorApproach,
  visibleOf,
} from '../../../src/lib/planetarium/sceneGraph.js'

describe('scene graph helpers', () => {
  it('builds a closed equatorial circle and tagged path lines', () => {
    const points = circlePoints(2, 4)
    expect(points).toHaveLength(5)
    expect(points[0].x).toBeCloseTo(2)
    expect(points[0].z).toBeCloseTo(0)
    expect(points.at(-1).x).toBeCloseTo(points[0].x)
    expect(points.at(-1).z).toBeCloseTo(points[0].z)

    const line = pathLine(points, { color: '#e2725b', opacity: 0.34, bodyName: 'Mars', periodDays: 687 })
    expect(line.userData).toMatchObject({ kind: 'orbit', bodyName: 'Mars', baseOpacity: 0.34, periodDays: 687 })
    expect(line.geometry.attributes.position.count).toBe(5)

    setLinePoints(line, [{ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }])
    expect(line.geometry.attributes.position.count).toBe(2)
  })

  it('walks userData for a pickable name and keeps only visible objects', () => {
    const mesh = planetMesh(BODY_BY_NAME.get('Earth'))
    expect(bodyNameOf(mesh.userData.clouds)).toBe('Earth')
    expect(planetMesh(BODY_BY_NAME.get('Sun')).userData.pickHalo).toBeTruthy()
    expect(visibleOf({ visible: true }, { visible: false }, [{ visible: true }])).toHaveLength(2)
  })

  it('stands the camera off the sunward axis', () => {
    const side = equatorialSide(new Vector3(1, 0, 0))
    expect(side.y).toBe(0)
    expect(side.length()).toBeCloseTo(1, 8)

    const at = placeAlong(new Vector3(), [[new Vector3(1, 0, 0), 2], [new Vector3(0, 1, 0), 3]])
    expect(at).toMatchObject({ x: 2, y: 3, z: 0 })

    const approach = terminatorApproach(new Vector3(1, 0, 0))
    expect(approach.length()).toBeCloseTo(1, 8)
    expect(approach.dot(new Vector3(1, 0, 0))).toBeGreaterThan(0)
    expect(approach.y).toBeGreaterThan(0)
  })
})
