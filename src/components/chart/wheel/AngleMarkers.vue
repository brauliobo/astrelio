<script setup>
import { computed } from 'vue'
import { VIEWBOX_SIZE, WHEEL_RADII, norm360, polarPoint, radialTrianglePath } from './geometry.js'

const props = defineProps({
  chart:      { type: Object, required: true },
  wheelShift: { type: Number, required: true },
  baseRadius: { type: Number, default: WHEEL_RADII.zodiacOuter },
})

const ANGLE_MARKERS = [
  { key: 'asc', source: 'asc', label: 'AS', offset: 0, accent: 'var(--chart-angle-asc, var(--chart-angle-accent))', primary: true },
  { key: 'desc', source: 'asc', offset: 180, accent: 'var(--chart-ink-muted)', primary: false },
  { key: 'mc', source: 'mc', label: 'MC', offset: 0, accent: 'var(--chart-angle-mc, var(--chart-angle-accent))', primary: true },
  { key: 'ic', source: 'mc', offset: 180, accent: 'var(--chart-ink-muted)', primary: false },
]
const MARKER_OFFSET = {
  tickInner:      -7,
  tickOuter:      1,
  arrowTip:       15,
  arrowBase:      1,
  arrowHalfWidth: 5.5,
  label:          20,
}

const edgePadding      = 12
const markerRadius     = (radius) => Math.min(props.baseRadius + radius, (VIEWBOX_SIZE / 2) - edgePadding)
const markerPoint      = (radius, longitude) => polarPoint(markerRadius(radius), longitude)
const outwardArrowPath = (longitude) =>
  radialTrianglePath(
    longitude,
    markerRadius(MARKER_OFFSET.arrowTip),
    markerRadius(MARKER_OFFSET.arrowBase),
    MARKER_OFFSET.arrowHalfWidth,
  )

const markerFromConfig = (marker, angleLongitudes) => {
  const baseLongitude = angleLongitudes[marker.source]
  if (baseLongitude == null) return null

  const longitude = norm360(baseLongitude + marker.offset + props.wheelShift)
  return {
    ...marker,
    longitude,
    inner:      markerPoint(MARKER_OFFSET.tickInner, longitude),
    outer:      markerPoint(MARKER_OFFSET.tickOuter, longitude),
    arrowPath:  marker.primary ? outwardArrowPath(longitude) : '',
    labelPoint: markerPoint(MARKER_OFFSET.label, longitude),
  }
}

const markers = computed(() => {
  const angleLongitudes = {
    asc: props.chart.ascendant ?? props.chart.cusps?.[0],
    mc:  props.chart.mc ?? props.chart.cusps?.[9],
  }

  return ANGLE_MARKERS
    .map(marker => markerFromConfig(marker, angleLongitudes))
    .filter(Boolean)
})
</script>

<template lang="pug">
g(data-testid='angle-markers' pointer-events='none' font-family='"Inter", "Avenir Next", system-ui, sans-serif' font-size='9' font-weight='800' text-anchor='middle')
  g(v-for='marker in markers' :key='marker.key')
    line(
      :x1='marker.inner.x'
      :y1='marker.inner.y'
      :x2='marker.outer.x'
      :y2='marker.outer.y'
      :stroke='marker.accent'
      :stroke-width='marker.primary ? 1.15 : 0.8'
      :stroke-opacity='marker.primary ? 0.58 : 0.32'
      stroke-linecap='round'
    )
    path(
      v-if='marker.primary'
      :data-testid='`angle-arrow-${marker.key}`'
      :d='marker.arrowPath'
      :fill='marker.accent'
      fill-opacity='0.76'
      :stroke='marker.accent'
      stroke-width='0.65'
      stroke-opacity='0.88'
      stroke-linejoin='round'
    )
    text(
      v-if='marker.primary'
      :data-testid='`angle-label-${marker.key}`'
      :x='marker.labelPoint.x'
      :y='marker.labelPoint.y'
      :fill='marker.accent'
      fill-opacity='0.82'
      dominant-baseline='central'
    ) {{ marker.label }}
</template>
