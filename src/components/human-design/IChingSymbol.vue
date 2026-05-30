<script setup>
import { computed } from 'vue'
import { ichingLinesForGate } from './ichingGeometry.js'

const props = defineProps({
  gate: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  size: { type: Number, default: 18 },
  active: { type: Boolean, default: false },
  color: { type: String, default: 'rgba(203,213,225,0.28)' },
  activeColor: { type: String, default: 'rgba(248,250,252,0.74)' },
})

const lines = computed(() =>
  ichingLinesForGate(props.gate).map((broken, index) => ({
    index,
    broken,
  }))
)

const lineY = index => (index - 2.5) * (props.size / 6)
const lineWidth = computed(() => props.size * 0.86)
const gap = computed(() => props.size * 0.16)
const strokeWidth = computed(() => Math.max(1.2, props.size * 0.075))
const strokeColor = computed(() => props.active ? props.activeColor : props.color)
</script>

<template lang="pug">
g(
  :transform='`translate(${x} ${y})`'
  :data-gate='gate'
  :data-active='String(active)'
  data-testid='iching-symbol'
)
  g(v-for='line in lines' :key='line.index')
    line(
      v-if='!line.broken'
      :x1='-lineWidth / 2'
      :x2='lineWidth / 2'
      :y1='lineY(line.index)'
      :y2='lineY(line.index)'
      :stroke='strokeColor'
      :stroke-width='strokeWidth'
      stroke-linecap='square'
      data-testid='iching-line'
    )
    template(v-else)
      line(
        :x1='-lineWidth / 2'
        :x2='-gap'
        :y1='lineY(line.index)'
        :y2='lineY(line.index)'
        :stroke='strokeColor'
        :stroke-width='strokeWidth'
        stroke-linecap='square'
        data-testid='iching-line'
      )
      line(
        :x1='gap'
        :x2='lineWidth / 2'
        :y1='lineY(line.index)'
        :y2='lineY(line.index)'
        :stroke='strokeColor'
        :stroke-width='strokeWidth'
        stroke-linecap='square'
        data-testid='iching-line'
      )
</template>
