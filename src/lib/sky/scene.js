import { computeChart } from '../astro/ephemeris.js'
import { msToJd } from '../astro/timezones.js'
import { norm360 } from '../astro/zodiac.js'
import { activationFromLongitude } from '../human-design/activations.js'
import { mandalaAngleForActivation } from '../../components/human-design/wheelCore.js'
import { moonPhaseLighting, moonPhaseLitPoints } from './moonPhase.js'

const STAR_COUNT                = 520
const CHART_SELECTOR            = '[data-testid="chart-wheel-svg"]'
const SKY_ASTERISMS_URL         = '/data/sky-asterisms.generated.json'
const ASTERISM_LONGITUDE_SPREAD = 1.55
const ASTERISM_LATITUDE_SPREAD  = 1.85

export const SKY_PLANETS = [
  { name: 'Sun', color: '#f6c453', radius: 13, photo: 'solar', image: '/planets/sun.jpg', texture: ['#fff7ad', '#f6c453', '#b45309'] },
  { name: 'Moon', color: '#dbeafe', radius: 8, photo: 'cratered', image: '/planets/moon.jpg', texture: ['#f8fafc', '#cbd5e1', '#64748b'] },
  { name: 'Mercury', color: '#7dd3fc', radius: 6, photo: 'cratered', image: '/planets/mercury.jpg', texture: ['#e0f2fe', '#7dd3fc', '#475569'] },
  { name: 'Venus', color: '#86efac', radius: 7, photo: 'clouds', image: '/planets/venus.jpg', texture: ['#dcfce7', '#86efac', '#4d7c0f'] },
  { name: 'Mars', color: '#fb7185', radius: 7, photo: 'dust', image: '/planets/mars.jpg', texture: ['#fecdd3', '#fb7185', '#991b1b'] },
  { name: 'Jupiter', color: '#fbbf24', radius: 10, photo: 'bands', image: '/planets/jupiter.jpg', texture: ['#fde68a', '#f59e0b', '#92400e'] },
  { name: 'Saturn', color: '#c4b5fd', radius: 9, photo: 'rings', image: '/planets/saturn.jpg', texture: ['#ede9fe', '#c4b5fd', '#6d28d9'] },
  { name: 'Uranus', color: '#67e8f9', radius: 6, photo: 'ice', image: '/planets/uranus.jpg', texture: ['#cffafe', '#67e8f9', '#0e7490'] },
  { name: 'Neptune', color: '#38bdf8', radius: 6, photo: 'storms', image: '/planets/neptune.jpg', texture: ['#dbeafe', '#38bdf8', '#1d4ed8'] },
  { name: 'Pluto', color: '#c084fc', radius: 5, photo: 'ice', image: '/planets/pluto.jpg', texture: ['#f3e8ff', '#c084fc', '#581c87'] },
]

const SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value))

const skyPalette = (theme = 'dark') => {
  const light = theme === 'light'
  return {
    star:      light ? '#1e3a5f' : '#e0f2fe',
    starAlpha: light ? 0.58 : 1,
    baseStops: light
      ? [
          'rgba(96,165,250,0.16)',
          'rgba(14,116,144,0.08)',
          'rgba(37,99,235,0.00)',
        ]
      : [
          'rgba(15, 23, 42, 0.28)',
          'rgba(15, 23, 42, 0.10)',
          'rgba(2, 6, 23, 0.00)',
        ],
    environmentStops: light
      ? [
          'rgba(56,189,248,0.12)',
          'rgba(37,99,235,0.09)',
          'rgba(15,23,42,0.07)',
        ]
      : [
          'rgba(15, 23, 42, 0.12)',
          'rgba(30, 41, 59, 0.11)',
          'rgba(125, 211, 252, 0.08)',
        ],
    ring:               light ? '#0f5ea8' : '#7dd3fc',
    secondaryRing:      light ? '#6d28d9' : '#c4b5fd',
    accentRing:         light ? '#b45309' : '#fbbf24',
    grid:               light ? '#1e3a5f' : '#dbeafe',
    label:              light ? '#1e3a5f' : '#e0f2fe',
    axis:               light ? '#b45309' : '#f97316',
    axisLabel:          light ? '#92400e' : '#fed7aa',
    asterismLine:       light ? '#17436f' : '#e0f2fe',
    asterismStar:       light ? '#0f5ea8' : '#bfdbfe',
    asterismImageAlpha: light ? 0.10 : 0.12,
    planetLink:         light ? '#7c2d12' : '#fde68a',
    planetLabelAlpha:   light ? 0.76 : 0.40,
  }
}

