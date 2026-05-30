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
  scale: { type: [Number, Object], default: 1 },
})

const symbol = computed(() => PLANET_SYMBOLS[props.reference] || props.reference.slice(0, 2))
const scaleXY = computed(() => {
  if (typeof props.scale === 'number') return { x: props.scale, y: props.scale }
  return { x: props.scale?.x ?? 1, y: props.scale?.y ?? 1 }
})
const isUnscaled = computed(() => scaleXY.value.x === 1 && scaleXY.value.y === 1)
const svgTransform = computed(() => isUnscaled.value
  ? null
  : `translate(${props.x} ${props.y}) scale(${scaleXY.value.x} ${scaleXY.value.y}) translate(${-props.x} ${-props.y})`
)
const htmlStyle = computed(() => ({
  '--glyph-size': `${props.size}px`,
  '--glyph-color': props.color,
  '--glyph-weight': props.weight,
  '--glyph-scale-x': scaleXY.value.x,
  '--glyph-scale-y': scaleXY.value.y,
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
  :transform='svgTransform'
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
  transform: scale(var(--glyph-scale-x), var(--glyph-scale-y));
}
</style>
