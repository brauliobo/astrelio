import { AmbientLight, CylinderGeometry, Group, Mesh, PerspectiveCamera, Scene, SphereGeometry, TorusGeometry, Vector3 } from 'three'
import { AU_KM, BODY_BY_NAME, EARTH_RADIUS_KM, MOON_RADIUS_KM, SUN_RADIUS_KM } from '../../../lib/planetarium/constants.js'
import { geoEcliptic, lengthAu, orientationBasis } from '../../../lib/planetarium/ephemeris3d.js'
import { lunarOrbitPath } from '../../../lib/planetarium/orbits.js'
import { shadowProjection } from '../../../lib/planetarium/shadows.js'
import {
  attachClouds,
  applyOrientation,
  disposeObject,
  namedBody,
  setOccultor,
  setShadowSlice,
  setSunDirection,
  shadowMaterial,
  shadowRimMesh,
  shadowSliceMesh,
  starSphere,
} from '../../../lib/planetarium/materials.js'
import {
  LABEL_LAYER,
  SHADOW_LAYER,
  UP,
  circlePoints,
  equatorialSide,
  faceAlong,
  fitLabelsToCamera,
  layeredLabel,
  pathLine,
  pathSegments,
  placeAlong,
  setLayer,
  setLinePoints,
  toVector3,
  visibleOf,
} from '../../../lib/planetarium/sceneGraph.js'

// One scene unit is 1000 km: Earth is 6.4 units wide, the Moon sits 384 units away.
const UNIT_KM      = 1000
const SUN_DISTANCE = 2400
const km           = value => value / UNIT_KM
const auToUnits    = au => km(au * AU_KM)
const MOON_PERIOD  = BODY_BY_NAME.get('Moon').periodDays
const ORIGIN = { x: 0, y: 0, z: 0 }

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

const shadowLoop = (color, opacity, kind, bodyName) => {
  const mesh = new Mesh(new TorusGeometry(1, 0.016, 8, 96), shadowMaterial(color, opacity))
  mesh.renderOrder = 5
  mesh.userData = { kind, bodyName, baseOpacity: opacity, radiusKm: 0 }
  return mesh
}

