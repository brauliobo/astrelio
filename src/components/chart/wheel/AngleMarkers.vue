<script setup>
import { computed } from 'vue'
import { WHEEL_RADII, norm360, polarPoint } from './geometry.js'

const props = defineProps({
  chart: { type: Object, required: true },
  wheelShift: { type: Number, required: true },
})

const markers = computed(() => {
  const asc = props.chart.ascendant ?? props.chart.cusps?.[0]
  const mc = props.chart.mc ?? props.chart.cusps?.[9]
  if (asc == null || mc == null) return []

  return [
    { key: 'asc', label: 'As', longitude: asc },
    { key: 'desc', label: 'Ds', longitude: asc + 180 },
    { key: 'mc', label: 'Mc', longitude: mc },
    { key: 'ic', label: 'Ic', longitude: mc + 180 },
  ].map((marker) => {
    const longitude = norm360(marker.longitude + props.wheelShift)
    return {
      ...marker,
      inner: polarPoint(WHEEL_RADII.zodiacOuter - 5, longitude),
      outer: polarPoint(WHEEL_RADII.zodiacOuter + 8, longitude),
      labelPoint: polarPoint(WHEEL_RADII.zodiacOuter + 20, longitude),
    }
  })
})
</script>

<template lang="pug">
g(data-testid='angle-markers' font-family='serif' font-size='14' font-weight='700' fill='#2d2f35' text-anchor='middle')
  g(v-for='marker in markers' :key='marker.key')
    line(
      :x1='marker.inner.x'
      :y1='marker.inner.y'
      :x2='marker.outer.x'
      :y2='marker.outer.y'
      stroke='#2d2f35'
      stroke-width='1'
      stroke-opacity='0.65'
    )
    text(:x='marker.labelPoint.x' :y='marker.labelPoint.y' dominant-baseline='central') {{ marker.label }}
</template>
