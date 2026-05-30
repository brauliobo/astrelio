<script setup>
defineProps({
  line:        { type: Object, required: true },
  pathId:      { type: String, required: true },
  strokeWidth: { type: Number, required: true },
  dimmed:      { type: Boolean, default: false },
  highlighted: { type: Boolean, default: false },
})

const emit = defineEmits(['hover', 'leave'])

const rounded             = value => Number.parseFloat(value.toFixed(3)).toString()
const laneStrokeWidth     = (strokeWidth) => rounded(Math.max(2.2, strokeWidth * 0.5))
const laneStrokeTransform = (line, index, strokeWidth) => {
  const direction = index === 0 ? -1 : 1
  const offset    = rounded(strokeWidth * 0.24 * direction)
  return line.splitAxis === 'y' ? `translate(0 ${offset})` : `translate(${offset} 0)`
}

const laneTransform = (line, index) => {
  const bounds    = line.splitBounds || { x: 0, y: 0, width: 0, height: 0, midX: 0, midY: 0 }
  const laneScale = 0.42
  const direction = index === 0 ? -1 : 1

  if (line.splitAxis === 'y') {
    const offset = bounds.height * 0.24 * direction
    const y      = bounds.midY + offset - (laneScale * bounds.midY)
    return `matrix(1 0 0 ${laneScale} 0 ${rounded(y)})`
  }

  const offset = bounds.width * 0.24 * direction
  const x      = bounds.midX + offset - (laneScale * bounds.midX)
  return `matrix(${laneScale} 0 0 1 ${rounded(x)} 0)`
}
</script>

<template lang="pug">
g
  template(v-if='line.parts?.length > 1 && line.laneD')
    path(
      v-for='(part, index) in line.parts'
      :key='part.key'
      :d='line.laneD'
      fill='none'
      :stroke='part.fill'
      :stroke-opacity='dimmed ? 0.08 : highlighted ? 1 : line.opacity'
      :stroke-width='laneStrokeWidth(strokeWidth)'
      stroke-linecap='butt'
      stroke-linejoin='round'
      :transform='laneStrokeTransform(line, index, strokeWidth)'
      :data-channel='line.channel'
      :data-gate='line.gate || null'
      :data-defined='String(line.defined)'
      :data-tone='line.tone || null'
      :data-part='part.key'
      :data-axis='line.splitAxis'
      data-testid='bodygraph-defined-channel'
      class='channel-path'
      :class='{ highlighted }'
      @pointerenter='emit("hover", line.channel)'
      @pointerleave='emit("leave")'
    )
  template(v-else-if='line.parts?.length > 1 && line.splitBounds')
    path(
      v-for='(part, index) in line.parts'
      :key='part.key'
      :d='line.d'
      :fill='part.fill'
      :fill-opacity='dimmed ? 0.08 : highlighted ? 1 : line.opacity'
      stroke='none'
      stroke-width='0'
      :transform='laneTransform(line, index)'
      :data-channel='line.channel'
      :data-gate='line.gate || null'
      :data-defined='String(line.defined)'
      :data-tone='line.tone || null'
      :data-part='part.key'
      :data-axis='line.splitAxis'
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
  transition: fill 140ms ease, fill-opacity 140ms ease, filter 140ms ease, stroke 140ms ease, stroke-opacity 140ms ease;
}

.channel-path.highlighted {
  filter: drop-shadow(0 0 8px rgba(248, 250, 252, 0.55));
}
</style>
