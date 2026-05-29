<script setup>
import { computed } from 'vue'
import { PLANET_COLORS, PLANET_SYMBOLS, WHEEL_RADII, degreeLabel } from './geometry.js'

const props = defineProps({
  placements: { type: Array, required: true },
  color: { type: String, default: '#111827' },
  mapIndex: { type: Number, default: 0 },
})

const glyphs = computed(() =>
  props.placements.map((item) => {
    const exact = item.tick
    const glyph = item.point
    const color = props.mapIndex === 0 ? PLANET_COLORS[item.planet.name] || props.color : props.color
    const labelColor = props.mapIndex === 0 ? '#111827' : props.color
    return {
      ...item,
      exact,
      glyph,
      color,
      labelColor,
      symbol: PLANET_SYMBOLS[item.planet.name],
      degree: degreeLabel(item.planet.longitude),
      fontSize: item.planet.name === 'Sun' && props.mapIndex === 0 ? 20 : props.mapIndex === 0 ? 18 : 15,
    }
  })
)
</script>

<template lang="pug">
g(data-testid='planet-layer' font-family='serif' text-anchor='middle')
  circle(:cx='260' :cy='260' :r='WHEEL_RADII.aspect' fill='none' stroke='#475569' stroke-width='0.45' stroke-opacity='0.25')
  g(
    v-for='item in glyphs'
    :key='`${item.planet.name}-${item.planet.longitude}`'
    :data-planet='item.planet.name'
    :data-testid='`planet-glyph-${item.planet.name}`'
  )
    line(
      :x1='item.exact.x'
      :y1='item.exact.y'
      :x2='item.glyph.x'
      :y2='item.glyph.y'
      :stroke='color'
      stroke-width='0.45'
      stroke-opacity='0.32'
      stroke-linecap='round'
    )
    circle(
      :cx='item.exact.x'
      :cy='item.exact.y'
      r='1.35'
      :fill='color'
      fill-opacity='0.72'
    )
    text(
      :x='item.glyph.x'
      :y='item.glyph.y'
      :fill='item.color'
      :stroke='item.planet.name === "Sun" && mapIndex === 0 ? "#facc15" : "none"'
      :stroke-width='item.planet.name === "Sun" && mapIndex === 0 ? 0.8 : 0'
      :font-size='item.fontSize'
      dominant-baseline='central'
      data-role='symbol'
    ) {{ item.symbol }}
    text(
      :x='item.glyph.x + 10'
      :y='item.glyph.y - 9'
      :fill='item.labelColor'
      :font-size='mapIndex === 0 ? 6 : 5.5'
      dominant-baseline='central'
    ) {{ item.degree }}
    text(
      v-if='item.planet.retrograde'
      :x='item.glyph.x + 10'
      :y='item.glyph.y + 7'
      :fill='item.labelColor'
      :font-size='mapIndex === 0 ? 5.5 : 5'
      dominant-baseline='central'
    ) R
</template>
