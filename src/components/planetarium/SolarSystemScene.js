import { PerspectiveCamera, Raycaster, Vector2, Vector3, WebGLRenderer, ACESFilmicToneMapping } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { focusDistance } from '../../lib/planetarium/scale.js'
import { bodyNameOf, equatorialSide, placeAlong, SHADOW_LAYER, terminatorApproach, UP } from '../../lib/planetarium/sceneGraph.js'
import { createOrreryScene } from './scenes/orrery.js'
import { createMoonLabScene } from './scenes/moonLab.js'
import { createSkyScene } from './scenes/skyView.js'

export const CAMERA_PRESETS = {
  orrery:     ['top', 'oblique', 'edge'],
  moon:       ['above', 'from_earth', 'side'],
  eclipses:   ['shadow_axis', 'above', 'from_earth'],
  retrograde: ['sky', 'ecliptic'],
}

const SCENE_KEY = { orrery: 'orrery', retrograde: 'sky' }
const sceneForView = view => SCENE_KEY[view] || 'moonLab'

const FRAME = {
  orrery:     d => [0, d * 0.72, d * 0.86],
  moon:       d => [0, d, 0.001],
  eclipses:   d => [d * 0.5, d * 0.22, d * 0.5],
  retrograde: d => [0, d * 0.35, d * 0.8],
}

const CONTROL_RANGE = {
  orrery:  { min: 0.00002, max: 4000 },
  moonLab: { min: 12,      max: 40000 },
  sky:     { min: 0.02,    max: 900 },
}

