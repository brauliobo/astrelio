<script setup>
import { computed } from 'vue'
import HumanDesignIChingSymbol from './HumanDesignIChingSymbol.vue'
import { ichingRingLayout } from './humanDesignWheelGeometry.js'

const props = defineProps({
  gates: { type: Array, required: true },
  activeGates: { type: Array, default: () => [] },
  radius: { type: Number, default: 490 },
})

const active = computed(() => new Set(props.activeGates.map(Number)))
const symbols = computed(() => ichingRingLayout({ gates: props.gates, radius: props.radius }))
</script>

<template lang="pug">
g.hd-iching-ring(data-testid='hd-iching-ring')
  HumanDesignIChingSymbol(
    v-for='item in symbols'
    :key='item.gate'
    :x='item.point.x'
    :y='item.point.y'
    :gate='item.gate'
    :active='active.has(item.gate)'
    :size='active.has(item.gate) ? 16 : 14'
  )
</template>

<style scoped>
.hd-iching-ring {
  pointer-events: none;
}
</style>
