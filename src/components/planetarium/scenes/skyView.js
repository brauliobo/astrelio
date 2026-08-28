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
import { BODIES, BODY_BY_NAME, RETROGRADE_BODIES } from '../../../lib/planetarium/constants.js'
import { geoEcliptic, helioEcliptic, lengthAu, orientationBasis } from '../../../lib/planetarium/ephemeris3d.js'
import { orbitPath, skyTrack } from '../../../lib/planetarium/orbits.js'
import { findStations } from '../../../lib/planetarium/retrograde.js'
import {
  UNIT_SPHERE,
  applyOrientation,
  disposeObject,
  emissiveMaterial,
  starSphere,
  surfaceMaterial,
} from '../../../lib/planetarium/materials.js'
import { makeLabel } from '../../../lib/planetarium/labels.js'

// Everything sits on a sky sphere: this is the geocentric view, where only direction matters.
const SKY_RADIUS   = 100
const TRACK_RADIUS = 96
const SKY_BODIES   = ['Sun', 'Moon', ...RETROGRADE_BODIES]
const LABEL_LAYER  = 2
const ZODIAC       = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

const onSky = (vector, radius = SKY_RADIUS) => {
  const length = lengthAu(vector) || 1
  return new Vector3(vector.x / length * radius, vector.y / length * radius, vector.z / length * radius)
}

const lineFrom = (points, color, opacity, width = 1) => new Line(
  new BufferGeometry().setFromPoints(points),
  new LineBasicMaterial({ color, transparent: true, opacity, linewidth: width })
)

