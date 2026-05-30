<script setup>
import { computed } from 'vue'
import { PLANET_SYMBOLS } from '../chart/wheel/geometry.js'

const props = defineProps({
  reference: { type: String, required: true },
  mode: { type: String, default: 'html' },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  size: { type: Number, default: 18 },
  color: { type: String, default: 'currentColor' },
  weight: { type: [Number, String], default: 700 },
  anchor: { type: String, default: 'middle' },
  baseline: { type: String, default: 'middle' },
})

const symbol = computed(() => PLANET_SYMBOLS[props.reference] || props.reference.slice(0, 2))
const htmlStyle = computed(() => ({
  '--glyph-size': `${props.size}px`,
  '--glyph-color': props.color,
  '--glyph-weight': props.weight,
}))
</script>

<template lang="pug">
text(
  v-if='mode === "svg"'
  :x='x'
  :y='y'
  :text-anchor='anchor'
  :dominant-baseline='baseline'
  :fill='color'
  :font-size='size'
  :font-weight='weight'
  class='celestial-glyph-svg'
) {{ symbol }}
span(v-else class='celestial-glyph' :style='htmlStyle') {{ symbol }}
</template>

<style scoped>
.celestial-glyph,
.celestial-glyph-svg {
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1;
}

.celestial-glyph {
  color: var(--glyph-color);
  display: inline-grid;
  font-size: var(--glyph-size);
  font-weight: var(--glyph-weight);
  min-width: 1.25em;
  place-items: center;
}
</style>
