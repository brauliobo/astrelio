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
const clipId = (pathId, part) => `clip-${safeId(pathId)}-${safeId(part)}`
const splitRect = (line, index) => {
  const bounds = line.splitBounds || { x: 0, y: 0, width: 0, height: 0, midX: 0, midY: 0 }
  const pad = 8
  if (line.splitAxis === 'y') {
    return {
      x: bounds.x - pad,
      y: index === 0 ? bounds.y - pad : bounds.midY,
      width: bounds.width + (pad * 2),
      height: (bounds.height / 2) + pad,
    }
  }
  return {
    x: index === 0 ? bounds.x - pad : bounds.midX,
    y: bounds.y - pad,
    width: (bounds.width / 2) + pad,
    height: bounds.height + (pad * 2),
  }
}
</script>

<template lang="pug">
g
  defs(v-if='line.parts?.length > 1 && line.splitBounds')
    clipPath(
      v-for='(part, index) in line.parts'
      :key='part.key'
      :id='clipId(pathId, part.key)'
      data-testid='bodygraph-split-clip'
      :data-gate='line.gate || null'
      :data-axis='line.splitAxis'
    )
      rect(
        :x='splitRect(line, index).x'
        :y='splitRect(line, index).y'
        :width='splitRect(line, index).width'
        :height='splitRect(line, index).height'
      )
  template(v-if='line.parts?.length > 1 && line.splitBounds')
    path(
      v-for='part in line.parts'
      :key='part.key'
      :d='line.d'
      :fill='part.fill'
      :fill-opacity='dimmed ? 0.08 : highlighted ? 1 : line.opacity'
      stroke='none'
      stroke-width='0'
      :clip-path='`url(#${clipId(pathId, part.key)})`'
      :data-channel='line.channel'
      :data-gate='line.gate || null'
      :data-defined='String(line.defined)'
      :data-tone='line.tone || null'
      :data-part='part.key'
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
