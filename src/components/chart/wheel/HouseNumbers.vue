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
  font-family='serif'
  font-style='italic'
  font-weight='700'
  font-size='12'
  fill='#111827'
  text-anchor='middle'
)
  text(
    v-for='item in labels'
    :key='item.index'
    :x='item.point.x'
    :y='item.point.y'
    dominant-baseline='central'
  ) {{ item.label }}
</template>
