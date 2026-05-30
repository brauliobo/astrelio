<script setup>
import { computed } from 'vue'
import CelestialGlyph from '../common/CelestialGlyph.vue'
import { planetGlyphScale } from '../chart/wheel/geometry.js'
import { planetGlyphLayout } from './planetGlyphGeometry.js'

const props = defineProps({
  chart: { type: Object, required: true },
})

const PLANET_GLYPH_SIZE = 28

const planets = computed(() => {
  const rows = [
    ...Object.values(props.chart.personality || {}).map(item => ({ ...item, layer: 'personality' })),
    ...Object.values(props.chart.design || {}).map(item => ({ ...item, layer: 'design' })),
  ]

  return planetGlyphLayout(rows).map((item) => {
    return {
      ...item,
      color: item.layer === 'personality' ? 'rgba(248,250,252,0.86)' : 'rgba(239,85,87,0.88)',
      size: PLANET_GLYPH_SIZE,
      scale: planetGlyphScale(item.planet),
    }
  })
})
</script>

<template lang="pug">
g.hd-wheel-planets(data-testid='hd-wheel-planets')
  CelestialGlyph(
    v-for='planet in planets'
    :key='`${planet.layer}-${planet.planet}`'
    mode='svg'
    :reference='planet.planet'
    :x='planet.point.x'
    :y='planet.point.y'
    :color='planet.color'
    :size='planet.size'
    :scale='planet.scale'
    :weight='700'
    :data-layer='planet.layer'
    :data-planet='planet.planet'
    :data-gate='planet.gate'
    :data-lane='planet.lane'
  )
</template>

<style scoped>
.hd-wheel-planets {
  opacity: 0.9;
  transition: opacity 160ms ease;
}

.hd-wheel-planets:hover {
  opacity: 1;
}
</style>
