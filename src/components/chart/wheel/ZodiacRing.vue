<script setup>
import { computed } from 'vue'
import SegmentRing from './SegmentRing.vue'
import { CENTER, WHEEL_RADII, ZODIAC_SIGNS, polarPoint, norm360 } from './geometry.js'

const props = defineProps({
  wheelShift: { type: Number, required: true },
  symbols:    { type: Array, default: () => ZODIAC_SIGNS },
})

const sectorFills = [
  'var(--chart-zodiac-fill-a)',
  'var(--chart-zodiac-fill-b)',
  'var(--chart-zodiac-fill-c)',
]

const sectors = computed(() =>
  props.symbols.map((symbol, index) => {
    const start = norm360(index * 30 + props.wheelShift)
    const end   = norm360((index + 1) * 30 + props.wheelShift)
    const label = polarPoint((WHEEL_RADII.zodiacInner + WHEEL_RADII.zodiacOuter) / 2, index * 30 + 15 + props.wheelShift)
    return { symbol, index, start, end, label, fill: sectorFills[index % sectorFills.length] }
  })
)
</script>

<template lang="pug">
g(pointer-events='none')
  SegmentRing(
    test-id='zodiac-ring'
    :sectors='sectors'
    :inner-radius='WHEEL_RADII.zodiacInner'
    :outer-radius='WHEEL_RADII.zodiacOuter'
    stroke='var(--chart-zodiac-stroke)'
    stroke-width='0.5'
    font-size='23'
  )
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter' fill='none' stroke='var(--chart-frame-stroke)' stroke-width='2.2')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacInner' fill='none' stroke='var(--chart-ink-muted)' stroke-width='1.35')
</template>
