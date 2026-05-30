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
  svg(
    v-if='baseChart'
    class='block h-auto w-full aspect-square'
    :viewBox='`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`'
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
    v-if='baseChart && (activeBodies.length || activeAspectKey)'
    :chart='baseChart'
    :bodies='activeBodies'
    :aspect-key='activeAspectKey'
  )
</template>

<style>
.chart-wheel[data-show-degrees="false"] [data-testid="planet-layer"] g[data-planet] text:not([data-role="symbol"]) {
  display: none;
}

.chart-wheel[data-show-point-details="false"] [data-testid="planet-layer"] g[data-planet] > line,
.chart-wheel[data-show-point-details="false"] [data-testid="planet-layer"] g[data-planet] > circle {
  display: none;
}

@media print {
  .chart-display-mode {
    display: none !important;
  }
}
</style>
