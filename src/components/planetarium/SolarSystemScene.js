import { PerspectiveCamera, Raycaster, Vector2, Vector3, WebGLRenderer, ACESFilmicToneMapping } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createOrreryScene } from './scenes/orrery.js'
import { createMoonLabScene } from './scenes/moonLab.js'
import { createSkyScene } from './scenes/skyView.js'

export const CAMERA_PRESETS = {
  orrery:     ['top', 'oblique', 'edge'],
  moon:       ['above', 'from_earth', 'side'],
  eclipses:   ['shadow_axis', 'above', 'from_earth'],
  retrograde: ['sky', 'ecliptic'],
}

const sceneForView = view => (view === 'orrery' ? 'orrery' : view === 'retrograde' ? 'sky' : 'moonLab')

export const supportsWebgl = () => {
  if (typeof document === 'undefined') return false
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

export const createPlanetarium = ({ canvas, host, onPick, labelFor }) => {
  const renderer = new WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' })
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2))

  const options = { labelFor }
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
    control.minDistance   = key === 'moonLab' ? 12 : key === 'orrery' ? 0.00002 : 0.02
    control.maxDistance   = key === 'moonLab' ? 40000 : key === 'sky' ? 900 : 4000
    controls.set(key, control)
  }

  // Second viewport used by the phase and retrograde views to show the same instant from another vantage.
  const insetCamera = new PerspectiveCamera(34, 1, 0.05, 60000)
  const raycaster   = new Raycaster()
  const pointer     = new Vector2()

  let activeView  = 'orrery'
  let activeState = null
  let insetMode   = 'none'

  const active = () => scenes[sceneForView(activeView)]

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
    const control  = controls.get(sceneForView(view))
    const pose     = entry.pose?.(activeState)
    control.target.set(0, 0, 0)

    if (pose) {
      control.target.copy(pose.target)
      entry.camera.position.copy(pose.position)
      control.update()
      return
    }

    if (view === 'orrery') entry.camera.position.set(0, distance * 0.72, distance * 0.86)
    if (view === 'moon') entry.camera.position.set(0, distance, 0.001)
    if (view === 'eclipses') entry.camera.position.set(distance * 0.5, distance * 0.22, distance * 0.5)
    if (view === 'retrograde') entry.camera.position.set(0, distance * 0.35, distance * 0.8)
    control.update()
  }

  const setView = (view) => {
    if (activeView === view) return
    activeView = view
    insetMode  = view === 'moon' || view === 'eclipses' ? 'fromEarth' : view === 'retrograde' ? 'helio' : 'none'
    frameCamera(view)
  }

  /**
   * Line the camera up across the Sun–Earth–Moon shadow axis. A solar eclipse reads on Earth, where
   * the Moon's umbra lands; a lunar eclipse reads at the Moon, inside Earth's umbra.
   */
  const alignShadowAxis = (kind = 'solar') => {
    const entry     = scenes.moonLab
    const direction = entry.scene.userData.sunDirection || new Vector3(1, 0, 0)
    const control   = controls.get('moonLab')
    const side      = new Vector3(0, 1, 0).cross(direction).normalize()
    const solar     = kind !== 'lunar'
    const target    = solar ? new Vector3() : (entry.scene.userData.moonPosition || new Vector3())
    const distance  = solar ? 34 : 150

    control.target.copy(target)
    entry.camera.position.copy(target.clone()
      .add(side.multiplyScalar(distance))
      .add(direction.clone().multiplyScalar(distance * 0.35)))
    control.update()
  }

  const updateInsetCamera = () => {
    const entry = active()
    if (insetMode === 'fromEarth') {
      const moon = entry.scene.userData.moonPosition || new Vector3(0, 0, 1)
      const moonRadius = entry.scene.userData.moonRadius || 1.7374
      insetCamera.position.copy(moon.clone().setLength((entry.scene.userData.earthRadius || 6.371) * 1.05))
      insetCamera.up.set(0, 1, 0)
      insetCamera.lookAt(moon)
      // Frame the Moon at a few times its apparent size, whichever layout the scene is using.
      insetCamera.fov = Math.max(1.2, (Math.atan(moonRadius / moon.length()) * 180) / Math.PI * 6)
      insetCamera.layers.set(0)
      insetCamera.updateProjectionMatrix()
    }
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
    const entry = active()
    controls.get(sceneForView(activeView)).update()
    renderer.setViewport(0, 0, size.width, size.height)
    renderer.render(entry.scene, entry.camera)
    renderInset(size)
  }

  const onResize = () => { size = resize() }

  const pick = (event) => {
    const rect = canvas.getBoundingClientRect()
    pointer.x  = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y  = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, active().camera)
    const hit  = raycaster.intersectObjects(active().pickables, true)[0]
    const name = hit?.object?.userData?.bodyName
    if (name) onPick?.(name)
  }

  // Applied from the render loop: a moon only takes its place once the frame's update has run.
  let pendingFocus = null

  const focusBody = (name) => { pendingFocus = name }

  const applyFocus = (name) => {
    const entry = active()
    const mesh  = entry.bodies?.get(name)
    if (!mesh) return
    const control = controls.get(sceneForView(activeView))
    control.target.copy(mesh.position)
    // Close enough to fill the frame with the body, wide enough to hold its moon system.
    const reach    = entry.systemReach?.(name, activeState || {}) || 0
    const distance = Math.max(0.05, mesh.scale.x * (activeState?.scaleMode === 'true' ? 6 : 8), reach * 3.2)
    // Approach from the sunward side in the orrery, so the body arrives lit rather than in shadow.
    const approach = sceneForView(activeView) === 'orrery' && mesh.position.length() > 0
      ? mesh.position.clone().negate().normalize()
      : new Vector3(1, 0, 1).normalize()

    entry.camera.position.copy(mesh.position.clone()
      .add(approach.multiplyScalar(distance))
      .add(new Vector3(0, distance * 0.35, 0)))
    control.update()
  }

  const dispose = () => {
    for (const control of controls.values()) control.dispose()
    for (const entry of Object.values(scenes)) entry.dispose()
    renderer.dispose()
  }

  frameCamera(activeView)

  return { update, render, onResize, pick, focusBody, frameCamera, alignShadowAxis, dispose, renderer }
}
