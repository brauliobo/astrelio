<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectionSummary from './SelectionSummary.vue'
import DisplayMode from './DisplayMode.vue'
import AngleMarkers from './wheel/AngleMarkers.vue'
import ChartMap from './wheel/ChartMap.vue'
import NakshatraRing from './wheel/NakshatraRing.vue'
import TickRing from './wheel/TickRing.vue'
import Frame from './wheel/Frame.vue'
import ZodiacRing from './wheel/ZodiacRing.vue'
import { CENTER, VIEWBOX_SIZE, WHEEL_RADII, mapsFromProps, norm360 } from './wheel/geometry.js'

const displayModes = ['clean', 'aspects', 'detailed', 'print']
const zoomMin      = 0.85
const zoomMax      = 1.6
const zoomStep     = 0.15
const modeSettings = {
  clean: {
    degrees:      false,
    aspects:      false,
    pointDetails: false,
  },
  aspects: {
    degrees:      false,
    aspects:      true,
    pointDetails: true,
  },
  detailed: {
    degrees:      true,
    aspects:      true,
    pointDetails: true,
  },
  print: {
    degrees:      true,
    aspects:      false,
    pointDetails: true,
  },
}

const normalizeMode = (mode) => displayModes.includes(mode) ? mode : 'auto'

