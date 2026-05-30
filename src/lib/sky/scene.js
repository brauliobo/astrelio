import { computeChart } from '../astro/ephemeris.js'
import { msToJd } from '../astro/timezones.js'
import { norm360 } from '../astro/zodiac.js'
import { mandalaAngleForLongitude } from '../../components/human-design/humanDesignWheelGeometry.js'

const STAR_COUNT = 520
const CHART_SELECTOR = '[data-testid="chart-wheel-svg"]'

const PLANETS = [
  { name: 'Sun', color: '#f6c453', radius: 13, texture: ['#fff7ad', '#f6c453', '#b45309'] },
  { name: 'Moon', color: '#dbeafe', radius: 8, texture: ['#f8fafc', '#cbd5e1', '#64748b'] },
  { name: 'Mercury', color: '#7dd3fc', radius: 6, texture: ['#e0f2fe', '#7dd3fc', '#475569'] },
  { name: 'Venus', color: '#86efac', radius: 7, texture: ['#dcfce7', '#86efac', '#4d7c0f'] },
  { name: 'Mars', color: '#fb7185', radius: 7, texture: ['#fecdd3', '#fb7185', '#991b1b'] },
  { name: 'Jupiter', color: '#fbbf24', radius: 10, texture: ['#fde68a', '#f59e0b', '#92400e'] },
  { name: 'Saturn', color: '#c4b5fd', radius: 9, texture: ['#ede9fe', '#c4b5fd', '#6d28d9'] },
  { name: 'Uranus', color: '#67e8f9', radius: 6, texture: ['#cffafe', '#67e8f9', '#0e7490'] },
  { name: 'Neptune', color: '#38bdf8', radius: 6, texture: ['#dbeafe', '#38bdf8', '#1d4ed8'] },
  { name: 'Pluto', color: '#c084fc', radius: 5, texture: ['#f3e8ff', '#c084fc', '#581c87'] },
]

const SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value))

export const skyRadiusForBounds = ({ chartRadius, maxRadius, viewportWidth }) => {
  const widthBound = Math.max(160, viewportWidth * 0.48)
  const upper = Math.min(maxRadius * 0.98, widthBound)
  const lower = Math.min(chartRadius + 180, upper)
  return clamp(chartRadius * 2.08, lower, upper)
}

