import { AmbientLight, Group, PerspectiveCamera, Scene, Vector3 } from 'three'
import { AU_KM, BODIES, BODY_BY_NAME } from '../../../lib/planetarium/constants.js'
import { heliocentricPositions, orientationBasis, sunwardOf } from '../../../lib/planetarium/ephemeris3d.js'
import { orbitPath } from '../../../lib/planetarium/orbits.js'
import { bodyRadiusUnits, compressedSunRadius, pickRadiusUnits, scalePosition } from '../../../lib/planetarium/scale.js'
import {
  applyOrientation,
  disposeObject,
  namedMoon,
  planetMesh,
  setSunDirection,
  starSphere,
} from '../../../lib/planetarium/materials.js'
import { MOONS, MOON_BY_NAME, moonOrbitPath, moonOrientation, moonPosition } from '../../../lib/planetarium/moons.js'
import {
  LABEL_LAYER,
  circlePoints,
  fitLabelsToCamera,
  layeredLabel,
  pathLine,
  setLinePoints,
  toVector3,
  visibleOf,
} from '../../../lib/planetarium/sceneGraph.js'

const NAMES = BODIES.map(body => body.name)
// A planet's moons only make sense once you are looking at that planet; at system scale they sit
// inside its exaggerated disc. Distances are scaled so the innermost moon clears the planet's
// exaggerated disc, which keeps every ratio inside that moon system exact.
const INNER_MOON_RADII = 1.6
// Sprite labels are sized in world units, so they are rescaled each frame to hold a steady size on
// screen however far the camera is from them.
const LABEL_SCREEN_SIZE = 0.045
const STAR_RADIUS      = 4000
const MOON_ORBIT_UNITS = 2.6
const GRID_AU          = [1, 5, 10, 20, 30]

const innerMoonRatio = new Map()
for (const moon of MOONS) {
  const ratio = moon.semiMajorKm / BODY_BY_NAME.get(moon.parent).radiusKm
  innerMoonRatio.set(moon.parent, Math.min(innerMoonRatio.get(moon.parent) ?? Infinity, ratio))
}

const eclipticGrid = () => {
  const group = new Group()
  for (const au of GRID_AU) {
    group.add(pathLine(circlePoints(au), { color: '#1e3a5f', opacity: 0.4, kind: 'grid' }))
  }
  group.userData.gridRadiiAu = GRID_AU
  return group
}

const taggedOrbit = (body, opacity, points = [{ x: 0, y: 0, z: 0 }]) => pathLine(points, {
  color:      body.color,
  opacity,
  bodyName:   body.name,
  periodDays: body.periodDays,
})

