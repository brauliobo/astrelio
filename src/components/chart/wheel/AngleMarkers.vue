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
    { key: 'asc', label: 'AS', longitude: asc, accent: '#b45309' },
    { key: 'desc', label: 'DS', longitude: asc + 180, accent: '#475569' },
    { key: 'mc', label: 'MC', longitude: mc, accent: '#b45309' },
    { key: 'ic', label: 'IC', longitude: mc + 180, accent: '#475569' },
  ].map((marker) => {
    const longitude = norm360(marker.longitude + props.wheelShift)
    return {
      ...marker,
      inner: polarPoint(WHEEL_RADII.zodiacInner + 2, longitude),
      outer: polarPoint(WHEEL_RADII.zodiacOuter + 12, longitude),
      labelPoint: polarPoint(WHEEL_RADII.zodiacOuter + 22, longitude),
    }
  })
})
</script>

<template lang="pug">
g(data-testid='angle-markers' font-family='"Inter", "Avenir Next", system-ui, sans-serif' font-size='11' font-weight='800' text-anchor='middle')
  g(v-for='marker in markers' :key='marker.key')
    line(
      :x1='marker.inner.x'
      :y1='marker.inner.y'
      :x2='marker.outer.x'
      :y2='marker.outer.y'
      :stroke='marker.accent'
      stroke-width='1.8'
      stroke-opacity='0.86'
      stroke-linecap='round'
    )
    circle(
      :cx='marker.labelPoint.x'
      :cy='marker.labelPoint.y'
      r='12'
      fill='#fffaf0'
      :stroke='marker.accent'
      stroke-width='1'
      stroke-opacity='0.9'
    )
    text(
      :x='marker.labelPoint.x'
      :y='marker.labelPoint.y'
      :fill='marker.accent'
      dominant-baseline='central'
    ) {{ marker.label }}
</template>
