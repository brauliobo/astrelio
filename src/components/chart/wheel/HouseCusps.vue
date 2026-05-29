<script setup>
import { computed } from 'vue'
import WheelArc from './WheelArc.vue'
import { WHEEL_RADII, midpointLongitude, norm360, polarPoint } from './geometry.js'

const props = defineProps({
  cusps: { type: Array, required: true },
  wheelShift: { type: Number, required: true },
})

const cusps = computed(() =>
  props.cusps.map((cusp, index) => {
    const longitude = norm360(cusp + props.wheelShift)
    return {
      index,
      inner: polarPoint(WHEEL_RADII.houseInner, longitude),
      outer: polarPoint(WHEEL_RADII.zodiacInner, longitude),
      width: [0, 3, 6, 9].includes(index) ? 1.45 : 0.85,
    }
  })
)

const sectors = computed(() =>
  props.cusps.map((cusp, index) => ({
    index,
    start: norm360(cusp + props.wheelShift),
    end: norm360(props.cusps[(index + 1) % 12] + props.wheelShift),
    midpoint: midpointLongitude(cusp, props.cusps[(index + 1) % 12]),
    fill: index % 2 === 0 ? '#ffffff' : '#f8fafc',
  }))
)
</script>

<template lang="pug">
g(data-testid='house-cusps')
  WheelArc(
    v-for='sector in sectors'
    :key='`house-sector-${sector.index}`'
    :inner-radius='WHEEL_RADII.houseInner'
    :outer-radius='WHEEL_RADII.houseOuter'
    :start-longitude='sector.start'
    :end-longitude='sector.end'
    :fill='sector.fill'
    stroke='none'
  )
  line(
    v-for='cusp in cusps'
    :key='cusp.index'
    :x1='cusp.inner.x'
    :y1='cusp.inner.y'
    :x2='cusp.outer.x'
    :y2='cusp.outer.y'
    stroke='#111827'
    :stroke-width='cusp.width'
    stroke-opacity='0.82'
  )
  circle(:cx='260' :cy='260' :r='WHEEL_RADII.houseOuter' fill='none' stroke='#252a30' stroke-width='1')
  circle(:cx='260' :cy='260' :r='WHEEL_RADII.houseInner' fill='none' stroke='#252a30' stroke-width='1.4')
</template>
