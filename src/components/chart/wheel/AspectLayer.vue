<script setup>
import { computed } from 'vue'
import { ASPECT_COLORS, naturalAspectLines } from './geometry.js'

const props = defineProps({
  chart: { type: Object, required: true },
  wheelShift: { type: Number, required: true },
  colors: { type: Object, default: () => ({}) },
})

const lines = computed(() =>
  naturalAspectLines(props.chart, props.wheelShift)
    .map(line => ({
      ...line,
      color: props.colors[line.aspect.type] || ASPECT_COLORS[line.aspect.type],
    }))
    .filter(line => line.color)
)
</script>

<template lang="pug">
g(data-testid='aspect-lines')
  line(
    v-for='line in lines'
    :key='`${line.aspect.a}-${line.aspect.b}-${line.aspect.type}`'
    :x1='line.start.x'
    :y1='line.start.y'
    :x2='line.end.x'
    :y2='line.end.y'
    :stroke='line.color'
    stroke-width='1.25'
    stroke-opacity='0.82'
    stroke-linecap='round'
    :data-aspect='`${line.aspect.a}-${line.aspect.b}-${line.aspect.type}`'
  )
</template>
