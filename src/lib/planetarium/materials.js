import {
  BackSide,
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  CircleGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three'
import { planetMapUrl, publicAssetUrl } from './constants.js'
import { equatorialBasis } from './ephemeris3d.js'

export const UNIT_SPHERE = new SphereGeometry(1, 96, 64)

const loader = new TextureLoader()

const textureSize = () =>
  (globalThis.devicePixelRatio || 1) < 2 && (globalThis.innerWidth || 1920) < 900 ? '1k' : '2k'

const loadTexture = (url, { color = true, anisotropy = 8 } = {}) => {
  const texture = loader.load(url)
  if (color) texture.colorSpace = SRGBColorSpace
  texture.anisotropy = anisotropy
  texture.minFilter  = LinearFilter
  return texture
}

const bodyTexture = name => loadTexture(planetMapUrl(name, textureSize()))

const auxTexture = (name, { color = true } = {}) =>
  loadTexture(publicAssetUrl(`planets/maps/${name}-${textureSize()}.${name === 'saturn-rings' ? 'png' : 'jpg'}`), { color })

const pixelTexture = (r, g, b) => {
  const texture = new DataTexture(new Uint8Array([r, g, b, 255]), 1, 1)
  texture.needsUpdate = true
  return texture
}

const WHITE_PIXEL = pixelTexture(255, 255, 255)
const BLACK_PIXEL = pixelTexture(0, 0, 0)

const LIT_BODY_VERTEX = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Day/night lighting from the true sunward vector, not from Three.js lights. Physical lights in
 * recent three.js treat intensity as lux/candela, which made artistic PointLights too weak to show
 * a terminator and left only a flat ambient fill.
 */
export const litBodyMaterial = ({
  map = null,
  nightMap = null,
  color = '#ffffff',
  nightGlow = 0,
} = {}) => new ShaderMaterial({
  uniforms: {
    dayMap:       { value: map || WHITE_PIXEL },
    nightMap:     { value: nightMap || BLACK_PIXEL },
    tint:         { value: new Color(color) },
    sunDirection: { value: new Vector3(1, 0, 0) },
    nightGlow:    { value: nightGlow },
    hasDayMap:    { value: map ? 1 : 0 },
    hasNightMap:  { value: nightMap ? 1 : 0 },
    occultCenter: { value: new Vector3() },
    occultRadius: { value: 0 },
    occultUmbraLength: { value: 1 },
    occultPenumbraGrowth: { value: 0 },
    occultCopper: { value: 1 },
    hasOccult:    { value: 0 },
  },
  vertexShader: LIT_BODY_VERTEX,
  fragmentShader: `
    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform vec3 tint;
    uniform vec3 sunDirection;
    uniform float nightGlow;
    uniform float hasDayMap;
    uniform float hasNightMap;
    uniform vec3 occultCenter;
    uniform float occultRadius;
    uniform float occultUmbraLength;
    uniform float occultPenumbraGrowth;
    uniform float occultCopper;
    uniform float hasOccult;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    void main() {
      vec3 albedo = tint;
      if (hasDayMap > 0.5) albedo *= texture2D(dayMap, vUv).rgb;
      vec3 sun      = normalize(sunDirection);
      float ndotl   = dot(normalize(vWorldNormal), sun);
      float lambert = max(ndotl, 0.0);
      float day     = smoothstep(-0.02, 0.08, ndotl);
      vec3 lit      = albedo * (0.08 + lambert * 1.55);
      vec3 dark     = albedo * 0.02;
      if (hasNightMap > 0.5) dark += texture2D(nightMap, vUv).rgb * nightGlow;

      float eclipse = 0.0;
      if (hasOccult > 0.5) {
        vec3 fromOccult = vWorldPosition - occultCenter;
        float alongSun  = dot(fromOccult, sun);
        float along     = -alongSun;
        if (along > 0.0) {
          float dist   = length(fromOccult - sun * alongSun);
          float umbraR = max(occultRadius * (1.0 - along / max(occultUmbraLength, 0.0001)), 0.0);
          float penR   = occultRadius + along * occultPenumbraGrowth;
          eclipse = 1.0 - smoothstep(umbraR, max(penR, umbraR + 0.0001), dist);
        }
      }

      vec3 copper = albedo * vec3(0.28, 0.08, 0.03);
      vec3 inShadow = mix(dark * 0.12, mix(dark * 0.35, copper, day), occultCopper);
      gl_FragColor = vec4(mix(mix(dark, lit, day), inShadow, eclipse), 1.0);
    }
  `,
})

export const setSunDirection = (mesh, direction) => {
  const write = (material) => {
    const uniform = material?.uniforms?.sunDirection?.value
    if (uniform) uniform.set(direction.x, direction.y, direction.z)
  }
  write(mesh.material)
  write(mesh.userData.clouds?.material)
  write(mesh.userData.rings?.material)
}

/** Drop a spherical occultor (Earth on the Moon, a planet on its moons) into the body shader. */
export const setOccultor = (mesh, occultor) => {
  const uniforms = mesh.material?.uniforms
  if (!uniforms?.hasOccult) return
  if (!occultor) {
    uniforms.hasOccult.value = 0
    return
  }
  uniforms.hasOccult.value = 1
  uniforms.occultCenter.value.set(occultor.center.x, occultor.center.y, occultor.center.z)
  uniforms.occultRadius.value = occultor.radius
  uniforms.occultUmbraLength.value = occultor.umbraLength
  uniforms.occultPenumbraGrowth.value = occultor.penumbraGrowth
  if (uniforms.occultCopper) uniforms.occultCopper.value = occultor.copper ?? 1
}

export const surfaceMaterial = name => new MeshStandardMaterial({
  map:       bodyTexture(name),
  roughness: 0.92,
  metalness: 0,
})

export const litSurfaceMaterial = name => litBodyMaterial({ map: bodyTexture(name) })

export const bodyMaterialFor = name => (
  name === 'Sun' ? emissiveMaterial('Sun') : name === 'Earth' ? earthMaterial() : litSurfaceMaterial(name)
)

export const namedBody = (name, geometry = UNIT_SPHERE) => {
  const mesh = new Mesh(geometry, bodyMaterialFor(name))
  mesh.userData.bodyName = name
  return mesh
}

export const attachClouds = (earth) => {
  const clouds = new Mesh(UNIT_SPHERE, cloudMaterial())
  clouds.scale.setScalar(1.006)
  clouds.userData.bodyName = 'Earth'
  earth.add(clouds)
  earth.userData.clouds = clouds
  return earth
}

export const attachRings = (mesh, body) => {
  const rings = new Mesh(
    ringGeometry(body.rings.innerKm / body.radiusKm, body.rings.outerKm / body.radiusKm),
    litRingMaterial()
  )
  rings.rotation.x = Math.PI / 2
  mesh.add(rings)
  mesh.userData.rings = rings
  return rings
}

export const attachPickHalo = (mesh, color = '#ffd166') => {
  const halo = new Mesh(UNIT_SPHERE, new MeshBasicMaterial({
    color, depthWrite: false, opacity: 0, transparent: true,
  }))
  halo.userData.bodyName = mesh.userData.bodyName
  mesh.add(halo)
  mesh.userData.pickHalo = halo
  return halo
}

export const planetMesh = (body) => {
  const mesh = namedBody(body.name)
  if (body.name === 'Earth') attachClouds(mesh)
  if (body.rings) attachRings(mesh, body)
  if (body.name === 'Sun') attachPickHalo(mesh)
  return mesh
}

/**
 * Moon plates are 1k and mostly greyscale, so a moon without a colour mosaic is tinted with its
 * catalogue colour; a moon with no plate at all falls back to a plain tinted sphere.
 */
export const moonMaterial = ({ map, color, colorMap }) => litBodyMaterial({
  map:   map ? loadTexture(publicAssetUrl(`planets/maps/${map}-1k.jpg`)) : null,
  color: colorMap ? '#ffffff' : color,
})

export const namedMoon = (moon) => {
  const mesh = new Mesh(UNIT_SPHERE, moonMaterial(moon))
  mesh.userData.bodyName = moon.name
  return mesh
}

export const emissiveMaterial = name => new MeshBasicMaterial({ map: bodyTexture(name) })

/** Earth day side from the colour map, night side from the city-lights map, blended at the terminator. */
export const earthMaterial = () => litBodyMaterial({
  map:       bodyTexture('Earth'),
  nightMap:  auxTexture('earth-night'),
  nightGlow: 0.9,
})

export const cloudMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite:  false,
  uniforms: {
    cloudMap:     { value: auxTexture('earth-clouds', { color: false }) },
    sunDirection: { value: new Vector3(1, 0, 0) },
  },
  vertexShader: LIT_BODY_VERTEX,
  fragmentShader: `
    uniform sampler2D cloudMap;
    uniform vec3 sunDirection;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      float cover   = texture2D(cloudMap, vUv).r;
      float lambert = max(dot(normalize(vWorldNormal), normalize(sunDirection)), 0.0);
      gl_FragColor  = vec4(vec3(1.0) * (0.15 + lambert), cover * (0.12 + lambert * 0.72));
    }
  `,
})

