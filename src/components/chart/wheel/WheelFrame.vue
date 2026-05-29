<script setup>
import { CENTER, WHEEL_RADII } from './geometry.js'
</script>

<template lang="pug">
g(data-testid='wheel-frame')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter' fill='#d9e3ec' stroke='#252a30' stroke-width='2')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacInner' fill='#fbfcfe' stroke='#252a30' stroke-width='1.3')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseOuter' fill='#fbfcfe' stroke='#252a30' stroke-width='1.1')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseInner' fill='#141322' stroke='#252a30' stroke-width='1.6')
</template>
