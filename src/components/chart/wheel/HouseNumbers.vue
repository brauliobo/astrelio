<script setup>
import { computed } from 'vue'
import { WHEEL_RADII, midpointLongitude, norm360, polarPoint } from './geometry.js'

const props = defineProps({
  cusps: { type: Array, required: true },
  wheelShift: { type: Number, required: true },
})

const labels = computed(() =>
  props.cusps.map((cusp, index) => {
    const longitude = midpointLongitude(cusp, props.cusps[(index + 1) % 12])
    const point = polarPoint(WHEEL_RADII.houseInner + 19, norm360(longitude + props.wheelShift))
    return { index, point, label: String(index + 1) }
  })
)
</script>

<template lang="pug">
g(
  data-testid='house-numbers'
  font-family='"Inter", "Avenir Next", system-ui, sans-serif'
  font-weight='700'
  font-size='11'
  fill='#0f172a'
  text-anchor='middle'
)
  g(v-for='item in labels' :key='item.index')
    circle(
      :cx='item.point.x'
      :cy='item.point.y'
      r='8.5'
      fill='#f8fafc'
      stroke='#cbd5e1'
      stroke-width='0.75'
    )
    text(
      :x='item.point.x'
      :y='item.point.y'
      dominant-baseline='central'
    ) {{ item.label }}
</template>
