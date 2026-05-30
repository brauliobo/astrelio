<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { aspectMatrix, chartAspectPoints } from '../../lib/astro/aspectarian.js'
import { motionMarker } from '../../lib/astro/motion.js'
import { degInSign, signIndex } from '../../lib/astro/zodiac.js'
import CelestialGlyph from '../common/CelestialGlyph.vue'
import { PLANET_SYMBOLS, ZODIAC_SIGNS } from './wheel/geometry.js'

const props = defineProps({
  base: { type: Object, required: true },
  comparison: { type: Object, default: null },
  aspectOptions: { type: Object, default: () => ({}) },
  baseLabel: { type: String, default: '' },
  comparisonLabel: { type: String, default: '' },
  planetGlyphRenderer: { type: String, default: null },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const { t, tm } = useI18n()
const signs = computed(() => tm('zodiac.signs'))
const hoverHighlight = ref(null)
const pinnedHighlight = ref(null)
const sharedHoverHighlight = ref(null)
const sharedPinnedHighlight = ref(null)
const chartHighlightEvent = 'astrelio-chart-highlight'

const ASPECT_SYMBOLS = {
  conjunction: '☌',
  opposition: '☍',
  trine: '△',
  square: '□',
  sextile: '✶',
  quincunx: '⚻',
}

const matrix = computed(() => aspectMatrix(props.base, props.comparison, props.aspectOptions))
const isComparison = computed(() => Boolean(props.comparison && props.comparison !== props.base))
const gridStyle = computed(() => ({
  '--aspect-column-count': matrix.value.columns.length,
  gridTemplateColumns: isComparison.value
    ? `minmax(1.25rem, 1.45rem) repeat(${matrix.value.columns.length}, minmax(1.05rem, 1fr)) minmax(1.25rem, 1.45rem)`
    : `minmax(1.25rem, 1.45rem) repeat(${matrix.value.columns.length}, minmax(1.05rem, 1fr))`,
}))
const title = computed(() => isComparison.value ? t('chart.aspect_grid_comparison') : t('chart.aspect_grid_natal'))
const subtitle = computed(() => {
  if (!isComparison.value) return props.baseLabel
  return [props.comparisonLabel, props.baseLabel].filter(Boolean).join(' × ')
})
const basePoints = computed(() =>
  chartAspectPoints(props.base, { ...props.aspectOptions, includeAngles: false, includeFortune: true })
)
const comparisonPoints = computed(() =>
  props.comparison
    ? chartAspectPoints(props.comparison, { ...props.aspectOptions, includeAngles: false, includeFortune: false })
    : []
)
const localHighlight = computed(() =>
  hoverHighlight.value || pinnedHighlight.value || sharedHoverHighlight.value || sharedPinnedHighlight.value
)
const activeAspectKey = computed(() => localHighlight.value?.aspectKey || '')

const pointLabel = (name) => t(`planets.${name}`)
const pointSymbol = (name) => PLANET_SYMBOLS[name] || name.slice(0, 2)
const pointMotion = (point) => motionMarker(point)
const aspectSymbol = (aspect) => ASPECT_SYMBOLS[aspect?.type] || ''
const aspectKey = (aspect) => aspect ? `${aspect.a}-${aspect.b}-${aspect.type}` : ''
const pointKey = (point, prefix) => `${prefix}-${point.name}`

const formatLongitude = (longitude) => {
  const degrees = degInSign(longitude)
  const wholeDegrees = Math.floor(degrees)
  const minutes = Math.floor((degrees - wholeDegrees) * 60)
  return `${wholeDegrees}°${minutes.toString().padStart(2, '0')}′ ${signs.value[signIndex(longitude)]}`
}

const formatPosition = (longitude) => {
  const degrees = degInSign(longitude)
  const wholeDegrees = Math.floor(degrees).toString().padStart(2, '0')
  const minutes = Math.floor((degrees - Math.floor(degrees)) * 60).toString().padStart(2, '0')
  return {
    degrees: wholeDegrees,
    sign: ZODIAC_SIGNS[signIndex(longitude)],
    minutes,
  }
}

const cellTitle = (cell) => cell
  ? `${pointLabel(cell.a)} ${t(`aspects.${cell.type}`)} ${pointLabel(cell.b)} · ${cell.delta.toFixed(2)}°`
  : ''

const aspectClass = (type) => ({
  conjunction: 'text-amber-200',
  opposition: 'text-emerald-300',
  trine: 'text-sky-300',
  square: 'text-rose-300',
  sextile: 'text-cyan-300',
  quincunx: 'text-violet-300',
}[type] || 'text-slate-300')

const normalizeHighlight = (payload) => ({
  bodies: [...new Set(payload?.bodies || [])],
  aspectKey: payload?.aspectKey || '',
})

const sameHighlight = (a, b) =>
  a.aspectKey === b.aspectKey &&
  a.bodies.length === b.bodies.length &&
  a.bodies.every(body => b.bodies.includes(body))

const highlightPayload = (cell) => ({
  bodies: [cell.a, cell.b],
  aspectKey: aspectKey(cell),
})

const broadcastHighlight = (highlight, pinned = false) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(chartHighlightEvent, { detail: { highlight, pinned } }))
}

