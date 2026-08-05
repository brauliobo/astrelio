<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { norm180, norm360, signIndex } from '../../lib/astro/zodiac.js'
import CelestialGlyph from '../common/CelestialGlyph.vue'
import { PLANET_SYMBOLS } from '../chart/wheel/geometry.js'

const YEAR_MS = 365.25 * 86_400_000
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
const PLANET_COLORS = {
  Sun: '#f6c453', Moon: '#dbeafe', Mercury: '#7dd3fc', Venus: '#86efac', Mars: '#fb7185',
  Jupiter: '#fbbf24', Saturn: '#c4b5fd', Uranus: '#67e8f9', Neptune: '#38bdf8', Pluto: '#c084fc',
}
const PLANET_IMPORTANCE = {
  Sun: 1, Moon: 0.96, Mercury: 0.72, Venus: 0.74, Mars: 0.8,
  Jupiter: 0.84, Saturn: 0.9, Uranus: 0.66, Neptune: 0.62, Pluto: 0.68,
}
const ASPECT_COLORS = {
  conjunction: 'var(--aspect-conjunction)', opposition: 'var(--aspect-opposition)',
  trine: 'var(--aspect-trine)', square: 'var(--aspect-square)',
  sextile: 'var(--aspect-sextile)', quincunx: 'var(--aspect-quincunx)',
}
const STARS = Array.from({ length: 84 }, (_, index) => ({
  x: ((index * 47) % 97) / 97,
  y: ((index * 71 + 13) % 101) / 101,
  radius: 0.35 + ((index * 17) % 9) / 10,
  alpha: 0.18 + ((index * 23) % 40) / 100,
  phase: ((index * 31) % 360) * Math.PI / 180,
}))

const props = defineProps({
  person: { type: Object, default: null },
  natal: { type: Object, default: null },
  progressed: { type: Object, default: null },
  aspects: { type: Array, default: () => [] },
  dateMs: { type: Number, default: null },
  dateInput: { type: String, default: '' },
  birthMs: { type: Number, default: null },
  planetGlyphRenderer: { type: String, default: null },
})
const emit = defineEmits(['update:date-input'])
const { t, tm, locale } = useI18n()

const canvas = ref(null)
const isPlaying = ref(false)
const selectedPlanet = ref('Sun')
const activeAspect = ref(null)
let animationFrame = 0
let playbackTimer = 0
let resizeObserver = null
let resizeHandler = null
let canvasContext = null

const signNames = computed(() => {
  const names = tm('zodiac.signs')
  return Array.isArray(names) ? names : []
})
const signShortNames = computed(() => {
  const names = tm('zodiac.signs_short')
  return Array.isArray(names) ? names : signNames.value
})
const safeDateMs = computed(() => Number.isFinite(props.dateMs) ? props.dateMs : Date.now())
const effectiveBirthMs = computed(() => {
  if (Number.isFinite(props.birthMs)) return props.birthMs
  if (props.person?.isoLocal) return DateTime.fromISO(props.person.isoLocal, { zone: 'utc' }).toMillis()
  return safeDateMs.value
})
const ageYears = computed(() => Math.max(0, (safeDateMs.value - effectiveBirthMs.value) / YEAR_MS))
const ageLabel = computed(() => ageYears.value.toFixed(1))
const ageAtSelectedDate = computed(() => t('progression_visual.active_age', { age: ageLabel.value }))

const timelineStartAge = computed(() => Math.max(0, Math.floor(ageYears.value - 6)))
const timelineEndAge = computed(() => Math.max(timelineStartAge.value + 12, Math.ceil(ageYears.value + 6)))
const timelineStartMs = computed(() => effectiveBirthMs.value + timelineStartAge.value * YEAR_MS)
const timelineEndMs = computed(() => effectiveBirthMs.value + timelineEndAge.value * YEAR_MS)
const timelinePercent = computed(() => {
  const span = timelineEndMs.value - timelineStartMs.value
  return span ? Math.max(0, Math.min(100, ((safeDateMs.value - timelineStartMs.value) / span) * 100)) : 0
})
const timelineStyle = computed(() => ({ '--timeline-progress': `${timelinePercent.value}%` }))
const timelineTicks = computed(() => {
  const count = Math.min(7, timelineEndAge.value - timelineStartAge.value + 1)
  const span = timelineEndAge.value - timelineStartAge.value
  return Array.from({ length: count }, (_, index) => ({
    age: timelineStartAge.value + Math.round(span * index / Math.max(1, count - 1)),
    position: span ? index / Math.max(1, count - 1) * 100 : 0,
  }))
})
const timelineWindowLabel = computed(() => t('progression_visual.timeline_window', {
  start: timelineStartAge.value,
  end: timelineEndAge.value,
}))

