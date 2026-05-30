<script setup>
import { computed } from 'vue'
import { ringSectorPath } from './geometry.js'

const props = defineProps({
  innerRadius:    { type: Number, required: true },
  outerRadius:    { type: Number, required: true },
  startLongitude: { type: Number, required: true },
  endLongitude:   { type: Number, required: true },
  fill:           { type: String, default: 'transparent' },
  stroke:         { type: String, default: 'none' },
  strokeWidth:    { type: [Number, String], default: 0 },
  opacity:        { type: [Number, String], default: 1 },
})

const path = computed(() =>
  ringSectorPath(props.innerRadius, props.outerRadius, props.startLongitude, props.endLongitude)
)
</script>

<template lang="pug">
path(
  :d='path'
  :fill='fill'
  :stroke='stroke'
  :stroke-width='strokeWidth'
  :opacity='opacity'
  stroke-linejoin='round'
)
</template>
