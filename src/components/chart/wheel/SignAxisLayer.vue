<script setup>
import { computed } from 'vue'
import { WHEEL_RADII, polarPoint } from './geometry.js'

const props = defineProps({
  signAxis:   { type: Object, required: true },
  wheelShift: { type: Number, required: true },
})

const radius = (WHEEL_RADII.zodiacInner + WHEEL_RADII.zodiacOuter) / 2
const points = computed(() => ({
  start: polarPoint(radius, props.signAxis.signIndex * 30 + 15 + props.wheelShift),
  end:   polarPoint(radius, props.signAxis.oppositeSignIndex * 30 + 15 + props.wheelShift),
}))
</script>

<template lang="pug">
g(
  data-testid='sign-axis-guide'
  :data-axis-id='signAxis.axisId'
  aria-hidden='true'
  pointer-events='none'
)
  line.sign-axis-guide__line(
    :x1='points.start.x'
    :y1='points.start.y'
    :x2='points.end.x'
    :y2='points.end.y'
    stroke='var(--chart-overlay-accent)'
    stroke-width='1.15'
    stroke-opacity='0.42'
    stroke-dasharray='3 5'
    stroke-linecap='round'
    vector-effect='non-scaling-stroke'
  )
  circle.sign-axis-guide__endpoint(
    :cx='points.start.x'
    :cy='points.start.y'
    r='2.2'
    fill='var(--chart-angle-accent)'
    fill-opacity='0.72'
  )
  circle.sign-axis-guide__endpoint(
    :cx='points.end.x'
    :cy='points.end.y'
    r='2.2'
    fill='var(--chart-overlay-accent)'
    fill-opacity='0.72'
  )
</template>
