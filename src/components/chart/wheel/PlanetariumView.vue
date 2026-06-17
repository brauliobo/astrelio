<script setup>
import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  DirectionalLight,
  Line,
  LineBasicMaterial,
  LineLoop,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PLANET_SYMBOLS, norm360 } from './geometry.js'

const publicAssetUrl = path => `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`
const planetTexture  = name => publicAssetUrl(`planets/${name.toLowerCase()}.jpg`)
const DEG_TO_RAD     = Math.PI / 180
const MIN_CAMERA     = 340
const MAX_CAMERA     = 760
const ZODIAC_SIGNS   = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

const BODY_STYLE = {
  Sun: {
    texture: planetTexture('sun'),
    radius:  18,
    orbit:   0,
    color:   '#ffd166',
  },
  Moon: {
    texture: planetTexture('moon'),
    radius:  5.4,
    orbit:   64,
    color:   '#dbeafe',
  },
  Mercury: {
    texture: planetTexture('mercury'),
    radius:  4.5,
    orbit:   84,
    color:   '#94a3b8',
  },
  Venus: {
    texture: planetTexture('venus'),
    radius:  6.2,
    orbit:   105,
    color:   '#f6c453',
  },
  Mars: {
    texture: planetTexture('mars'),
    radius:  5.5,
    orbit:   127,
    color:   '#f97316',
  },
  Jupiter: {
    texture: planetTexture('jupiter'),
    radius:  10.5,
    orbit:   154,
    color:   '#fbbf24',
  },
  Saturn: {
    texture: planetTexture('saturn'),
    radius:  9.4,
    orbit:   180,
    color:   '#fde68a',
  },
  Uranus: {
    texture: planetTexture('uranus'),
    radius:  7,
    orbit:   204,
    color:   '#67e8f9',
  },
  Neptune: {
    texture: planetTexture('neptune'),
    radius:  7,
    orbit:   226,
    color:   '#38bdf8',
  },
  Pluto: {
    texture: planetTexture('pluto'),
    radius:  4.4,
    orbit:   248,
    color:   '#c084fc',
  },
}

const ZODIAC_RADIUS = 320

const props = defineProps({
  chart:             { type: Object, required: true },
  wheelShift:        { type: Number, default: 0 },
  highlightedBodies: { type: Array, default: () => [] },
  interactive:       { type: Boolean, default: true },
  background:        { type: Boolean, default: false },
  centerOffset:      { type: Object, default: () => ({ x: 0, y: 0 }) },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])
const { t } = useI18n()

const canvas          = ref(null)
const host            = ref(null)
const webglError      = ref(false)
const selectedBody    = ref('')
const cameraDistance  = ref(620)
const highlightedBody = computed(() => props.highlightedBodies[0] || selectedBody.value)
const bodies          = computed(() => {
  const positions = new Map((props.chart?.positions || []).map(position => [position.name, position]))
  return Object.entries(BODY_STYLE).map(([name, style]) => ({
    name,
    style,
    orbit:     positions.get(name)?.orbit || null,
    orbitPath: positions.get(name)?.orbitPath || [],
    longitude: name === 'Sun'
      ? 0
      : norm360((positions.get(name)?.longitude || 0) + props.wheelShift),
  }))
})

let animationFrame = 0
let camera         = null
let dragging       = false
let dragMoved      = false
let lastPointer    = { x: 0, y: 0 }
let resizeObserver = null
let renderer       = null
let scene          = null
let sceneRoot      = null
let textureLoader  = null

const meshes = new Map()
const labels = new Map()
const rings  = []
const ray    = new Raycaster()
const mouse  = new Vector2()

const disposeObject = (object) => {
  if (!object) return
  object.children?.forEach(disposeObject)
  object.geometry?.dispose?.()
  if (Array.isArray(object.material)) {
    object.material.forEach(material => material.dispose?.())
  } else {
    object.material?.map?.dispose?.()
    object.material?.dispose?.()
  }
}

const disposeScene = () => {
  cancelAnimationFrame(animationFrame)
  animationFrame = 0
  resizeObserver?.disconnect?.()
  resizeObserver = null
  for (const mesh of meshes.values()) disposeObject(mesh)
  for (const label of labels.values()) disposeObject(label)
  for (const ring of rings) disposeObject(ring)
  meshes.clear()
  labels.clear()
  rings.length = 0
  renderer?.dispose?.()
  renderer = null
  scene    = null
  camera   = null
}

