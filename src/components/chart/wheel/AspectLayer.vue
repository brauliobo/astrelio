<script setup>
import { computed } from 'vue'
import { ASPECT_COLORS, naturalAspectLines } from './geometry.js'

const ASPECT_LINE_STYLES = {
  conjunction: { color: 'var(--aspect-conjunction)', dasharray: '1 4', opacity: 0.26 },
  opposition: { color: 'var(--aspect-opposition)', dasharray: 'none', opacity: 0.36 },
  trine: { color: 'var(--aspect-trine)', dasharray: 'none', opacity: 0.34 },
  square: { color: 'var(--aspect-square)', dasharray: '7 5', opacity: 0.32 },
  sextile: { color: 'var(--aspect-sextile)', dasharray: '4 5', opacity: 0.3 },
  quincunx: { color: 'var(--aspect-quincunx)', dasharray: '2 5 7 5', opacity: 0.28 },
}

const props = defineProps({
  chart: { type: Object, required: true },
  wheelShift: { type: Number, required: true },
  colors: { type: Object, default: () => ({}) },
  highlightedBodies: { type: Array, default: () => [] },
  highlightedAspectKey: { type: String, default: '' },
  aspectOptions: { type: Object, default: () => ({}) },
  placements: { type: Array, default: () => [] },
})
defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const aspectKey = (aspect) => `${aspect.a}-${aspect.b}-${aspect.type}`
const defaultAspectColor = (type) => ASPECT_LINE_STYLES[type]?.color || ASPECT_COLORS[type]
const aspectColor = (type) => {
  const configured = props.colors[type]
  return configured && configured !== ASPECT_COLORS[type] ? configured : defaultAspectColor(type)
}

const lines = computed(() =>
  naturalAspectLines(props.chart, props.wheelShift, undefined, props.placements, props.aspectOptions)
    .map(line => ({
      ...line,
      color: aspectColor(line.aspect.type),
    }))
    .filter(line => line.color)
)

const highlightedBodySet = computed(() => new Set(props.highlightedBodies))
const hasHighlight = computed(() =>
  highlightedBodySet.value.size > 0 || Boolean(props.highlightedAspectKey)
)

const lineTouchesHighlightedBody = (line) =>
  highlightedBodySet.value.has(line.aspect.a) || highlightedBodySet.value.has(line.aspect.b)

const lineHighlightState = (line) => {
  if (!hasHighlight.value) return 'idle'
  if (props.highlightedAspectKey) return props.highlightedAspectKey === aspectKey(line.aspect) ? 'active' : 'dimmed'
  return lineTouchesHighlightedBody(line) ? 'active' : 'dimmed'
}

const lineVisual = (line, state) => {
  const style = ASPECT_LINE_STYLES[line.aspect.type] || ASPECT_LINE_STYLES.conjunction
  return {
    dasharray: style.dasharray,
    haloOpacity: state === 'active' ? 0.18 : 0,
    haloWidth: state === 'active' ? 6 : 0,
    opacity: state === 'active' ? 0.98 : state === 'dimmed' ? 0.07 : style.opacity,
    width: state === 'active' ? 2.8 : 1.15,
  }
}

const visualLines = computed(() =>
  lines.value.map((line) => {
    const state = lineHighlightState(line)
    return {
      ...line,
      highlightState: state,
      visual: lineVisual(line, state),
    }
  })
)

const highlightPayload = (line) => ({
  bodies: [line.aspect.a, line.aspect.b],
  aspectKey: aspectKey(line.aspect),
})
</script>

<template lang="pug">
g(data-testid='aspect-lines')
  g(
    v-for='line in visualLines'
    :key='aspectKey(line.aspect)'
    :aria-label='`${line.aspect.a} ${line.aspect.type} ${line.aspect.b}`'
    :aria-pressed='props.highlightedAspectKey === aspectKey(line.aspect)'
    :data-highlight='line.highlightState'
    role='button'
    tabindex='0'
    class='cursor-pointer'
    @mouseenter='$emit("highlight", highlightPayload(line))'
    @mouseleave='$emit("clear-highlight")'
    @focus='$emit("highlight", highlightPayload(line))'
    @blur='$emit("clear-highlight")'
    @click.stop='$emit("toggle-highlight", highlightPayload(line))'
    @keydown.enter.prevent='$emit("toggle-highlight", highlightPayload(line))'
    @keydown.space.prevent='$emit("toggle-highlight", highlightPayload(line))'
  )
    title {{ line.aspect.a }} {{ line.aspect.type }} {{ line.aspect.b }}
    line(
      v-if='line.visual.haloOpacity'
      :x1='line.start.x'
      :y1='line.start.y'
      :x2='line.end.x'
      :y2='line.end.y'
      :stroke='line.color'
      :stroke-width='line.visual.haloWidth'
      :stroke-opacity='line.visual.haloOpacity'
      stroke-linecap='round'
      pointer-events='none'
      vector-effect='non-scaling-stroke'
    )
    line(
      :x1='line.start.x'
      :y1='line.start.y'
      :x2='line.end.x'
      :y2='line.end.y'
      stroke='transparent'
      stroke-width='10'
      stroke-linecap='round'
      pointer-events='stroke'
    )
    line(
      :x1='line.start.x'
      :y1='line.start.y'
      :x2='line.end.x'
      :y2='line.end.y'
      :stroke='line.color'
      :stroke-width='line.visual.width'
      :stroke-opacity='line.visual.opacity'
      :stroke-dasharray='line.visual.dasharray'
      stroke-linecap='round'
      pointer-events='none'
      vector-effect='non-scaling-stroke'
      :data-aspect='aspectKey(line.aspect)'
      :data-highlight='line.highlightState'
    )
</template>
