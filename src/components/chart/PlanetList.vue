<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fortuneLongitude } from '../../lib/astro/aspectarian.js'
import { houseOf } from '../../lib/astro/houses.js'
import { motionMarker } from '../../lib/astro/motion.js'
import { signIndex, degInSign, norm360 } from '../../lib/astro/zodiac.js'

const props = defineProps({
  chart: { type: Object, required: true },
  highlightedBodies: { type: Array, default: () => [] },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])
const { t, tm } = useI18n()
const signs = computed(() => tm('zodiac.signs'))
const hoverHighlight = ref(null)
const pinnedHighlight = ref(null)
const sharedHoverHighlight = ref(null)
const sharedPinnedHighlight = ref(null)
const chartHighlightEvent = 'astrelio-chart-highlight'

const fmt = (lon) => {
  const d  = degInSign(lon)
  const dd = Math.floor(d)
  const mm = Math.floor((d - dd) * 60)
  return `${dd}° ${mm.toString().padStart(2, '0')}'`
}

const rows = computed(() =>
  props.chart.positions.map(p => ({
    name:  p.name,
    label: t(`planets.${p.name}`),
    sign:  signs.value[signIndex(p.longitude)],
    deg:   fmt(p.longitude),
    house: houseOf(p.longitude, props.chart.cusps),
    motion: motionMarker(p)
  }))
)

const ascSign = computed(() => signs.value[signIndex(props.chart.ascendant)])
const mcSign  = computed(() => signs.value[signIndex(props.chart.mc)])
const fortune = computed(() => fortuneLongitude(props.chart))
const fortuneSign = computed(() => fortune.value === null ? '' : signs.value[signIndex(fortune.value)])
const hasExternalHighlight = computed(() => props.highlightedBodies.length > 0)
const localHighlight = computed(() =>
  hoverHighlight.value || pinnedHighlight.value || sharedHoverHighlight.value || sharedPinnedHighlight.value
)
const activeBodies = computed(() =>
  new Set(hasExternalHighlight.value ? props.highlightedBodies : localHighlight.value?.bodies || [])
)
const hasHighlight = computed(() => activeBodies.value.size > 0)
const _ = norm360

const highlightPayload = (body) => ({ bodies: [body], aspectKey: '' })
const normalizeHighlight = (payload) => ({
  bodies: [...new Set(payload?.bodies || [])],
  aspectKey: payload?.aspectKey || '',
})
const sameHighlight = (a, b) =>
  a.bodies.length === b.bodies.length &&
  a.bodies.every(body => b.bodies.includes(body))

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

const setHoverHighlight = (body) => {
  const highlight = highlightPayload(body)
  hoverHighlight.value = highlight
  emit('highlight', highlight)
  broadcastHighlight(highlight)
}

const clearHoverHighlight = () => {
  hoverHighlight.value = null
  emit('clear-highlight')
  broadcastHighlight(null)
}

const togglePinnedHighlight = (body) => {
  const highlight = highlightPayload(body)
  pinnedHighlight.value = pinnedHighlight.value && sameHighlight(pinnedHighlight.value, highlight) ? null : highlight
  hoverHighlight.value = null
  emit('toggle-highlight', highlight)
  broadcastHighlight(pinnedHighlight.value, true)
}

const rowHighlightState = (body) => {
  if (!hasHighlight.value) return 'idle'
  return activeBodies.value.has(body) ? 'active' : 'dimmed'
}

const rowClass = (body) => {
  const state = rowHighlightState(body)
  if (state === 'active') return 'bg-amber-300/10 ring-1 ring-inset ring-amber-300/35'
  if (state === 'dimmed') return 'opacity-45'
  return 'hover:bg-white/5 focus:bg-white/5'
}

onMounted(() => {
  window.addEventListener(chartHighlightEvent, onSharedHighlight)
})

onBeforeUnmount(() => {
  window.removeEventListener(chartHighlightEvent, onSharedHighlight)
})
</script>

<template lang="pug">
.planet-list.text-sm(data-testid='planet-list')
  .grid.grid-cols-2.gap-y-1.gap-x-3.mb-3
    .text-slate-400 {{ t('chart.asc') }}
    .text-slate-100.font-medium(data-testid='asc-sign') {{ ascSign }} {{ fmt(chart.ascendant) }}
    .text-slate-400 {{ t('chart.mc') }}
    .text-slate-100.font-medium(data-testid='mc-sign') {{ mcSign }} {{ fmt(chart.mc) }}
    template(v-if='fortune !== null')
      .text-slate-400 {{ t('planets.Fortune') }}
      .text-slate-100.font-medium(data-testid='fortune-sign') {{ fortuneSign }} {{ fmt(fortune) }}
  table.w-full
    tbody
      tr.border-t.cursor-pointer.outline-none(
        class='border-white/5'
        v-for='r in rows'
        :key='r.name'
        :class='rowClass(r.name)'
        :data-testid='`planet-${r.name}`'
        :data-highlight='rowHighlightState(r.name)'
        :aria-pressed='activeBodies.has(r.name)'
        role='button'
        tabindex='0'
        @mouseenter='setHoverHighlight(r.name)'
        @mouseleave='clearHoverHighlight'
        @focus='setHoverHighlight(r.name)'
        @blur='clearHoverHighlight'
        @click='togglePinnedHighlight(r.name)'
        @keydown.enter.prevent='togglePinnedHighlight(r.name)'
        @keydown.space.prevent='togglePinnedHighlight(r.name)'
      )
        td.py-1.pr-2.text-slate-300 {{ r.label }}
        td.py-1.px-2.text-slate-100 {{ r.sign }}
        td.py-1.px-2.tabular-nums {{ r.deg }}
        td.py-1.px-2.text-slate-400 {{ t('chart.house_system') ? '' : '' }} {{ r.house }}
        td.py-1.pl-2.text-amber-300(v-if='r.motion') {{ r.motion }}
</template>
