<script setup>
import { computed, useId } from 'vue'
import { moonPhaseLighting, moonPhaseLitPathData } from '../../lib/sky/moonPhase.js'

const props = defineProps({
  phase: { type: Number, default: 0 },
  src:   { type: String, default: '/planets/moon.jpg' },
  size:  { type: Number, default: 32 },
  light: { type: Number, default: 1 },
  alt:   { type: String, default: 'Moon' },
})

const clipId    = `moon-phase-light-${useId()}`
const clipUrl   = `url(#${clipId})`
const lighting  = computed(() => moonPhaseLighting(props.phase, props.light))
const litPath   = computed(() => moonPhaseLitPathData(props.phase))
const rootStyle = computed(() => ({
  '--moon-size':         `${Math.max(1, props.size)}px`,
  '--moon-glow-alpha':   lighting.value.glowAlpha,
  '--moon-rim-alpha':    lighting.value.rimAlpha,
  '--moon-shadow-alpha': lighting.value.shadowAlpha,
  '--moon-lit-alpha':    lighting.value.litAlpha,
}))
</script>

<template lang="pug">
span.moon-phase-image(
  :style='rootStyle'
  :role='alt ? "img" : null'
  :aria-label='alt || null'
  :aria-hidden='alt ? null : "true"'
  :data-phase='lighting.phase.toFixed(3)'
  :data-illumination='lighting.illumination.toFixed(3)'
  data-testid='moon-phase-image'
)
  img.moon-phase-image__base(:src='src' alt='' draggable='false')
  svg.moon-phase-image__light(viewBox='0 0 100 100' aria-hidden='true' focusable='false')
    defs
      clipPath(:id='clipId')
        path(:d='litPath')
    circle.moon-phase-image__shadow(cx='50' cy='50' r='50')
    image(
      x='0'
      y='0'
      width='100'
      height='100'
      preserveAspectRatio='xMidYMid slice'
      :href='src'
      :clip-path='clipUrl'
    )
    path.moon-phase-image__sheen(:d='litPath')
</template>

<style scoped>
.moon-phase-image {
  position: relative;
  display: inline-block;
  width: var(--moon-size);
  height: var(--moon-size);
  border-radius: 999px;
  overflow: hidden;
  filter:
    drop-shadow(0 0 calc(var(--moon-size) * 0.28) rgba(219, 234, 254, var(--moon-glow-alpha)))
    drop-shadow(0 0 1px rgba(255, 255, 255, var(--moon-rim-alpha)));
}

.moon-phase-image__base,
.moon-phase-image__light {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.moon-phase-image__base {
  opacity: 0.38;
  filter: brightness(0.46) saturate(0.62);
}

.moon-phase-image__shadow {
  fill: rgba(2, 6, 23, var(--moon-shadow-alpha));
}

.moon-phase-image__light image {
  opacity: var(--moon-lit-alpha);
}

.moon-phase-image__sheen {
  fill: rgba(255, 255, 255, 0.12);
  mix-blend-mode: screen;
}
</style>