export const createOrreryScene = ({ labelFor = name => name } = {}) => {
  const scene  = new Scene()
  // Near plane at ~150 km so a true-scale planet stays visible when the camera closes in.
  const camera = new PerspectiveCamera(45, 1, 0.000001, 12000)
  camera.position.set(0, 34, 46)
  camera.layers.enable(LABEL_LAYER)

  const bodies     = new Map()
  const labels     = new Map()
  const moonMeshes = new Map()
  const moonLabels = new Map()
  const moonOrbits = new Map()
  const orbits     = new Group()
  const grid       = eclipticGrid()
  const stars      = starSphere(STAR_RADIUS)

  scene.add(new AmbientLight('#fff6e5', 0.02), orbits, grid, stars)

  for (const body of BODIES) {
    const mesh  = planetMesh(body)
    const label = layeredLabel(labelFor(body.name), body.color, 2.6)
    scene.add(mesh, label)
    bodies.set(body.name, mesh)
    labels.set(body.name, label)
    if (body.kind === 'planet' || body.kind === 'dwarf') {
      orbits.add(taggedOrbit(body, 0.34, orbitPath(body.name, new Date())))
    }
  }

  for (const moon of MOONS) {
    const mesh  = namedMoon(moon)
    const label = layeredLabel(labelFor(moon.name), moon.color, 1.1)
    const line  = taggedOrbit(moon, 0.4)
    mesh.visible = label.visible = line.visible = false
    scene.add(mesh, label, line)
    moonMeshes.set(moon.name, mesh)
    moonLabels.set(moon.name, label)
    moonOrbits.set(moon.name, line)
  }

  // True scale means exactly that: 1 unit is 1 au and radii are untouched, so bodies are smaller
  // than a pixel until you fly up to one. Compressed mode exaggerates the planets so they read at
  // system scale, but the Sun is capped inside Mercury's perihelion — the same exaggeration would
  // swallow the inner system. A camera-relative pick halo keeps the true-scale photosphere clickable.
  const radiusUnits = (body, state) => {
    if (state.scaleMode === 'true') return bodyRadiusUnits(body.radiusKm)
    if (body.name === 'Sun') return compressedSunRadius(state.sizeExaggeration)
    return bodyRadiusUnits(body.radiusKm, {
      exaggeration: state.sizeExaggeration,
      minUnits:     0.2,
    })
  }

  const scaleOptions = state => ({ mode: state.scaleMode, unitsPerAu: 1 })

  const rebuildOrbits = (state) => {
    const options = scaleOptions(state)
    const when    = new Date(state.timeMs)
    for (const line of orbits.children) {
      setLinePoints(line, orbitPath(line.userData.bodyName, when).map(point => scalePosition(point, options)))
    }
    grid.children.forEach((line, index) => {
      setLinePoints(line, circlePoints(grid.userData.gridRadiiAu[index]).map(point => scalePosition(point, options)))
    })
  }

  let lastScaleMode = ''
  let lastOrbitDay  = 0

  const update = (state) => {
    const when      = new Date(state.timeMs)
    const positions = heliocentricPositions(NAMES, when)
    const day       = Math.floor(state.timeMs / 86400000)

    if (lastScaleMode !== state.scaleMode || Math.abs(day - lastOrbitDay) > 120) {
      rebuildOrbits(state)
      lastScaleMode = state.scaleMode
      lastOrbitDay  = day
    }

    orbits.visible = grid.visible = state.showOrbits
    stars.visible  = state.showStarMap

    const sunRadius = radiusUnits(BODY_BY_NAME.get('Sun'), state)

    for (const body of BODIES) {
      const mesh   = bodies.get(body.name)
      const label  = labels.get(body.name)
      const radius = body.name === 'Sun' ? sunRadius : radiusUnits(body, state)
      let position = scalePosition(positions.get(body.name), scaleOptions(state))

      if (body.parent) {
        const parent = scalePosition(positions.get(body.parent), scaleOptions(state))
        const offset = toVector3(position).sub(toVector3(parent))
        offset.setLength(state.scaleMode === 'true' ? offset.length() : radiusUnits(BODY_BY_NAME.get(body.parent), state) * MOON_ORBIT_UNITS)
        position = { x: parent.x + offset.x, y: parent.y + offset.y, z: parent.z + offset.z }
      }

      mesh.scale.setScalar(radius)
      mesh.position.set(position.x, position.y, position.z)
      applyOrientation(mesh, orientationBasis(body.name, when))
      if (body.name !== 'Sun') setSunDirection(mesh, sunwardOf(positions.get(body.name)))

      const distance  = Math.hypot(position.x, position.y, position.z)
      const insideSun = body.name !== 'Sun' && distance < sunRadius
      mesh.visible  = !insideSun
      label.visible = state.showLabels && (body.name === 'Sun' || distance > sunRadius * 1.2)
      label.position.set(position.x, position.y + radius, position.z)

      if (body.name === 'Sun') {
        const halo     = mesh.userData.pickHalo
        const pickSize = pickRadiusUnits(radius, camera.position.distanceTo(mesh.position))
        halo.scale.setScalar(pickSize / radius)
        halo.material.opacity = pickSize > radius * 1.2 ? 0.16 : 0
      }
    }

    updateMoons(state, when, positions)
    fitLabelsToCamera(camera, [...labels.values(), ...moonLabels.values()], LABEL_SCREEN_SIZE)
  }

  /**
   * Moons are drawn around the focused planet only. In true scale their real distances are used; in
   * the compressed view they are laid out in units of the parent's rendered radius, which keeps the
   * Galilean spacing (and Iapetus being far out) readable at any exaggeration.
   */
  const updateMoons = (state, when, positions) => {
    const parent = MOON_BY_NAME.get(state.focusBody)?.parent || state.focusBody

    for (const moon of MOONS) {
      const mesh   = moonMeshes.get(moon.name)
      const label  = moonLabels.get(moon.name)
      const line   = moonOrbits.get(moon.name)
      const active = state.showMoons && moon.parent === parent

      mesh.visible  = active
      label.visible = active && state.showLabels
      line.visible  = active && state.showOrbits
      if (!active) continue

      const parentBody   = BODY_BY_NAME.get(moon.parent)
      const parentPoint  = scalePosition(positions.get(moon.parent), scaleOptions(state))
      const parentRadius = radiusUnits(parentBody, state)
      const spread       = state.scaleMode === 'true'
        ? 1
        : (parentRadius / (parentBody.radiusKm / AU_KM)) * (INNER_MOON_RADII / innerMoonRatio.get(moon.parent))

      const place = (offset) => new Vector3(
        parentPoint.x + offset.x * spread,
        parentPoint.y + offset.y * spread,
        parentPoint.z + offset.z * spread
      )

      const offset = moonPosition(moon, when)
      mesh.scale.setScalar(Math.max(
        state.scaleMode === 'true' ? 0 : parentRadius * 0.2,
        bodyRadiusUnits(moon.radiusKm, { exaggeration: state.scaleMode === 'true' ? 1 : state.sizeExaggeration })
      ))
      mesh.position.copy(place(offset))
      applyOrientation(mesh, moonOrientation(moon, when))
      const parentTrue = positions.get(moon.parent)
      setSunDirection(mesh, sunwardOf({
        x: parentTrue.x + offset.x,
        y: parentTrue.y + offset.y,
        z: parentTrue.z + offset.z,
      }))
      label.position.copy(mesh.position).setY(mesh.position.y + mesh.scale.x)
      setLinePoints(line, moonOrbitPath(moon, when).map(place))
    }
  }

  /**
   * Framing distance for a focused planet's moon system. It keys on the median moon rather than the
   * outermost: Iapetus orbits twenty times further out than Mimas, and framing for it would shrink
   * the rest of Saturn's system to nothing.
   */
  const systemReach = (name, state) => {
    const moons = MOONS.filter(moon => moon.parent === name)
    if (!moons.length) return 0

    const parentBody = BODY_BY_NAME.get(name)
    const sorted     = moons.map(moon => moon.semiMajorKm).sort((a, b) => a - b)
    const median     = sorted[Math.floor(sorted.length / 2)]
    if (state.scaleMode === 'true') return median / AU_KM

    const parentRadius = radiusUnits(parentBody, state)
    return parentRadius * INNER_MOON_RADII * (median / (innerMoonRatio.get(name) * parentBody.radiusKm))
  }

  const bodyIndex = new Map([...bodies, ...moonMeshes])

  return {
    scene,
    camera,
    update,
    dispose:     () => { disposeObject(scene); scene.clear() },
    framing:     state => (state.scaleMode === 'true' ? 90 : 150),
    systemReach,
    pickables:   [...bodyIndex.values()],
    bodies:      bodyIndex,
    hoverables:  () => visibleOf(orbits.visible ? orbits.children : [], [...moonOrbits.values()]),
  }
}
