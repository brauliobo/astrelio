<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AngleMarkers from './wheel/AngleMarkers.vue'
import ChartMap from './wheel/ChartMap.vue'
import TickRing from './wheel/TickRing.vue'
import WheelFrame from './wheel/WheelFrame.vue'
import ZodiacRing from './wheel/ZodiacRing.vue'
import { VIEWBOX_SIZE, mapsFromProps, norm360 } from './wheel/geometry.js'

const props = defineProps({
  natal: { type: Object, default: null },
  overlay: { type: Object, default: null },
  charts: { type: Array, default: () => [] },
  size: { type: Number, default: 520 },
  highlightedBodies: { type: Array, default: () => [] },
  highlightedAspectKey: { type: String, default: '' },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const hoverHighlight = ref(null)
const pinnedHighlight = ref(null)
const sharedHoverHighlight = ref(null)
const sharedPinnedHighlight = ref(null)
const chartHighlightEvent = 'astrelio-chart-highlight'

const maps = computed(() => mapsFromProps(props))
const baseChart = computed(() => maps.value[0]?.chart || null)
const wheelShift = computed(() => norm360(-(baseChart.value?.cusps?.[0] || 0)))
const style = computed(() => ({
  width: `${props.size}px`,
  maxWidth: '100%',
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

onMounted(() => {
  window.addEventListener(chartHighlightEvent, onSharedHighlight)
})

onBeforeUnmount(() => {
  window.removeEventListener(chartHighlightEvent, onSharedHighlight)
})
</script>

<template lang="pug">
.chart-wheel.relative.mx-auto(ref='host' data-testid='chart-wheel' :style='style')
  svg(
    v-if='baseChart'
    class='block h-auto w-full aspect-square'
    :viewBox='`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`'
    role='img'
    data-testid='chart-wheel-svg'
  )
    WheelFrame
    ChartMap(
      v-for='(map, index) in maps'
      :key='map.id'
      :map='map'
      :index='index'
      :count='maps.length'
      :wheel-shift='wheelShift'
      :highlighted-bodies='activeBodies'
      :highlighted-aspect-key='activeAspectKey'
      @highlight='setHoverHighlight'
      @clear-highlight='clearHoverHighlight'
      @toggle-highlight='togglePinnedHighlight'
    )
    ZodiacRing(:wheel-shift='wheelShift')
    TickRing(:wheel-shift='wheelShift')
    AngleMarkers(
      v-if='maps[0]?.showAngles'
      :chart='baseChart'
      :wheel-shift='wheelShift'
    )
</template>
