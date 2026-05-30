<script setup>
import { CENTER, WHEEL_RADII } from './geometry.js'
</script>

<template lang="pug">
g(data-testid='wheel-frame' pointer-events='none')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter + 8' fill='var(--chart-shadow-fill)' opacity='0.2')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter' fill='var(--chart-zodiac-fill-b)' stroke='var(--chart-frame-stroke)' stroke-width='2.2')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacInner' fill='var(--chart-house-fill-a)' stroke='var(--chart-ink-muted)' stroke-width='1.25')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseOuter' fill='var(--chart-house-fill-a)' stroke='var(--chart-ink-muted)' stroke-width='1')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseInner' fill='var(--chart-house-center)' stroke='var(--chart-frame-stroke)' stroke-width='1.8')
</template>