/** RingGeometry ships planar UVs; a ring plate needs u to run radially from the inner edge outwards. */
export const ringGeometry = (innerRatio, outerRatio, segments = 160) => {
  const geometry = new RingGeometry(innerRatio, outerRatio, segments)
  const position = geometry.attributes.position
  const uv       = geometry.attributes.uv

  for (let index = 0; index < position.count; index += 1) {
    const radius = Math.hypot(position.getX(index), position.getY(index))
    uv.setXY(index, (radius - innerRatio) / (outerRatio - innerRatio), 0.5)
  }
  uv.needsUpdate = true
  return geometry
}

export const ringMaterial = () => new MeshBasicMaterial({
  map:         auxTexture('saturn-rings'),
  side:        DoubleSide,
  transparent: true,
  opacity:     0.92,
})

/** Ring plate lit by the Sun, with the planet's umbra cut out of the night-side ansa. */
export const litRingMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite:  false,
  side:        DoubleSide,
  uniforms: {
    ringMap:      { value: auxTexture('saturn-rings') },
    sunDirection: { value: new Vector3(1, 0, 0) },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vPlanetCenter;
    varying float vPlanetRadius;
    void main() {
      vUv = uv;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vPlanetCenter  = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      vPlanetRadius  = length((modelMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D ringMap;
    uniform vec3 sunDirection;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vPlanetCenter;
    varying float vPlanetRadius;
    void main() {
      vec4 texel  = texture2D(ringMap, vUv);
      vec3 sun    = normalize(sunDirection);
      vec3 offset = vWorldPosition - vPlanetCenter;
      float along = dot(offset, sun);
      vec3  perp  = offset - sun * along;
      float shadow = along < 0.0
        ? 1.0 - smoothstep(vPlanetRadius * 0.92, vPlanetRadius * 1.12, length(perp))
        : 0.0;
      float lit = 0.18 + 0.82 * (1.0 - shadow);
      gl_FragColor = vec4(texel.rgb * lit, texel.a * 0.92);
    }
  `,
})

/** The star map is an equatorial equirectangular plate, so it is oriented by the equatorial axes. */
export const starSphere = (radius) => {
  const mesh = new Mesh(UNIT_SPHERE, new MeshBasicMaterial({
    map:  loadTexture(publicAssetUrl('sky/starmap-4k.jpg')),
    side: BackSide,
    depthWrite: false,
  }))
  mesh.scale.setScalar(radius)
  mesh.renderOrder = -1
  applyOrientation(mesh, equatorialBasis())
  return mesh
}

export const shadowMaterial = (color, opacity) => new MeshBasicMaterial({
  color:            new Color(color),
  transparent:      true,
  opacity,
  depthWrite:       false,
  depthTest:        true,
  side:             DoubleSide,
  polygonOffset:    true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits:  -2,
})

export const shadowSliceMesh = ({ color, opacity, kind, bodyName }) => {
  const mesh = new Mesh(new CircleGeometry(1, 96), shadowMaterial(color, opacity))
  mesh.renderOrder = kind === 'umbra' ? 3 : 2
  mesh.userData = { kind, bodyName, baseOpacity: opacity, radiusKm: 0 }
  return mesh
}

export const shadowRimMesh = ({ color, opacity, kind, bodyName }) => {
  const mesh = new Mesh(new RingGeometry(0.96, 1.04, 96), shadowMaterial(color, opacity))
  mesh.renderOrder = 4
  mesh.userData = { kind, bodyName, baseOpacity: opacity, radiusKm: 0 }
  return mesh
}

export const setShadowSlice = (mesh, inner, outer) => {
  mesh.visible = outer > 1e-4
  if (!mesh.visible) return
  mesh.geometry.dispose()
  const ratio = inner > 0 ? Math.min(inner / outer, 0.98) : 0
  mesh.geometry = ratio > 0.04 ? new RingGeometry(ratio, 1, 96) : new CircleGeometry(1, 96)
  mesh.scale.setScalar(outer)
}

/** Orient a mesh from body-fixed axes: local +X is the prime meridian, +Y the north pole. */
export const applyOrientation = (mesh, basis) => {
  mesh.matrixAutoUpdate = false
  mesh.matrix.makeBasis(
    new Vector3(basis.x.x, basis.x.y, basis.x.z),
    new Vector3(basis.z.x, basis.z.y, basis.z.z),
    new Vector3(-basis.y.x, -basis.y.y, -basis.y.z)
  )
  mesh.matrix.scale(new Vector3(mesh.scale.x, mesh.scale.y, mesh.scale.z))
  mesh.matrix.setPosition(mesh.position)
}

export const disposeObject = (object) => {
  object?.traverse?.((child) => {
    if (child.geometry && child.geometry !== UNIT_SPHERE) child.geometry.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) {
      if (!material) continue
      for (const value of Object.values(material.uniforms || {})) {
        const texture = value?.value
        if (texture?.isTexture && texture !== WHITE_PIXEL && texture !== BLACK_PIXEL) texture.dispose()
      }
      material.map?.dispose?.()
      material.dispose()
    }
  })
}