const shadowCone = (topRatio, color, opacity) => {
  const cone = new Mesh(coneGeometry(topRatio), shadowMaterial(color, opacity))
  cone.userData.topRatio = topRatio
  cone.userData.kind = topRatio === 0 ? 'umbra' : 'penumbra'
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

const kmVector = (vector) => ({ x: vector.x * AU_KM, y: vector.y * AU_KM, z: vector.z * AU_KM })

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

const makeCaster = (bodyName, colors, captionFor) => ({
  umbraCone:     shadowCone(0, colors.umbra, 0.12),
  penumbraCone:  shadowCone(PENUMBRA_RATIO, colors.penumbra, 0.055),
  terminator:    shadowRimMesh({ color: colors.umbraEdge, opacity: 0.5, kind: 'umbra', bodyName }),
  umbraSlice:    shadowSliceMesh({ color: colors.umbraSlice, opacity: 0.4, kind: 'umbra', bodyName }),
  penumbraSlice: shadowSliceMesh({ color: colors.penumbraSlice, opacity: 0.16, kind: 'penumbra', bodyName }),
  umbraLoop:     shadowLoop(colors.umbraEdge, 0.9, 'umbra', bodyName),
  penumbraLoop:  shadowLoop(colors.penumbraEdge, 0.7, 'penumbra', bodyName),
  umbraEdges:    pathSegments([], { color: colors.umbraEdge, opacity: 0.85, kind: 'umbra', bodyName }),
  penumbraEdges: pathSegments([], { color: colors.penumbraEdge, opacity: 0.55, kind: 'penumbra', bodyName }),
  umbraLabel:    layeredLabel(captionFor('umbra'), colors.umbraEdge, 10),
  penumbraLabel: layeredLabel(captionFor('penumbra'), colors.penumbraEdge, 9),
})

export const createMoonLabScene = ({ labelFor = name => name, captionFor = key => key } = {}) => {
  const scene  = new Scene()
  const camera = new PerspectiveCamera(38, 1, 0.1, 60000)
  camera.position.set(0, 900, 0)
  camera.layers.enable(SHADOW_LAYER)
  camera.layers.enable(LABEL_LAYER)

  const earth = attachClouds(namedBody('Earth'))
  const moon  = namedBody('Moon')
  const sun   = namedBody('Sun', new SphereGeometry(1, 48, 32))
  earth.scale.setScalar(km(EARTH_RADIUS_KM))
  moon.scale.setScalar(km(MOON_RADIUS_KM))

  const lunarOrbit   = pathLine([], { color: '#c4b5fd', opacity: 0.8, bodyName: 'Moon', periodDays: MOON_PERIOD })
  const eclipticRing = pathLine(circlePoints(km(384400), 240), { color: '#38bdf8', opacity: 0.45, kind: 'ecliptic' })
  const nodeLine     = pathLine([], { color: '#fbbf24', opacity: 0.85, kind: 'nodes' })
  const sunRay       = pathLine([], { color: '#fde68a', opacity: 0.5, kind: 'ray' })

  const earthShadow = makeCaster('Earth', {
    umbra: '#9a3412', umbraSlice: '#c2410c', umbraEdge: '#fdba74',
    penumbra: '#64748b', penumbraSlice: '#94a3b8', penumbraEdge: '#e2e8f0',
  }, captionFor)
  const moonShadow = makeCaster('Moon', {
    umbra: '#312e81', umbraSlice: '#4338ca', umbraEdge: '#a5b4fc',
    penumbra: '#64748b', penumbraSlice: '#818cf8', penumbraEdge: '#c7d2fe',
  }, captionFor)

  const shadows = new Group()
  shadows.add(
    earthShadow.umbraCone, earthShadow.penumbraCone, earthShadow.terminator,
    moonShadow.umbraCone, moonShadow.penumbraCone, moonShadow.terminator,
  )
  // Kept off the inset camera's layers: standing inside a shadow cone would tint the whole view.
  setLayer(shadows, SHADOW_LAYER)

  const projections = new Group()
  projections.add(
    earthShadow.umbraSlice, earthShadow.penumbraSlice, earthShadow.umbraLoop, earthShadow.penumbraLoop,
    earthShadow.umbraEdges, earthShadow.penumbraEdges,
    moonShadow.umbraSlice, moonShadow.penumbraSlice, moonShadow.umbraLoop, moonShadow.penumbraLoop,
    moonShadow.umbraEdges, moonShadow.penumbraEdges,
  )
  setLayer(projections, SHADOW_LAYER)

  const earthLabel = layeredLabel(labelFor('Earth'), '#6bb1e8', 26)
  const moonLabel  = layeredLabel(labelFor('Moon'), '#dbeafe', 20)
  const sunLabel   = layeredLabel(labelFor('Sun'), '#ffd166', 90)
  const labels     = new Group()
  labels.add(earthLabel, moonLabel, sunLabel, earthShadow.umbraLabel, earthShadow.penumbraLabel, moonShadow.umbraLabel, moonShadow.penumbraLabel)

  const stars = starSphere(30000)
  scene.add(new AmbientLight('#ffffff', 0.04), earth, moon, sun, lunarOrbit, eclipticRing, nodeLine, sunRay, shadows, projections, labels, stars)

  let lastOrbitDay = NaN
  let lastLayout   = null

  const rebuildLunarOrbit = (when, distanceScale) => {
    const points = lunarOrbitPath(when).map(point => ({
      x: auToUnits(point.x) * distanceScale,
      y: auToUnits(point.y) * distanceScale,
      z: auToUnits(point.z) * distanceScale,
    }))
    setLinePoints(lunarOrbit, points)

    // The nodes are where the tilted lunar orbit crosses the ecliptic plane: eclipses only happen there.
    const crossings = []
    for (let index = 1; index < points.length; index += 1) {
      if (Math.sign(points[index].y) === Math.sign(points[index - 1].y)) continue
      crossings.push(toVector3(points[index]).setY(0).setLength(km(420000) * distanceScale))
    }
    setLinePoints(nodeLine, crossings.length >= 2 ? [crossings[0], { x: 0, y: 0, z: 0 }, crossings[1]] : [])
  }

  const hideCaster = (caster) => {
    caster.umbraCone.visible = caster.penumbraCone.visible = caster.terminator.visible = false
    caster.umbraSlice.visible = caster.penumbraSlice.visible = false
    caster.umbraLoop.visible = caster.penumbraLoop.visible = false
    caster.umbraEdges.visible = caster.penumbraEdges.visible = false
    caster.umbraLabel.visible = caster.penumbraLabel.visible = false
  }

  const placeProjection = (mesh, center, away, inner, outer, radiusKm, opacity) => {
    setShadowSlice(mesh, inner, outer)
    if (!mesh.visible) return
    mesh.position.copy(center)
    faceAlong(mesh, away)
    mesh.material.opacity = opacity
    mesh.userData.radiusKm = radiusKm
  }

  const placeLoop = (mesh, center, away, radius, opacity) => {
    const visible = radius > 0.02
    mesh.visible = visible
    if (!visible) return
    mesh.position.copy(center)
    mesh.scale.setScalar(radius)
    faceAlong(mesh, away)
    mesh.material.opacity = opacity
    mesh.userData.radiusKm = radius * UNIT_KM
  }

  const placeEdges = (line, origin, away, side, baseRadius, along, tipRadius, opacity) => {
    const tip = origin.clone().addScaledVector(away, along)
    setLinePoints(line, [
      origin.clone().addScaledVector(side, -baseRadius),
      tip.clone().addScaledVector(side, -tipRadius),
      origin.clone().addScaledVector(side, baseRadius),
      tip.clone().addScaledVector(side, tipRadius),
    ])
    line.visible = true
    line.material.opacity = opacity
    line.userData.radiusKm = tipRadius * UNIT_KM
  }

  const applyCaster = (caster, { show, projection, origin, away, side, baseRadius, toUnits, labelsOn }) => {
    if (!show) {
      hideCaster(caster)
      return
    }

    const hits     = projection.hits
    const umbraHit = projection.umbra
    const fade     = hits ? 1 : 0.32
    const drawTo   = Math.max(toUnits(projection.drawAlong), baseRadius * 1.06)
    const umbraTo  = Math.max(Math.min(toUnits(projection.umbraDrawTo), drawTo), baseRadius * 1.04)
    const umbraR   = toUnits(projection.umbraKm)
    const penR     = toUnits(projection.penumbraKm)
    const umbraEnds = umbraTo < drawTo - 0.05
    const gap      = Math.max(0.05, baseRadius * 0.008)
    const sliceAt  = origin.clone().addScaledVector(away, Math.max(drawTo - gap, baseRadius * 1.05))

    caster.umbraCone.visible = umbraTo > baseRadius * 1.05
    caster.penumbraCone.visible = caster.terminator.visible = true
    caster.umbraCone.material.opacity = 0.11 * fade
    caster.penumbraCone.material.opacity = 0.05 * fade
    caster.terminator.material.opacity = 0.5 * (hits ? 1 : 0.4)
    truncateCone(caster.umbraCone, umbraEnds ? 0 : umbraR / Math.max(baseRadius, 1e-6))
    truncateCone(caster.penumbraCone, penR / Math.max(baseRadius, 1e-6))
    orientCone(caster.umbraCone, away, baseRadius, umbraTo, origin)
    orientCone(caster.penumbraCone, away, baseRadius, drawTo, origin)

    caster.terminator.scale.setScalar(baseRadius)
    caster.terminator.position.copy(origin)
    faceAlong(caster.terminator, away)

    if (hits) {
      placeProjection(caster.umbraSlice, sliceAt, away, 0, umbraHit ? umbraR : 0, projection.umbraKm, 0.28)
      placeProjection(caster.penumbraSlice, sliceAt, away, umbraHit ? umbraR : 0, penR, projection.penumbraKm, 0.11)
    } else {
      placeProjection(caster.umbraSlice, sliceAt, away, umbraR * 0.86, umbraR, projection.umbraKm, 0.07)
      placeProjection(caster.penumbraSlice, sliceAt, away, penR * 0.9, penR, projection.penumbraKm, 0.045)
    }

    placeLoop(caster.umbraLoop, sliceAt, away, !hits || umbraHit ? umbraR : 0, hits ? 0.95 : 0.3)
    placeLoop(caster.penumbraLoop, sliceAt, away, penR, hits ? 0.72 : 0.22)
    placeEdges(caster.umbraEdges, origin, away, side, baseRadius, umbraTo, umbraEnds ? 0 : umbraR, 0.8 * fade)
    placeEdges(caster.penumbraEdges, origin, away, side, baseRadius, drawTo, penR, 0.5 * fade)

    caster.umbraLabel.visible = labelsOn && hits && umbraHit
    caster.penumbraLabel.visible = labelsOn && hits
    caster.umbraLabel.position.copy(sliceAt).addScaledVector(side, umbraR * 0.2)
    caster.penumbraLabel.position.copy(sliceAt).addScaledVector(side, penR * 0.82)
  }

  const update = (state) => {
    const layout   = LAYOUTS[state.view === 'eclipses' || state.scaleMode === 'true' ? 'true' : 'diagram']
    const when     = new Date(state.timeMs)
    const moonGeo  = geoEcliptic('Moon', when)
    const sunGeo   = geoEcliptic('Sun', when)
    const sunAu    = lengthAu(sunGeo)
    const sunKm    = sunAu * AU_KM
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

    setSunDirection(earth, sunDir)
    setSunDirection(moon, sunDir)

    setLinePoints(sunRay, [sun.position, new Vector3(), moonPos])
    sunRay.visible = lunarOrbit.visible = eclipticRing.visible = nodeLine.visible = state.showOrbits
    stars.visible  = state.showStarMap
    labels.visible = state.showLabels

    const moonKm      = kmVector(moonGeo)
    const earthOnMoon = shadowProjection({
      caster: ORIGIN, casterRadius: EARTH_RADIUS_KM, target: moonKm, targetRadius: MOON_RADIUS_KM,
      sunDirection: sunGeo, sunDistance: sunKm,
    })
    const moonOnEarth = shadowProjection({
      caster: moonKm, casterRadius: MOON_RADIUS_KM, target: ORIGIN, targetRadius: EARTH_RADIUS_KM,
      sunDirection: sunGeo, sunDistance: sunKm,
    })

    const focus = state.shadowFocus || 'all'
    const canDraw = state.showShadows && layout.shadows
    const showEarth = canDraw && focus !== 'solar'
    const showMoon  = canDraw && focus !== 'lunar' && moonOnEarth.nightSide
    shadows.visible = projections.visible = showEarth || showMoon

    const antiSun = sunDir.clone().negate()
    const side    = equatorialSide(antiSun)
    const origin  = new Vector3()
    const toUnits = value => km(value) * layout.distance

    setOccultor(moon, canDraw && earthOnMoon.hits ? {
      center:         ORIGIN,
      radius:         earth.scale.x,
      umbraLength:    toUnits(earthOnMoon.umbraLength),
      penumbraGrowth: (SUN_RADIUS_KM + EARTH_RADIUS_KM) / sunKm,
      copper:         1,
    } : null)
    setOccultor(earth, canDraw && moonOnEarth.hits ? {
      center:         moonPos,
      radius:         moon.scale.x,
      umbraLength:    toUnits(moonOnEarth.umbraLength),
      penumbraGrowth: (SUN_RADIUS_KM + MOON_RADIUS_KM) / sunKm,
      copper:         0,
    } : null)

    applyCaster(earthShadow, {
      show: showEarth, projection: earthOnMoon, origin, away: antiSun, side,
      baseRadius: earth.scale.x, toUnits, labelsOn: state.showLabels,
    })
    applyCaster(moonShadow, {
      show: showMoon, projection: moonOnEarth, origin: moonPos.clone(), away: antiSun, side,
      baseRadius: moon.scale.x, toUnits, labelsOn: state.showLabels,
    })

    earthLabel.position.set(0, 0, 0)
    moonLabel.position.copy(moonPos)
    sunLabel.position.copy(sun.position)
    fitLabelsToCamera(camera, labels.children, 0.034)

    scene.userData.moonPosition = moonPos
    scene.userData.sunDirection = sunDir
    scene.userData.earthRadius  = earth.scale.x
    scene.userData.moonRadius   = moon.scale.x
  }

  const shadowHoverables = [
    earthShadow.umbraSlice, earthShadow.penumbraSlice, earthShadow.umbraLoop, earthShadow.penumbraLoop,
    earthShadow.umbraEdges, earthShadow.penumbraEdges,
    moonShadow.umbraSlice, moonShadow.penumbraSlice, moonShadow.umbraLoop, moonShadow.penumbraLoop,
    moonShadow.umbraEdges, moonShadow.penumbraEdges,
  ]

  return {
    scene,
    camera,
    update,
    dispose:    () => { disposeObject(scene); scene.clear() },
    framing:    state => (state?.view === 'eclipses' ? 620 : 820),
    pose:       (state) => {
      if (state?.view !== 'eclipses') return null
      const moon = scene.userData.moonPosition
      const sun  = scene.userData.sunDirection
      if (!moon || !sun) return null
      const side = equatorialSide(sun)
      const focus = state.shadowFocus || 'all'
      if (focus === 'lunar') {
        const dist = Math.max(28, (scene.userData.moonRadius || 1.7) * 16)
        return {
          target: moon.clone(),
          position: placeAlong(moon, [[sun, dist], [side, dist * 0.32], [UP, dist * 0.18]]),
        }
      }
      if (focus === 'solar') {
        const dist = Math.max(34, (scene.userData.earthRadius || 6.4) * 5.6)
        const origin = new Vector3()
        return {
          target: origin,
          position: placeAlong(origin, [[sun, dist], [side, dist * 0.32], [UP, dist * 0.18]]),
        }
      }
      const mid  = moon.clone().multiplyScalar(0.45)
      const dist = Math.max(moon.length() * 0.7, 240)
      return {
        target: mid,
        position: placeAlong(mid, [[side, dist], [UP, dist * 0.22], [sun, dist * 0.14]]),
      }
    },
    pickables:  [earth, moon, sun],
    bodies:     new Map([['Earth', earth], ['Moon', moon], ['Sun', sun]]),
    hoverables: () => visibleOf(lunarOrbit, eclipticRing, nodeLine, shadowHoverables),
  }
}
