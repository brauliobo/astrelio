<script setup>
import { computed } from 'vue'
import { CENTER_LAYOUT, CENTER_TOKEN } from '../../../lib/human-design/layout.js'

const props = defineProps({
  center: { type: String, required: true },
  state:  { type: String, default: 'defined' },
  size:   { type: Number, default: 40 },
})

const layout = computed(() => CENTER_LAYOUT[props.center])
const box    = computed(() => {
  const [x, y, w, h] = layout.value.bbox
  const side        = Math.max(w, h) + 12
  return [x + w / 2 - side / 2, y + h / 2 - side / 2, side, side].join(' ')
})
const token  = computed(() => CENTER_TOKEN[props.center])
</script>

<template lang="pug">
svg.hda-center(
  :viewBox='box'
  :width='size'
  :height='size'
  :data-state='state'
  :style='{ "--fill": `var(--hd-${token})`, "--edge": `var(--hd-${token}-stroke)` }'
  aria-hidden='true'
)
  path(:d='layout.d')
  circle(v-if='state === "undefined"' :cx='layout.centroid[0]' :cy='layout.centroid[1]' r='9')
</template>

<style scoped>
.hda-center { flex: none; overflow: visible; }
.hda-center path { stroke-width: 6; stroke-linejoin: round; }
.hda-center circle { fill: var(--fill); stroke: var(--edge); stroke-width: 3; }
[data-state="defined"] path { fill: var(--fill); stroke: var(--edge); }
[data-state="undefined"] path { fill: var(--hd-open-fill); stroke: var(--hd-open-stroke); }
[data-state="open"] path { fill: var(--hd-open-fill); stroke: var(--hd-open-stroke); stroke-dasharray: 14 9; }
</style>
