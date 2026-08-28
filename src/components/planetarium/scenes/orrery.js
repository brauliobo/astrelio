import {
  AmbientLight,
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three'
import { AU_KM, BODIES, BODY_BY_NAME } from '../../../lib/planetarium/constants.js'
import { heliocentricPositions, orientationBasis } from '../../../lib/planetarium/ephemeris3d.js'
import { orbitPath } from '../../../lib/planetarium/orbits.js'
import { bodyRadiusUnits, scalePosition } from '../../../lib/planetarium/scale.js'
import {
  UNIT_SPHERE,
  applyOrientation,
  cloudMaterial,
  disposeObject,
  earthMaterial,
  emissiveMaterial,
  moonMaterial,
  ringGeometry,
  ringMaterial,
  starSphere,
  surfaceMaterial,
} from '../../../lib/planetarium/materials.js'
import { makeLabel } from '../../../lib/planetarium/labels.js'
import { MOONS, MOON_BY_NAME, moonOrbitPath, moonOrientation, moonPosition } from '../../../lib/planetarium/moons.js'

const NAMES        = BODIES.map(body => body.name)
// A planet's moons only make sense once you are looking at that planet; at system scale they sit
// inside its exaggerated disc. Distances are scaled so the innermost moon clears the planet's
// exaggerated disc, which keeps every ratio inside that moon system exact.
const INNER_MOON_RADII = 1.6
// Sprite labels are sized in world units, so they are rescaled each frame to hold a steady size on
// screen however far the camera is from them.
const LABEL_SCREEN_SIZE = 0.045
const STAR_RADIUS  = 4000
const MOON_ORBIT_UNITS = 2.6
const LABEL_LAYER      = 2

const vector3 = point => new Vector3(point.x, point.y, point.z)

const orbitLine = (points, color, opacity) => new Line(
  new BufferGeometry().setFromPoints(points.map(vector3)),
  new LineBasicMaterial({ color, transparent: true, opacity })
)

const eclipticGrid = () => {
  const group = new Group()
  for (const au of [1, 5, 10, 20, 30]) {
    const points = Array.from({ length: 181 }, (_, index) => {
      const angle = (index / 180) * Math.PI * 2
      return { x: Math.cos(angle) * au, y: 0, z: Math.sin(angle) * au }
    })
    group.add(orbitLine(points, '#1e3a5f', 0.4))
  }
  group.userData.gridRadiiAu = [1, 5, 10, 20, 30]
  return group
}

export const createOrreryScene = ({ labelFor = name => name } = {}) => {
  const scene  = new Scene()
  // Near plane at ~150 km so a true-scale planet stays visible when the camera closes in.
  const camera = new PerspectiveCamera(45, 1, 0.000001, 12000)
  camera.position.set(0, 34, 46)
  camera.layers.enable(LABEL_LAYER)

  const bodies = new Map()
  const labels = new Map()
  const orbits = new Group()
  const grid   = eclipticGrid()
  const stars  = starSphere(STAR_RADIUS)

  scene.add(new AmbientLight('#ffffff', 0.1))
  const sunLight = new PointLight('#fff6e5', 3.2, 0, 0)
  scene.add(sunLight, orbits, grid, stars)

  for (const body of BODIES) {
    const material = body.name === 'Sun'
      ? emissiveMaterial('Sun')
      : body.name === 'Earth' ? earthMaterial() : surfaceMaterial(body.name)
    const mesh = new Mesh(UNIT_SPHERE, material)
    mesh.userData.bodyName = body.name

    if (body.name === 'Earth') {
      const clouds = new Mesh(UNIT_SPHERE, cloudMaterial())
      clouds.scale.setScalar(1.006)
      clouds.userData.bodyName = 'Earth'
      mesh.add(clouds)
      mesh.userData.clouds = clouds
    }
    if (body.rings) {
      const rings = new Mesh(
        ringGeometry(body.rings.innerKm / body.radiusKm, body.rings.outerKm / body.radiusKm),
        ringMaterial()
      )
      rings.rotation.x = Math.PI / 2
      mesh.add(rings)
      mesh.userData.rings = rings
    }

    scene.add(mesh)
    bodies.set(body.name, mesh)

    const label = makeLabel(labelFor(body.name), body.color, 2.6)
    label.layers.set(LABEL_LAYER)
    scene.add(label)
    labels.set(body.name, label)

    if (body.kind === 'planet' || body.kind === 'dwarf') {
      const line = orbitLine(orbitPath(body.name, new Date()), body.color, 0.34)
      line.userData.bodyName = body.name
      orbits.add(line)
    }
  }

  const sunMarker = new Mesh(new SphereGeometry(1, 32, 24), new MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.12 }))
  scene.add(sunMarker)

  const moonMeshes = new Map()
  const moonLabels = new Map()
  const moonOrbits = new Map()

  for (const moon of MOONS) {
    const mesh = new Mesh(UNIT_SPHERE, moonMaterial(moon))
    mesh.userData.bodyName = moon.name
    mesh.visible = false
    scene.add(mesh)
    moonMeshes.set(moon.name, mesh)

    const label = makeLabel(labelFor(moon.name), moon.color, 1.1)
    label.layers.set(LABEL_LAYER)
    label.visible = false
    scene.add(label)
    moonLabels.set(moon.name, label)

    const line = orbitLine([{ x: 0, y: 0, z: 0 }], moon.color, 0.4)
    line.visible = false
    scene.add(line)
    moonOrbits.set(moon.name, line)
  }

  // True scale means exactly that: 1 unit is 1 au and radii are untouched, so bodies are smaller
  // than a pixel until you fly up to one. Otherwise the Sun is exaggerated on a gentler curve than
  // the planets, or it swallows the inner system.
  const radiusUnits = (body, state) => {
    if (state.scaleMode === 'true') return bodyRadiusUnits(body.radiusKm)
    return bodyRadiusUnits(body.radiusKm, {
      exaggeration: body.name === 'Sun' ? Math.pow(state.sizeExaggeration, 0.62) : state.sizeExaggeration,
      minUnits:     0.2,
    })
  }

  const scaleOptions = state => ({ mode: state.scaleMode, unitsPerAu: 1 })

  const rebuildOrbits = (state) => {
    for (const line of orbits.children) {
      const points = orbitPath(line.userData.bodyName, new Date(state.timeMs))
        .map(point => scalePosition(point, scaleOptions(state)))
      line.geometry.dispose()
      line.geometry = new BufferGeometry().setFromPoints(points.map(vector3))
    }
    for (let index = 0; index < grid.children.length; index += 1) {
      const au     = grid.userData.gridRadiiAu[index]
      const points = Array.from({ length: 181 }, (_, step) => {
        const angle = (step / 180) * Math.PI * 2
        return scalePosition({ x: Math.cos(angle) * au, y: 0, z: Math.sin(angle) * au }, scaleOptions(state))
      })
      grid.children[index].geometry.dispose()
      grid.children[index].geometry = new BufferGeometry().setFromPoints(points.map(vector3))
    }
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

    orbits.visible = state.showOrbits
    grid.visible   = state.showOrbits
    stars.visible  = state.showStarMap

    for (const body of BODIES) {
      const mesh   = bodies.get(body.name)
      const label  = labels.get(body.name)
      const radius = radiusUnits(body, state)
      let position = scalePosition(positions.get(body.name), scaleOptions(state))

      if (body.parent) {
        const parent = scalePosition(positions.get(body.parent), scaleOptions(state))
        const offset = new Vector3(position.x - parent.x, position.y - parent.y, position.z - parent.z)
        const gap    = radiusUnits(BODY_BY_NAME.get(body.parent), state) * MOON_ORBIT_UNITS
        offset.setLength(state.scaleMode === 'true' ? offset.length() : gap)
        position = { x: parent.x + offset.x, y: parent.y + offset.y, z: parent.z + offset.z }
      }

      mesh.scale.setScalar(radius)
      mesh.position.set(position.x, position.y, position.z)
      applyOrientation(mesh, orientationBasis(body.name, when))

      const sunDirection = new Vector3(-position.x, -position.y, -position.z).normalize()
      mesh.material.uniforms?.sunDirection?.value.copy(sunDirection)
      mesh.userData.clouds?.material.uniforms.sunDirection.value.copy(sunDirection)

      label.visible = state.showLabels
      label.position.set(position.x, position.y + radius, position.z)
    }

    sunMarker.scale.setScalar(radiusUnits(BODY_BY_NAME.get('Sun'), state) * 2.6)
    updateMoons(state, when, positions)
    scaleLabels()
  }

  /**
   * Moons are drawn around the focused planet only. In true scale their real distances are used; in
   * the compressed view they are laid out in units of the parent's rendered radius, which keeps the
   * Galilean spacing (and Iapetus being far out) readable at any exaggeration.
   */
  const updateMoons = (state, when, positions) => {
    const focused = state.focusBody
    const parent  = MOON_BY_NAME.get(focused)?.parent || focused

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

      mesh.scale.setScalar(Math.max(
        state.scaleMode === 'true' ? 0 : parentRadius * 0.12,
        bodyRadiusUnits(moon.radiusKm, { exaggeration: state.scaleMode === 'true' ? 1 : state.sizeExaggeration })
      ))
      mesh.position.copy(place(moonPosition(moon, when)))
      applyOrientation(mesh, moonOrientation(moon, when))
      label.position.copy(mesh.position).setY(mesh.position.y + mesh.scale.x)

      line.geometry.dispose()
      line.geometry = new BufferGeometry().setFromPoints(moonOrbitPath(moon, when).map(place))
    }
  }

  /** Keep every label at a steady on-screen size, whatever the camera distance. */
  const scaleLabels = () => {
    for (const label of [...labels.values(), ...moonLabels.values()]) {
      if (!label.visible) continue
      const size = camera.position.distanceTo(label.position) * LABEL_SCREEN_SIZE
      const map  = label.material.map
      label.scale.set(size * (map.image.width / map.image.height), size, 1)
    }
  }

  const framing = state => (state.scaleMode === 'true' ? 90 : 150)

  const dispose = () => {
    disposeObject(scene)
    scene.clear()
  }

  const innerMoonRatio = new Map()
  for (const moon of MOONS) {
    const ratio = moon.semiMajorKm / BODY_BY_NAME.get(moon.parent).radiusKm
    innerMoonRatio.set(moon.parent, Math.min(innerMoonRatio.get(moon.parent) ?? Infinity, ratio))
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

  return { scene, camera, update, dispose, framing, systemReach, pickables: [...bodyIndex.values()], bodies: bodyIndex }
}
