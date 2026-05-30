<script setup>
import WheelArc from './WheelArc.vue'

defineProps({
  sectors: { type: Array, required: true },
  innerRadius: { type: Number, required: true },
  outerRadius: { type: Number, required: true },
  stroke: { type: String, default: 'var(--chart-zodiac-stroke)' },
  strokeWidth: { type: [Number, String], default: 0.5 },
  textFill: { type: String, default: 'var(--chart-zodiac-text)' },
  textStroke: { type: String, default: 'var(--chart-zodiac-text-stroke)' },
  fontSize: { type: [Number, String], default: 23 },
  fontFamily: { type: String, default: '"DejaVu Sans", "Noto Sans Symbols 2", "Noto Sans Symbols", serif' },
  fontWeight: { type: [Number, String], default: 600 },
  testId: { type: String, default: 'segment-ring' },
})
</script>

<template lang="pug">
g(:data-testid='testId' pointer-events='none')
  WheelArc(
    v-for='sector in sectors'
    :key='sector.key ?? sector.index'
    :inner-radius='innerRadius'
    :outer-radius='outerRadius'
    :start-longitude='sector.start'
    :end-longitude='sector.end'
    :fill='sector.fill'
    :stroke='stroke'
    :stroke-width='strokeWidth'
  )
  text(
    v-for='sector in sectors'
    :key='`label-${sector.key ?? sector.index}`'
    :x='sector.label.x'
    :y='sector.label.y'
    :fill='sector.textFill || textFill'
    :font-family='fontFamily'
    :font-size='sector.fontSize || fontSize'
    :font-weight='fontWeight'
    :stroke='textStroke'
    stroke-width='1.8'
    paint-order='stroke fill'
    text-anchor='middle'
    dominant-baseline='central'
  ) {{ sector.symbol }}
</template>
