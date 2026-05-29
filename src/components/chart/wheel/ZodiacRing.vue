<script setup>
import { computed } from 'vue'
import WheelArc from './WheelArc.vue'
import { CENTER, WHEEL_RADII, ZODIAC_SIGNS, polarPoint, norm360 } from './geometry.js'

const props = defineProps({
  wheelShift: { type: Number, required: true },
})

const sectors = computed(() =>
  ZODIAC_SIGNS.map((symbol, index) => {
    const start = norm360(index * 30 + props.wheelShift)
    const end = norm360((index + 1) * 30 + props.wheelShift)
    const label = polarPoint((WHEEL_RADII.zodiacInner + WHEEL_RADII.zodiacOuter) / 2, index * 30 + 15 + props.wheelShift)
    return { symbol, index, start, end, label }
  })
)
</script>

<template lang="pug">
g(data-testid='zodiac-ring')
  WheelArc(
    v-for='sector in sectors'
    :key='sector.index'
    :inner-radius='WHEEL_RADII.zodiacInner'
    :outer-radius='WHEEL_RADII.zodiacOuter'
    :start-longitude='sector.start'
    :end-longitude='sector.end'
    fill='#d9e3ec'
    stroke='#91a0af'
    stroke-width='0.55'
  )
  text(
    v-for='sector in sectors'
    :key='`sign-${sector.index}`'
    :x='sector.label.x'
    :y='sector.label.y'
    fill='#020617'
    font-family='"DejaVu Sans", "Noto Sans Symbols 2", "Noto Sans Symbols", serif'
    font-size='22'
    font-weight='500'
    text-anchor='middle'
    dominant-baseline='central'
  ) {{ sector.symbol }}
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter' fill='none' stroke='#252a30' stroke-width='2')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacInner' fill='none' stroke='#252a30' stroke-width='1.2')
</template>