export const skyRadiusForBounds = ({ chartRadius, maxRadius, viewportWidth }) => {
  const widthBound = Math.max(160, viewportWidth * 0.48)
  const upper      = Math.min(maxRadius * 0.98, widthBound)
  const lower      = Math.min(chartRadius + 180, upper)
  return clamp(chartRadius * 2.08, lower, upper)
}

const mulberry32 = (seed) => {
  let value = seed
  return () => {
    value += 0x6D2B79F5
    let t = value
    t     = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const makeStars = () => {
  const random = mulberry32(19860212)
  return Array.from({ length: STAR_COUNT }, () => ({
    x: random(),
    y: random(),
    r: 0.35 + random() * 1.15,
    a: 0.18 + random() * 0.48,
  }))
}

const loadPlanetImages = (schedule) => {
  if (typeof Image === 'undefined') return new Map()
  return new Map(SKY_PLANETS.map((planet) => {
    const image    = new Image()
    image.decoding = 'async'
    image.onload   = schedule
    image.src      = planet.image
    return [planet.name, image]
  }))
}

const loadSkyAsterisms = async () => {
  if (typeof fetch === 'undefined') return null
  try {
    const response = await fetch(SKY_ASTERISMS_URL)
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

const loadAsterismImages = (skyData, schedule) => {
  if (typeof Image === 'undefined' || !skyData?.asterisms?.length) return new Map()
  const urls = [...new Set(skyData.asterisms.map(item => item.image?.src || item.image).filter(Boolean))]
  return new Map(urls.map((url) => {
    const image    = new Image()
    image.decoding = 'async'
    image.onload   = schedule
    image.src      = url
    return [url, image]
  }))
}

const polarPoint = (cx, cy, radius, longitude) => {
  const angle = (180 - longitude) * Math.PI / 180
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

const angularDistance = (a, b) => {
  const distance = Math.abs(norm360(a - b))
  return Math.min(distance, 360 - distance)
}

const signedAngularDistance = (longitude, origin) => {
  const distance = norm360(longitude - origin)
  return distance > 180 ? distance - 360 : distance
}

const circularMean = values => {
  if (!values.length) return 0
  const vector = values.reduce((sum, value) => {
    const radians = value * Math.PI / 180
    sum.x += Math.cos(radians)
    sum.y += Math.sin(radians)
    return sum
  }, { x: 0, y: 0 })
  return norm360(Math.atan2(vector.y, vector.x) * 180 / Math.PI)
}

const asterismProjection = (stars = []) => {
  const validStars = stars.filter(star => Number.isFinite(star?.lon) && Number.isFinite(star?.lat))
  if (!validStars.length) return null
  return {
    centerLon: circularMean(validStars.map(star => star.lon)),
    centerLat: validStars.reduce((sum, star) => sum + star.lat, 0) / validStars.length,
  }
}

const distortAsterismStar = (star, projection) => {
  if (!projection) return star
  return {
    ...star,
    lon: norm360(projection.centerLon + signedAngularDistance(star.lon, projection.centerLon) * ASTERISM_LONGITUDE_SPREAD),
    lat: clamp(
      projection.centerLat + (star.lat - projection.centerLat) * ASTERISM_LATITUDE_SPREAD,
      -82,
      82
    ),
  }
}

export const skyLongitudeForHumanDesignLongitude = longitude =>
  norm360(270 - mandalaAngleForActivation(activationFromLongitude(longitude)))

export const skyLongitudeForPosition = ({ longitude, mode = 'astrology', wheelShift = 0 }) =>
  mode === 'humanDesign'
    ? skyLongitudeForHumanDesignLongitude(longitude)
    : norm360(longitude + wheelShift)

const chartSelector = mode => mode === 'humanDesign' ? '[data-testid="bodygraph-svg"]' : CHART_SELECTOR

const chartBounds = (canvas, mode) => {
  const rect  = canvas.getBoundingClientRect()
  const chart = document.querySelector(chartSelector(mode))?.getBoundingClientRect()

  if (!chart || chart.width < 40 || chart.height < 40) {
    const radius = Math.min(rect.width, rect.height) * 0.44
    return {
      cx:          rect.width / 2,
      cy:          rect.height / 2,
      chartRadius: radius * 0.42,
      skyRadius:   radius,
    }
  }

  const chartRadius = Math.min(chart.width, chart.height) / 2
  const cx          = chart.left - rect.left + chart.width / 2
  const cy          = chart.top - rect.top + chart.height / 2
  const maxRadius   = Math.hypot(
    Math.max(cx, rect.width - cx),
    Math.max(cy, rect.height - cy)
  )

  return {
    cx,
    cy,
    chartRadius,
    skyRadius: skyRadiusForBounds({ chartRadius, maxRadius, viewportWidth: rect.width }),
  }
}

const drawRing = (ctx, cx, cy, radius, stroke, alpha = 1, width = 1, dash = []) => {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = stroke
  ctx.lineWidth   = width
  ctx.setLineDash(dash)
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

const drawLine = (ctx, a, b, stroke, alpha = 1, width = 1, dash = []) => {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = stroke
  ctx.lineWidth   = width
  ctx.setLineDash(dash)
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.restore()
}

const drawEnvironment = (ctx, bounds, mode, wheelShift, palette) => {
  const { cx, cy, skyRadius, chartRadius } = bounds

  const gradient = ctx.createRadialGradient(cx, cy, chartRadius * 0.8, cx, cy, skyRadius)
  gradient.addColorStop(0, palette.environmentStops[0])
  gradient.addColorStop(0.58, palette.environmentStops[1])
  gradient.addColorStop(1, palette.environmentStops[2])
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, skyRadius, 0, Math.PI * 2)
  ctx.fill()

  drawRing(ctx, cx, cy, skyRadius, palette.ring, 0.20, 1.25)
  drawRing(ctx, cx, cy, skyRadius * 0.72, palette.secondaryRing, 0.12, 0.9, [8, 10])
  drawRing(ctx, cx, cy, chartRadius * 1.18, palette.accentRing, 0.12, 0.9, [2, 7])

  for (let i = 0; i < 12; i++) {
    const longitude = skyLongitudeForPosition({ longitude: i * 30, mode, wheelShift })
    const inner     = polarPoint(cx, cy, chartRadius * 1.06, longitude)
    const outer     = polarPoint(cx, cy, skyRadius, longitude)
    drawLine(ctx, inner, outer, palette.grid, i % 3 === 0 ? 0.16 : 0.08, i % 3 === 0 ? 1 : 0.6)

    const label = polarPoint(cx, cy, skyRadius * 0.965, skyLongitudeForPosition({ longitude: i * 30 + 15, mode, wheelShift }))
    ctx.save()
    ctx.globalAlpha  = 0.18
    ctx.fillStyle    = palette.label
    ctx.font         = '600 22px Georgia, serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(SIGNS[i], label.x, label.y)
    ctx.restore()
  }

  const axisStyle = [
    { lon: 0, label: 'AS' },
    { lon: 90, label: 'IC' },
    { lon: 180, label: 'DS' },
    { lon: 270, label: 'MC' },
  ]

  for (const axis of axisStyle) {
    const longitude = norm360(axis.lon)
    const a         = polarPoint(cx, cy, chartRadius * 1.02, longitude)
    const b         = polarPoint(cx, cy, skyRadius * 0.985, longitude)
    drawLine(ctx, a, b, palette.axis, 0.20, 1.2)
    const text = polarPoint(cx, cy, skyRadius * 1.015, longitude)
    ctx.save()
    ctx.globalAlpha  = 0.34
    ctx.fillStyle    = palette.axisLabel
    ctx.font         = '700 12px system-ui, sans-serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(axis.label, text.x, text.y)
    ctx.restore()
  }
}

const projectAsterismStar = (star, bounds, mode, wheelShift, projection = null) => {
  const projectedStar = distortAsterismStar(star, projection)
  const latRange      = Math.min(132, bounds.skyRadius * 0.30)
  const baseRadius    = Math.max(bounds.chartRadius * 1.26, bounds.skyRadius * 0.62)
  const radius        = clamp(baseRadius + projectedStar.lat * latRange / 90, bounds.chartRadius * 1.08, bounds.skyRadius * 0.97)
  const longitude     = skyLongitudeForPosition({ longitude: projectedStar.lon, mode, wheelShift })
  return {
    ...polarPoint(bounds.cx, bounds.cy, radius, longitude),
    longitude,
    mag: projectedStar.mag,
  }
}

const affineTransformForAnchors = (sourceAnchors, targetAnchors) => {
  if (sourceAnchors.length < 3 || targetAnchors.length < 3) return null
  const [p0, p1, p2] = sourceAnchors
  const [q0, q1, q2] = targetAnchors
  const p10         = { x: p1.x - p0.x, y: p1.y - p0.y }
  const p20         = { x: p2.x - p0.x, y: p2.y - p0.y }
  const q10         = { x: q1.x - q0.x, y: q1.y - q0.y }
  const q20         = { x: q2.x - q0.x, y: q2.y - q0.y }
  const determinant = p10.x * p20.y - p20.x * p10.y
  if (Math.abs(determinant) < 0.01) return null

  const a = (q10.x * p20.y - q20.x * p10.y) / determinant
  const b = (q10.y * p20.y - q20.y * p10.y) / determinant
  const c = (-q10.x * p20.x + q20.x * p10.x) / determinant
  const d = (-q10.y * p20.x + q20.y * p10.x) / determinant
  const e = q0.x - a * p0.x - c * p0.y
  const f = q0.y - b * p0.x - d * p0.y

  return { a, b, c, d, e, f }
}

const drawAnchoredAsterismImage = (ctx, image, imageMeta, bounds, mode, wheelShift, palette, projection) => {
  if (!image?.complete || image.naturalWidth <= 0 || !imageMeta?.anchors?.length) return false
  const sourceAnchors = imageMeta.anchors.map(anchor => ({ x: anchor.pos[0], y: anchor.pos[1] }))
  const targetAnchors = imageMeta.anchors.map(anchor => projectAsterismStar(anchor, bounds, mode, wheelShift, projection))
  const transform     = affineTransformForAnchors(sourceAnchors, targetAnchors)
  if (!transform) return false

  ctx.save()
  ctx.globalAlpha = palette.asterismImageAlpha
  ctx.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f)
  ctx.drawImage(image, 0, 0, imageMeta.size?.[0] || image.naturalWidth, imageMeta.size?.[1] || image.naturalHeight)
  ctx.restore()
  return true
}

const drawFallbackAsterismImage = (ctx, image, points, palette) => {
  if (!image?.complete || image.naturalWidth <= 0 || points.length < 2) return
  const xs   = points.map(point => point.x)
  const ys   = points.map(point => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const span = Math.max(maxX - minX, maxY - minY)
  const size = clamp(span * 1.55, 54, 128)
  const cx   = (minX + maxX) / 2
  const cy   = (minY + maxY) / 2

  ctx.save()
  ctx.globalAlpha = palette.asterismImageAlpha
  ctx.drawImage(image, cx - size / 2, cy - size / 2, size, size)
  ctx.restore()
}

const drawAsterisms = (ctx, bounds, mode, wheelShift, palette, skyData, asterismImages) => {
  const starPoints = []
  if (!skyData?.asterisms?.length) return starPoints

  const drawnImages = new Set()
  for (const asterism of skyData.asterisms) {
    const projection = asterismProjection([
      ...asterism.stars,
      ...(asterism.image?.anchors || []),
    ])
    const projectedByHip = new Map(asterism.stars.map(star => [star.hip, projectAsterismStar(star, bounds, mode, wheelShift, projection)]))
    const points         = [...projectedByHip.values()]
    const imageSrc       = asterism.image?.src || asterism.image
    if (imageSrc && !drawnImages.has(imageSrc)) {
      const image             = asterismImages?.get(imageSrc)
      const drewAnchoredImage = drawAnchoredAsterismImage(ctx, image, asterism.image, bounds, mode, wheelShift, palette, projection)
      if (!drewAnchoredImage) drawFallbackAsterismImage(ctx, image, points, palette)
      drawnImages.add(imageSrc)
    }

    ctx.save()
    ctx.strokeStyle = palette.asterismLine
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    for (const line of asterism.lines) {
      for (let index = 1; index < line.length; index += 1) {
        const a = projectedByHip.get(line[index - 1])
        const b = projectedByHip.get(line[index])
        if (!a || !b || angularDistance(a.longitude, b.longitude) > 118) continue
        ctx.globalAlpha = 0.20
        ctx.lineWidth   = 0.86
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
    ctx.restore()

    ctx.save()
    ctx.fillStyle = palette.asterismStar
    for (const point of points) {
      const strength  = clamp(1 - (point.mag - 1) / 5.8, 0.18, 0.86)
      ctx.globalAlpha = 0.16 + strength * 0.20
      ctx.beginPath()
      ctx.arc(point.x, point.y, 1.15 + strength * 1.75, 0, Math.PI * 2)
      ctx.fill()
      starPoints.push(point)
    }
    ctx.restore()
  }

  return starPoints
}

export const planetStarLinks = (planetPoints, starPoints, maxDistance) =>
  planetPoints
    .map((planet) => {
      let closest  = null
      let distance = Infinity
      for (const star of starPoints) {
        const nextDistance = Math.hypot(planet.x - star.x, planet.y - star.y)
        if (nextDistance < distance) {
          distance = nextDistance
          closest  = star
        }
      }
      return closest && distance <= maxDistance ? { planet, star: closest, distance } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6)

const drawPlanetStarLinks = (ctx, planetPoints, starPoints, bounds, palette) => {
  const links = planetStarLinks(planetPoints, starPoints, bounds.skyRadius * 0.26)
  ctx.save()
  ctx.strokeStyle = palette.planetLink
  ctx.lineWidth   = 0.62
  ctx.setLineDash([2, 8])
  for (const link of links) {
    ctx.globalAlpha = 0.045
    ctx.beginPath()
    ctx.moveTo(link.star.x, link.star.y)
    ctx.lineTo(link.planet.x, link.planet.y)
    ctx.stroke()
  }
  ctx.restore()
}

const drawPlanet = (ctx, cx, cy, radius, shiftedLongitude, planet, label, image = null, palette = skyPalette()) => {
  const point      = polarPoint(cx, cy, radius, shiftedLongitude)
  const labelPoint = polarPoint(cx, cy, radius + planet.radius + 22, shiftedLongitude)

  ctx.save()
  const body = ctx.createRadialGradient(
    point.x - planet.radius * 0.35,
    point.y - planet.radius * 0.42,
    planet.radius * 0.15,
    point.x,
    point.y,
    planet.radius
  )
  body.addColorStop(0, planet.texture[0])
  body.addColorStop(0.55, planet.texture[1])
  body.addColorStop(1, planet.texture[2])

  ctx.strokeStyle = planet.color
  ctx.fillStyle   = body
  ctx.globalAlpha = 0.62
  ctx.lineWidth   = 1.2
  ctx.beginPath()
  ctx.arc(point.x, point.y, planet.radius, 0, Math.PI * 2)
  ctx.fill()

  if (planet.name === 'Moon') {
    drawMoonPhaseImage(ctx, point, planet, image, planet.phaseFraction)
  } else if (image?.complete && image.naturalWidth > 0) {
    drawPlanetImage(ctx, point, planet, image)
  } else {
    drawPlanetPhotoTexture(ctx, point, planet)
  }

  ctx.stroke()

  ctx.globalAlpha = 0.24
  ctx.strokeStyle = 'rgba(255,255,255,0.72)'
  ctx.lineWidth   = 0.7
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.ellipse(point.x, point.y + (i - 1) * planet.radius * 0.26, planet.radius * 0.74, planet.radius * 0.14, -0.18, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.globalAlpha = planet.name === 'Sun' ? 0.26 : 0.16
  ctx.beginPath()
  ctx.arc(point.x, point.y, planet.radius * 1.7, 0, Math.PI * 2)
  ctx.stroke()

  ctx.globalAlpha  = palette.planetLabelAlpha
  ctx.font         = '700 14px system-ui, sans-serif'
  ctx.textAlign    = labelPoint.x < cx - 8 ? 'right' : labelPoint.x > cx + 8 ? 'left' : 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle    = planet.color
  ctx.fillText(label, labelPoint.x, labelPoint.y)
  ctx.restore()
}

const drawPlanetImage = (ctx, point, planet, image) => {
  const diameter = planet.radius * 2
  ctx.save()
  ctx.beginPath()
  ctx.arc(point.x, point.y, planet.radius, 0, Math.PI * 2)
  ctx.clip()

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
  const sx         = (image.naturalWidth - sourceSize) / 2
  const sy         = (image.naturalHeight - sourceSize) / 2
  ctx.globalAlpha  = 0.96
  ctx.drawImage(
    image,
    sx,
    sy,
    sourceSize,
    sourceSize,
    point.x - planet.radius,
    point.y - planet.radius,
    diameter,
    diameter
  )
  ctx.restore()
}

const traceMoonPhasePath = (ctx, point, radius, phaseFraction) => {
  const points = moonPhaseLitPoints(phaseFraction, radius * 2)
  ctx.beginPath()
  points.forEach((phasePoint, index) => {
    const x = point.x - radius + phasePoint.x
    const y = point.y - radius + phasePoint.y
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
}

const drawMoonPhaseImage = (ctx, point, planet, image, phaseFraction = 0) => {
  const r        = planet.radius
  const diameter = r * 2
  const lighting = moonPhaseLighting(phaseFraction)
  ctx.save()
  ctx.beginPath()
  ctx.arc(point.x, point.y, r, 0, Math.PI * 2)
  ctx.clip()

  if (image?.complete && image.naturalWidth > 0) {
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
    const sx         = (image.naturalWidth - sourceSize) / 2
    const sy         = (image.naturalHeight - sourceSize) / 2
    ctx.globalAlpha  = 0.36
    ctx.filter       = 'brightness(45%) saturate(65%)'
    ctx.drawImage(image, sx, sy, sourceSize, sourceSize, point.x - r, point.y - r, diameter, diameter)
    ctx.filter = 'none'

    ctx.save()
    traceMoonPhasePath(ctx, point, r, phaseFraction)
    ctx.clip()
    ctx.globalAlpha = lighting.litAlpha
    ctx.drawImage(image, sx, sy, sourceSize, sourceSize, point.x - r, point.y - r, diameter, diameter)
    ctx.restore()
  } else {
    drawPlanetPhotoTexture(ctx, point, planet)
    ctx.save()
    traceMoonPhasePath(ctx, point, r, phaseFraction)
    ctx.clip()
    ctx.globalAlpha = lighting.litAlpha * 0.52
    ctx.fillStyle   = 'rgba(248,250,252,0.72)'
    ctx.fillRect(point.x - r, point.y - r, diameter, diameter)
    ctx.restore()
  }

  ctx.globalAlpha              = lighting.shadowAlpha
  ctx.fillStyle                = 'rgba(2,6,23,0.58)'
  ctx.globalCompositeOperation = 'multiply'
  ctx.beginPath()
  ctx.arc(point.x, point.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  ctx.globalAlpha = lighting.rimAlpha
  ctx.strokeStyle = 'rgba(219,234,254,0.88)'
  ctx.lineWidth   = Math.max(0.7, r * 0.1)
  ctx.beginPath()
  ctx.arc(point.x, point.y, r - ctx.lineWidth / 2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

const drawPlanetPhotoTexture = (ctx, point, planet) => {
  const r = planet.radius
  ctx.save()
  ctx.beginPath()
  ctx.arc(point.x, point.y, r, 0, Math.PI * 2)
  ctx.clip()

  if (planet.photo === 'bands' || planet.photo === 'rings') {
    const bands = planet.photo === 'rings'
      ? ['rgba(255,255,255,0.30)', 'rgba(88,28,135,0.24)', 'rgba(250,204,21,0.20)']
      : ['rgba(255,247,237,0.38)', 'rgba(180,83,9,0.28)', 'rgba(254,215,170,0.34)']
    for (let index = -4; index <= 4; index += 1) {
      ctx.globalAlpha = 0.55
      ctx.fillStyle   = bands[Math.abs(index) % bands.length]
      ctx.fillRect(point.x - r, point.y + index * r * 0.24, r * 2, r * 0.13)
    }
  }

  if (planet.photo === 'cratered' || planet.photo === 'dust' || planet.photo === 'ice') {
    const spots = planet.photo === 'dust' ? 9 : 7
    for (let index = 0; index < spots; index += 1) {
      const angle     = (index * 137.5) * Math.PI / 180
      const distance  = r * (0.18 + ((index * 17) % 53) / 100)
      const size      = r * (0.12 + ((index * 11) % 19) / 100)
      ctx.globalAlpha = planet.photo === 'dust' ? 0.28 : 0.22
      ctx.fillStyle   = planet.photo === 'dust' ? 'rgba(127,29,29,0.55)' : 'rgba(15,23,42,0.45)'
      ctx.beginPath()
      ctx.arc(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (planet.photo === 'clouds' || planet.photo === 'storms' || planet.photo === 'solar') {
    for (let index = 0; index < 4; index += 1) {
      ctx.globalAlpha = planet.photo === 'solar' ? 0.18 : 0.24
      ctx.strokeStyle = planet.photo === 'solar' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.48)'
      ctx.lineWidth   = Math.max(0.8, r * 0.12)
      ctx.beginPath()
      ctx.ellipse(point.x, point.y + (index - 1.5) * r * 0.22, r * 0.95, r * 0.22, -0.38, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  ctx.restore()

  if (planet.photo === 'rings') {
    ctx.save()
    ctx.globalAlpha = 0.34
    ctx.strokeStyle = 'rgba(226,232,240,0.72)'
    ctx.lineWidth   = Math.max(1, r * 0.18)
    ctx.beginPath()
    ctx.ellipse(point.x, point.y, r * 1.62, r * 0.45, -0.24, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

const moonPhaseFractionFromPositions = (positionsByName) => {
  const sun  = positionsByName.get('Sun')
  const moon = positionsByName.get('Moon')
  return sun && moon ? norm360(moon.longitude - sun.longitude) / 360 : 0
}

export const createSkyScene = (canvas, options = {}) => {
  const ctx   = canvas.getContext('2d')
  const stars = makeStars()
  let context = {
    date:         new Date(),
    lat:          0,
    lon:          0,
    zodiac:       'tropical',
    houseSystem:  'placidus',
    mode:         'astrology',
    theme:        'dark',
    planetLabels: {},
  }
  let raf            = 0
  const pulse        = window.setInterval(() => schedule(), 1000)
  let chart          = null
  let planetImages   = null
  let skyData        = null
  let asterismImages = null

  const resize = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const width      = Math.max(1, canvas.clientWidth)
    const height     = Math.max(1, canvas.clientHeight)
    canvas.width     = Math.floor(width * pixelRatio)
    canvas.height    = Math.floor(height * pixelRatio)
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }

  const recalc = () => {
    const jd = msToJd(context.date.getTime())
    chart    = computeChart(jd, context.lat, context.lon, {
      zodiac:      context.zodiac,
      houseSystem: context.houseSystem,
    })
  }

  const draw = () => {
    resize()
    const width      = canvas.clientWidth
    const height     = canvas.clientHeight
    const bounds     = chartBounds(canvas, context.mode)
    const wheelShift = context.mode === 'humanDesign' ? 58 : norm360(-(chart?.cusps?.[0] || 0))
    const palette    = skyPalette(context.theme)

    ctx.clearRect(0, 0, width, height)

    const base = ctx.createRadialGradient(bounds.cx, bounds.cy, 0, bounds.cx, bounds.cy, bounds.skyRadius)
    base.addColorStop(0, palette.baseStops[0])
    base.addColorStop(0.58, palette.baseStops[1])
    base.addColorStop(1, palette.baseStops[2])
    ctx.fillStyle = base
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.fillStyle = palette.star
    for (const star of stars) {
      ctx.globalAlpha = star.a * palette.starAlpha
      ctx.beginPath()
      ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    drawEnvironment(ctx, bounds, context.mode, wheelShift, palette)
    const asterismPoints = drawAsterisms(ctx, bounds, context.mode, wheelShift, palette, skyData, asterismImages)

    const planetRadius      = Math.max(bounds.chartRadius * 1.42, bounds.skyRadius * 0.78)
    const byName            = new Map((chart?.positions || []).map(item => [item.name, item]))
    const moonPhaseFraction = moonPhaseFractionFromPositions(byName)
    const planetPoints      = SKY_PLANETS
      .map((planet) => {
        const position = byName.get(planet.name)
        if (!position) return null
        const longitude = skyLongitudeForPosition({ longitude: position.longitude, mode: context.mode, wheelShift })
        return {
          ...polarPoint(bounds.cx, bounds.cy, planetRadius, longitude),
          name: planet.name,
        }
      })
      .filter(Boolean)

    drawPlanetStarLinks(ctx, planetPoints, asterismPoints, bounds, palette)

    for (const planet of SKY_PLANETS) {
      const position = byName.get(planet.name)
      if (!position) continue
      const phaseFraction = planet.name === 'Moon' ? moonPhaseFraction : null
      if (planet.name === 'Moon') {
        const longitude = skyLongitudeForPosition({ longitude: position.longitude, mode: context.mode, wheelShift })
        const point     = polarPoint(bounds.cx, bounds.cy, planetRadius, longitude)
        options.onMoonFrame?.({
          x:    point.x,
          y:    point.y,
          size: Math.max(18, planet.radius * 2.4),
          phaseFraction,
          illumination: moonPhaseLighting(phaseFraction).illumination,
        })
      }
      drawPlanet(
        ctx,
        bounds.cx,
        bounds.cy,
        planetRadius,
        skyLongitudeForPosition({ longitude: position.longitude, mode: context.mode, wheelShift }),
        { ...planet, phaseFraction },
        context.planetLabels[planet.name] || planet.name,
        planetImages?.get(planet.name),
        palette
      )
    }
  }

  const schedule = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(draw)
  }

  resize()
  planetImages = loadPlanetImages(schedule)
  loadSkyAsterisms().then((data) => {
    skyData        = data
    asterismImages = loadAsterismImages(data, schedule)
    schedule()
  })
  recalc()
  schedule()
  window.addEventListener('resize', schedule)

  return {
    dispose() {
      cancelAnimationFrame(raf)
      window.clearInterval(pulse)
      window.removeEventListener('resize', schedule)
      options.onMoonFrame?.(null)
    },
    setContext(next) {
      context = {
        ...context,
        ...next,
        date: next.date || context.date,
      }
      recalc()
      schedule()
    },
  }
}
