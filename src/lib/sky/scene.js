import * as THREE from 'three'
import { Body, MakeTime, Observer, Equator } from 'astronomy-engine'

const STAR_COUNT = 1500

const makeStarField = () => {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(STAR_COUNT * 3)
  const col = new Float32Array(STAR_COUNT * 3)
  for (let i = 0; i < STAR_COUNT; i++) {
    pos[i*3]     = (Math.random() - 0.5) * 120
    pos[i*3 + 1] = (Math.random() - 0.5) * 80
    pos[i*3 + 2] = -30 - Math.random() * 90
    const b = 0.4 + Math.random() * 0.6
    col[i*3]     = b
    col[i*3 + 1] = b
    col[i*3 + 2] = Math.min(1, b + 0.1)
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
  const mat = new THREE.PointsMaterial({
    size: 1.25, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: false
  })
  return new THREE.Points(geo, mat)
}

const PLANETS = [
  { name: 'Sun',     body: Body.Sun,     color: 0xffd87a, size: 1.6, label: 'Sol' },
  { name: 'Moon',    body: Body.Moon,    color: 0xdbeafe, size: 1.0, label: 'Lua' },
  { name: 'Mercury', body: Body.Mercury, color: 0x9aa6b2, size: 0.6, label: 'Mercurio' },
  { name: 'Venus',   body: Body.Venus,   color: 0xf2c97d, size: 0.8, label: 'Venus' },
  { name: 'Mars',    body: Body.Mars,    color: 0xe87a5d, size: 0.75, label: 'Marte' },
  { name: 'Jupiter', body: Body.Jupiter, color: 0xf0c060, size: 1.25, label: 'Jupiter' },
  { name: 'Saturn',  body: Body.Saturn,  color: 0xd8b070, size: 1.05, label: 'Saturno' }
]

const labelTexture = (label, color) => {
  const canvas = document.createElement('canvas')
  canvas.width = 192
  canvas.height = 48
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = '600 22px system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(11, 10, 26, 0.62)'
  ctx.fillRect(0, 5, canvas.width, 38)
  ctx.fillStyle = color
  ctx.fillText(label, 14, 25)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const planetMarker = (planet) => {
  const color = `#${planet.color.toString(16).padStart(6, '0')}`
  const group = new THREE.Group()
  const geo = new THREE.SphereGeometry(planet.size * 0.18, 16, 16)
  const mat = new THREE.MeshBasicMaterial({ color: planet.color, transparent: true, opacity: 0.92 })
  const mesh = new THREE.Mesh(geo, mat)
  const haloGeo = new THREE.RingGeometry(planet.size * 0.28, planet.size * 0.38, 32)
  const haloMat = new THREE.MeshBasicMaterial({ color: planet.color, transparent: true, opacity: 0.46, side: THREE.DoubleSide })
  const halo = new THREE.Mesh(haloGeo, haloMat)
  const texture = labelTexture(planet.label, color)
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.72 }))
  label.position.set(planet.size * 0.35, planet.size * 0.35, 0)
  label.scale.set(5.8, 1.45, 1)
  group.add(halo, mesh, label)
  return { group, geometry: [geo, haloGeo], material: [mat, haloMat, label.material], texture }
}

export const createSkyScene = (canvas) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  const scene  = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200)
  camera.position.set(0, 0, 0)
  camera.lookAt(new THREE.Vector3(0, 0, -1))

  const stars = makeStarField()
  scene.add(stars)

  const planetMeshes = PLANETS.map(p => {
    const marker = planetMarker(p)
    scene.add(marker.group)
    return { ...p, ...marker }
  })
  let observer = new Observer(0, 0, 0)
  let sceneDate = new Date()

  const positionPlanets = (date) => {
    const t = MakeTime(date)
    for (const p of planetMeshes) {
      const eq = Equator(p.body, t, observer, true, false)
      const ra = eq.ra * 15 * Math.PI / 180
      const dec = eq.dec * Math.PI / 180
      const r  = 48
      p.group.position.set(
        r * Math.cos(dec) * Math.sin(ra),
        r * Math.sin(dec),
        -r * Math.cos(dec) * Math.cos(ra)
      )
      p.group.lookAt(camera.position)
    }
  }

  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  let raf       = 0
  let frame     = 0
  const tick    = () => {
    frame++
    if (frame % 60 === 0) positionPlanets(sceneDate)
    stars.rotation.y += reduced ? 0 : 0.00008
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }

  resize()
  positionPlanets(new Date())
  window.addEventListener('resize', resize)
  raf = requestAnimationFrame(tick)

  return {
    dispose() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      stars.geometry.dispose()
      planetMeshes.forEach(p => {
        p.geometry.forEach(g => g.dispose())
        p.material.forEach(m => m.dispose())
        p.texture.dispose()
      })
    },
    setContext({ date, lat, lon }) {
      sceneDate = date || new Date()
      observer = new Observer(lat || 0, lon || 0, 0)
      positionPlanets(sceneDate)
    },
  }
}
