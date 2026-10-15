<script setup>
import { computed } from 'vue'
import { ASPECT_COLORS, placementMap } from './geometry.js'

const TIGHT_ORB = 1

const props = defineProps({
  aspects:           { type: Array, required: true },
  natalPlacements:   { type: Array, required: true },
  transitPlacements: { type: Array, required: true },
  focus:             { type: Object, default: null },
  showIdle:          { type: Boolean, default: true },
})

const aspectColor = type => ASPECT_COLORS[type] || 'var(--aspect-conjunction)'
const isFocused   = aspect => props.focus && aspect[props.focus.side] === props.focus.name

const lines = computed(() => {
  const natal   = placementMap(props.natalPlacements)
  const transit = placementMap(props.transitPlacements)
  return props.aspects
    .filter(aspect => props.focus ? isFocused(aspect) : props.showIdle && aspect.delta <= TIGHT_ORB)
    .map(aspect => ({
      aspect,
      active: Boolean(props.focus),
      color:  aspectColor(aspect.type),
      start:  transit.get(aspect.b)?.leader?.from,
      end:    natal.get(aspect.a)?.point,
    }))
    .filter(line => line.start && line.end)
})
</script>

<template lang="pug">
g(data-testid='transit-aspect-lines' pointer-events='none')
  g(
    v-for='line in lines'
    :key='`${line.aspect.a}-${line.aspect.b}-${line.aspect.type}`'
    :data-transit-aspect='`${line.aspect.a}-${line.aspect.b}-${line.aspect.type}`'
    :data-active='line.active'
  )
    line(
      v-if='line.active'
      :x1='line.start.x'
      :y1='line.start.y'
      :x2='line.end.x'
      :y2='line.end.y'
      :stroke='line.color'
      stroke-width='7'
      stroke-opacity='0.2'
      stroke-linecap='round'
    )
    line(
      :x1='line.start.x'
      :y1='line.start.y'
      :x2='line.end.x'
      :y2='line.end.y'
      :stroke='line.color'
      :stroke-width='line.active ? 2.2 : 1.1'
      :stroke-opacity='line.active ? 0.95 : 0.4'
      stroke-linecap='round'
    )
    circle(
      v-if='line.active'
      :cx='line.end.x'
      :cy='line.end.y'
      r='3'
      :fill='line.color'
    )
</template>
