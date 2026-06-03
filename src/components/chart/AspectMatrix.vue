<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { aspectMatrix, chartAspectPoints } from '../../lib/astro/aspectarian.js'
import { motionMarker } from '../../lib/astro/motion.js'
import { degInSign, signIndex } from '../../lib/astro/zodiac.js'
import CelestialGlyph from '../common/CelestialGlyph.vue'
import { PLANET_SYMBOLS, ZODIAC_SIGNS } from './wheel/geometry.js'

const props = defineProps({
  base:                { type: Object, required: true },
  comparison:          { type: Object, default: null },
  aspectOptions:       { type: Object, default: () => ({}) },
  baseLabel:           { type: String, default: '' },
  comparisonLabel:     { type: String, default: '' },
  planetGlyphRenderer: { type: String, default: null },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const { t, tm } = useI18n()
const signs                 = computed(() => tm('zodiac.signs'))
const hoverHighlight        = ref(null)
const pinnedHighlight       = ref(null)
const sharedHoverHighlight  = ref(null)
const sharedPinnedHighlight = ref(null)
const chartHighlightEvent   = 'astrelio-chart-highlight'
const activeAspectFilter    = ref('major')
const EXACT_FILTER_ORB      = 1

const ASPECT_SYMBOLS = {
  conjunction: '☌',
  opposition:  '☍',
  trine:       '△',
  square:      '□',
  sextile:     '✶',
  quincunx:    '⚻',
}

const aspectFilters = computed(() => [
  { key: 'major', label: t('chart.aspect_filters.major') },
  { key: 'all', label: t('chart.aspect_filters.all') },
  { key: 'applying', label: t('chart.aspect_filters.applying') },
  { key: 'exact', label: t('chart.aspect_filters.exact') },
])
const matrixOptions = computed(() => {
  const filterOptions = {
    major:    { aspectSet: 'major', applyingOnly: false },
    all:      { aspectSet: 'all', applyingOnly: false },
    applying: { aspectSet: 'all', applyingOnly: true },
    exact:    { aspectSet: 'all', applyingOnly: false },
  }[activeAspectFilter.value]
  return { ...props.aspectOptions, ...filterOptions }
})
const unfilteredMatrix = computed(() => aspectMatrix(props.base, props.comparison, matrixOptions.value))
const matrix           = computed(() => {
  if (activeAspectFilter.value !== 'exact') return unfilteredMatrix.value
  return {
    columns: unfilteredMatrix.value.columns,
    rows:    unfilteredMatrix.value.rows.map(row => ({
      ...row,
      cells: row.cells.map(cell => cell && cell.delta <= EXACT_FILTER_ORB ? cell : null),
    })),
  }
})
const visibleAspectCount = computed(() =>
  matrix.value.rows.reduce((count, row) => count + row.cells.filter(Boolean).length, 0)
)
const isComparison = computed(() => Boolean(props.comparison && props.comparison !== props.base))
const gridStyle    = computed(() => ({
  '--aspect-column-count': matrix.value.columns.length,
  gridTemplateColumns:     isComparison.value
    ? `repeat(${matrix.value.columns.length + 2}, minmax(1.42rem, 1.86rem))`
    : `repeat(${matrix.value.columns.length + 1}, minmax(1.42rem, 1.86rem))`,
}))
const title    = computed(() => isComparison.value ? t('chart.aspect_grid_comparison') : t('chart.aspect_grid_natal'))
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

const pointLabel      = (name) => t(`planets.${name}`)
const pointSymbol     = (name) => PLANET_SYMBOLS[name] || name.slice(0, 2)
const pointMotion     = (point) => motionMarker(point)
const aspectSymbol    = (aspect) => ASPECT_SYMBOLS[aspect?.type] || ''
const aspectKey       = (aspect) => aspect ? `${aspect.a}-${aspect.b}-${aspect.type}` : ''
const pointKey        = (point, prefix) => `${prefix}-${point.name}`
const pointName       = (point) => t(`planets.${point.name}`)
const setAspectFilter = (filter) => {
  activeAspectFilter.value = filter
  hoverHighlight.value     = null
  pinnedHighlight.value    = null
  emit('clear-highlight')
  broadcastHighlight(null, true)
}

const formatLongitude = (longitude) => {
  const degrees      = degInSign(longitude)
  const wholeDegrees = Math.floor(degrees)
  const minutes      = Math.floor((degrees - wholeDegrees) * 60)
  return `${wholeDegrees}°${minutes.toString().padStart(2, '0')}′ ${signs.value[signIndex(longitude)]}`
}

const formatPosition = (longitude) => {
  const degrees      = degInSign(longitude)
  const wholeDegrees = Math.floor(degrees).toString().padStart(2, '0')
  const minutes      = Math.floor((degrees - Math.floor(degrees)) * 60).toString().padStart(2, '0')
  return {
    degrees: wholeDegrees,
    sign:    ZODIAC_SIGNS[signIndex(longitude)],
    minutes,
  }
}

const formatOrb = (value) => {
  const totalMinutes = Math.round(Math.abs(value) * 60)
  const degrees      = Math.floor(totalMinutes / 60)
  const minutes      = totalMinutes % 60
  return `${degrees}°${minutes.toString().padStart(2, '0')}′`
}

const cellTitle = (cell) => cell
  ? [
      `${pointLabel(cell.a)} ${t(`aspects.${cell.type}`)} ${pointLabel(cell.b)}`,
      `${t('aspects.orb')}: ${formatOrb(cell.delta)} / ${formatOrb(cell.orb)}`,
      `${t('chart.aspect_tooltip.exact')}: ${cell.exact}°`,
      `${t('aspects.motion')}: ${cell.applying ? t('aspects.applying') : t('aspects.separating')}`,
    ].join('\n')
  : ''

const aspectClass = (type) => ({
  conjunction: 'text-amber-200',
  opposition:  'text-emerald-300',
  trine:       'text-sky-300',
  square:      'text-rose-300',
  sextile:     'text-cyan-300',
  quincunx:    'text-violet-300',
}[type] || 'text-slate-300')

const normalizeHighlight = (payload) => ({
  bodies:    [...new Set(payload?.bodies || [])],
  aspectKey: payload?.aspectKey || '',
})

const sameHighlight = (a, b) =>
  a.aspectKey === b.aspectKey &&
  a.bodies.length === b.bodies.length &&
  a.bodies.every(body => b.bodies.includes(body))

const highlightPayload = (cell) => ({
  bodies:    [cell.a, cell.b],
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
    sharedHoverHighlight.value  = null
  } else {
    sharedHoverHighlight.value = highlight
  }
}

const setHoverHighlight = (cell) => {
  if (!cell) return
  const highlight      = highlightPayload(cell)
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
  const highlight       = highlightPayload(cell)
  pinnedHighlight.value = pinnedHighlight.value && sameHighlight(pinnedHighlight.value, highlight) ? null : highlight
  hoverHighlight.value  = null
  emit('toggle-highlight', highlight)
  broadcastHighlight(pinnedHighlight.value, true)
}

const cellHighlightState = (cell) => {
  if (!cell || !activeAspectKey.value) return 'idle'
  return activeAspectKey.value === aspectKey(cell) ? 'active' : 'dimmed'
}

const cellClass = (cell) => {
  if (!cell) return 'border-white/5 bg-white/[0.02]'
  const state          = cellHighlightState(cell)
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
  .aspect-matrix-head
    .aspect-matrix-title
      h2 {{ title }}
      .text-xs.text-slate-500(v-if='subtitle') {{ subtitle }}
    .aspect-filter-group(role='group' :aria-label='t("chart.aspect_filters.label")')
      button.aspect-filter-button(
        v-for='filter in aspectFilters'
        :key='filter.key'
        type='button'
        :class='{ "is-active": activeAspectFilter === filter.key }'
        :aria-pressed='activeAspectFilter === filter.key'
        :data-testid='`aspect-filter-${filter.key}`'
        @click='setAspectFilter(filter.key)'
      ) {{ filter.label }}
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
        span.aspect-point-name {{ pointName(point) }}
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
            :aria-label='cellTitle(cell)'
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
      .aspect-matrix-empty(v-if='!visibleAspectCount' data-testid='aspect-matrix-empty')
        | {{ t('aspects.none_for_filter') }}
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
        span.aspect-point-name {{ pointName(point) }}
        span.tabular-nums {{ formatPosition(point.longitude).degrees }}
        span.aspect-sign {{ formatPosition(point.longitude).sign }}
        span.tabular-nums {{ formatPosition(point.longitude).minutes }}
        span.aspect-retro(v-if='pointMotion(point)') {{ pointMotion(point) }}
  .aspect-legend
    .aspect-legend-group
      span.aspect-legend-title {{ t('chart.aspect_legend') }}
      span(v-for='type in Object.keys(ASPECT_SYMBOLS)' :key='type' :class='aspectClass(type)')
        | {{ ASPECT_SYMBOLS[type] }} {{ t(`aspects.${type}`) }}
    .aspect-legend-group
      span.aspect-legend-title {{ t('chart.motion_legend') }}
      span.aspect-retro R {{ t('chart.motion_markers.retrograde') }}
      span.aspect-retro E {{ t('chart.motion_markers.stationary') }}
</template>

<style scoped>
.aspect-matrix-grid {
  display: grid;
  gap: 1px;
  justify-content: center;
  max-width: 100%;
  width: 100%;
}

.aspect-matrix-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  justify-content: space-between;
  margin-bottom: 0.45rem;
}

.aspect-matrix-title {
  min-width: 0;
}

.aspect-matrix-title h2 {
  color: rgb(226 232 240);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}

.aspect-filter-group {
  align-items: center;
  border: 1px solid rgb(255 255 255 / 0.1);
  display: inline-flex;
  flex: 0 1 auto;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.aspect-filter-button {
  background: rgb(255 255 255 / 0.03);
  border: 0;
  border-left: 1px solid rgb(255 255 255 / 0.08);
  color: rgb(148 163 184);
  cursor: pointer;
  flex: 1 1 auto;
  font-size: 0.69rem;
  font-weight: 700;
  line-height: 1;
  min-height: 1.65rem;
  min-width: 0;
  padding: 0.35rem 0.55rem;
  white-space: nowrap;
}

.aspect-filter-button:first-child {
  border-left: 0;
}

.aspect-filter-button:hover,
.aspect-filter-button:focus {
  background: rgb(255 255 255 / 0.08);
  color: rgb(226 232 240);
  outline: none;
}

.aspect-filter-button.is-active {
  background: rgb(252 211 77);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.28);
  color: rgb(15 23 42);
}

.aspectarian-body {
  display: grid;
  gap: 0.45rem;
}

.aspectarian-body.is-comparison {
  align-items: start;
  grid-template-columns: minmax(9rem, 10.5rem) minmax(0, 1fr) minmax(9rem, 10.5rem);
}

.aspect-matrix-stage {
  min-width: 0;
  overflow: hidden;
  width: 100%;
}

.aspect-matrix-corner,
.aspect-matrix-header,
.aspect-matrix-cell {
  align-items: center;
  aspect-ratio: 1;
  border: 1px solid rgb(255 255 255 / 0.08);
  display: inline-flex;
  height: auto;
  justify-content: center;
  min-height: 0.95rem;
  min-width: 0;
  overflow: hidden;
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
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
  outline: none;
  transition: background-color 120ms ease, opacity 120ms ease, box-shadow 120ms ease;
}

.aspect-matrix-cell:disabled {
  color: transparent;
  cursor: default;
}

.aspect-matrix-empty {
  color: rgb(148 163 184);
  font-size: 0.75rem;
  line-height: 1.2;
  margin-top: 0.45rem;
  text-align: center;
}

.aspect-position-list {
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(2 6 23 / 0.24);
  padding: 0.5rem 0.45rem;
}

.aspect-position-list h3 {
  color: rgb(226 232 240);
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.15;
  margin: 0;
  text-align: center;
}

.aspect-position-list p {
  color: rgb(148 163 184);
  font-size: 0.62rem;
  line-height: 1.1;
  margin: 0.12rem 0 0.35rem;
  text-align: center;
}

.aspect-position-row {
  align-items: center;
  color: rgb(203 213 225);
  display: grid;
  font-size: 0.66rem;
  gap: 0.15rem;
  grid-template-columns: 1rem minmax(3.25rem, 1fr) 1rem 1rem 1rem 0.42rem;
  min-height: 1.2rem;
}

.aspect-point-name {
  color: rgb(226 232 240);
  font-size: 0.66rem;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aspect-sign {
  color: rgb(125 211 252);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.82rem;
  line-height: 1;
}

.aspect-retro {
  color: rgb(251 191 36);
  font-size: 0.6rem;
}

.aspect-legend {
  align-items: center;
  color: rgb(148 163 184);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.72rem;
  gap: 0.3rem 0.9rem;
  line-height: 1.35;
  margin-top: 0.75rem;
}

.aspect-legend-group {
  align-items: center;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.55rem;
}

.aspect-legend-title {
  color: rgb(203 213 225);
  font-weight: 700;
}

@media (max-width: 760px) {
  .aspect-matrix-head {
    align-items: stretch;
  }

  .aspect-filter-group {
    width: 100%;
  }

  .aspect-filter-button {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }

  .aspectarian-body.is-comparison {
    grid-template-columns: 1fr;
  }

  .aspect-position-list {
    display: none;
  }

  .aspect-matrix-header,
  .aspect-matrix-cell {
    font-size: 0.66rem;
    min-height: 0.9rem;
  }
}
</style>