const mulberry32 = (seed) => {
  let value = seed
  return () => {
    value += 0x6D2B79F5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
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

const polarPoint = (cx, cy, radius, longitude) => {
  const angle = (180 - longitude) * Math.PI / 180
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

export const skyLongitudeForHumanDesignLongitude = longitude =>
  norm360(270 - mandalaAngleForLongitude(longitude))

export const skyLongitudeForPosition = ({ longitude, mode = 'astrology', wheelShift = 0 }) =>
  mode === 'humanDesign'
    ? skyLongitudeForHumanDesignLongitude(longitude)
    : norm360(longitude + wheelShift)

const chartSelector = mode => mode === 'humanDesign' ? '[data-testid="bodygraph-svg"]' : CHART_SELECTOR

const chartBounds = (canvas, mode) => {
  const rect = canvas.getBoundingClientRect()
  const chart = document.querySelector(chartSelector(mode))?.getBoundingClientRect()

  if (!chart || chart.width < 40 || chart.height < 40) {
    const radius = Math.min(rect.width, rect.height) * 0.44
    return {
      cx: rect.width / 2,
      cy: rect.height / 2,
      chartRadius: radius * 0.42,
      skyRadius: radius,
    }
  }

  const chartRadius = Math.min(chart.width, chart.height) / 2
  const cx = chart.left - rect.left + chart.width / 2
  const cy = chart.top - rect.top + chart.height / 2
  const maxRadius = Math.hypot(
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
  ctx.lineWidth = width
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
  ctx.lineWidth = width
  ctx.setLineDash(dash)
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.restore()
}

const drawEnvironment = (ctx, bounds, mode, wheelShift) => {
  const { cx, cy, skyRadius, chartRadius } = bounds

  const gradient = ctx.createRadialGradient(cx, cy, chartRadius * 0.8, cx, cy, skyRadius)
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0.12)')
  gradient.addColorStop(0.58, 'rgba(30, 41, 59, 0.11)')
  gradient.addColorStop(1, 'rgba(125, 211, 252, 0.08)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, skyRadius, 0, Math.PI * 2)
  ctx.fill()

  drawRing(ctx, cx, cy, skyRadius, '#7dd3fc', 0.20, 1.25)
  drawRing(ctx, cx, cy, skyRadius * 0.72, '#c4b5fd', 0.12, 0.9, [8, 10])
  drawRing(ctx, cx, cy, chartRadius * 1.18, '#fbbf24', 0.12, 0.9, [2, 7])

  for (let i = 0; i < 12; i++) {
    const longitude = skyLongitudeForPosition({ longitude: i * 30, mode, wheelShift })
    const inner = polarPoint(cx, cy, chartRadius * 1.06, longitude)
    const outer = polarPoint(cx, cy, skyRadius, longitude)
    drawLine(ctx, inner, outer, '#dbeafe', i % 3 === 0 ? 0.16 : 0.08, i % 3 === 0 ? 1 : 0.6)

    const label = polarPoint(cx, cy, skyRadius * 0.965, skyLongitudeForPosition({ longitude: i * 30 + 15, mode, wheelShift }))
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#e0f2fe'
    ctx.font = '600 22px Georgia, serif'
    ctx.textAlign = 'center'
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
    const a = polarPoint(cx, cy, chartRadius * 1.02, longitude)
    const b = polarPoint(cx, cy, skyRadius * 0.985, longitude)
    drawLine(ctx, a, b, '#f97316', 0.20, 1.2)
    const text = polarPoint(cx, cy, skyRadius * 1.015, longitude)
    ctx.save()
    ctx.globalAlpha = 0.34
    ctx.fillStyle = '#fed7aa'
    ctx.font = '700 12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(axis.label, text.x, text.y)
    ctx.restore()
  }
}

const drawPlanet = (ctx, cx, cy, radius, shiftedLongitude, planet, label) => {
  const point = polarPoint(cx, cy, radius, shiftedLongitude)
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
  ctx.fillStyle = body
  ctx.globalAlpha = 0.62
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(point.x, point.y, planet.radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.globalAlpha = 0.24
  ctx.strokeStyle = 'rgba(255,255,255,0.72)'
  ctx.lineWidth = 0.7
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.ellipse(point.x, point.y + (i - 1) * planet.radius * 0.26, planet.radius * 0.74, planet.radius * 0.14, -0.18, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.globalAlpha = planet.name === 'Sun' ? 0.26 : 0.16
  ctx.beginPath()
  ctx.arc(point.x, point.y, planet.radius * 1.7, 0, Math.PI * 2)
  ctx.stroke()

  ctx.globalAlpha = 0.40
  ctx.font = '700 14px system-ui, sans-serif'
  ctx.textAlign = labelPoint.x < cx - 8 ? 'right' : labelPoint.x > cx + 8 ? 'left' : 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = planet.color
  ctx.fillText(label, labelPoint.x, labelPoint.y)
  ctx.restore()
}

export const createSkyScene = (canvas) => {
  const ctx = canvas.getContext('2d')
  const stars = makeStars()
  let context = {
    date: new Date(),
    lat: 0,
    lon: 0,
    zodiac: 'tropical',
    houseSystem: 'placidus',
    mode: 'astrology',
    planetLabels: {},
  }
  let raf = 0
  const pulse = window.setInterval(() => schedule(), 1000)
  let chart = null

  const resize = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, canvas.clientWidth)
    const height = Math.max(1, canvas.clientHeight)
    canvas.width = Math.floor(width * pixelRatio)
    canvas.height = Math.floor(height * pixelRatio)
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }

  const recalc = () => {
    const jd = msToJd(context.date.getTime())
    chart = computeChart(jd, context.lat, context.lon, {
      zodiac: context.zodiac,
      houseSystem: context.houseSystem,
    })
  }

  const draw = () => {
    resize()
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const bounds = chartBounds(canvas, context.mode)
    const wheelShift = context.mode === 'humanDesign' ? 58 : norm360(-(chart?.cusps?.[0] || 0))

    ctx.clearRect(0, 0, width, height)

    const base = ctx.createRadialGradient(bounds.cx, bounds.cy, 0, bounds.cx, bounds.cy, bounds.skyRadius)
    base.addColorStop(0, 'rgba(15, 23, 42, 0.28)')
    base.addColorStop(0.58, 'rgba(15, 23, 42, 0.10)')
    base.addColorStop(1, 'rgba(2, 6, 23, 0.00)')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.fillStyle = '#e0f2fe'
    for (const star of stars) {
      ctx.globalAlpha = star.a
      ctx.beginPath()
      ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    drawEnvironment(ctx, bounds, context.mode, wheelShift)

    const planetRadius = Math.max(bounds.chartRadius * 1.42, bounds.skyRadius * 0.78)
    const byName = new Map((chart?.positions || []).map(item => [item.name, item]))
    for (const planet of PLANETS) {
      const position = byName.get(planet.name)
      if (!position) continue
      drawPlanet(
        ctx,
        bounds.cx,
        bounds.cy,
        planetRadius,
        skyLongitudeForPosition({ longitude: position.longitude, mode: context.mode, wheelShift }),
        planet,
        context.planetLabels[planet.name] || planet.name
      )
    }
  }

  const schedule = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(draw)
  }

  resize()
  recalc()
  schedule()
  window.addEventListener('resize', schedule)

  return {
    dispose() {
      cancelAnimationFrame(raf)
      window.clearInterval(pulse)
      window.removeEventListener('resize', schedule)
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
