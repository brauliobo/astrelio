import {
  AmbientLight,
  BufferGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three'
import { AU_KM, EARTH_RADIUS_KM, MOON_RADIUS_KM, SUN_RADIUS_KM } from '../../../lib/planetarium/constants.js'
import { geoEcliptic, lengthAu, orientationBasis } from '../../../lib/planetarium/ephemeris3d.js'
import { lunarOrbitPath } from '../../../lib/planetarium/orbits.js'
import { umbraCone } from '../../../lib/planetarium/shadows.js'
import {
  UNIT_SPHERE,
  applyOrientation,
  cloudMaterial,
  disposeObject,
  earthMaterial,
  emissiveMaterial,
  shadowMaterial,
  starSphere,
  surfaceMaterial,
} from '../../../lib/planetarium/materials.js'
import { makeLabel } from '../../../lib/planetarium/labels.js'

// One scene unit is 1000 km: Earth is 6.4 units wide, the Moon sits 384 units away.
const UNIT_KM      = 1000
const SUN_DISTANCE = 2400
const km           = value => value / UNIT_KM
const auToUnits    = au => km(au * AU_KM)

const vector3 = point => new Vector3(point.x, point.y, point.z)

const dashedCircle = (radius, color, opacity, segments = 240) => new Line(
  new BufferGeometry().setFromPoints(Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2
    return new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
  })),
  new LineBasicMaterial({ color, transparent: true, opacity })
)

/**
 * Shadow cones drawn from the body outward, away from the Sun. The umbra converges to a point at
 * its full length; the penumbra diverges, and at that same length its radius is always about twice
 * the body radius, which is why `PENUMBRA_RATIO` is a constant.
 */
const PENUMBRA_RATIO = 2

const coneGeometry = (topRatio) => {
  const geometry = new CylinderGeometry(topRatio, 1, 1, 72, 1, true)
  geometry.translate(0, 0.5, 0)
  return geometry
}

const shadowCone = (topRatio, color, opacity) => {
  const cone = new Mesh(coneGeometry(topRatio), shadowMaterial(color, opacity))
  cone.userData.topRatio = topRatio
  return cone
}

/** Cones are drawn only as far as they need to be, so a 1.4 million km umbra does not fill the frame. */
const truncateCone = (cone, topRatio) => {
  if (Math.abs(cone.userData.topRatio - topRatio) < 0.02) return
  cone.geometry.dispose()
  cone.geometry = coneGeometry(topRatio)
  cone.userData.topRatio = topRatio
}

const orientCone = (cone, awayFromSun, baseRadius, length, origin) => {
  cone.scale.set(baseRadius, length, baseRadius)
  cone.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), awayFromSun)
  cone.position.copy(origin)
}

/**
 * Two layouts share this scene. The phase view is a diagram: bodies are enlarged and the lunar
 * distance shortened so the lit hemisphere reads at a glance, which is safe because phases only
 * depend on the Sun's direction. The eclipse view keeps everything at true scale, because there the
 * exact size of the shadow cones is the whole point.
 */
const LAYOUTS = {
  diagram: { body: 9.5, distance: 0.6, shadows: false },
  true:    { body: 1, distance: 1, shadows: true },
}

const LABEL_LAYER  = 2
const SHADOW_LAYER = 3

