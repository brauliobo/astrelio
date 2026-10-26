<script setup>
import { computed, inject } from 'vue'
import { CENTER_LAYOUT } from '../../../lib/human-design/layout.js'
import { centerToneStyle } from './bodygraphState.js'

const props = defineProps({
  center:   { type: String, required: true },
  defined:  { type: Boolean, default: false },
  layer:    { type: String, required: true },
  emphasis: { type: String, default: 'idle' },
  active:   { type: Boolean, default: false },
  pinned:   { type: Boolean, default: false },
  tabbable: { type: Boolean, default: false },
  label:    { type: String, default: '' },
  caption:  { type: String, default: '' },
})

const emit = defineEmits(['hover', 'leave', 'select', 'focus', 'blur'])

const ids      = inject('bodygraphIds')
const layout   = computed(() => CENTER_LAYOUT[props.center])
const tone     = computed(() => centerToneStyle(props.center))
const centroid = computed(() => layout.value.centroid)
const lines    = computed(() => props.caption.split(' ').filter(Boolean))
</script>

<template lang="pug">
g.center(
  v-if='layer === "base"'
  :class='defined ? "is-defined" : "is-open"'
  :style='tone'
  :data-center='center'
  :data-defined='String(defined)'
  :data-emphasis='emphasis'
  :data-active='String(active)'
)
  template(v-if='defined')
    path.glow(:d='layout.d' :filter='`url(#${ids.glow})`')
    path.body(:d='layout.d')
    path.sheen(:d='layout.d' :fill='`url(#${ids.sheen})`')
  path.body(v-else :d='layout.d')
  text.caption(v-if='caption' :x='centroid[0]' :y='centroid[1]')
    tspan(v-for='(line, index) in lines' :key='line' :x='centroid[0]' :dy='index ? "1.1em" : `${-0.55 * (lines.length - 1)}em`') {{ line }}
path.hit(
  v-else
  :d='layout.d'
  role='button'
  :tabindex='tabbable ? 0 : -1'
  :aria-label='label'
  :aria-pressed='String(pinned)'
  :data-center='center'
  :data-defined='String(defined)'
  :data-focus-id='`center:${center}`'
  :data-testid='defined ? "bodygraph-defined-center" : "bodygraph-open-center"'
  @pointerenter='emit("hover")'
  @pointerleave='emit("leave")'
  @click.stop='emit("select")'
  @focus='emit("focus")'
  @blur='emit("blur")'
)
</template>

<style scoped>
.center {
  pointer-events: none;
  transition: opacity 140ms ease;
}

.center[data-emphasis='dim'] {
  opacity: var(--hd-dim);
}

.is-open .body {
  fill: var(--hd-open-fill);
  stroke: var(--hd-open-stroke);
  stroke-width: calc(1.6px * max(1, var(--hd-k, 1)));
  stroke-dasharray: 5 3;
}

.is-defined .body {
  fill: var(--c-fill);
  stroke: var(--c-stroke);
  stroke-width: 2.2;
  stroke-linejoin: round;
}

.sheen {
  stroke: none;
}

.glow {
  fill: var(--c-fill);
  opacity: var(--hd-glow-opacity);
  transition: opacity 140ms ease;
}

.center[data-active='true'] .glow {
  opacity: 0.7;
}

.caption {
  fill: var(--hd-text-muted);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-anchor: middle;
  dominant-baseline: central;
  text-transform: uppercase;
  paint-order: stroke;
  stroke: var(--hd-page);
  stroke-width: 3;
  stroke-linejoin: round;
}

.is-defined .caption {
  fill: var(--c-ink);
  stroke: none;
}

.hit {
  fill: transparent;
  stroke: transparent;
  stroke-width: 3;
  stroke-linejoin: round;
  cursor: pointer;
  outline: none;
}

.hit:focus-visible {
  stroke: var(--hd-focus);
}
</style>