const onSharedHighlight = (event) => {
  const highlight = event.detail?.highlight ? normalizeHighlight(event.detail.highlight) : null
  if (event.detail?.pinned) {
    sharedPinnedHighlight.value = highlight
    sharedHoverHighlight.value = null
  } else {
    sharedHoverHighlight.value = highlight
  }
}

const setHoverHighlight = (cell) => {
  if (!cell) return
  const highlight = highlightPayload(cell)
  hoverHighlight.value = highlight
  emit('highlight', highlight)
  broadcastHighlight(highlight)
}

const clearHoverHighlight = () => {
  hoverHighlight.value = null
  emit('clear-highlight')
  broadcastHighlight(null)
}

const togglePinnedHighlight = (cell) => {
  if (!cell) return
  const highlight = highlightPayload(cell)
  pinnedHighlight.value = pinnedHighlight.value && sameHighlight(pinnedHighlight.value, highlight) ? null : highlight
  hoverHighlight.value = null
  emit('toggle-highlight', highlight)
  broadcastHighlight(pinnedHighlight.value, true)
}

const cellHighlightState = (cell) => {
  if (!cell || !activeAspectKey.value) return 'idle'
  return activeAspectKey.value === aspectKey(cell) ? 'active' : 'dimmed'
}

const cellClass = (cell) => {
  if (!cell) return 'border-white/5 bg-white/[0.02]'
  const state = cellHighlightState(cell)
  const highlightClass = state === 'active'
    ? 'ring-1 ring-inset ring-amber-300/45 bg-amber-300/10'
    : state === 'dimmed'
      ? 'opacity-45'
      : 'hover:bg-white/10 focus:bg-white/10'
  return [aspectClass(cell.type), highlightClass].join(' ')
}

onMounted(() => {
  window.addEventListener(chartHighlightEvent, onSharedHighlight)
})

onBeforeUnmount(() => {
  window.removeEventListener(chartHighlightEvent, onSharedHighlight)
})
</script>

<template lang="pug">
.aspect-matrix(data-testid='aspect-matrix')
  .flex.flex-wrap.items-baseline.justify-between.gap-2.mb-3
    h2.text-sm.font-semibold.text-slate-200 {{ title }}
    .text-xs.text-slate-500(v-if='subtitle') {{ subtitle }}
  .aspectarian-body(:class='{ "is-comparison": isComparison }')
    aside.aspect-position-list(v-if='isComparison' data-testid='aspect-matrix-natal-positions')
      h3 {{ props.baseLabel || t('chart.natal_positions') }}
      p {{ t('zodiac.tropical') }}
      .aspect-position-row(v-for='point in basePoints' :key='pointKey(point, "base-position")')
        CelestialGlyph(
          :reference='point.name'
          :symbol='pointSymbol(point.name)'
          :size='15'
          :weight='700'
          :renderer='planetGlyphRenderer'
        )
        span.tabular-nums {{ formatPosition(point.longitude).degrees }}
        span.aspect-sign {{ formatPosition(point.longitude).sign }}
        span.tabular-nums {{ formatPosition(point.longitude).minutes }}
        span.aspect-retro(v-if='pointMotion(point)') {{ pointMotion(point) }}
    .aspect-matrix-stage
      .aspect-matrix-grid(:style='gridStyle' role='grid' :aria-label='title')
        .aspect-matrix-corner
        .aspect-matrix-header(
          v-for='column in matrix.columns'
          :key='pointKey(column, "column")'
          role='columnheader'
          :title='`${pointLabel(column.name)} · ${formatLongitude(column.longitude)}`'
        )
          CelestialGlyph(
            :reference='column.name'
            :symbol='pointSymbol(column.name)'
            :size='13'
            :weight='700'
            :renderer='planetGlyphRenderer'
          )
        .aspect-matrix-corner(v-if='isComparison')
        template(v-for='row in matrix.rows' :key='pointKey(row.point, "row")')
          .aspect-matrix-header.aspect-matrix-row-header(
            role='rowheader'
            :title='`${pointLabel(row.point.name)} · ${formatLongitude(row.point.longitude)}`'
          )
            CelestialGlyph(
              :reference='row.point.name'
              :symbol='pointSymbol(row.point.name)'
              :size='13'
              :weight='700'
              :renderer='planetGlyphRenderer'
            )
          button.aspect-matrix-cell(
            v-for='(cell, columnIndex) in row.cells'
            :key='`${row.point.name}-${matrix.columns[columnIndex].name}`'
            type='button'
            role='gridcell'
            :class='cellClass(cell)'
            :disabled='!cell'
            :title='cellTitle(cell)'
            :data-aspect-grid-cell='cell ? aspectKey(cell) : ""'
            :data-highlight='cellHighlightState(cell)'
            @mouseenter='setHoverHighlight(cell)'
            @mouseleave='clearHoverHighlight'
            @focus='setHoverHighlight(cell)'
            @blur='clearHoverHighlight'
            @click='togglePinnedHighlight(cell)'
            @keydown.enter.prevent='togglePinnedHighlight(cell)'
            @keydown.space.prevent='togglePinnedHighlight(cell)'
          ) {{ aspectSymbol(cell) }}
          .aspect-matrix-header.aspect-matrix-row-header-right(
            v-if='isComparison'
            role='rowheader'
            :title='`${pointLabel(row.point.name)} · ${formatLongitude(row.point.longitude)}`'
          )
            CelestialGlyph(
              :reference='row.point.name'
              :symbol='pointSymbol(row.point.name)'
              :size='13'
              :weight='700'
              :renderer='planetGlyphRenderer'
            )
        template(v-if='isComparison')
          .aspect-matrix-corner
          .aspect-matrix-header(
            v-for='column in matrix.columns'
            :key='pointKey(column, "column-bottom")'
            role='columnheader'
            :title='`${pointLabel(column.name)} · ${formatLongitude(column.longitude)}`'
          )
            CelestialGlyph(
              :reference='column.name'
              :symbol='pointSymbol(column.name)'
              :size='13'
              :weight='700'
              :renderer='planetGlyphRenderer'
            )
          .aspect-matrix-corner
    aside.aspect-position-list(v-if='isComparison' data-testid='aspect-matrix-transit-positions')
      h3 {{ props.comparisonLabel || t('chart.transit_positions') }}
      p {{ t('zodiac.tropical') }}
      .aspect-position-row(v-for='point in comparisonPoints' :key='pointKey(point, "comparison-position")')
        CelestialGlyph(
          :reference='point.name'
          :symbol='pointSymbol(point.name)'
          :size='15'
          :weight='700'
          :renderer='planetGlyphRenderer'
        )
        span.tabular-nums {{ formatPosition(point.longitude).degrees }}
        span.aspect-sign {{ formatPosition(point.longitude).sign }}
        span.tabular-nums {{ formatPosition(point.longitude).minutes }}
        span.aspect-retro(v-if='pointMotion(point)') {{ pointMotion(point) }}
  .flex.flex-wrap.gap-x-3.gap-y-1.mt-3.text-xs.text-slate-500
    span(v-for='type in Object.keys(ASPECT_SYMBOLS)' :key='type' :class='aspectClass(type)')
      | {{ ASPECT_SYMBOLS[type] }} {{ t(`aspects.${type}`) }}
