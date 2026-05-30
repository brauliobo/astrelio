<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ChartSelectionSummary from './ChartSelectionSummary.vue'
import ChartDisplayMode from './ChartDisplayMode.vue'
import AngleMarkers from './wheel/AngleMarkers.vue'
import ChartMap from './wheel/ChartMap.vue'
import TickRing from './wheel/TickRing.vue'
import WheelFrame from './wheel/WheelFrame.vue'
import ZodiacRing from './wheel/ZodiacRing.vue'
import { VIEWBOX_SIZE, mapsFromProps, norm360 } from './wheel/geometry.js'

const displayModes = ['clean', 'aspects', 'detailed', 'print']
const zoomMin = 0.85
const zoomMax = 1.6
const zoomStep = 0.15
const modeSettings = {
  clean: {
    degrees: false,
    aspects: false,
    pointDetails: false,
  },
  aspects: {
    degrees: false,
    aspects: true,
    pointDetails: true,
  },
  detailed: {
    degrees: true,
    aspects: true,
    pointDetails: true,
  },
  print: {
    degrees: true,
    aspects: false,
    pointDetails: true,
  },
}

const normalizeMode = (mode) => displayModes.includes(mode) ? mode : 'auto'

const props = defineProps({
  natal: { type: Object, default: null },
  overlay: { type: Object, default: null },
  charts: { type: Array, default: () => [] },
  size: { type: Number, default: 520 },
  highlightedBodies: { type: Array, default: () => [] },
  highlightedAspectKey: { type: String, default: '' },
  aspectOptions: { type: Object, default: () => ({}) },
  displayMode: { type: String, default: 'auto' },
  showModeControls: { type: Boolean, default: true },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight', 'update:display-mode'])

const hoverHighlight = ref(null)
const pinnedHighlight = ref(null)
const sharedHoverHighlight = ref(null)
const sharedPinnedHighlight = ref(null)
const localDisplayMode = ref('')
const isSmallScreen = ref(false)
const zoomLevel = ref(1)
const chartHighlightEvent = 'astrelio-chart-highlight'
let smallScreenQuery = null

const updateSmallScreen = () => {
  isSmallScreen.value = Boolean(smallScreenQuery?.matches)
}

const maps = computed(() => mapsFromProps(props))
const baseChart = computed(() => maps.value[0]?.chart || null)
const isSimpleChart = computed(() => maps.value.length === 1)
const automaticDisplayMode = computed(() =>
  isSimpleChart.value && isSmallScreen.value ? 'clean' : 'detailed'
)
const activeDisplayMode = computed(() => {
  if (localDisplayMode.value) return localDisplayMode.value
  const propMode = normalizeMode(props.displayMode)
  return propMode === 'auto' ? automaticDisplayMode.value : propMode
})
const displayOptions = computed(() => modeSettings[activeDisplayMode.value])
const displayMaps = computed(() =>
  maps.value.map(map => ({
    ...map,
    showAspects: displayOptions.value.aspects && map.showAspects,
  }))
)
const wheelShift = computed(() => norm360(-(baseChart.value?.cusps?.[0] || 0)))
const style = computed(() => ({
  width: `${props.size}px`,
  maxWidth: '100%',
}))
const zoomViewBox = computed(() => {
  const viewSize = VIEWBOX_SIZE / zoomLevel.value
  const offset = (VIEWBOX_SIZE - viewSize) / 2
  return [offset, offset, viewSize, viewSize]
    .map(value => Number(value.toFixed(3)))
    .join(' ')
})
const zoomPercent = computed(() => `${Math.round(zoomLevel.value * 100)}%`)
const isZoomMin = computed(() => zoomLevel.value <= zoomMin)
const isZoomMax = computed(() => zoomLevel.value >= zoomMax)
const isZoomDefault = computed(() => zoomLevel.value === 1)
const displayAttributes = computed(() => ({
  'data-chart-mode': activeDisplayMode.value,
  'data-show-degrees': String(displayOptions.value.degrees),
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
  bodies: [...new Set(payload?.bodies || [])],
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
    sharedHoverHighlight.value = null
  } else {
    sharedHoverHighlight.value = highlight
  }
}

const sameHighlight = (a, b) =>
  a.aspectKey === b.aspectKey &&
  a.bodies.length === b.bodies.length &&
  a.bodies.every(body => b.bodies.includes(body))

const setHoverHighlight = (payload) => {
  const highlight = normalizeHighlight(payload)
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
  const highlight = normalizeHighlight(payload)
  pinnedHighlight.value = pinnedHighlight.value && sameHighlight(pinnedHighlight.value, highlight) ? null : highlight
  hoverHighlight.value = null
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
  const clamped = Math.min(zoomMax, Math.max(zoomMin, value))
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
  ChartDisplayMode.mb-3(
    v-if='showModeControls'
    :model-value='activeDisplayMode'
    :modes='displayModes'
    @update:model-value='selectDisplayMode'
  )
  .chart-wheel-stage.relative.aspect-square.overflow-hidden.rounded-md(
    v-if='baseChart'
    role='group'
    tabindex='0'
    aria-label='Chart wheel'
    :data-zoom='zoomLevel.toFixed(2)'
    @keydown='onWheelKeydown'
  )
    .chart-zoom-controls.absolute.right-2.top-2.z-20.flex.items-center.gap-1.rounded-md.border.p-1.shadow-sm.backdrop-blur-sm(
      aria-label='Chart zoom controls'
    )
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
    svg(
      class='block h-full w-full'
      :viewBox='zoomViewBox'
      role='img'
      data-testid='chart-wheel-svg'
    )
      WheelFrame
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
        @highlight='setHoverHighlight'
        @clear-highlight='clearHoverHighlight'
        @toggle-highlight='togglePinnedHighlight'
      )
      ZodiacRing(:wheel-shift='wheelShift')
      TickRing(:wheel-shift='wheelShift')
      AngleMarkers(
        v-if='displayMaps[0]?.showAngles'
        :chart='baseChart'
        :wheel-shift='wheelShift'
      )
    ChartSelectionSummary(
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
