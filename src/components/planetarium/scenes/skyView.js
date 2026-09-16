import { AmbientLight, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, SphereGeometry, Vector3 } from 'three'
import { BODIES, BODY_BY_NAME, RETROGRADE_BODIES } from '../../../lib/planetarium/constants.js'
import { geoEcliptic, helioEcliptic, lengthAu, orientationBasis, sunwardOf } from '../../../lib/planetarium/ephemeris3d.js'
import { orbitPath, skyTrack } from '../../../lib/planetarium/orbits.js'
import { findStations } from '../../../lib/planetarium/retrograde.js'
import {
  UNIT_SPHERE,
  applyOrientation,
  disposeObject,
  namedBody,
  setSunDirection,
  starSphere,
} from '../../../lib/planetarium/materials.js'
import {
  LABEL_LAYER,
  circlePoints,
  layeredLabel,
  pathLine,
  setLayer,
  setLinePoints,
  visibleOf,
} from '../../../lib/planetarium/sceneGraph.js'

// Everything sits on a sky sphere: this is the geocentric view, where only direction matters.
const SKY_RADIUS   = 100
const TRACK_RADIUS = 96
const SKY_BODIES   = ['Sun', 'Moon', ...RETROGRADE_BODIES]
const ZODIAC       = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
const SKY_SIZE     = { Sun: 3.2, Moon: 2.6 }

const onSky = (vector, radius = SKY_RADIUS) => {
  const length = lengthAu(vector) || 1
  return new Vector3(vector.x / length * radius, vector.y / length * radius, vector.z / length * radius)
}

export const createSkyScene = ({ labelFor = name => name } = {}) => {
  const scene  = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.1, 20000)
  camera.position.set(0, 60, 130)
  camera.layers.enable(LABEL_LAYER)

  const earth = namedBody('Earth', new SphereGeometry(3.4, 48, 32))
  const bodies = new Map()
  const labels = new Map()
  for (const name of SKY_BODIES) {
    const mesh = namedBody(name)
    mesh.scale.setScalar(SKY_SIZE[name] || 1.9)
    const label = layeredLabel(labelFor(name), BODY_BY_NAME.get(name).color, 3.4)
    scene.add(mesh, label)
    bodies.set(name, mesh)
    labels.set(name, label)
  }

  const eclipticRing = pathLine(circlePoints(SKY_RADIUS, 240), { color: '#38bdf8', opacity: 0.4, kind: 'ecliptic' })
  const trail        = pathLine([], { color: '#fbbf24', opacity: 0.95, kind: 'trail' })
  const sightLine    = pathLine([], { color: '#f97316', opacity: 0.75, kind: 'sight' })
  const stationMarks = new Group()
  const stars        = starSphere(6000)

  const zodiacLabels = new Group()
  for (let index = 0; index < 12; index += 1) {
    const angle = ((index * 30 + 15) * Math.PI) / 180
    const label = layeredLabel(ZODIAC[index], '#94a3b8', 5)
    label.position.set(Math.cos(angle) * SKY_RADIUS * 1.04, 0, -Math.sin(angle) * SKY_RADIUS * 1.04)
    zodiacLabels.add(label)
  }

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
    inset.add(pathLine(
      orbitPath(body.name, new Date()).map(point => ({
        x: point.x * insetScale, y: point.y * insetScale, z: point.z * insetScale,
      })),
      { color: body.color, opacity: 0.4, kind: 'grid' }
    ))
  }
  const insetSight = pathLine([], { color: '#f97316', opacity: 0.9, kind: 'sight' })
  inset.add(insetSight)
  setLayer(inset, 1)

  scene.add(new AmbientLight('#ffffff', 0.04), earth, eclipticRing, zodiacLabels, trail, stationMarks, sightLine, stars, inset)

  const insetCamera = new PerspectiveCamera(40, 1, 0.01, 400)
  insetCamera.layers.set(1)
  insetCamera.position.set(0, 60, 0)
  insetCamera.up.set(0, 0, -1)
  insetCamera.lookAt(0, 0, 0)

  let trailKey = ''

  const rebuildTrail = (state) => {
    const points = skyTrack(state.trailBody, new Date(state.timeMs), { spanDays: state.trailSpanDays })
      .map(point => ({ x: point.x * TRACK_RADIUS, y: point.y * TRACK_RADIUS, z: point.z * TRACK_RADIUS }))
    setLinePoints(trail, points)

    for (const mark of [...stationMarks.children]) {
      stationMarks.remove(mark)
      disposeObject(mark)
    }
    const half = (state.trailSpanDays / 2) * 86400000
    for (const station of findStations(state.trailBody, new Date(state.timeMs - half), new Date(state.timeMs + half))) {
      const retrograde = station.direction === 'retrograde'
      const mark = new Mesh(new SphereGeometry(1.5, 20, 14), new MeshBasicMaterial({ color: retrograde ? '#f87171' : '#4ade80' }))
      mark.position.copy(onSky(geoEcliptic(state.trailBody, station.time), TRACK_RADIUS))
      const label = layeredLabel(
        `${retrograde ? '℞' : 'D'} ${station.time.toISOString().slice(0, 10)}`,
        retrograde ? '#fca5a5' : '#86efac',
        3
      )
      label.position.copy(mark.position.clone().multiplyScalar(1.04))
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
    trail.userData.bodyName = state.trailBody

    for (const name of SKY_BODIES) {
      const position = onSky(geoEcliptic(name, when))
      const mesh     = bodies.get(name)
      mesh.position.copy(position)
      applyOrientation(mesh, orientationBasis(name, when))
      if (name !== 'Sun') setSunDirection(mesh, sunwardOf(helioEcliptic(name, when)))
      const label = labels.get(name)
      label.visible = state.showLabels
      label.position.copy(position)
    }
    setSunDirection(earth, sunwardOf(helioEcliptic('Earth', when)))
    setLinePoints(sightLine, [{ x: 0, y: 0, z: 0 }, onSky(geoEcliptic(state.trailBody, when), TRACK_RADIUS)])

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
    setLinePoints(insetSight, [earthPoint, beyond])
    setLayer(inset, 1)
  }

  /** Frame the trailed planet's patch of sky, where the retrograde loop is actually legible. */
  const pose = (state) => {
    const direction = onSky(geoEcliptic(state?.trailBody || 'Mars', new Date(state?.timeMs || Date.now())), 1)
    return {
      target:   direction.clone().multiplyScalar(TRACK_RADIUS),
      position: direction.clone().multiplyScalar(TRACK_RADIUS + 90),
    }
  }

  return {
    scene,
    camera,
    update,
    dispose:    () => { disposeObject(scene); scene.clear() },
    framing:    () => 190,
    pose,
    pickables:  [...bodies.values(), earth],
    bodies,
    hoverables: () => visibleOf(eclipticRing, trail),
    inset:      { group: inset, camera: insetCamera },
  }
}
