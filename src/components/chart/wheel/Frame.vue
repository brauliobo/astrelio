<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { wheelHighlight } from '../../../lib/chart/highlight.js'
import { CENTER, WHEEL_RADII } from './geometry.js'

const props = defineProps({
  highlightedWheel: { type: Object, default: null },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])
const { t } = useI18n()

const rings = computed(() => [
  {
    id:      'zodiac-ring-bg',
    radius:  WHEEL_RADII.zodiacOuter,
    fill:    'var(--chart-zodiac-fill-b)',
    stroke:  'var(--chart-frame-stroke)',
    width:   2.2,
    title:   t('chart.wheel_details.titles.zodiac_ring'),
    details: [{ label: t('chart.wheel_details.labels.layer'), value: t('chart.wheel_details.values.signs_degree_ruler') }],
  },
  {
    id:      'inner-zodiac-bg',
    radius:  WHEEL_RADII.zodiacInner,
    fill:    'var(--chart-house-fill-a)',
    stroke:  'var(--chart-ink-muted)',
    width:   1.25,
    title:   t('chart.wheel_accessibility.zodiac_inner_boundary'),
    details: [{ label: t('chart.wheel_details.labels.layer'), value: t('chart.wheel_details.values.zodiac_to_houses') }],
  },
  {
    id:      'house-ring-bg',
    radius:  WHEEL_RADII.houseOuter,
    fill:    'var(--chart-house-fill-a)',
    stroke:  'var(--chart-ink-muted)',
    width:   1,
    title:   t('chart.wheel_details.titles.house_ring'),
    details: [{ label: t('chart.wheel_details.labels.layer'), value: t('chart.wheel_details.values.house_sectors_cusps') }],
  },
  {
    id:      'aspect-center-bg',
    radius:  WHEEL_RADII.houseInner,
    fill:    'var(--chart-house-center)',
    stroke:  'var(--chart-frame-stroke)',
    width:   1.8,
    title:   t('chart.wheel_details.titles.aspect_center'),
    details: [{ label: t('chart.wheel_details.labels.layer'), value: t('chart.wheel_details.values.aspect_geometry_center') }],
  },
])

const payloadFor = ring => wheelHighlight('ring', ring.id, {
  title:   ring.title,
  details: ring.details,
})
const ringState = ring => {
  if (props.highlightedWheel?.kind !== 'ring') return 'idle'
  return props.highlightedWheel.id === ring.id ? 'active' : 'dimmed'
}
const sameWheel = ring => props.highlightedWheel?.kind === 'ring' && props.highlightedWheel.id === ring.id
const emitPayload = (event, ring) => emit(event, payloadFor(ring))
</script>

<template lang="pug">
g(data-testid='wheel-frame')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter + 8' fill='var(--chart-shadow-fill)' opacity='0.2' pointer-events='none')
    title {{ t('chart.wheel_accessibility.chart_shadow') }}
  g(
    v-for='ring in rings'
    :key='ring.id'
    :aria-label='ring.title'
    :aria-pressed='sameWheel(ring)'
    :data-highlight='ringState(ring)'
    data-wheel-kind='ring'
    :data-wheel-id='ring.id'
    role='button'
    tabindex='0'
    class='wheel-frame-ring'
    @mouseenter='emitPayload("highlight", ring)'
    @mouseleave='$emit("clear-highlight")'
    @focus='emitPayload("highlight", ring)'
    @blur='$emit("clear-highlight")'
    @click.stop='emitPayload("toggle-highlight", ring)'
    @keydown.enter.prevent='emitPayload("toggle-highlight", ring)'
    @keydown.space.prevent='emitPayload("toggle-highlight", ring)'
  )
    circle(
      :cx='CENTER'
      :cy='CENTER'
      :r='ring.radius'
      :fill='ring.fill'
      :stroke='ring.stroke'
      :stroke-width='ring.width'
      :pointer-events='ring.id === "aspect-center-bg" ? "visiblePainted" : "stroke"'
      class='wheel-frame-ring__shape'
    )
      title {{ ring.title }}
</template>

<style scoped>
.wheel-frame-ring {
  cursor: pointer;
  outline: none;
}

.wheel-frame-ring__shape {
  transition: filter 140ms ease, stroke-width 140ms ease, opacity 140ms ease;
}

.wheel-frame-ring[data-highlight='active'] .wheel-frame-ring__shape,
.wheel-frame-ring:hover .wheel-frame-ring__shape,
.wheel-frame-ring:focus-visible .wheel-frame-ring__shape {
  filter: drop-shadow(0 0 5px var(--chart-angle-accent));
  stroke-width: 2.4;
}

.wheel-frame-ring[data-highlight='dimmed'] .wheel-frame-ring__shape {
  opacity: 0.5;
}
</style>
