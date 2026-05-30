<script setup>
import { CENTER, WHEEL_RADII } from './geometry.js'
</script>

<template lang="pug">
g(data-testid='wheel-frame')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter + 8' fill='#0f172a' opacity='0.2')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter' fill='#edf3f8' stroke='#0f172a' stroke-width='2.2')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacInner' fill='#fbfdff' stroke='#334155' stroke-width='1.25')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseOuter' fill='#f9fbfd' stroke='#475569' stroke-width='1')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseInner' fill='#101827' stroke='#0f172a' stroke-width='1.8')
</template>