export const createMoonLabScene = ({ labelFor = name => name } = {}) => {
  const scene  = new Scene()
  const camera = new PerspectiveCamera(38, 1, 0.1, 60000)
  camera.position.set(0, 900, 0)

  scene.add(new AmbientLight('#ffffff', 0.05))
  const sunLight = new DirectionalLight('#fff6e5', 3.4)
  scene.add(sunLight, sunLight.target)

  const earth = new Mesh(UNIT_SPHERE, earthMaterial())
  earth.userData.bodyName = 'Earth'
  earth.scale.setScalar(km(EARTH_RADIUS_KM))
  const clouds = new Mesh(UNIT_SPHERE, cloudMaterial())
  clouds.scale.setScalar(1.006)
  earth.add(clouds)

  const moon = new Mesh(UNIT_SPHERE, surfaceMaterial('Moon'))
  moon.userData.bodyName = 'Moon'
  moon.scale.setScalar(km(MOON_RADIUS_KM))

  const sun = new Mesh(new SphereGeometry(1, 48, 32), emissiveMaterial('Sun'))
  sun.userData.bodyName = 'Sun'

  const lunarOrbit  = new Line(new BufferGeometry(), new LineBasicMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.8 }))
  const eclipticRing = dashedCircle(km(384400), '#38bdf8', 0.45)
  const nodeLine     = new Line(new BufferGeometry(), new LineBasicMaterial({ color: '#fbbf24', transparent: true, opacity: 0.85 }))
  const sunRay       = new Line(new BufferGeometry(), new LineBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.5 }))

  const earthUmbra    = shadowCone(0, '#4338ca', 0.34)
  const earthPenumbra = shadowCone(PENUMBRA_RATIO, '#94a3b8', 0.1)
  const moonUmbra     = shadowCone(0, '#4338ca', 0.38)
  const moonPenumbra  = shadowCone(PENUMBRA_RATIO, '#94a3b8', 0.12)
  const shadows = new Group()
  shadows.add(earthUmbra, earthPenumbra, moonUmbra, moonPenumbra)
  // Kept off the inset camera's layers: standing inside a shadow cone would tint the whole view.
  shadows.traverse(object => object.layers.set(SHADOW_LAYER))
  camera.layers.enable(SHADOW_LAYER)

  const labels = new Group()
  const earthLabel = makeLabel(labelFor('Earth'), '#6bb1e8', 26)
  const moonLabel  = makeLabel(labelFor('Moon'), '#dbeafe', 20)
  const sunLabel   = makeLabel(labelFor('Sun'), '#ffd166', 90)
  labels.add(earthLabel, moonLabel, sunLabel)
  labels.traverse(object => object.layers.set(LABEL_LAYER))
  camera.layers.enable(LABEL_LAYER)

  const stars = starSphere(30000)
  scene.add(earth, moon, sun, lunarOrbit, eclipticRing, nodeLine, sunRay, shadows, labels, stars)

  let lastOrbitDay = NaN
  let lastLayout   = null

  const rebuildLunarOrbit = (when, distanceScale) => {
    const points = lunarOrbitPath(when).map(point => vector3({
      x: auToUnits(point.x) * distanceScale,
      y: auToUnits(point.y) * distanceScale,
      z: auToUnits(point.z) * distanceScale,
    }))
    lunarOrbit.geometry.dispose()
    lunarOrbit.geometry = new BufferGeometry().setFromPoints(points)

    // The nodes are where the tilted lunar orbit crosses the ecliptic plane: eclipses only happen there.
    const crossings = []
    for (let index = 1; index < points.length; index += 1) {
      if (Math.sign(points[index].y) === Math.sign(points[index - 1].y)) continue
      crossings.push(points[index].clone().setY(0).setLength(km(420000) * distanceScale))
    }
    nodeLine.geometry.dispose()
    nodeLine.geometry = new BufferGeometry().setFromPoints(
      crossings.length >= 2 ? [crossings[0], new Vector3(), crossings[1]] : []
    )
  }

  const update = (state) => {
    const layout   = LAYOUTS[state.view === 'eclipses' || state.scaleMode === 'true' ? 'true' : 'diagram']
    const when     = new Date(state.timeMs)
    const moonGeo  = geoEcliptic('Moon', when)
    const sunGeo   = geoEcliptic('Sun', when)
    const sunAu    = lengthAu(sunGeo)
    const sunDir   = new Vector3(sunGeo.x, sunGeo.y, sunGeo.z).normalize()
    const moonPos  = new Vector3(auToUnits(moonGeo.x), auToUnits(moonGeo.y), auToUnits(moonGeo.z)).multiplyScalar(layout.distance)
    const day      = Math.floor(state.timeMs / 86400000)

    if (Math.abs(day - lastOrbitDay) > 3 || lastLayout !== layout) {
      rebuildLunarOrbit(when, layout.distance)
      eclipticRing.scale.setScalar(layout.distance)
      lastOrbitDay = day
      lastLayout   = layout
    }

    moon.position.copy(moonPos)
    earth.scale.setScalar(km(EARTH_RADIUS_KM) * layout.body)
    moon.scale.setScalar(km(MOON_RADIUS_KM) * layout.body)
    applyOrientation(earth, orientationBasis('Earth', when))
    applyOrientation(moon, orientationBasis('Moon', when))

    // Sun kept at its true angular size: a disc of the right diameter at a workable distance.
    sun.position.copy(sunDir.clone().multiplyScalar(SUN_DISTANCE))
    sun.scale.setScalar(SUN_DISTANCE * (SUN_RADIUS_KM / (sunAu * AU_KM)))

    sunLight.position.copy(sun.position)
    sunLight.target.position.set(0, 0, 0)
    earth.material.uniforms.sunDirection.value.copy(sunDir)
    clouds.material.uniforms.sunDirection.value.copy(sunDir)

    sunRay.geometry.dispose()
    sunRay.geometry = new BufferGeometry().setFromPoints([sun.position.clone(), new Vector3(), moonPos.clone()])
    sunRay.visible  = state.showOrbits
    lunarOrbit.visible = state.showOrbits
    eclipticRing.visible = state.showOrbits
    nodeLine.visible = state.showOrbits
    stars.visible   = state.showStarMap
    labels.visible  = state.showLabels
    // When an eclipse is selected, only the cone that causes it stays on screen.
    const focus = state.shadowFocus || 'all'
    shadows.visible      = state.showShadows && layout.shadows
    earthUmbra.visible    = focus !== 'solar'
    earthPenumbra.visible = focus !== 'solar'
    moonUmbra.visible     = focus !== 'lunar'
    moonPenumbra.visible  = focus !== 'lunar'

    const antiSun    = sunDir.clone().negate()
    const sunKm      = sunAu * AU_KM
    const earthCone  = umbraCone(EARTH_RADIUS_KM, sunKm)
    const moonCone   = umbraCone(MOON_RADIUS_KM, sunKm)

    const origin      = new Vector3()
    const earthDrawKm = Math.min(earthCone.lengthKm, (moonPos.length() / layout.distance) * UNIT_KM * 1.3)
    const growth      = (SUN_RADIUS_KM + EARTH_RADIUS_KM) / sunKm

    truncateCone(earthUmbra, 1 - earthDrawKm / earthCone.lengthKm)
    truncateCone(earthPenumbra, 1 + (growth * earthDrawKm) / EARTH_RADIUS_KM)
    orientCone(earthUmbra, antiSun, km(EARTH_RADIUS_KM), km(earthDrawKm) * layout.distance, origin)
    orientCone(earthPenumbra, antiSun, km(EARTH_RADIUS_KM), km(earthDrawKm) * layout.distance, origin)
    orientCone(moonUmbra, antiSun, km(MOON_RADIUS_KM), km(moonCone.lengthKm) * layout.distance, moonPos)
    orientCone(moonPenumbra, antiSun, km(MOON_RADIUS_KM), km(moonCone.lengthKm) * layout.distance, moonPos)

    earthLabel.position.set(0, 0, 0)
    moonLabel.position.copy(moonPos)
    sunLabel.position.copy(sun.position)

    scene.userData.moonPosition = moonPos
    scene.userData.sunDirection = sunDir
    scene.userData.earthRadius  = earth.scale.x
    scene.userData.moonRadius   = moon.scale.x
  }

  const framing = state => (state?.view === 'eclipses' ? 1000 : 820)

  const dispose = () => {
    disposeObject(scene)
    scene.clear()
  }

  return { scene, camera, update, dispose, framing, pickables: [earth, moon, sun], bodies: new Map([['Earth', earth], ['Moon', moon], ['Sun', sun]]) }
}