const props = defineProps({
  natal:                { type: Object, default: null },
  overlay:              { type: Object, default: null },
  charts:               { type: Array, default: () => [] },
  size:                 { type: Number, default: 520 },
  highlightedBodies:    { type: Array, default: () => [] },
  highlightedAspectKey: { type: String, default: '' },
  aspectOptions:        { type: Object, default: () => ({}) },
  displayMode:          { type: String, default: 'auto' },
  showModeControls:     { type: Boolean, default: true },
  zodiacSymbols:        { type: Array, default: null },
  planetGlyphRenderer:  { type: String, default: null },
  showNakshatraRing:    { type: Boolean, default: false },
  defaultZoomBase:      { type: Number, default: 1.3 },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight', 'update:display-mode'])
const { t } = useI18n()

const hoverHighlight        = ref(null)
const pinnedHighlight       = ref(null)
const sharedHoverHighlight  = ref(null)
const sharedPinnedHighlight = ref(null)
const localDisplayMode      = ref('')
const isSmallScreen         = ref(false)
const zoomLevel             = ref(1)
const showExteriorOrbit     = ref(false)
const chartHighlightEvent   = 'astrelio-chart-highlight'
let smallScreenQuery        = null

const updateSmallScreen = () => {
  isSmallScreen.value = Boolean(smallScreenQuery?.matches)
}

const maps                   = computed(() => mapsFromProps(props))
const hasExteriorOrbitOption = computed(() => maps.value.some(map => map.exteriorOrbit))
const visibleMaps            = computed(() =>
  maps.value.filter(map => !map.exteriorOrbit || showExteriorOrbit.value)
)
const baseChart            = computed(() => maps.value[0]?.chart || null)
const isSimpleChart        = computed(() => visibleMaps.value.length === 1)
const hasExteriorOrbit     = computed(() => visibleMaps.value.some(map => map.exteriorOrbit))
const zoomBase             = computed(() => hasExteriorOrbit.value ? Math.min(props.defaultZoomBase, 1.08) : props.defaultZoomBase)
const automaticDisplayMode = computed(() =>
  isSimpleChart.value && isSmallScreen.value ? 'clean' : 'detailed'
)
const activeDisplayMode = computed(() => {
  if (localDisplayMode.value) return localDisplayMode.value
  const propMode = normalizeMode(props.displayMode)
  return propMode === 'auto' ? automaticDisplayMode.value : propMode
})
const displayOptions = computed(() => modeSettings[activeDisplayMode.value])
const displayMaps    = computed(() =>
  visibleMaps.value.map(map => ({
    ...map,
    showAspects: displayOptions.value.aspects && map.showAspects,
  }))
)
const wheelShift = computed(() => norm360(-(baseChart.value?.cusps?.[0] || 0)))
const style      = computed(() => ({
  width:    `${props.size}px`,
  maxWidth: '100%',
}))
const zoomViewBox = computed(() => {
  const viewSize = VIEWBOX_SIZE / (zoomBase.value * zoomLevel.value)
  const offset   = (VIEWBOX_SIZE - viewSize) / 2
  return [offset, offset, viewSize, viewSize]
    .map(value => Number(value.toFixed(3)))
    .join(' ')
})
const zoomPercent       = computed(() => `${Math.round(zoomLevel.value * 100)}%`)
const isZoomMin         = computed(() => zoomLevel.value <= zoomMin)
const isZoomMax         = computed(() => zoomLevel.value >= zoomMax)
const isZoomDefault     = computed(() => zoomLevel.value === 1)
const displayAttributes = computed(() => ({
  'data-chart-mode':         activeDisplayMode.value,
  'data-show-degrees':       String(displayOptions.value.degrees),
  'data-show-point-details': String(displayOptions.value.pointDetails),
}))
const hasExternalHighlight = computed(() =>
  props.highlightedBodies.length > 0 || Boolean(props.highlightedAspectKey)
)
const localHighlight = computed(() =>
  hoverHighlight.value || pinnedHighlight.value || sharedHoverHighlight.value || sharedPinnedHighlight.value
)
const activeBodies = computed(() =>
  hasExternalHighlight.value ? props.highlightedBodies : localHighlight.value?.bodies || []
)
const activeAspectKey = computed(() =>
  hasExternalHighlight.value ? props.highlightedAspectKey : localHighlight.value?.aspectKey || ''
)

const normalizeHighlight = (payload) => ({
  bodies:    [...new Set(payload?.bodies || [])],
  aspectKey: payload?.aspectKey || '',
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

const sameHighlight = (a, b) =>
  a.aspectKey === b.aspectKey &&
  a.bodies.length === b.bodies.length &&
  a.bodies.every(body => b.bodies.includes(body))

const setHoverHighlight = (payload) => {
  const highlight      = normalizeHighlight(payload)
  hoverHighlight.value = highlight
  emit('highlight', highlight)
  broadcastHighlight(highlight)
}

const clearHoverHighlight = () => {
  hoverHighlight.value = null
  emit('clear-highlight')
  broadcastHighlight(null)
}

const togglePinnedHighlight = (payload) => {
  const highlight       = normalizeHighlight(payload)
  pinnedHighlight.value = pinnedHighlight.value && sameHighlight(pinnedHighlight.value, highlight) ? null : highlight
  hoverHighlight.value  = null
  emit('toggle-highlight', highlight)
  broadcastHighlight(pinnedHighlight.value, true)
}

const selectDisplayMode = (mode) => {
  const normalizedMode = normalizeMode(mode)
  if (normalizedMode === 'auto') return
  localDisplayMode.value = normalizedMode
  emit('update:display-mode', normalizedMode)
}

const setZoom = (value) => {
  const clamped   = Math.min(zoomMax, Math.max(zoomMin, value))
  zoomLevel.value = Number(clamped.toFixed(2))
}

const zoomIn = () => {
  setZoom(zoomLevel.value + zoomStep)
}

const zoomOut = () => {
  setZoom(zoomLevel.value - zoomStep)
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const toggleExteriorOrbit = () => {
  showExteriorOrbit.value = !showExteriorOrbit.value
}

const onWheelKeydown = (event) => {
  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    zoomIn()
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    zoomOut()
  } else if (event.key === '0') {
    event.preventDefault()
    resetZoom()
  }
}

watch(() => props.displayMode, () => {
  localDisplayMode.value = ''
})

onMounted(() => {
  window.addEventListener(chartHighlightEvent, onSharedHighlight)
  smallScreenQuery = window.matchMedia?.('(max-width: 640px)') || null
  updateSmallScreen()
  if (smallScreenQuery?.addEventListener) {
    smallScreenQuery.addEventListener('change', updateSmallScreen)
  } else {
    smallScreenQuery?.addListener?.(updateSmallScreen)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener(chartHighlightEvent, onSharedHighlight)
  if (smallScreenQuery?.removeEventListener) {
    smallScreenQuery.removeEventListener('change', updateSmallScreen)
  } else {
    smallScreenQuery?.removeListener?.(updateSmallScreen)
  }
})
</script>

<template lang="pug">
.chart-wheel.relative.mx-auto(
  ref='host'
  data-testid='chart-wheel'
  :style='style'
  v-bind='displayAttributes'
)
  DisplayMode.mb-3(
    v-if='showModeControls'
    :model-value='activeDisplayMode'
    :modes='displayModes'
    @update:model-value='selectDisplayMode'
  )
    .chart-zoom-controls.inline-flex.items-center.gap-1.mr-1.border-r.pr-1(
      v-if='baseChart'
      aria-label='Chart zoom controls'
    )
      button.chart-zoom-button.chart-transit-orbit-toggle(
        v-if='hasExteriorOrbitOption'
        type='button'
        data-testid='chart-toggle-transit-orbit'
        :class='{ "chart-transit-orbit-toggle--active": showExteriorOrbit }'
        :aria-pressed='showExteriorOrbit'
        :aria-label='t("chart.transit_orbit")'
        @click='toggleExteriorOrbit'
      ) {{ t('chart.transit_orbit') }}
      button.chart-zoom-button(
        type='button'
        data-testid='chart-zoom-out'
        aria-label='Zoom out'
        :disabled='isZoomMin'
        @click='zoomOut'
      ) -
      button.chart-zoom-button.chart-zoom-button--reset(
        type='button'
        data-testid='chart-zoom-reset'
        aria-label='Reset zoom'
        :disabled='isZoomDefault'
        @click='resetZoom'
      ) {{ zoomPercent }}
      button.chart-zoom-button(
        type='button'
        data-testid='chart-zoom-in'
        aria-label='Zoom in'
        :disabled='isZoomMax'
        @click='zoomIn'
      ) +
  .chart-wheel-stage.relative.aspect-square.overflow-hidden.rounded-md(
    v-if='baseChart'
    role='group'
    tabindex='0'
    aria-label='Chart wheel'
    :data-zoom='zoomLevel.toFixed(2)'
    @keydown='onWheelKeydown'
  )
    svg(
      class='block h-full w-full'
      :viewBox='zoomViewBox'
      role='img'
      data-testid='chart-wheel-svg'
    )
      Frame
      g(v-if='hasExteriorOrbit' data-testid='transit-orbit-frame' pointer-events='none')
        circle(
          :cx='CENTER'
          :cy='CENTER'
          :r='WHEEL_RADII.transitOuter'
          fill='none'
          stroke='var(--chart-frame-stroke)'
          stroke-width='1.25'
          stroke-opacity='0.62'
        )
        circle(
          :cx='CENTER'
          :cy='CENTER'
          :r='WHEEL_RADII.transitInner'
          fill='none'
          stroke='var(--chart-overlay-accent)'
          stroke-width='0.9'
          stroke-opacity='0.34'
        )
      NakshatraRing(v-if='showNakshatraRing' :wheel-shift='wheelShift')
      ChartMap(
        v-for='(map, index) in displayMaps'
        :key='map.id'
        :map='map'
        :index='index'
        :count='displayMaps.length'
        :wheel-shift='wheelShift'
        :highlighted-bodies='activeBodies'
        :highlighted-aspect-key='activeAspectKey'
        :aspect-options='aspectOptions'
        :glyph-renderer='map.planetGlyphRenderer || planetGlyphRenderer'
        @highlight='setHoverHighlight'
        @clear-highlight='clearHoverHighlight'
        @toggle-highlight='togglePinnedHighlight'
      )
      ZodiacRing(:wheel-shift='wheelShift' :symbols='zodiacSymbols || undefined')
      TickRing(:wheel-shift='wheelShift')
      AngleMarkers(
        v-if='displayMaps[0]?.showAngles'
        :chart='baseChart'
        :wheel-shift='wheelShift'
        :base-radius='hasExteriorOrbit ? WHEEL_RADII.transitOuter : WHEEL_RADII.zodiacOuter'
      )
    SelectionSummary(
      v-if='activeBodies.length || activeAspectKey'
      :chart='baseChart'
      :bodies='activeBodies'
      :aspect-key='activeAspectKey'
    )
</template>

<style>
.chart-wheel-stage:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}

.chart-zoom-button {
  align-items: center;
  border-radius: 0.25rem;
  color: var(--chart-control-text);
  display: inline-flex;
  font-size: 0.8125rem;
  font-weight: 700;
  height: 2rem;
  justify-content: center;
  line-height: 1;
  min-width: 2rem;
  padding: 0 0.5rem;
}

.chart-zoom-controls {
  background: var(--chart-control-bg);
  border-color: var(--app-border);
}

.chart-zoom-button--reset {
  font-size: 0.6875rem;
  font-weight: 800;
  min-width: 2.875rem;
}

.chart-transit-orbit-toggle {
  font-size: 0.6875rem;
  min-width: 4.25rem;
}

.chart-transit-orbit-toggle--active {
  background: var(--chart-overlay-accent);
  color: var(--chart-control-active-text, var(--app-bg));
}

.chart-zoom-button:hover:not(:disabled),
.chart-zoom-button:focus-visible {
  background: var(--chart-control-hover-bg);
}

.chart-zoom-button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.chart-zoom-button:disabled {
  color: var(--chart-control-disabled-text);
  cursor: default;
}

.chart-wheel[data-show-degrees="false"] [data-testid="planet-layer"] g[data-planet] text:not([data-role="symbol"]) {
  display: none;
}

.chart-wheel[data-show-point-details="false"] [data-testid="planet-layer"] g[data-planet] > line,
.chart-wheel[data-show-point-details="false"] [data-testid="planet-layer"] g[data-planet] > circle:not(.planet-hit-target) {
  display: none;
}

@media print {
  .chart-display-mode {
    display: none !important;
  }
}
</style>
