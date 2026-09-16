import { BufferGeometry, Line, LineBasicMaterial, LineSegments, Vector3 } from 'three'
import { makeLabel } from './labels.js'

export const LABEL_LAYER = 2
export const SHADOW_LAYER = 3
export const UP = new Vector3(0, 1, 0)

export const toVector3 = (point) => (point?.isVector3 ? point : new Vector3(point.x, point.y, point.z))

export const bodyNameOf = (object) => {
  for (let current = object; current; current = current.parent) {
    if (current.userData?.bodyName) return current.userData.bodyName
  }
  return ''
}

export const setLayer = (object, layer) => object.traverse(child => child.layers.set(layer))

export const pathLine = (points, { color = '#ffffff', opacity = 0.4, kind = 'orbit', ...data } = {}) => {
  const line = new Line(
    new BufferGeometry().setFromPoints(points.map(toVector3)),
    new LineBasicMaterial({ color, transparent: true, opacity })
  )
  line.userData = { kind, baseOpacity: opacity, ...data }
  return line
}

export const setLinePoints = (line, points) => {
  line.geometry.dispose()
  line.geometry = new BufferGeometry().setFromPoints(points.map(toVector3))
}

export const pathSegments = (points, { color = '#ffffff', opacity = 0.4, kind = 'orbit', ...data } = {}) => {
  const line = new LineSegments(
    new BufferGeometry().setFromPoints(points.map(toVector3)),
    new LineBasicMaterial({ color, transparent: true, opacity })
  )
  line.userData = { kind, baseOpacity: opacity, ...data }
  return line
}

const FACE_AXIS = new Vector3(0, 0, 1)

export const faceAlong = (object, direction) => {
  object.quaternion.setFromUnitVectors(FACE_AXIS, direction)
}

export const circlePoints = (radius, segments = 180) => Array.from({ length: segments + 1 }, (_, index) => {
  const angle = (index / segments) * Math.PI * 2
  return { x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius }
})

export const layeredLabel = (text, color, size, layer = LABEL_LAYER) => {
  const label = makeLabel(text, color, size)
  label.layers.set(layer)
  return label
}

export const visibleOf = (...items) => items.flat().filter(item => item?.visible)

export const fitLabelsToCamera = (camera, labels, screenSize) => {
  for (const label of labels) {
    if (!label.visible) continue
    const size = camera.position.distanceTo(label.position) * screenSize
    const map  = label.material.map
    label.scale.set(size * (map.image.width / map.image.height), size, 1)
  }
}

export const equatorialSide = (direction) => {
  const side = new Vector3().crossVectors(UP, direction)
  return side.lengthSq() < 1e-8 ? new Vector3(1, 0, 0) : side.normalize()
}

export const placeAlong = (origin, offsets) => {
  const at = origin.clone()
  for (const [vector, scale] of offsets) at.addScaledVector(vector, scale)
  return at
}

/** Camera offset that shows a terminator instead of a fully lit face. */
export const terminatorApproach = (sunward) => new Vector3()
  .addScaledVector(equatorialSide(sunward), 0.78)
  .addScaledVector(sunward, 0.26)
  .addScaledVector(UP, 0.4)
  .normalize()
