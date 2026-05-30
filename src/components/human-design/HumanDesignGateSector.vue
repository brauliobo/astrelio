<script setup>
defineProps({
  segment: { type: Object, required: true },
  hovered: { type: Boolean, default: false },
  dimmed: { type: Boolean, default: false },
})

const emit = defineEmits(['hover', 'leave'])
</script>

<template lang="pug">
path(
  :d='segment.path'
  :fill='hovered ? segment.hoverFill : segment.fill'
  :fill-opacity='dimmed ? 0.32 : 1'
  :stroke='hovered ? "#f8fafc" : "rgba(248,250,252,0.075)"'
  :stroke-width='hovered ? 1.7 : 0.7'
  :data-gate='segment.gate'
  :data-active='String(segment.active)'
  data-testid='mandala-gate-sector'
  class='wheel-gate-segment'
  @pointerenter='emit("hover", { type: "gate", value: segment.gate })'
  @pointerleave='emit("leave")'
)
</template>

<style scoped>
.wheel-gate-segment {
  cursor: pointer;
  transition: fill 140ms ease, fill-opacity 140ms ease, stroke 140ms ease, stroke-width 140ms ease;
}
</style>
