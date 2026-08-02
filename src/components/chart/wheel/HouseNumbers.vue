<script setup>
import { computed } from 'vue'
import { wheelHighlight } from '../../../lib/chart/highlight.js'
import { WHEEL_RADII, longitudeLabel, midpointLongitude, norm360, polarPoint } from './geometry.js'

const props = defineProps({
  cusps:            { type: Array, required: true },
  wheelShift:       { type: Number, required: true },
  highlightedWheel: { type: Object, default: null },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const labels = computed(() =>
  props.cusps.map((cusp, index) => {
    const longitude = midpointLongitude(cusp, props.cusps[(index + 1) % 12])
    const point     = polarPoint(WHEEL_RADII.houseLabel, norm360(longitude + props.wheelShift))
    const label     = String(index + 1)
    return {
      index,
      point,
      label,
      title:   `House ${label}: midpoint ${longitudeLabel(longitude)}`,
      payload: wheelHighlight('house', `house-${label}`, {
        house:    index + 1,
        midpoint: longitude,
        title:    `House ${label}`,
        details:  [
          { label: 'Midpoint', value: longitudeLabel(longitude) },
          { label: 'Action', value: 'House label and sector' },
        ],
      }),
    }
  })
)

const numberState = (item) => {
  if (!props.highlightedWheel || !['house', 'cusp'].includes(props.highlightedWheel.kind)) return 'idle'
  return props.highlightedWheel.house === item.index + 1 ? 'active' : 'dimmed'
}
const sameWheel = payload =>
  payload?.wheel?.kind === props.highlightedWheel?.kind && payload?.wheel?.id === props.highlightedWheel?.id
const emitPayload = (event, payload) => emit(event, payload)
</script>

<template lang="pug">
g(
  data-testid='house-numbers'
  font-family='"Inter", "Avenir Next", system-ui, sans-serif'
  font-weight='600'
  font-size='7.5'
  fill='var(--chart-house-number-fill)'
  opacity='var(--chart-house-number-opacity)'
  text-anchor='middle'
)
  g(
    v-for='item in labels'
    :key='item.index'
    :aria-label='item.title'
    :aria-pressed='sameWheel(item.payload)'
    :data-highlight='numberState(item)'
    :data-wheel-kind='item.payload.wheel.kind'
    :data-wheel-id='item.payload.wheel.id'
    role='button'
    tabindex='0'
    class='house-number-group'
    @mouseenter='emitPayload("highlight", item.payload)'
    @mouseleave='$emit("clear-highlight")'
    @focus='emitPayload("highlight", item.payload)'
    @blur='$emit("clear-highlight")'
    @click.stop='emitPayload("toggle-highlight", item.payload)'
    @keydown.enter.prevent='emitPayload("toggle-highlight", item.payload)'
    @keydown.space.prevent='emitPayload("toggle-highlight", item.payload)'
  )
    circle(
      :cx='item.point.x'
      :cy='item.point.y'
      r='8'
      fill='transparent'
    )
      title {{ item.title }}
    text(
      :x='item.point.x'
      :y='item.point.y'
      :data-house-number='item.label'
      dominant-baseline='central'
    ) {{ item.label }}
</template>

<style scoped>
.house-number-group {
  cursor: pointer;
  outline: none;
}

.house-number-group text {
  transition: filter 140ms ease, font-size 140ms ease, opacity 140ms ease;
}

.house-number-group[data-highlight='active'] text,
.house-number-group:hover text,
.house-number-group:focus-visible text {
  filter: drop-shadow(0 0 3px var(--chart-angle-accent));
  font-size: 9.5px;
  opacity: 1;
}

.house-number-group[data-highlight='dimmed'] text {
  opacity: 0.38;
}
</style>
