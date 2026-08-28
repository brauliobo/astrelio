import {
  BackSide,
  Color,
  DoubleSide,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
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

export const surfaceMaterial = name => new MeshStandardMaterial({
  map:       bodyTexture(name),
  roughness: 0.92,
  metalness: 0,
})

/**
 * Moon plates are 1k and mostly greyscale, so a moon without a colour mosaic is tinted with its
 * catalogue colour; a moon with no plate at all falls back to a plain tinted sphere.
 */
export const moonMaterial = ({ map, color, colorMap }) => new MeshStandardMaterial({
  map:       map ? loadTexture(publicAssetUrl(`planets/maps/${map}-1k.jpg`)) : null,
  color:     colorMap ? '#ffffff' : color,
  roughness: 0.95,
  metalness: 0,
})

export const emissiveMaterial = name => new MeshBasicMaterial({ map: bodyTexture(name) })

/** Earth day side from the colour map, night side from the city-lights map, blended at the terminator. */
export const earthMaterial = () => new ShaderMaterial({
  uniforms: {
    dayMap:    { value: bodyTexture('Earth') },
    nightMap:  { value: auxTexture('earth-night') },
    sunDirection: { value: new Vector3(1, 0, 0) },
    nightGlow: { value: 0.9 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      vUv = uv;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform vec3 sunDirection;
    uniform float nightGlow;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      float lambert = dot(normalize(vWorldNormal), normalize(sunDirection));
      float day     = smoothstep(-0.08, 0.22, lambert);
      vec3 lit      = texture2D(dayMap, vUv).rgb * max(lambert, 0.0);
      vec3 dark     = texture2D(nightMap, vUv).rgb * nightGlow;
      gl_FragColor  = vec4(mix(dark, lit, day) + lit * 0.06, 1.0);
    }
  `,
})

export const cloudMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite:  false,
  uniforms: {
    cloudMap:     { value: auxTexture('earth-clouds', { color: false }) },
    sunDirection: { value: new Vector3(1, 0, 0) },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      vUv = uv;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
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
  color:       new Color(color),
  transparent: true,
  opacity,
  depthWrite:  false,
  side:        DoubleSide,
})

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
      for (const value of Object.values(material.uniforms || {})) value?.value?.dispose?.()
      material.map?.dispose?.()
      material.dispose()
    }
  })
}