export const createSkyScene = ({ labelFor = name => name } = {}) => {
  const scene  = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.1, 20000)
  camera.position.set(0, 60, 130)
  camera.layers.enable(LABEL_LAYER)

  scene.add(new AmbientLight('#ffffff', 0.35))
  scene.add(new PointLight('#ffffff', 1.4, 0, 0))

  const earth = new Mesh(new SphereGeometry(3.4, 48, 32), surfaceMaterial('Earth'))
  earth.userData.bodyName = 'Earth'

  const bodies = new Map()
  const labels = new Map()
  for (const name of SKY_BODIES) {
    const style = BODY_BY_NAME.get(name)
    const mesh  = new Mesh(UNIT_SPHERE, name === 'Sun' ? emissiveMaterial('Sun') : surfaceMaterial(name))
    mesh.userData.bodyName = name
    mesh.scale.setScalar(name === 'Sun' ? 3.2 : name === 'Moon' ? 2.6 : 1.9)
    scene.add(mesh)
    bodies.set(name, mesh)

    const label = makeLabel(labelFor(name), style.color, 3.4)
    label.layers.set(LABEL_LAYER)
    scene.add(label)
    labels.set(name, label)
  }

  const eclipticRing = lineFrom(
    Array.from({ length: 241 }, (_, index) => {
      const angle = (index / 240) * Math.PI * 2
      return new Vector3(Math.cos(angle) * SKY_RADIUS, 0, Math.sin(angle) * SKY_RADIUS)
    }),
    '#38bdf8', 0.4
  )

  const zodiacLabels = new Group()
  for (let index = 0; index < 12; index += 1) {
    const angle = ((index * 30 + 15) * Math.PI) / 180
    const label = makeLabel(ZODIAC[index], '#94a3b8', 5)
    label.position.set(Math.cos(angle) * SKY_RADIUS * 1.04, 0, -Math.sin(angle) * SKY_RADIUS * 1.04)
    label.layers.set(LABEL_LAYER)
    zodiacLabels.add(label)
  }

  const trail        = lineFrom([], '#fbbf24', 0.95)
  const stationMarks = new Group()
  const sightLine    = lineFrom([], '#f97316', 0.75)
  const stars        = starSphere(6000)

  // Heliocentric inset: the same instant seen from above, where the overtaking that causes the loop is visible.
  const inset       = new Group()
  const insetScale  = 3.4
  const insetBodies = new Map()
  for (const body of BODIES.filter(entry => entry.kind === 'planet' || entry.name === 'Sun')) {
    const mesh = new Mesh(UNIT_SPHERE, new MeshBasicMaterial({ color: body.color }))
    mesh.scale.setScalar(body.name === 'Sun' ? 0.9 : 0.42)
    inset.add(mesh)
    insetBodies.set(body.name, mesh)
    if (body.kind !== 'planet') continue
    inset.add(lineFrom(
      orbitPath(body.name, new Date()).map(point => new Vector3(point.x * insetScale, point.y * insetScale, point.z * insetScale)),
      body.color, 0.4
    ))
  }
  const insetSight = lineFrom([], '#f97316', 0.9)
  inset.add(insetSight)

  scene.add(earth, eclipticRing, zodiacLabels, trail, stationMarks, sightLine, stars, inset)

  // The inset lives on its own layer so only the inset camera draws it.
  inset.traverse(object => object.layers.set(1))

  const insetCamera = new PerspectiveCamera(40, 1, 0.01, 400)
  insetCamera.layers.set(1)
  insetCamera.position.set(0, 60, 0)
  insetCamera.up.set(0, 0, -1)
  insetCamera.lookAt(0, 0, 0)

  let trailKey = ''

  const rebuildTrail = (state) => {
    const points = skyTrack(state.trailBody, new Date(state.timeMs), { spanDays: state.trailSpanDays })
      .map(point => new Vector3(point.x * TRACK_RADIUS, point.y * TRACK_RADIUS, point.z * TRACK_RADIUS))
    trail.geometry.dispose()
    trail.geometry = new BufferGeometry().setFromPoints(points)

    for (const mark of [...stationMarks.children]) {
      stationMarks.remove(mark)
      disposeObject(mark)
    }
    const half = (state.trailSpanDays / 2) * 86400000
    for (const station of findStations(state.trailBody, new Date(state.timeMs - half), new Date(state.timeMs + half))) {
      const mark = new Mesh(
        new SphereGeometry(1.5, 20, 14),
        new MeshBasicMaterial({ color: station.direction === 'retrograde' ? '#f87171' : '#4ade80' })
      )
      mark.position.copy(onSky(geoEcliptic(state.trailBody, station.time), TRACK_RADIUS))
      const label = makeLabel(
        `${station.direction === 'retrograde' ? '℞' : 'D'} ${station.time.toISOString().slice(0, 10)}`,
        station.direction === 'retrograde' ? '#fca5a5' : '#86efac',
        3
      )
      label.position.copy(mark.position.clone().multiplyScalar(1.04))
      label.layers.set(LABEL_LAYER)
      stationMarks.add(mark, label)
    }
  }

  const update = (state) => {
    const when = new Date(state.timeMs)
    const key  = `${state.trailBody}:${state.trailSpanDays}:${Math.floor(state.timeMs / (7 * 86400000))}`
    if (key !== trailKey) {
      rebuildTrail(state)
      trailKey = key
    }

    for (const name of SKY_BODIES) {
      const position = onSky(geoEcliptic(name, when))
      const mesh     = bodies.get(name)
      mesh.position.copy(position)
      applyOrientation(mesh, orientationBasis(name, when))
      const label = labels.get(name)
      label.visible = state.showLabels
      label.position.copy(position)
    }

    const target = onSky(geoEcliptic(state.trailBody, when), TRACK_RADIUS)
    sightLine.geometry.dispose()
    sightLine.geometry = new BufferGeometry().setFromPoints([new Vector3(), target])

    eclipticRing.visible = state.showOrbits
    zodiacLabels.visible = state.showLabels
    stars.visible        = state.showStarMap
    trail.visible        = true

    const earthHelio = helioEcliptic('Earth', when)
    const earthPoint = new Vector3(earthHelio.x, earthHelio.y, earthHelio.z).multiplyScalar(insetScale)
    for (const [name, mesh] of insetBodies) {
      const point = name === 'Sun' ? { x: 0, y: 0, z: 0 } : helioEcliptic(name, when)
      mesh.position.set(point.x * insetScale, point.y * insetScale, point.z * insetScale)
    }
    // Keep the inset framed on the pair whose geometry explains the loop.
    insetCamera.position.set(0, Math.max(12, lengthAu(helioEcliptic(state.trailBody, when)) * insetScale * 2.4), 0)
    insetCamera.lookAt(0, 0, 0)

    const trailHelio = helioEcliptic(state.trailBody, when)
    const trailPoint = new Vector3(trailHelio.x, trailHelio.y, trailHelio.z).multiplyScalar(insetScale)
    const beyond     = trailPoint.clone().sub(earthPoint).setLength(40).add(earthPoint)
    insetSight.geometry.dispose()
    insetSight.geometry = new BufferGeometry().setFromPoints([earthPoint, beyond])
    inset.traverse(object => object.layers.set(1))
  }

  const framing = () => 190

  /** Frame the trailed planet's patch of sky, where the retrograde loop is actually legible. */
  const pose = (state) => {
    const direction = onSky(geoEcliptic(state?.trailBody || 'Mars', new Date(state?.timeMs || Date.now())), 1)
    return {
      target:   direction.clone().multiplyScalar(TRACK_RADIUS),
      position: direction.clone().multiplyScalar(TRACK_RADIUS + 90),
    }
  }

  const dispose = () => {
    disposeObject(scene)
    scene.clear()
  }

  return {
    scene,
    camera,
    update,
    dispose,
    framing,
    pose,
    pickables: [...bodies.values(), earth],
    bodies,
    inset: { group: inset, camera: insetCamera },
  }
}
