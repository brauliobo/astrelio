<script setup>
import { computed } from 'vue'
import IChingSymbol from './IChingSymbol.vue'
import { ichingRingLayout } from './ichingGeometry.js'

const props = defineProps({
  gates:       { type: Array, required: true },
  activeGates: { type: Array, default: () => [] },
  radius:      { type: Number, default: 490 },
  color:       { type: String, default: 'rgba(203,213,225,0.28)' },
  activeColor: { type: String, default: 'rgba(248,250,252,0.74)' },
})

const active  = computed(() => new Set(props.activeGates.map(Number)))
const symbols = computed(() => ichingRingLayout({ gates: props.gates, radius: props.radius }))
</script>

<template lang="pug">
g.hd-iching-ring(data-testid='hd-iching-ring')
  IChingSymbol(
    v-for='item in symbols'
    :key='item.gate'
    :x='item.point.x'
    :y='item.point.y'
    :gate='item.gate'
    :active='active.has(item.gate)'
    :size='active.has(item.gate) ? 16 : 14'
    :color='color'
    :active-color='activeColor'
  )
</template>

<style scoped>
.hd-iching-ring {
  pointer-events: none;
}
</style>
