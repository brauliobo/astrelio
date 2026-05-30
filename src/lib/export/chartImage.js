import { downloadBlob } from './download.js'

const SVG_NS           = 'http://www.w3.org/2000/svg'
const STYLE_PROPERTIES = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
  'dominant-baseline',
]

const copyComputedStyles = (source, target) => {
  const sourceNodes = [source, ...source.querySelectorAll('*')]
  const targetNodes = [target, ...target.querySelectorAll('*')]

  sourceNodes.forEach((node, index) => {
    const targetNode = targetNodes[index]
    const style      = window.getComputedStyle(node)

    STYLE_PROPERTIES.forEach((property) => {
      const value = style.getPropertyValue(property)
      if (value) targetNode.style.setProperty(property, value)
    })
  })
}

export const serializeSvg = (svg) => {
  if (!svg) throw new Error('missing_svg')

  const clone   = svg.cloneNode(true)
  const viewBox = svg.getAttribute('viewBox')
  const rect    = svg.getBoundingClientRect()
  const width   = Math.round(rect.width || Number(svg.getAttribute('width')) || 520)
  const height  = Math.round(rect.height || Number(svg.getAttribute('height')) || width)

  copyComputedStyles(svg, clone)
  clone.setAttribute('xmlns', SVG_NS)
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  if (viewBox) clone.setAttribute('viewBox', viewBox)

  return new window.XMLSerializer().serializeToString(clone)
}

export const downloadSvg = (svg, filename) => {
  const source = serializeSvg(svg)
  const blob   = new window.Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, filename)
}

export const svgToPngBlob = async (svg, scale = 2) => {
  const source  = serializeSvg(svg)
  const svgBlob = new window.Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url     = window.URL.createObjectURL(svgBlob)

  try {
    const image = await new Promise((resolve, reject) => {
      const img   = new window.Image()
      img.onload  = () => resolve(img)
      img.onerror = () => reject(new Error('png_render_failed'))
      img.src     = url
    })

    const canvas  = document.createElement('canvas')
    canvas.width  = image.naturalWidth * scale
    canvas.height = image.naturalHeight * scale

    const context = canvas.getContext('2d')
    if (!context) throw new Error('png_render_failed')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('png_render_failed'))
      }, 'image/png')
    })
  } finally {
    window.URL.revokeObjectURL(url)
  }
}

export const downloadPng = async (svg, filename) => {
  const blob = await svgToPngBlob(svg)
  downloadBlob(blob, filename)
}
