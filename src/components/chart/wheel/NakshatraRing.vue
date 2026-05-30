<script setup>
import { computed } from 'vue'
import SegmentRing from './SegmentRing.vue'
import { NAKSHATRAS } from '../../../lib/vedic/constants.js'
import { CENTER, WHEEL_RADII, norm360, polarPoint } from './geometry.js'

const props = defineProps({
  wheelShift: { type: Number, required: true },
})

const fills = [
  'var(--chart-house-fill-a)',
  'var(--chart-house-fill-b)',
]

const labelFor = (key) =>
  key
    .split('_')
    .map(part => part.slice(0, 2))
    .join('')
    .slice(0, 3)

const sectors = computed(() =>
  NAKSHATRAS.map((key, index) => {
    const start = norm360(index * (360 / 27) + props.wheelShift)
    const end = norm360((index + 1) * (360 / 27) + props.wheelShift)
    const label = polarPoint((WHEEL_RADII.zodiacOuter + 210) / 2, index * (360 / 27) + (360 / 54) + props.wheelShift)
    return {
      key,
      index,
      start,
      end,
      label,
      symbol: labelFor(key),
      fill: fills[index % fills.length],
      fontSize: 6.7,
    }
  })
)
</script>

<template lang="pug">
g(pointer-events='none')
  SegmentRing(
    test-id='nakshatra-ring'
    :sectors='sectors'
    :inner-radius='WHEEL_RADII.zodiacOuter'
    :outer-radius='210'
    stroke='var(--chart-ink-muted)'
    stroke-width='0.35'
    text-fill='var(--chart-zodiac-text)'
    text-stroke='transparent'
    font-size='6.7'
    font-family='Inter, system-ui, sans-serif'
    font-weight='700'
  )
  circle(:cx='CENTER' :cy='CENTER' r='210' fill='none' stroke='var(--chart-frame-stroke)' stroke-width='1')
</template>
