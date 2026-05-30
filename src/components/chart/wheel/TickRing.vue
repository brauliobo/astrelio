<script setup>
import { computed } from 'vue'
import { WHEEL_RADII, norm360, polarPoint } from './geometry.js'

const props = defineProps({
  wheelShift: { type: Number, required: true },
})

const ticks = computed(() =>
  Array.from({ length: 360 }, (_, degree) => {
    const isSign = degree % 30 === 0
    const isDecan = degree % 10 === 0
    const isFive = degree % 5 === 0
    const longitude = norm360(degree + props.wheelShift)
    const outer = polarPoint(WHEEL_RADII.zodiacInner - 1, longitude)
    const inner = polarPoint(WHEEL_RADII.zodiacInner - (isSign ? 11 : isDecan ? 7 : isFive ? 5 : 2.6), longitude)
    return {
      degree,
      outer,
      inner,
      stroke: isSign ? 'var(--chart-cusp-angle)' : 'var(--chart-ink-muted)',
      width: isSign ? 1.35 : isDecan ? 0.8 : isFive ? 0.55 : 0.35,
      opacity: isSign ? 0.9 : isDecan ? 0.5 : isFive ? 0.34 : 0.18,
    }
  })
)
</script>

<template lang="pug">
g(data-testid='tick-ring' pointer-events='none')
  line(
    v-for='tick in ticks'
    :key='tick.degree'
    :x1='tick.inner.x'
    :y1='tick.inner.y'
    :x2='tick.outer.x'
    :y2='tick.outer.y'
    :stroke='tick.stroke'
    :stroke-width='tick.width'
    :stroke-opacity='tick.opacity'
    stroke-linecap='round'
  )
</template>