const labelTexture = (text, color = '#e2e8f0') => {
  const size          = 128
  const drawingCanvas = document.createElement('canvas')
  drawingCanvas.width = size
  drawingCanvas.height = size
  const ctx = drawingCanvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle    = color
  ctx.font         = '700 48px Georgia, serif'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, size / 2, size / 2)
  const texture       = new CanvasTexture(drawingCanvas)
  texture.colorSpace  = SRGBColorSpace
  texture.wrapS       = ClampToEdgeWrapping
  texture.wrapT       = ClampToEdgeWrapping
  return texture
}

const makeLabel = (text, color, scale = 22) => {
  const sprite = new Sprite(new SpriteMaterial({
    map:         labelTexture(text, color),
    transparent: true,
    depthTest:   false,
  }))
  sprite.scale.set(scale, scale, 1)
  return sprite
}

const eclipticPoint = (radius, longitude, y = 0) => {
  const angle = (180 - longitude) * DEG_TO_RAD
  return new Vector3(
    Math.cos(angle) * radius,
    y,
    Math.sin(angle) * radius
  )
}

const visualOrbitRadius = (distanceAu) => {
  const safeDistance = Math.max(0, Number(distanceAu) || 0)
  return 42 + Math.log1p(safeDistance) * 76
}

const visualOrbitPathRadius = (distanceAu, averageDistanceAu) => {
  const radius        = visualOrbitRadius(distanceAu)
  const averageRadius = visualOrbitRadius(averageDistanceAu)
  return averageRadius + (radius - averageRadius) * 2.4
}

const bodyOrbitLongitude = (body) => norm360((body.orbit?.longitude ?? body.longitude) + props.wheelShift)

const bodyOrbitRadius = (body) => body.orbit?.distanceAu
  ? visualOrbitRadius(body.orbit.distanceAu)
  : body.style.orbit

const bodyOrbitPoint = (body) => {
  const latitude = body.orbit?.latitude || 0
  return eclipticPoint(
    bodyOrbitRadius(body),
    bodyOrbitLongitude(body),
    Math.sin(latitude * DEG_TO_RAD) * 18
  )
}

const circleLine = (radius, material, segments = 192) => {
  const points = Array.from({ length: segments }, (_, index) =>
    eclipticPoint(radius, index * 360 / segments)
  )
  const line = new LineLoop(new BufferGeometry().setFromPoints(points), material)
  rings.push(line)
  return line
}

const sampledOrbitLine = (body, material) => {
  if (!body.orbitPath.length) return circleLine(bodyOrbitRadius(body), material, 192)

  const averageDistance = body.orbitPath.reduce((total, point) => total + (point.distanceAu || 0), 0) / body.orbitPath.length
  const points          = body.orbitPath.map(point => eclipticPoint(
    visualOrbitPathRadius(point.distanceAu, averageDistance),
    norm360(point.longitude + props.wheelShift),
    Math.sin((point.latitude || 0) * DEG_TO_RAD) * 18
  ))
  const line = new LineLoop(new BufferGeometry().setFromPoints(points), material)
  rings.push(line)
  return line
}

const radialLine = (longitude, inner, outer, material) => {
  const line = new Line(new BufferGeometry().setFromPoints([
    eclipticPoint(inner, longitude),
    eclipticPoint(outer, longitude),
  ]), material)
  rings.push(line)
  return line
}

const makeSaturnRing = () => {
  const ring = new Mesh(
    new TorusGeometry(14.2, 0.45, 10, 96),
    new MeshStandardMaterial({
      color:       '#fde68a',
      opacity:     0.78,
      roughness:   0.9,
      transparent: true,
    })
  )
  ring.rotation.x = Math.PI / 2.6
  ring.rotation.z = Math.PI / 10
  return ring
}

