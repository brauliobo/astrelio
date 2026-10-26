<script setup>
import { computed, inject } from 'vue'

const props = defineProps({
  channel:  { type: Object, required: true },
  layer:    { type: String, required: true },
  emphasis: { type: String, default: 'idle' },
  index:    { type: Number, default: 0 },
  animate:  { type: Boolean, default: true },
  pinned:   { type: Boolean, default: false },
  tabbable: { type: Boolean, default: false },
  label:    { type: String, default: '' },
})

const emit = defineEmits(['hover', 'leave', 'select', 'focus', 'blur'])

const ids = inject('bodygraphIds')

const HALF_DASHES = ['50 50', '0 50 50 0']

const halves = computed(() => props.channel.halves
  .map((state, side) => ({ state, side, dash: HALF_DASHES[side] }))
  .filter(({ state }) => state))
</script>

<template lang="pug">
g.channel(
  v-if='layer !== "hit"'
  :data-channel='channel.id'
  :data-status='channel.status'
  :data-emphasis='emphasis'
  :data-layer='layer'
)
  path.track(v-if='layer === "track"' :d='channel.d')
  template(v-else-if='layer === "halo" || layer === "color"')
    path.half(
      v-for='half in halves'
      :key='half.side'
      :d='channel.d'
      pathLength='100'
      :stroke-dasharray='half.dash'
      :class='layer === "halo" ? "half--halo" : `half--${half.state}`'
      :stroke='layer === "color" && half.state === "both" ? `url(#${ids.stripe})` : null'
      :data-gate='channel.gates[half.side]'
    )
  path.flow(
    v-else
    :d='channel.d'
    :class='{ animated: animate }'
    :style='{ "--i": index }'
  )
path.hit(
  v-else
  :d='channel.d'
  role='button'
  :tabindex='tabbable ? 0 : -1'
  :aria-label='label'
  :aria-pressed='String(pinned)'
  :data-channel='channel.id'
  :data-status='channel.status'
  :data-focus-id='`channel:${channel.id}`'
  data-testid='bodygraph-channel'
  @pointerenter='emit("hover")'
  @pointerleave='emit("leave")'
  @click.stop='emit("select")'
  @focus='emit("focus")'
  @blur='emit("blur")'
)
</template>

<style scoped>
.channel {
  fill: none;
  pointer-events: none;
  transition: opacity 140ms ease;
}

.channel[data-emphasis='dim'] {
  opacity: 0.45;
}

.track {
  stroke: var(--hd-track);
  stroke-width: 4;
}

.half {
  stroke-width: 11;
}

.half--halo {
  stroke: var(--hd-page);
  stroke-width: 14;
}

.channel[data-status='hanging'] .half:not(.half--halo) {
  opacity: 0.85;
}

.half--design {
  stroke: var(--hd-design);
}

.half--personality {
  stroke: var(--hd-personality);
}

.flow {
  stroke: var(--hd-pers-on);
  stroke-opacity: 0.8;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 0.1 14;
}

.flow.animated {
  animation: hd-flow 0.9s linear infinite;
  animation-delay: calc(var(--i) * -0.17s);
}

.channel[data-emphasis='dim'] .flow {
  animation-play-state: paused;
}

@keyframes hd-flow {
  to {
    stroke-dashoffset: -28;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow.animated {
    animation: none;
  }
}

.hit {
  fill: none;
  stroke: transparent;
  stroke-width: 16;
  pointer-events: stroke;
  cursor: pointer;
  outline: none;
}

.hit:focus-visible {
  stroke: var(--hd-focus);
  stroke-opacity: 0.55;
}
</style>
