<script setup>
import { computed } from 'vue'
import { ASPECT_COLORS, naturalAspectLines } from './geometry.js'

const props = defineProps({
  chart: { type: Object, required: true },
  wheelShift: { type: Number, required: true },
  colors: { type: Object, default: () => ({}) },
  placements: { type: Array, default: () => [] },
  highlightedBodies: { type: Array, default: () => [] },
  highlightedAspectKey: { type: String, default: '' },
})
defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const aspectKey = (aspect) => `${aspect.a}-${aspect.b}-${aspect.type}`

const lines = computed(() =>
  naturalAspectLines(props.chart, props.wheelShift, undefined, props.placements)
    .map(line => ({
      ...line,
      color: props.colors[line.aspect.type] || ASPECT_COLORS[line.aspect.type],
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

const highlightPayload = (line) => ({
  bodies: [line.aspect.a, line.aspect.b],
  aspectKey: aspectKey(line.aspect),
})
</script>

<template lang="pug">
g(data-testid='aspect-lines')
  g(
    v-for='line in lines'
    :key='aspectKey(line.aspect)'
    :aria-label='`${line.aspect.a} ${line.aspect.type} ${line.aspect.b}`'
    :aria-pressed='props.highlightedAspectKey === aspectKey(line.aspect)'
    :data-highlight='lineHighlightState(line)'
    role='button'
    tabindex='0'
    class='cursor-pointer transition-opacity'
    :class='lineHighlightState(line) === "dimmed" ? "opacity-25" : "opacity-100"'
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
      :x1='line.start.x'
      :y1='line.start.y'
      :x2='line.end.x'
      :y2='line.end.y'
      :stroke='line.color'
      :stroke-width='lineHighlightState(line) === "active" ? 2.4 : 1.25'
      :stroke-opacity='lineHighlightState(line) === "active" ? 1 : 0.82'
      stroke-linecap='round'
      :data-aspect='aspectKey(line.aspect)'
      :data-highlight='lineHighlightState(line)'
    )
</template>
