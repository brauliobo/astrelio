<script setup>
import { computed } from 'vue'
import { wheelHighlight } from '../../../lib/chart/highlight.js'
import { VIEWBOX_SIZE, WHEEL_RADII, longitudeLabel, norm360, polarPoint, radialTrianglePath } from './geometry.js'

const props = defineProps({
  chart:            { type: Object, required: true },
  wheelShift:       { type: Number, required: true },
  baseRadius:       { type: Number, default: WHEEL_RADII.zodiacOuter },
  highlightedWheel: { type: Object, default: null },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const ANGLE_MARKERS = [
  { key: 'asc', source: 'asc', label: 'AS', name: 'Ascendant', offset: 0, accent: 'var(--chart-angle-asc, var(--chart-angle-accent))', primary: true },
  { key: 'desc', source: 'asc', label: 'DS', name: 'Descendant', offset: 180, accent: 'var(--chart-ink-muted)', primary: false },
  { key: 'mc', source: 'mc', label: 'MC', name: 'Midheaven', offset: 0, accent: 'var(--chart-angle-mc, var(--chart-angle-accent))', primary: true },
  { key: 'ic', source: 'mc', label: 'IC', name: 'Imum Coeli', offset: 180, accent: 'var(--chart-ink-muted)', primary: false },
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
    title:      `${marker.label}: ${marker.name} ${longitudeLabel(baseLongitude + marker.offset)}`,
    payload:    wheelHighlight('angle', marker.key, {
      angle:     marker.key,
      label:     marker.label,
      name:      marker.name,
      longitude: baseLongitude + marker.offset,
      title:     `${marker.label} ${marker.name}`,
      details:   [
        { label: 'Longitude', value: longitudeLabel(baseLongitude + marker.offset) },
        { label: 'Axis', value: marker.source === 'asc' ? 'Ascendant / Descendant' : 'Midheaven / Imum Coeli' },
      ],
    }),
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

const markerState = (marker) => {
  if (props.highlightedWheel?.kind !== 'angle') return 'idle'
  return props.highlightedWheel.id === marker.key ? 'active' : 'dimmed'
}
const sameWheel = payload =>
  payload?.wheel?.kind === props.highlightedWheel?.kind && payload?.wheel?.id === props.highlightedWheel?.id
const emitPayload = (event, payload) => emit(event, payload)
</script>

<template lang="pug">
g(data-testid='angle-markers' font-family='"Inter", "Avenir Next", system-ui, sans-serif' font-size='9' font-weight='800' text-anchor='middle')
  g(
    v-for='marker in markers'
    :key='marker.key'
    :aria-label='marker.title'
    :aria-pressed='sameWheel(marker.payload)'
    :data-highlight='markerState(marker)'
    :data-wheel-kind='marker.payload.wheel.kind'
    :data-wheel-id='marker.payload.wheel.id'
    role='button'
    tabindex='0'
    class='angle-marker'
    @mouseenter='emitPayload("highlight", marker.payload)'
    @mouseleave='$emit("clear-highlight")'
    @focus='emitPayload("highlight", marker.payload)'
    @blur='$emit("clear-highlight")'
    @click.stop='emitPayload("toggle-highlight", marker.payload)'
    @keydown.enter.prevent='emitPayload("toggle-highlight", marker.payload)'
    @keydown.space.prevent='emitPayload("toggle-highlight", marker.payload)'
  )
    line(
      :x1='marker.inner.x'
      :y1='marker.inner.y'
      :x2='marker.outer.x'
      :y2='marker.outer.y'
      stroke='transparent'
      stroke-width='10'
      stroke-linecap='round'
    )
      title {{ marker.title }}
    line(
      :x1='marker.inner.x'
      :y1='marker.inner.y'
      :x2='marker.outer.x'
      :y2='marker.outer.y'
      :stroke='marker.accent'
      :stroke-width='marker.primary ? 1.15 : 0.8'
      :stroke-opacity='marker.primary ? 0.58 : 0.32'
      stroke-linecap='round'
      class='angle-marker__tick'
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
      class='angle-marker__arrow'
    )
    text(
      v-if='marker.primary'
      :data-testid='`angle-label-${marker.key}`'
      :x='marker.labelPoint.x'
      :y='marker.labelPoint.y'
      :fill='marker.accent'
      fill-opacity='0.82'
      dominant-baseline='central'
      class='angle-marker__label'
    ) {{ marker.label }}
</template>

<style scoped>
.angle-marker {
  cursor: pointer;
  outline: none;
}

.angle-marker__tick,
.angle-marker__arrow,
.angle-marker__label {
  transition: filter 140ms ease, opacity 140ms ease, stroke-width 140ms ease;
}

.angle-marker[data-highlight='active'] .angle-marker__tick,
.angle-marker:hover .angle-marker__tick,
.angle-marker:focus-visible .angle-marker__tick {
  filter: drop-shadow(0 0 4px var(--chart-angle-accent));
  stroke-opacity: 0.95;
  stroke-width: 2.1;
}

.angle-marker[data-highlight='active'] .angle-marker__arrow,
.angle-marker[data-highlight='active'] .angle-marker__label,
.angle-marker:hover .angle-marker__arrow,
.angle-marker:hover .angle-marker__label,
.angle-marker:focus-visible .angle-marker__arrow,
.angle-marker:focus-visible .angle-marker__label {
  filter: drop-shadow(0 0 4px var(--chart-angle-accent));
  opacity: 1;
}

.angle-marker[data-highlight='dimmed'] .angle-marker__tick,
.angle-marker[data-highlight='dimmed'] .angle-marker__arrow,
.angle-marker[data-highlight='dimmed'] .angle-marker__label {
  opacity: 0.32;
}
</style>