const bodyMaterial = (body) => {
  const texture       = textureLoader.load(body.style.texture)
  texture.colorSpace  = SRGBColorSpace
  texture.wrapS       = ClampToEdgeWrapping
  texture.wrapT       = ClampToEdgeWrapping
  const isSun         = body.name === 'Sun'

  return new ShaderMaterial({
    uniforms: {
      planetMap: { value: texture },
      lightDir:  { value: new Vector3(-0.38, 0.52, 0.76).normalize() },
      ambient:   { value: isSun ? 1 : 0.72 },
      diffuse:   { value: isSun ? 0.08 : 0.36 },
    },
    vertexShader: `
      varying vec3 vObjectNormal;
      varying vec3 vWorldNormal;

      void main() {
        vObjectNormal = normalize(normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D planetMap;
      uniform vec3 lightDir;
      uniform float ambient;
      uniform float diffuse;
      varying vec3 vObjectNormal;
      varying vec3 vWorldNormal;

      void main() {
        vec2 photoUv = vObjectNormal.xz * 0.5 + 0.5;
        vec4 photo = texture2D(planetMap, photoUv);
        float light = ambient + max(dot(normalize(vWorldNormal), lightDir), 0.0) * diffuse;
        gl_FragColor = vec4(photo.rgb * light, 1.0);
      }
    `,
  })
}

const createBodies = () => {
  for (const body of bodies.value) {
    const mesh = new Mesh(
      new SphereGeometry(body.style.radius, 64, 32),
      bodyMaterial(body)
    )
    mesh.userData.bodyName = body.name
    mesh.userData.baseScale = 1
    if (body.name === 'Saturn') mesh.add(makeSaturnRing())

    sceneRoot.add(mesh)
    meshes.set(body.name, mesh)

    const label = makeLabel(PLANET_SYMBOLS[body.name] || body.name[0], body.style.color, body.name === 'Sun' ? 28 : 18)
    sceneRoot.add(label)
    labels.set(body.name, label)
  }
}

const createWheel = () => {
  const zodiacMaterial = new LineBasicMaterial({
    color:       '#94a3b8',
    opacity:     0.34,
    transparent: true,
  })
  const orbitMaterial = new LineBasicMaterial({
    color:       '#64748b',
    opacity:     0.18,
    transparent: true,
  })
  const rayMaterial = new LineBasicMaterial({
    color:       '#fcd34d',
    opacity:     0.18,
    transparent: true,
  })

  sceneRoot.add(circleLine(ZODIAC_RADIUS, zodiacMaterial))
  sceneRoot.add(circleLine(52, orbitMaterial))
  for (const body of bodies.value.filter(body => body.style.orbit > 0)) {
    sceneRoot.add(sampledOrbitLine(body, orbitMaterial))
  }
  for (let index = 0; index < 12; index += 1) {
    const longitude = index * 30
    sceneRoot.add(radialLine(longitude, 34, ZODIAC_RADIUS, index % 3 === 0 ? rayMaterial : orbitMaterial))

    const label = makeLabel(ZODIAC_SIGNS[index], '#cbd5e1', 18)
    label.position.copy(eclipticPoint(ZODIAC_RADIUS + 20, longitude + 15, 4))
    sceneRoot.add(label)
    rings.push(label)
  }
}

const updateBodyPositions = () => {
  for (const body of bodies.value) {
    const mesh  = meshes.get(body.name)
    const label = labels.get(body.name)
    if (!mesh || !label) continue

    const point = body.name === 'Sun'
      ? new Vector3(0, 0, 0)
      : bodyOrbitPoint(body)

    mesh.position.copy(point)
    label.position.copy(point.clone().add(new Vector3(0, body.style.radius + 11, 0)))
  }
}

const updateHighlight = () => {
  for (const [name, mesh] of meshes.entries()) {
    const active = highlightedBody.value === name
    const scale  = (mesh.userData.baseScale || 1) * (active ? 1.24 : 1)
    mesh.scale.setScalar(scale)
  }
}

