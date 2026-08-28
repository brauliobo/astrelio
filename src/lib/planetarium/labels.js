import { CanvasTexture, LinearFilter, Sprite, SpriteMaterial, SRGBColorSpace } from 'three'

const FONT = '600 44px "Inter", system-ui, sans-serif'

export const labelTexture = (text, color = '#e2e8f0') => {
  const canvas  = document.createElement('canvas')
  const context = canvas.getContext('2d')
  context.font  = FONT
  canvas.width  = Math.ceil(context.measureText(text).width) + 24
  canvas.height = 72

  const draw = canvas.getContext('2d')
  draw.font         = FONT
  draw.textAlign    = 'center'
  draw.textBaseline = 'middle'
  draw.shadowColor  = 'rgba(2,6,23,0.9)'
  draw.shadowBlur   = 10
  draw.fillStyle    = color
  draw.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture      = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter  = LinearFilter
  return texture
}

export const makeLabel = (text, color, height = 1) => {
  const texture = labelTexture(text, color)
  const sprite  = new Sprite(new SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }))
  sprite.scale.set(height * (texture.image.width / texture.image.height), height, 1)
  // Anchor below the sprite so labels sit above their body whatever direction the camera looks from.
  sprite.center.set(0.5, -0.35)
  sprite.renderOrder = 10
  return sprite
}