</template>

<style scoped>
.aspect-matrix-grid {
  display: grid;
  gap: 1px;
  width: 100%;
}

.aspectarian-body {
  display: grid;
  gap: 0.75rem;
}

.aspectarian-body.is-comparison {
  align-items: start;
  grid-template-columns: minmax(6.8rem, 8.2rem) minmax(0, 1fr) minmax(6.8rem, 8.2rem);
}

.aspect-matrix-stage {
  min-width: 0;
  width: 100%;
}

.aspect-matrix-corner,
.aspect-matrix-header,
.aspect-matrix-cell {
  align-items: center;
  border: 1px solid rgb(255 255 255 / 0.08);
  display: inline-flex;
  height: clamp(1.25rem, calc((100vw - 22rem) / 22), 1.75rem);
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.aspect-matrix-header {
  background: rgb(255 255 255 / 0.05);
  color: rgb(203 213 225);
}

.aspect-matrix-row-header {
  position: sticky;
  left: 0;
  z-index: 1;
}

.aspect-matrix-cell {
  background: rgb(255 255 255 / 0.03);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(0.72rem, calc((100vw - 22rem) / 38), 0.95rem);
  font-weight: 700;
  line-height: 1;
  outline: none;
  transition: background-color 120ms ease, opacity 120ms ease, box-shadow 120ms ease;
}

.aspect-matrix-cell:disabled {
  color: transparent;
  cursor: default;
}

.aspect-position-list {
  border: 1px solid rgb(255 255 255 / 0.1);
  padding: 0.5rem;
}

.aspect-position-list h3 {
  color: rgb(226 232 240);
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.15;
  margin: 0;
  text-align: center;
}

.aspect-position-list p {
  color: rgb(148 163 184);
  font-size: 0.68rem;
  line-height: 1.1;
  margin: 0.12rem 0 0.35rem;
  text-align: center;
}

.aspect-position-row {
  align-items: center;
  color: rgb(203 213 225);
  display: grid;
  font-size: 0.73rem;
  gap: 0.16rem;
  grid-template-columns: 1.1rem 1.1rem 1.15rem 1.1rem 0.5rem;
  min-height: 1.12rem;
}

.aspect-sign {
  color: rgb(125 211 252);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.95rem;
  line-height: 1;
}

.aspect-retro {
  color: rgb(251 191 36);
  font-size: 0.65rem;
}

@media (max-width: 760px) {
  .aspectarian-body.is-comparison {
    grid-template-columns: 1fr;
  }

  .aspect-position-list {
    display: none;
  }

  .aspect-matrix-header,
  .aspect-matrix-cell {
    height: 1.18rem;
  }
}
</style>
