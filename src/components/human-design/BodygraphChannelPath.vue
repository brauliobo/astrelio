<script setup>
defineProps({
  line: { type: Object, required: true },
  pathId: { type: String, required: true },
  strokeWidth: { type: Number, required: true },
  dimmed: { type: Boolean, default: false },
  highlighted: { type: Boolean, default: false },
})

const emit = defineEmits(['hover', 'leave'])

const safeId = value => value.replace(/[^a-zA-Z0-9_-]/g, '-')
const splitGradientId = pathId => `split-${safeId(pathId)}`
const splitFill = pathId => `url(#${splitGradientId(pathId)})`
const gradientVector = line => line.splitAxis === 'y'
  ? { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
  : { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
</script>

<template lang="pug">
g
  defs(v-if='line.parts?.length > 1')
    linearGradient(
      :id='splitGradientId(pathId)'
      :x1='gradientVector(line).x1'
      :y1='gradientVector(line).y1'
      :x2='gradientVector(line).x2'
      :y2='gradientVector(line).y2'
      data-testid='bodygraph-split-gradient'
      :data-gate='line.gate || null'
    )
      stop(offset='0%' :stop-color='line.parts[0].fill')
      stop(offset='49.5%' :stop-color='line.parts[0].fill')
      stop(offset='50.5%' :stop-color='line.parts[1].fill')
      stop(offset='100%' :stop-color='line.parts[1].fill')
  path(
    v-if='line.parts?.length > 1'
    :d='line.d'
    :fill='splitFill(pathId)'
    :fill-opacity='dimmed ? 0.08 : highlighted ? 1 : line.opacity'
    stroke='none'
    stroke-width='0'
    :data-channel='line.channel'
    :data-gate='line.gate || null'
    :data-defined='String(line.defined)'
    :data-tone='line.tone || null'
    :data-parts='line.parts.map(part => part.key).join(",")'
    data-testid='bodygraph-defined-channel'
    class='channel-path'
    :class='{ highlighted }'
    @pointerenter='emit("hover", line.channel)'
    @pointerleave='emit("leave")'
  )
  path(
    v-else
    :d='line.d'
    :fill='highlighted ? line.highlightFill : line.fill'
    :fill-opacity='dimmed ? 0.08 : highlighted ? 1 : line.opacity'
    :stroke='line.accentStroke || "none"'
    :stroke-width='line.accentStroke && line.accentStroke !== "none" ? Math.max(2.4, strokeWidth * 0.22) : 0'
    :data-channel='line.channel'
    :data-gate='line.gate || null'
    :data-defined='String(line.defined)'
    :data-tone='line.tone || null'
    :data-testid='line.defined ? "bodygraph-defined-channel" : "bodygraph-open-channel"'
    class='channel-path'
    :class='{ highlighted }'
    @pointerenter='emit("hover", line.channel)'
    @pointerleave='emit("leave")'
  )
</template>

<style scoped>
.channel-path {
  cursor: pointer;
  transition: fill 140ms ease, fill-opacity 140ms ease, filter 140ms ease;
}

.channel-path.highlighted {
  filter: drop-shadow(0 0 8px rgba(248, 250, 252, 0.55));
}
</style>
