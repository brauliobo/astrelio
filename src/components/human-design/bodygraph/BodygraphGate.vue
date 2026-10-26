<script setup>
import { computed } from 'vue'
import { centerToneStyle } from './bodygraphState.js'

const props = defineProps({
  item:     { type: Object, required: true },
  state:    { type: String, default: null },
  defined:  { type: Boolean, default: false },
  layer:    { type: String, required: true },
  emphasis: { type: String, default: 'idle' },
  active:   { type: Boolean, default: false },
  pinned:   { type: Boolean, default: false },
  tabbable: { type: Boolean, default: false },
  label:    { type: String, default: '' },
})

const emit = defineEmits(['hover', 'leave', 'select', 'focus', 'blur'])

const tone  = computed(() => centerToneStyle(props.item.center))
const halfs = computed(() => ['design', 'personality'].map((state, side) => {
  const { x, y, radius } = props.item
  return { state, d: `M${x} ${y - radius} A${radius} ${radius} 0 0 ${side} ${x} ${y + radius}Z` }
}))
</script>

<template lang="pug">
g.gate(
  v-if='layer === "base"'
  :style='tone'
  :data-gate='item.gate'
  :data-state='state || "inactive"'
  :data-center-defined='String(defined)'
  :data-emphasis='emphasis'
  :data-active='String(active)'
)
  g.glyph
    template(v-if='state')
      template(v-if='state === "both"')
        path.disc(v-for='half in halfs' :key='half.state' :d='half.d' :class='`disc--${half.state}`' data-testid='bodygraph-gate-part')
      circle.disc(v-else :cx='item.x' :cy='item.y' :r='item.radius' :class='`disc--${state}`')
      circle.inner(v-if='state === "design"' :cx='item.x' :cy='item.y' :r='item.radius - 3')
      circle.ring(:cx='item.x' :cy='item.y' :r='item.radius')
    text.number(:x='item.x' :y='item.y') {{ item.gate }}
circle.hit(
  v-else
  :cx='item.x'
  :cy='item.y'
  :r='item.radius + 0.5'
  role='button'
  :tabindex='tabbable ? 0 : -1'
  :aria-label='label'
  :aria-pressed='String(pinned)'
  :data-gate='item.gate'
  :data-focus-id='`gate:${item.gate}`'
  data-testid='bodygraph-gate'
  @pointerenter='emit("hover")'
  @pointerleave='emit("leave")'
  @click.stop='emit("select")'
  @focus='emit("focus")'
  @blur='emit("blur")'
)
</template>

<style scoped>
.gate {
  pointer-events: none;
  transition: opacity 140ms ease;
}

.gate[data-emphasis='dim'] {
  opacity: var(--hd-dim);
}

.glyph {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 140ms ease;
}

.gate[data-active='true'] .glyph {
  transform: scale(1.2);
}

.disc--design {
  fill: var(--hd-design);
}

.disc--personality {
  fill: var(--hd-personality);
}

.inner {
  fill: none;
  stroke: var(--hd-design-on);
  stroke-opacity: 0.7;
  stroke-width: 1;
}

.ring {
  fill: none;
  stroke: var(--hd-marker-ring);
  stroke-width: 1.5;
}

.number {
  fill: var(--hd-text-muted);
  font-size: min(14px, max(11px, calc(10px * var(--hd-k, 1))));
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-anchor: middle;
  dominant-baseline: central;
}

.gate[data-center-defined='true'] .number {
  fill: var(--c-ink);
}

.gate[data-state='personality'] .number {
  fill: var(--hd-pers-on);
  font-weight: 700;
}

.gate[data-state='design'] .number {
  fill: var(--hd-design-on);
  font-weight: 700;
}

.gate[data-state='both'] .number {
  fill: var(--hd-both-on);
  stroke: var(--hd-both-halo);
  stroke-width: 2.5;
  stroke-linejoin: round;
  paint-order: stroke;
  font-weight: 700;
}

.hit {
  fill: transparent;
  stroke: transparent;
  stroke-width: 2;
  cursor: pointer;
  outline: none;
}

.hit:focus-visible {
  stroke: var(--hd-focus);
}
</style>