const findPosition = (chart, name) => chart?.positions?.find(position => position.name === name) || null
const planetLabel = planet => t(`planets.${planet}`)
const signLabel = index => signNames.value[index] || ''
const signShortLabel = index => signShortNames.value[index] || signLabel(index)
const planetColor = planet => PLANET_COLORS[planet] || 'var(--app-text-soft)'
const formatDegree = longitude => {
  const value = norm360(longitude)
  const degree = Math.floor(value % 30)
  const minutes = Math.floor((value % 1) * 60).toString().padStart(2, '0')
  return `${degree}\u00b0${minutes}'`
}
const formatMonthYear = milliseconds => new Intl.DateTimeFormat(locale.value, {
  month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(milliseconds))
const motionLabel = motion => t(`progression_visual.motion_${motion === 'retrograde' || motion === 'stationary' ? motion : 'direct'}`)

const positionRows = computed(() => {
  const natalByName = new Map((props.natal?.positions || []).map(position => [position.name, position]))
  const progressedByName = new Map((props.progressed?.positions || []).map(position => [position.name, position]))
  return PLANETS.map((planet, index) => {
    const natal = natalByName.get(planet)
    const progressed = progressedByName.get(planet)
    if (!progressed) return null
    const movement = natal ? Math.abs(norm180(progressed.longitude - natal.longitude)) : 0
    const currentSign = signIndex(progressed.longitude)
    const natalSign = natal ? signIndex(natal.longitude) : currentSign
    const signChanged = Boolean(natal && currentSign !== natalSign)
    const motionChanged = Boolean(natal && progressed.motion && natal.motion && progressed.motion !== natal.motion)
    return {
      planet, index, natal, progressed, movement, currentSign, natalSign, signChanged, motionChanged,
      changeRank: (signChanged ? 4 : 0) + (motionChanged ? 3 : 0) + Math.min(2, movement / 12),
      color: planetColor(planet), barPercent: Math.max(8, Math.min(100, movement / 24 * 100)),
      longitude: norm360(progressed.longitude),
    }
  }).filter(Boolean).sort((a, b) =>
    b.changeRank - a.changeRank || (PLANET_IMPORTANCE[b.planet] || 0) - (PLANET_IMPORTANCE[a.planet] || 0)
  )
})
const changeRows = computed(() => {
  const changed = positionRows.value.filter(row => row.signChanged || row.motionChanged || row.movement >= 2)
  return (changed.length ? changed : positionRows.value).slice(0, 5)
})
const rankedAspects = computed(() => [...props.aspects]
  .sort((a, b) => (b.strength || 0) - (a.strength || 0) || a.delta - b.delta).slice(0, 3))
const activeChange = computed(() =>
  positionRows.value.find(row => row.planet === selectedPlanet.value) || changeRows.value[0] || null
)
const currentChapter = computed(() => {
  const row = activeChange.value
  if (!row) return t('progression_visual.chapter_default')
  if (row.signChanged) return t('progression_visual.chapter_sign', { planet: planetLabel(row.planet), sign: signLabel(row.currentSign) })
  if (row.motionChanged) return t('progression_visual.chapter_motion', { planet: planetLabel(row.planet) })
  return t('progression_visual.chapter_shift', { planet: planetLabel(row.planet) })
})

const progressionSun = computed(() => findPosition(props.progressed, 'Sun'))
const cycleSignIndex = computed(() => progressionSun.value ? signIndex(progressionSun.value.longitude) : 0)
const cycleProgress = computed(() => progressionSun.value ? norm360(progressionSun.value.longitude) / 360 * 100 : 0)
const cycleDegree = computed(() => progressionSun.value ? formatDegree(progressionSun.value.longitude) : '--')
const cycleDialStyle = computed(() => ({
  background: `conic-gradient(from -90deg, var(--progression-accent) 0 ${cycleProgress.value}%, var(--progression-cycle-track) ${cycleProgress.value}% 100%)`,
}))
const cycleMarkerStyle = computed(() => ({ transform: `rotate(${cycleProgress.value * 3.6}deg)` }))
const orbitPlanets = computed(() => positionRows.value.map((row, index) => {
  const radius = 23 + (index % 6) * 5.2
  const radians = (row.longitude - 90) * Math.PI / 180
  return { ...row, left: 50 + Math.cos(radians) * radius, top: 50 + Math.sin(radians) * radius }
}))
const orbitPlanetStyle = planet => ({ left: `${planet.left}%`, top: `${planet.top}%`, '--planet-color': planet.color })
const ringStyle = radius => ({ width: `${radius}%`, height: `${radius}%` })
const changeBarStyle = change => ({ width: `${change.barPercent}%`, '--change-color': change.color })
const aspectStyle = aspect => ({ '--aspect-color': ASPECT_COLORS[aspect.type] || 'var(--progression-accent)' })

const changeTypeLabel = change => t(change.signChanged
  ? 'progression_visual.change_sign'
  : change.motionChanged ? 'progression_visual.change_motion' : 'progression_visual.change_shift')
const changeDetail = change => {
  if (change.signChanged) return t('progression_visual.sign_shift', {
    planet: planetLabel(change.planet), from: signLabel(change.natalSign), to: signLabel(change.currentSign),
  })
  if (change.motionChanged) return t('progression_visual.motion_shift', {
    planet: planetLabel(change.planet), motion: motionLabel(change.progressed.motion), from: motionLabel(change.natal.motion),
  })
  return t('progression_visual.degree_shift', { planet: planetLabel(change.planet), delta: `${change.movement.toFixed(1)}\u00b0` })
}
const aspectTitle = aspect => t('progression_visual.aspect_title', {
  a: planetLabel(aspect.a), aspect: t(`aspects.${aspect.type}`), b: planetLabel(aspect.b),
})
const aspectMeta = aspect => t('progression_visual.aspect_meta', {
  orb: aspect.delta.toFixed(2), motion: aspect.applying ? t('aspects.applying') : t('aspects.separating'),
})
const isActiveAspect = aspect => activeAspect.value === aspect

const selectPlanet = planet => {
  selectedPlanet.value = planet
  activeAspect.value = null
}
const selectAspect = aspect => {
  activeAspect.value = aspect
  selectedPlanet.value = aspect.b
}
watch(changeRows, rows => {
  if (!rows.some(row => row.planet === selectedPlanet.value)) selectedPlanet.value = rows[0]?.planet || 'Sun'
}, { immediate: true })

const emitDate = milliseconds => {
  const target = Math.max(0, Number(milliseconds))
  if (Number.isFinite(target)) emit('update:date-input', DateTime.fromMillis(target, { zone: 'utc' }).toFormat('yyyy-MM-dd'))
}
const updateDateInput = event => emit('update:date-input', event.target.value)
const moveDate = years => emitDate(DateTime.fromMillis(safeDateMs.value, { zone: 'utc' }).plus({ years }).toMillis())
const seekTo = value => {
  const percent = Math.max(0, Math.min(100, Number(value))) / 100
  emitDate(timelineStartMs.value + (timelineEndMs.value - timelineStartMs.value) * percent)
}
const setToday = () => emitDate(Date.now())
const stopPlayback = () => {
  isPlaying.value = false
  if (playbackTimer) {
    clearInterval(playbackTimer)
    playbackTimer = 0
  }
}
const togglePlayback = () => {
  if (isPlaying.value) return stopPlayback()
  isPlaying.value = true
  playbackTimer = window.setInterval(() => moveDate(0.5), 820)
}

const resizeCanvas = () => {
  if (!canvas.value || !canvasContext) return
  const rect = canvas.value.getBoundingClientRect()
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.floor(rect.width * ratio))
  const height = Math.max(1, Math.floor(rect.height * ratio))
  if (canvas.value.width !== width || canvas.value.height !== height) {
    canvas.value.width = width
    canvas.value.height = height
  }
  canvasContext.setTransform(ratio, 0, 0, ratio, 0, 0)
}
const drawCanvas = timestamp => {
  if (!canvas.value || !canvasContext) return
  const width = canvas.value.clientWidth
  const height = canvas.value.clientHeight
  if (!width || !height) return
  resizeCanvas()
  const ctx = canvasContext
  const time = timestamp * 0.001
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.38
  const light = document.documentElement.dataset.theme === 'light'
  const background = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.7)
  background.addColorStop(0, light ? 'rgba(219,234,254,.86)' : 'rgba(24,21,54,.78)')
  background.addColorStop(.56, light ? 'rgba(224,242,254,.35)' : 'rgba(8,10,34,.58)')
  background.addColorStop(1, light ? 'rgba(241,245,249,0)' : 'rgba(2,6,23,0)')
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.fillStyle = light ? '#2563a6' : '#dbeafe'
  for (const star of STARS) {
    ctx.globalAlpha = star.alpha * (.72 + Math.sin(time * .8 + star.phase) * .18)
    ctx.beginPath()
    ctx.arc(star.x * width + Math.sin(time * .2 + star.phase) * 3, star.y * height, star.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.strokeStyle = light ? 'rgba(37,99,166,.18)' : 'rgba(125,211,252,.20)'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 9])
  for (const scale of [.58, .78, 1]) {
    ctx.beginPath()
    ctx.arc(0, 0, radius * scale, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.strokeStyle = light ? 'rgba(180,83,9,.18)' : 'rgba(246,196,83,.18)'
  ctx.beginPath()
  ctx.moveTo(-radius * 1.1, 0)
  ctx.lineTo(radius * 1.1, 0)
  ctx.moveTo(0, -radius * 1.1)
  ctx.lineTo(0, radius * 1.1)
  ctx.stroke()
  ctx.restore()

  const pulseRadius = (time * 18) % Math.max(30, radius * 1.1)
  ctx.save()
  ctx.globalAlpha = .18 * (1 - pulseRadius / Math.max(30, radius * 1.1))
  ctx.strokeStyle = light ? '#b45309' : '#f6c453'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  for (const planet of orbitPlanets.value) {
    const angle = (planet.longitude - 90) * Math.PI / 180 + time * (.006 + planet.index * .0006)
    const orbitRadius = radius * (.56 + (planet.index % 6) * .085)
    const point = { x: centerX + Math.cos(angle) * orbitRadius, y: centerY + Math.sin(angle) * orbitRadius }
    const selected = activeChange.value?.planet === planet.planet
    ctx.save()
    ctx.globalAlpha = selected ? .3 : .1
    ctx.strokeStyle = planet.color
    ctx.lineWidth = selected ? 1.5 : .7
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    ctx.globalAlpha = selected ? 1 : .54
    ctx.fillStyle = planet.color
    ctx.beginPath()
    ctx.arc(point.x, point.y, selected ? 2.9 : 1.9, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

const startCanvas = async () => {
  await nextTick()
  if (!canvas.value) return
  canvasContext = canvas.value.getContext('2d')
  if (!canvasContext) return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    || window.matchMedia?.('(prefers-reduced-data: reduce)').matches
  resizeCanvas()
  drawCanvas(0)
  if (!reduced) {
    const animate = timestamp => {
      drawCanvas(timestamp)
      animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)
  }
  resizeHandler = () => drawCanvas(0)
  if (window.ResizeObserver) {
    resizeObserver = new window.ResizeObserver(resizeHandler)
    resizeObserver.observe(canvas.value)
  } else window.addEventListener('resize', resizeHandler)
}
watch([() => props.progressed, () => props.natal, selectedPlanet], () => drawCanvas(0))
onMounted(startCanvas)
onBeforeUnmount(() => {
  stopPlayback()
  if (animationFrame) cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect?.()
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  canvasContext = null
})
</script>

<template lang="pug">
section.progression-visualization(data-testid='progression-visualization')
  .progression-stage
    canvas.progression-canvas(ref='canvas' aria-hidden='true')
    .progression-stage__veil
    .progression-stage__content
      header.progression-header
        .progression-header__copy
          .progression-kicker
            span.progression-kicker__dot
            span {{ t('progression_visual.kicker') }}
          h2 {{ t('progression_visual.title') }}
          p {{ t('progression_visual.subtitle') }}
          p.progression-header__chapter
            span {{ t('progression_visual.current_chapter') }}
            strong {{ currentChapter }}
        .progression-status(:class='{ "is-playing": isPlaying }')
          span.progression-status__pulse
          span {{ isPlaying ? t('progression_visual.status_playing') : t('progression_visual.status_paused') }}

      .progression-orbit-layout
        .progression-orbit-card
          .progression-panel-label
            span {{ t('progression_visual.orbit_label') }}
            span.progression-panel-label__hint {{ ageAtSelectedDate }}
          .progression-orbit
            span.progression-orbit__ring(
              v-for='radius in [28, 38, 48, 58]'
              :key='radius'
              :style='ringStyle(radius)'
            )
            .progression-orbit__crosshair
            .progression-orbit__sun
              CelestialGlyph(
                reference='Sun'
                :symbol='PLANET_SYMBOLS.Sun'
                mode='html'
                :renderer='planetGlyphRenderer'
                :size='30'
                color='var(--progression-accent)'
              )
              span {{ t('progression_visual.center') }}
            button.progression-orbit__planet(
              v-for='planet in orbitPlanets'
              :key='planet.planet'
              type='button'
              :style='orbitPlanetStyle(planet)'
              :class='{ "is-selected": selectedPlanet === planet.planet }'
              :aria-label='planetLabel(planet.planet)'
              :data-planet='planet.planet'
              @click='selectPlanet(planet.planet)'
            )
              CelestialGlyph(
                :reference='planet.planet'
                :symbol='PLANET_SYMBOLS[planet.planet]'
                mode='html'
                :renderer='planetGlyphRenderer'
                :size='20'
                :color='planet.color'
              )
          .progression-orbit__legend
            span
              i.progression-legend-dot.progression-legend-dot--accent
              | {{ t('progression_visual.progressed') }}
            span
              i.progression-legend-dot.progression-legend-dot--muted
              | {{ t('progression_visual.click_to_focus') }}

        aside.progression-cycle-card
          .progression-panel-label
            span {{ t('progression_visual.cycle_title') }}
            span.progression-panel-label__hint {{ t('progression_visual.cycle_hint') }}
          .progression-cycle-dial(:style='cycleDialStyle')
            .progression-cycle-dial__marker(:style='cycleMarkerStyle')
            .progression-cycle-dial__core
              CelestialGlyph(
                v-if='progressionSun'
                reference='Sun'
                :symbol='PLANET_SYMBOLS.Sun'
                mode='html'
                :renderer='planetGlyphRenderer'
                :size='22'
                color='var(--progression-accent)'
              )
              strong {{ cycleDegree }}
              span {{ signShortLabel(cycleSignIndex) }}
          p.progression-cycle-card__summary {{ t('progression_visual.cycle_summary', { sign: signLabel(cycleSignIndex) }) }}
          .progression-sign-grid
            span(
              v-for='(sign, index) in signShortNames'
              :key='sign'
              :class='{ "is-active": index === cycleSignIndex }'
            ) {{ sign }}

  .progression-controls
    .progression-controls__copy
      span.progression-panel-label__hint {{ t('progression_visual.controls') }}
      strong {{ formatMonthYear(safeDateMs) }}
    .progression-controls__actions
      button.progression-step-button(
        type='button'
        :aria-label='t("progression_visual.previous")'
        @click='moveDate(-0.5)'
      ) -
      button.progression-play-button(
        type='button'
        :aria-label='isPlaying ? t("progression_visual.pause") : t("progression_visual.play")'
        :aria-pressed='isPlaying'
        data-testid='progression-play'
        @click='togglePlayback'
      )
        span(aria-hidden='true') {{ isPlaying ? '||' : '>' }}
        span {{ isPlaying ? t('progression_visual.pause') : t('progression_visual.play') }}
      button.progression-step-button(
        type='button'
        :aria-label='t("progression_visual.next")'
        @click='moveDate(0.5)'
      ) +
      label.progression-date-control
        span {{ t('progression_visual.study_date') }}
        input.ui-control.ui-control-sm(
          type='date'
          :value='dateInput'
          data-testid='prog-date'
          @input='updateDateInput'
        )
      button.progression-today-button(
        type='button'
        data-testid='btn-today'
        @click='setToday'
      ) {{ t('progression_visual.today') }}

  section.progression-timeline(:style='timelineStyle')
    .progression-timeline__header
      div
        span.progression-panel-label__hint {{ t('progression_visual.timeline') }}
        strong {{ ageAtSelectedDate }}
      span.progression-timeline__window {{ timelineWindowLabel }}
    .progression-timeline__track
      .progression-timeline__fill
      input.progression-range(
        type='range'
        min='0'
        max='100'
        step='0.1'
        :value='timelinePercent'
        :aria-label='t("progression_visual.timeline_label")'
        @input='seekTo($event.target.value)'
      )
      .progression-timeline__ticks
        span(
          v-for='tick in timelineTicks'
          :key='tick.age'
          :style='{ left: `${tick.position}%` }'
        ) {{ tick.age }}

  section.progression-changes
    header.progression-section-header
      div
        .progression-kicker {{ t('progression_visual.changes_kicker') }}
        h3 {{ t('progression_visual.changes_title') }}
      p {{ t('progression_visual.changes_subtitle') }}
    TransitionGroup.progression-change-grid(name='progression-card' tag='div')
      button.progression-change-card(
        v-for='change in changeRows'
        :key='`${change.planet}-${change.currentSign}-${change.progressed.motion}`'
        type='button'
        :class='{ "is-active": selectedPlanet === change.planet }'
        data-testid='progression-change-card'
        @click='selectPlanet(change.planet)'
      )
        .progression-change-card__top
          span.progression-change-card__type {{ changeTypeLabel(change) }}
          span.progression-change-card__degree {{ formatDegree(change.progressed.longitude) }}
        .progression-change-card__identity
          span.progression-change-card__glyph(:style='{ color: change.color }')
            CelestialGlyph(
              :reference='change.planet'
              :symbol='PLANET_SYMBOLS[change.planet]'
              mode='html'
              :renderer='planetGlyphRenderer'
              :size='24'
              :color='change.color'
            )
          div
            strong {{ planetLabel(change.planet) }}
            small {{ signLabel(change.currentSign) }} · {{ motionLabel(change.progressed.motion) }}
        p {{ changeDetail(change) }}
        .progression-change-card__bar
          span(:style='changeBarStyle(change)')

  section.progression-aspects(v-if='rankedAspects.length')
    header.progression-section-header
      div
        .progression-kicker {{ t('progression_visual.contacts_kicker') }}
        h3 {{ t('progression_visual.contacts_title') }}
      p {{ t('progression_visual.contacts_subtitle') }}
    .progression-aspect-list
      button.progression-aspect-row(
        v-for='aspect in rankedAspects'
        :key='`${aspect.a}-${aspect.type}-${aspect.b}`'
        type='button'
        :class='{ "is-active": isActiveAspect(aspect) }'
        :style='aspectStyle(aspect)'
        @click='selectAspect(aspect)'
      )
        span.progression-aspect-row__line
        span.progression-aspect-row__title {{ aspectTitle(aspect) }}
        span.progression-aspect-row__meta {{ aspectMeta(aspect) }}
</template>

<style scoped>
.progression-visualization {
  --progression-accent: #f6c453;
  --progression-cyan: #7dd3fc;
  --progression-surface: rgb(6 11 30 / 0.74);
  --progression-border: rgb(148 163 184 / 0.18);
  --progression-muted: rgb(148 163 184 / 0.78);
  --progression-cycle-track: rgb(148 163 184 / 0.16);
  color: var(--app-heading);
  display: grid;
  gap: 0.9rem;
}

.progression-stage,
.progression-controls,
.progression-timeline,
.progression-changes,
.progression-aspects {
  border: 1px solid var(--progression-border);
  border-radius: 1.1rem;
  box-shadow: 0 18px 50px rgb(2 6 23 / 0.18);
  overflow: hidden;
}

.progression-stage {
  min-height: 34rem;
  position: relative;
  isolation: isolate;
  background: var(--progression-surface);
}

.progression-canvas,
.progression-stage__veil {
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.progression-canvas {
  height: 100%;
  width: 100%;
}

.progression-stage__veil {
  background: linear-gradient(115deg, rgb(2 6 23 / 0.48), transparent 45%, rgb(2 6 23 / 0.18));
  z-index: -1;
}

.progression-stage__content {
  display: grid;
  gap: 1.4rem;
  padding: clamp(1.1rem, 3vw, 2rem);
  position: relative;
}

.progression-header,
.progression-section-header,
.progression-timeline__header,
.progression-panel-label,
.progression-controls,
.progression-controls__actions,
.progression-controls__copy,
.progression-change-card__top,
.progression-change-card__identity,
.progression-aspect-row {
  align-items: center;
  display: flex;
}

.progression-header,
.progression-section-header,
.progression-timeline__header {
  gap: 1rem;
  justify-content: space-between;
}

.progression-header {
  align-items: flex-start;
}

.progression-header__copy {
  max-width: 37rem;
}

.progression-kicker {
  align-items: center;
  color: var(--progression-accent);
  display: flex;
  font-size: 0.66rem;
  font-weight: 800;
  gap: 0.42rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.progression-kicker__dot,
.progression-status__pulse {
  background: currentColor;
  border-radius: 999px;
  display: inline-block;
  height: 0.42rem;
  width: 0.42rem;
}

.progression-kicker__dot {
  box-shadow: 0 0 0 0.25rem rgb(246 196 83 / 0.12);
}

.progression-header h2 {
  color: var(--app-heading);
  font-size: clamp(1.35rem, 3vw, 2.35rem);
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 0.55rem 0 0.65rem;
}

.progression-header p,
.progression-section-header p,
.progression-cycle-card__summary {
  color: var(--progression-muted);
  font-size: 0.8rem;
  line-height: 1.55;
  margin: 0;
}

.progression-header p {
  max-width: 32rem;
}

.progression-header__chapter {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.95rem !important;
}

.progression-header__chapter span {
  color: var(--progression-accent);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.progression-header__chapter strong {
  color: var(--app-heading);
  font-size: 0.78rem;
  font-weight: 700;
}

.progression-status {
  align-items: center;
  border: 1px solid rgb(125 211 252 / 0.2);
  border-radius: 999px;
  color: var(--progression-cyan);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.68rem;
  font-weight: 800;
  gap: 0.45rem;
  padding: 0.42rem 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.progression-status.is-playing .progression-status__pulse {
  animation: progression-pulse 1.3s ease-in-out infinite;
}

.progression-orbit-layout {
  align-items: stretch;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.3fr) minmax(15rem, 0.7fr);
}

.progression-orbit-card,
.progression-cycle-card {
  background: rgb(2 6 23 / 0.35);
  border: 1px solid rgb(148 163 184 / 0.14);
  border-radius: 0.85rem;
  min-width: 0;
  padding: 0.85rem;
}

.progression-panel-label {
  color: var(--app-heading);
  font-size: 0.69rem;
  font-weight: 800;
  justify-content: space-between;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.progression-panel-label__hint {
  color: var(--progression-muted);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.progression-orbit {
  aspect-ratio: 1.55;
  margin: 0.35rem auto 0;
  max-width: 33rem;
  min-height: 15rem;
  overflow: hidden;
  position: relative;
}

.progression-orbit__ring {
  border: 1px solid rgb(125 211 252 / 0.16);
  border-radius: 50%;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.progression-orbit__ring:nth-child(odd) {
  border-color: rgb(246 196 83 / 0.13);
}

.progression-orbit__crosshair {
  background: linear-gradient(90deg, transparent, rgb(125 211 252 / 0.17), transparent);
  height: 1px;
  left: 8%;
  position: absolute;
  top: 50%;
  width: 84%;
}

.progression-orbit__crosshair::after {
  background: rgb(246 196 83 / 0.14);
  content: '';
  height: 84%;
  left: 50%;
  position: absolute;
  top: -42%;
  width: 1px;
}

.progression-orbit__sun,
.progression-orbit__planet {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: absolute;
  transform: translate(-50%, -50%);
}

.progression-orbit__sun {
  color: var(--progression-accent);
  left: 50%;
  top: 50%;
  text-shadow: 0 0 1.1rem rgb(246 196 83 / 0.55);
}

.progression-orbit__sun span {
  color: var(--progression-muted);
  font-size: 0.54rem;
  letter-spacing: 0.1em;
  margin-top: -0.15rem;
  text-transform: uppercase;
}

.progression-orbit__planet {
  background: rgb(2 6 23 / 0.45);
  border: 1px solid transparent;
  border-radius: 50%;
  color: var(--planet-color);
  cursor: pointer;
  height: 2.2rem;
  transition: border-color 180ms ease, box-shadow 180ms ease, left 700ms cubic-bezier(.2,.8,.2,1), top 700ms cubic-bezier(.2,.8,.2,1), transform 180ms ease;
  width: 2.2rem;
  z-index: 2;
}

.progression-orbit__planet:hover,
.progression-orbit__planet:focus-visible,
.progression-orbit__planet.is-selected {
  border-color: var(--planet-color);
  box-shadow: 0 0 1rem color-mix(in srgb, var(--planet-color) 45%, transparent);
  transform: translate(-50%, -50%) scale(1.15);
}

.progression-orbit__legend {
  color: var(--progression-muted);
  display: flex;
  font-size: 0.66rem;
  gap: 1rem;
  justify-content: center;
}

.progression-legend-dot {
  border-radius: 50%;
  display: inline-block;
  height: 0.42rem;
  margin-right: 0.3rem;
  width: 0.42rem;
}

.progression-legend-dot--accent { background: var(--progression-accent); }
.progression-legend-dot--muted { background: var(--progression-cyan); opacity: 0.65; }

.progression-cycle-card {
  align-content: start;
  display: grid;
  gap: 0.7rem;
}

.progression-cycle-dial {
  border-radius: 50%;
  height: 12rem;
  margin: 0.4rem auto 0;
  padding: 0.55rem;
  position: relative;
  width: 12rem;
}

.progression-cycle-dial::before,
.progression-cycle-dial__core {
  background: rgb(5 10 27 / 0.9);
  border-radius: inherit;
  inset: 0.2rem;
  position: absolute;
}

.progression-cycle-dial::before {
  content: '';
}

.progression-cycle-dial__core {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 1;
}

.progression-cycle-dial__core strong {
  color: var(--app-heading);
  font-size: 1.25rem;
  letter-spacing: -0.03em;
  margin-top: 0.2rem;
}

.progression-cycle-dial__core span {
  color: var(--progression-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.progression-cycle-dial__marker {
  inset: 0;
  position: absolute;
  transition: transform 700ms cubic-bezier(.2,.8,.2,1);
  z-index: 2;
}

.progression-cycle-dial__marker::after {
  background: var(--progression-accent);
  border: 3px solid rgb(5 10 27 / 0.9);
  border-radius: 50%;
  box-shadow: 0 0 0.8rem rgb(246 196 83 / 0.85);
  content: '';
  height: 0.75rem;
  left: calc(50% - 0.375rem);
  position: absolute;
  top: -0.1rem;
  width: 0.75rem;
}

.progression-cycle-card__summary {
  text-align: center;
}

.progression-sign-grid {
  display: grid;
  gap: 0.25rem;
  grid-template-columns: repeat(6, 1fr);
}

.progression-sign-grid span {
  border-radius: 0.3rem;
  color: var(--progression-muted);
  font-size: 0.62rem;
  padding: 0.3rem 0;
  text-align: center;
}

.progression-sign-grid span.is-active {
  background: rgb(246 196 83 / 0.16);
  color: var(--progression-accent);
  font-weight: 800;
}

.progression-controls,
.progression-timeline {
  background: color-mix(in srgb, var(--app-panel-strong) 82%, transparent);
  padding: 0.75rem 0.9rem;
}

.progression-controls {
  gap: 1rem;
  justify-content: space-between;
}

.progression-controls__copy {
  align-items: flex-start;
  flex-direction: column;
  gap: 0.12rem;
}

.progression-controls__copy strong {
  font-size: 0.95rem;
}

.progression-controls__actions {
  flex-wrap: wrap;
  gap: 0.45rem;
  justify-content: flex-end;
}

.progression-step-button,
.progression-play-button,
.progression-today-button {
  align-items: center;
  border-radius: 0.45rem;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 800;
  justify-content: center;
  min-height: 2rem;
  transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
}

.progression-step-button {
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  color: var(--app-text-soft);
  width: 2rem;
}

.progression-play-button {
  background: var(--progression-accent);
  color: rgb(15 23 42);
  gap: 0.45rem;
  padding: 0.35rem 0.7rem;
}

.progression-today-button {
  background: transparent;
  border: 1px solid rgb(246 196 83 / 0.42);
  color: var(--progression-accent);
  padding: 0.35rem 0.65rem;
}

.progression-step-button:hover,
.progression-step-button:focus-visible { background: var(--app-chip-hover); color: var(--app-heading); }
.progression-play-button:hover,
.progression-play-button:focus-visible { background: #fde68a; }
.progression-today-button:hover,
.progression-today-button:focus-visible { background: rgb(246 196 83 / 0.12); }

.progression-date-control {
  color: var(--progression-muted);
  display: grid;
  font-size: 0.64rem;
  font-weight: 700;
  gap: 0.2rem;
}

.progression-date-control input { min-width: 9.6rem; }

.progression-timeline__header {
  margin-bottom: 0.7rem;
}

.progression-timeline__header div {
  display: grid;
  gap: 0.18rem;
}

.progression-timeline__window {
  color: var(--progression-muted);
  font-size: 0.68rem;
}

.progression-timeline__track {
  padding: 0 0.15rem 1.1rem;
  position: relative;
}

.progression-timeline__track::before,
.progression-timeline__fill {
  border-radius: 999px;
  height: 0.28rem;
  left: 0;
  position: absolute;
  top: 0.55rem;
}

.progression-timeline__track::before {
  background: var(--app-chip);
  content: '';
  right: 0;
}

.progression-timeline__fill {
  background: linear-gradient(90deg, var(--progression-cyan), var(--progression-accent));
  width: var(--timeline-progress);
}

.progression-range {
  appearance: none;
  background: transparent;
  cursor: pointer;
  height: 1.35rem;
  margin: 0;
  position: relative;
  width: 100%;
}

.progression-range::-webkit-slider-runnable-track { background: transparent; height: 0.28rem; }
.progression-range::-moz-range-track { background: transparent; height: 0.28rem; }
.progression-range::-webkit-slider-thumb {
  appearance: none;
  background: var(--progression-accent);
  border: 3px solid var(--app-heading);
  border-radius: 50%;
  box-shadow: 0 0 0.8rem rgb(246 196 83 / 0.62);
  height: 0.9rem;
  margin-top: -0.31rem;
  width: 0.9rem;
}
.progression-range::-moz-range-thumb {
  background: var(--progression-accent);
  border: 3px solid var(--app-heading);
  border-radius: 50%;
  box-shadow: 0 0 0.8rem rgb(246 196 83 / 0.62);
  height: 0.9rem;
  width: 0.9rem;
}

.progression-timeline__ticks { height: 0.8rem; position: relative; }
.progression-timeline__ticks span {
  color: var(--progression-muted);
  font-size: 0.61rem;
  position: absolute;
  transform: translateX(-50%);
}

.progression-changes,
.progression-aspects {
  background: color-mix(in srgb, var(--app-panel) 88%, transparent);
  padding: 1rem;
}

.progression-section-header {
  align-items: flex-start;
  margin-bottom: 0.85rem;
}

.progression-section-header h3 {
  color: var(--app-heading);
  font-size: 1.05rem;
  letter-spacing: -0.02em;
  margin: 0.28rem 0 0;
}

.progression-section-header p {
  max-width: 28rem;
  text-align: right;
}

.progression-change-grid {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.progression-change-card {
  background: rgb(255 255 255 / 0.035);
  border: 1px solid var(--app-border-soft);
  border-radius: 0.75rem;
  color: var(--app-text);
  cursor: pointer;
  min-width: 0;
  padding: 0.75rem;
  text-align: left;
  transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.progression-change-card:hover,
.progression-change-card:focus-visible,
.progression-change-card.is-active {
  background: rgb(246 196 83 / 0.08);
  border-color: rgb(246 196 83 / 0.46);
  transform: translateY(-2px);
}

.progression-change-card__top { justify-content: space-between; gap: 0.4rem; }
.progression-change-card__type {
  color: var(--progression-accent);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.progression-change-card__degree { color: var(--progression-muted); font-size: 0.61rem; }
.progression-change-card__identity { gap: 0.55rem; margin: 0.8rem 0 0.55rem; }
.progression-change-card__glyph { align-items: center; display: flex; justify-content: center; }
.progression-change-card__identity strong { display: block; font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.progression-change-card__identity small { color: var(--progression-muted); display: block; font-size: 0.62rem; margin-top: 0.14rem; }
.progression-change-card p { color: var(--progression-muted); font-size: 0.68rem; line-height: 1.45; margin: 0; min-height: 3.1rem; }
.progression-change-card__bar { background: var(--app-chip); border-radius: 999px; height: 0.22rem; margin-top: 0.7rem; overflow: hidden; }
.progression-change-card__bar span { background: var(--change-color); border-radius: inherit; display: block; height: 100%; transition: width 700ms cubic-bezier(.2,.8,.2,1); }

.progression-aspect-list { display: grid; gap: 0.5rem; }
.progression-aspect-row {
  background: rgb(255 255 255 / 0.035);
  border: 1px solid var(--app-border-soft);
  border-left: 3px solid var(--aspect-color);
  border-radius: 0.55rem;
  color: var(--app-text);
  cursor: pointer;
  gap: 0.7rem;
  justify-content: flex-start;
  padding: 0.7rem 0.8rem;
  text-align: left;
  transition: background-color 160ms ease, border-color 160ms ease;
  width: 100%;
}
.progression-aspect-row:hover,
.progression-aspect-row:focus-visible,
.progression-aspect-row.is-active { background: color-mix(in srgb, var(--aspect-color) 10%, transparent); }
.progression-aspect-row__line { background: var(--aspect-color); border-radius: 999px; height: 0.45rem; width: 0.45rem; }
.progression-aspect-row__title { flex: 1; font-size: 0.76rem; font-weight: 700; }
.progression-aspect-row__meta { color: var(--progression-muted); font-size: 0.65rem; }

.progression-card-enter-active,
.progression-card-leave-active { transition: opacity 220ms ease, transform 220ms ease; }
.progression-card-enter-from,
.progression-card-leave-to { opacity: 0; transform: translateY(0.5rem); }

@keyframes progression-pulse {
  0%, 100% { opacity: 0.55; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

:global(html[data-theme='light']) .progression-stage {
  --progression-surface: rgb(239 246 255 / 0.78);
  --progression-border: rgb(30 64 175 / 0.14);
}

:global(html[data-theme='light']) .progression-stage__veil { background: linear-gradient(115deg, rgb(255 255 255 / 0.32), transparent 48%, rgb(30 64 175 / 0.05)); }
:global(html[data-theme='light']) .progression-orbit-card,
:global(html[data-theme='light']) .progression-cycle-card { background: rgb(255 255 255 / 0.42); }
:global(html[data-theme='light']) .progression-cycle-dial::before,
:global(html[data-theme='light']) .progression-cycle-dial__core { background: rgb(239 246 255 / 0.9); }

@media (max-width: 900px) {
  .progression-orbit-layout { grid-template-columns: minmax(0, 1fr); }
  .progression-cycle-card { grid-template-columns: auto minmax(0, 1fr); }
  .progression-cycle-card .progression-panel-label,
  .progression-cycle-card__summary,
  .progression-sign-grid { grid-column: 1 / -1; }
  .progression-cycle-dial { grid-row: span 2; }
  .progression-change-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 620px) {
  .progression-stage { min-height: auto; }
  .progression-header,
  .progression-section-header,
  .progression-controls { align-items: stretch; flex-direction: column; }
  .progression-status { align-self: flex-start; }
  .progression-orbit { aspect-ratio: 1.05; min-height: 14rem; }
  .progression-controls__actions { justify-content: flex-start; }
  .progression-date-control,
  .progression-date-control input { width: 100%; }
  .progression-section-header p { text-align: left; }
  .progression-change-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 390px) {
  .progression-change-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
