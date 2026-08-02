<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SegmentRing from './SegmentRing.vue'
import { wheelHighlight } from '../../../lib/chart/highlight.js'
import { CENTER, WHEEL_RADII, ZODIAC_SIGN_NAMES, ZODIAC_SIGNS, polarPoint, norm360 } from './geometry.js'

const props = defineProps({
  wheelShift:       { type: Number, required: true },
  symbols:          { type: Array, default: () => ZODIAC_SIGNS },
  highlightedWheel: { type: Object, default: null },
})
defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])
const { t } = useI18n()

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
    return {
      symbol,
      index,
      start,
      end,
      label,
      fill:  sectorFills[index % sectorFills.length],
      title: `${ZODIAC_SIGN_NAMES[index]} (${symbol})`,
      payload: wheelHighlight('sign', `sign-${index}`, {
        signIndex: index,
        symbol,
        title:     `${ZODIAC_SIGN_NAMES[index]} ${symbol}`,
        details:   [
          { label: 'Span', value: `${index * 30}° to ${(index + 1) * 30}°` },
          { label: 'Mode', value: 'Zodiac sign sector' },
        ],
      }),
    }
  })
)
</script>

<template lang="pug">
g
  SegmentRing(
    test-id='zodiac-ring'
    :sectors='sectors'
    :inner-radius='WHEEL_RADII.zodiacInner'
    :outer-radius='WHEEL_RADII.zodiacOuter'
    :highlighted-wheel='highlightedWheel'
    stroke='var(--chart-zodiac-stroke)'
    stroke-width='0.5'
    font-size='23'
    @highlight='$emit("highlight", $event)'
    @clear-highlight='$emit("clear-highlight")'
    @toggle-highlight='$emit("toggle-highlight", $event)'
  )
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter' fill='none' stroke='var(--chart-frame-stroke)' stroke-width='2.2')
    title {{ t('chart.wheel_accessibility.zodiac_outer_boundary') }}
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacInner' fill='none' stroke='var(--chart-ink-muted)' stroke-width='1.35')
    title {{ t('chart.wheel_accessibility.zodiac_inner_boundary') }}
</template>