const resize = () => {
  if (!renderer || !camera || !host.value) return
  const rect   = host.value.getBoundingClientRect()
  const width  = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

const renderFrame = () => {
  if (!renderer || !scene || !camera) return
  updateHighlight()
  if (sceneRoot && host.value) {
    const rect      = host.value.getBoundingClientRect()
    const worldSize = 2 * cameraDistance.value * Math.tan((camera.fov * DEG_TO_RAD) / 2)
    const worldPx   = worldSize / Math.max(1, rect.height)
    sceneRoot.position.x = props.background ? props.centerOffset.x * worldPx : 0
    sceneRoot.position.z = props.background ? props.centerOffset.y * worldPx : 0
  }
  camera.position.set(0, cameraDistance.value, 0)
  camera.up.set(0, 0, -1)
  camera.lookAt(0, 0, 0)
  renderer.render(scene, camera)
  animationFrame = requestAnimationFrame(renderFrame)
}

const supportsWebgl = () => {
  if (typeof document === 'undefined') return false
  const target = document.createElement('canvas')
  try {
    return Boolean(target.getContext('webgl2') || target.getContext('webgl'))
  } catch {
    return false
  }
}

const initScene = async () => {
  await nextTick()
  disposeScene()
  webglError.value = false
  if (!canvas.value || !supportsWebgl()) {
    webglError.value = true
    return
  }

  try {
    scene            = new Scene()
    scene.background = new Color('#020617')
    sceneRoot        = new Group()
    textureLoader    = new TextureLoader()
    camera           = new PerspectiveCamera(45, 1, 0.1, 1400)
    renderer         = new WebGLRenderer({
      alpha:                 false,
      antialias:             true,
      canvas:                canvas.value,
      preserveDrawingBuffer: true,
    })

    scene.add(new AmbientLight('#ffffff', 0.76))
    const light = new DirectionalLight('#fff7ed', 1.55)
    light.position.set(-160, 190, 260)
    scene.add(light)
    scene.add(sceneRoot)
    sceneRoot.rotation.x = 0

    createWheel()
    createBodies()
    updateBodyPositions()
    resize()

    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host.value)
    renderFrame()
  } catch (error) {
    console.warn('planetarium disabled:', error)
    webglError.value = true
    disposeScene()
  }
}

const pointerPosition = (event) => ({
  x: event.clientX,
  y: event.clientY,
})

const onPointerDown = (event) => {
  if (!props.interactive) return
  dragging    = true
  dragMoved   = false
  lastPointer = pointerPosition(event)
  canvas.value?.setPointerCapture?.(event.pointerId)
}

const onPointerMove = (event) => {
  if (!dragging || !sceneRoot) return
  if (!props.interactive) return
  const point = pointerPosition(event)
  const dx    = point.x - lastPointer.x
  const dy    = point.y - lastPointer.y
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true
  sceneRoot.rotation.y += dx * 0.007
  lastPointer = point
}

const pickBody = (event) => {
  if (!camera || !renderer || dragMoved) return
  if (!props.interactive) return
  const rect = canvas.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  ray.setFromCamera(mouse, camera)
  const hit  = ray.intersectObjects([...meshes.values()], true)[0]
  const name = hit?.object?.userData?.bodyName || hit?.object?.parent?.userData?.bodyName || ''
  if (!name) return

  selectedBody.value = selectedBody.value === name ? '' : name
  emit('toggle-highlight', { bodies: selectedBody.value ? [selectedBody.value] : [], aspectKey: '' })
}

const onPointerUp = (event) => {
  pickBody(event)
  dragging = false
  canvas.value?.releasePointerCapture?.(event.pointerId)
}

const onWheel = (event) => {
  if (!props.interactive) return
  event.preventDefault()
  cameraDistance.value = Math.max(MIN_CAMERA, Math.min(MAX_CAMERA, cameraDistance.value + event.deltaY * 0.34))
}

watch(() => props.chart, () => {
  if (renderer) {
    updateBodyPositions()
  }
}, { deep: true })

watch(() => props.wheelShift, updateBodyPositions)

onMounted(initScene)
onBeforeUnmount(disposeScene)
</script>

<template lang="pug">
.planetarium-view.relative.h-full.w-full(
  ref='host'
  data-testid='chart-planetarium'
  :data-background='background ? "true" : "false"'
  role='img'
  :aria-label='t("chart.planetarium_aria")'
)
  canvas.planetarium-view__canvas(
    ref='canvas'
    data-testid='chart-planetarium-canvas'
    @pointerdown='onPointerDown'
    @pointermove='onPointerMove'
    @pointerup='onPointerUp'
    @pointercancel='onPointerUp'
    @wheel='onWheel'
  )
  .planetarium-view__fallback(v-if='webglError' data-testid='chart-planetarium-fallback')
    span {{ t('chart.planetarium_unavailable') }}
</template>

<style scoped>
.planetarium-view {
  background: #020617;
  height: 100%;
  min-height: 100%;
  touch-action: none;
}

.planetarium-view__canvas {
  display: block;
  height: 100%;
  width: 100%;
}

.planetarium-view__fallback {
  align-items: center;
  background: rgb(2 6 23 / 0.92);
  color: rgb(226 232 240);
  display: flex;
  font-size: 0.8125rem;
  font-weight: 700;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: absolute;
  text-align: center;
}
</style>