export const supportsWebgl = () => {
  if (typeof document === 'undefined') return false
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

export const createPlanetarium = ({ canvas, host, onPick, labelFor, captionFor }) => {
  const renderer = new WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' })
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2))

  const options = { labelFor, captionFor }
  const scenes  = {
    orrery:  createOrreryScene(options),
    moonLab: createMoonLabScene(options),
    sky:     createSkyScene(options),
  }

  const controls = new Map()
  for (const [key, entry] of Object.entries(scenes)) {
    const control = new OrbitControls(entry.camera, canvas)
    control.enableDamping = true
    control.dampingFactor = 0.08
    // Small enough to fly right up to a planet when the orrery is at true scale (1 unit = 1 au).
    const range = CONTROL_RANGE[key]
    control.minDistance = range.min
    control.maxDistance = range.max
    controls.set(key, control)
  }

  // Second viewport used by the phase and retrograde views to show the same instant from another vantage.
  const insetCamera = new PerspectiveCamera(34, 1, 0.05, 60000)
  const raycaster   = new Raycaster()
  raycaster.layers.enable(SHADOW_LAYER)
  const pointer     = new Vector2()

  let activeView    = 'orrery'
  let activeState   = null
  let insetMode     = 'none'
  let hoveredLine   = null
  let pendingFocus  = null
  let pendingShadow = null

  const active = () => scenes[sceneForView(activeView)]
  const controlOf = (view = activeView) => controls.get(sceneForView(view))

  const paintHover = (line) => {
    if (hoveredLine === line) return
    if (hoveredLine?.material && hoveredLine.userData.baseOpacity != null) {
      hoveredLine.material.opacity = hoveredLine.userData.baseOpacity
    }
    hoveredLine = line || null
    if (hoveredLine?.material) {
      hoveredLine.material.opacity = Math.min(1, (hoveredLine.userData.baseOpacity ?? 0.4) + 0.45)
    }
  }

  const resize = () => {
    const rect   = host.getBoundingClientRect()
    const width  = Math.max(1, Math.floor(rect.width))
    const height = Math.max(1, Math.floor(rect.height))
    renderer.setSize(width, height, false)
    for (const entry of Object.values(scenes)) {
      entry.camera.aspect = width / height
      entry.camera.updateProjectionMatrix()
    }
    insetCamera.aspect = 1
    insetCamera.updateProjectionMatrix()
    return { width, height }
  }

  const frameCamera = (view) => {
    const entry    = active()
    const distance = entry.framing(activeState || { scaleMode: 'compressed' })
    const control  = controlOf(view)
    const pose     = entry.pose?.(activeState)
    control.target.set(0, 0, 0)

    if (pose) {
      control.target.copy(pose.target)
      entry.camera.position.copy(pose.position)
    } else if (FRAME[view]) {
      entry.camera.position.set(...FRAME[view](distance))
    }
    control.update()
  }

  const setView = (view) => {
    if (activeView === view) return
    paintHover(null)
    activeView = view
    insetMode  = view === 'moon' || view === 'eclipses' ? 'fromEarth' : view === 'retrograde' ? 'helio' : 'none'
    frameCamera(view)
  }

  const alignShadowAxis = (kind = 'solar') => { pendingShadow = kind }

  const applyShadowAxis = (kind = 'solar') => {
    const entry       = scenes.moonLab
    const sun         = entry.scene.userData.sunDirection || new Vector3(1, 0, 0)
    const moon        = entry.scene.userData.moonPosition || new Vector3()
    const moonRadius  = entry.scene.userData.moonRadius || 1.7374
    const earthRadius = entry.scene.userData.earthRadius || 6.371
    const solar       = kind !== 'lunar'
    const target      = solar ? new Vector3() : moon.clone()
    const distance    = solar ? Math.max(34, earthRadius * 5.6) : Math.max(28, moonRadius * 16)
    const side        = equatorialSide(sun)

    const control = controlOf('eclipses')
    control.target.copy(target)
    // Stand on the sunward side, a little off-axis, so the stamp is a circle on the body not a line.
    entry.camera.position.copy(placeAlong(target, [
      [sun, distance],
      [side, distance * 0.32],
      [UP, distance * 0.18],
    ]))
    control.update()
  }

  const updateInsetCamera = () => {
    const entry = active()
    if (insetMode !== 'fromEarth') return
    const moon       = entry.scene.userData.moonPosition || new Vector3(0, 0, 1)
    const moonRadius = entry.scene.userData.moonRadius || 1.7374
    insetCamera.position.copy(moon.clone().setLength((entry.scene.userData.earthRadius || 6.371) * 1.05))
    insetCamera.up.set(0, 1, 0)
    insetCamera.lookAt(moon)
    // Frame the Moon at a few times its apparent size, whichever layout the scene is using.
    insetCamera.fov = Math.max(1.2, (Math.atan(moonRadius / moon.length()) * 180) / Math.PI * 6)
    insetCamera.layers.set(0)
    insetCamera.updateProjectionMatrix()
  }

  const renderInset = (size) => {
    if (insetMode === 'none') return
    const side = Math.round(Math.min(size.width, size.height) * 0.28)
    const pad  = 16
    renderer.setScissorTest(true)
    renderer.setViewport(size.width - side - pad, pad, side, side)
    renderer.setScissor(size.width - side - pad, pad, side, side)
    renderer.clear(true, true, false)

    const entry = active()
    if (insetMode === 'helio' && entry.inset) {
      entry.inset.camera.aspect = 1
      entry.inset.camera.updateProjectionMatrix()
      renderer.render(entry.scene, entry.inset.camera)
    } else if (insetMode === 'fromEarth') {
      updateInsetCamera()
      renderer.render(entry.scene, insetCamera)
    }
    renderer.setScissorTest(false)
    renderer.setViewport(0, 0, size.width, size.height)
  }

  let size = resize()

  const update = (state) => {
    activeState = state
    setView(state.view)
    active().update(state)
  }

  const render = () => {
    if (pendingFocus) {
      applyFocus(pendingFocus)
      pendingFocus = null
    }
    if (pendingShadow) {
      applyShadowAxis(pendingShadow)
      pendingShadow = null
    }
    const entry = active()
    controlOf().update()
    renderer.setViewport(0, 0, size.width, size.height)
    renderer.render(entry.scene, entry.camera)
    renderInset(size)
  }

  const onResize = () => { size = resize() }

  const pointerFromEvent = (event) => {
    const rect = canvas.getBoundingClientRect()
    pointer.x  = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y  = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  const hitAt = (event, objects, recursive = true) => {
    pointerFromEvent(event)
    raycaster.setFromCamera(pointer, active().camera)
    return raycaster.intersectObjects(objects, recursive)[0]
  }

  const pick = (event) => {
    const name = bodyNameOf(hitAt(event, active().pickables)?.object)
    if (name) onPick?.(name)
  }

  const hover = (event) => {
    const entry = active()
    if (bodyNameOf(hitAt(event, entry.pickables)?.object)) {
      paintHover(null)
      return null
    }

    raycaster.params.Line.threshold = Math.max(0.012, Math.min(0.22, entry.camera.position.length() * 0.0022))
    const hit = raycaster.intersectObjects(entry.hoverables?.() ?? [], false)[0]
    paintHover(hit?.object || null)
    if (!hit) return null
    const { kind = 'orbit', bodyName = '', periodDays = 0, radiusKm = 0 } = hit.object.userData
    return { kind, bodyName, periodDays, radiusKm }
  }

  const clearHover = () => paintHover(null)

  const focusBody = (name) => { pendingFocus = name }

  const applyFocus = (name) => {
    const entry = active()
    const mesh  = entry.bodies?.get(name)
    if (!mesh) return
    const control = controlOf()
    control.target.copy(mesh.position)
    // True scale frames the disc itself. Compressed mode can pull back to hold the moon system,
    // which is already laid out just outside the exaggerated planet.
    const trueScale = activeState?.scaleMode === 'true'
    const reach     = !trueScale && activeState?.showMoons
      ? (entry.systemReach?.(name, activeState || {}) || 0)
      : 0
    const distance  = focusDistance(mesh.scale.x, {
      fovDeg: entry.camera.fov,
      trueScale,
      moonReach: reach,
    })
    // Stand off the sun-body line, slightly above, so the terminator cuts across the disc
    // instead of hiding on the limb of a fully lit face. In the moon lab the Sun is not at the
    // origin, so the stored sunward vector is the one that matches the shader.
    const sunward = sceneForView(activeView) === 'orrery'
      ? (mesh.position.length() > 0 ? mesh.position.clone().negate().normalize() : new Vector3(1, 0, 0))
      : (entry.scene.userData.sunDirection?.clone().normalize() || new Vector3(1, 0, 0))

    entry.camera.position.copy(mesh.position.clone().addScaledVector(terminatorApproach(sunward), distance))
    control.update()
  }

  const dispose = () => {
    paintHover(null)
    for (const control of controls.values()) control.dispose()
    for (const entry of Object.values(scenes)) entry.dispose()
    renderer.dispose()
  }

  frameCamera(activeView)

  return { update, render, onResize, pick, hover, clearHover, focusBody, frameCamera, alignShadowAxis, dispose, renderer }
}
