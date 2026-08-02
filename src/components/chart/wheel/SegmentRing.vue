<script setup>
import Arc from './Arc.vue'

const props = defineProps({
  sectors:          { type: Array, required: true },
  innerRadius:      { type: Number, required: true },
  outerRadius:      { type: Number, required: true },
  stroke:           { type: String, default: 'var(--chart-zodiac-stroke)' },
  strokeWidth:      { type: [Number, String], default: 0.5 },
  textFill:         { type: String, default: 'var(--chart-zodiac-text)' },
  textStroke:       { type: String, default: 'var(--chart-zodiac-text-stroke)' },
  fontSize:         { type: [Number, String], default: 23 },
  fontFamily:       { type: String, default: '"DejaVu Sans", "Noto Sans Symbols 2", "Noto Sans Symbols", serif' },
  fontWeight:       { type: [Number, String], default: 600 },
  testId:           { type: String, default: 'segment-ring' },
  highlightedWheel: { type: Object, default: null },
})

const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const payloadFor = sector => sector.payload || null
const isInteractive = sector => Boolean(payloadFor(sector))
const isSameWheel = payload =>
  payload?.wheel?.kind === props.highlightedWheel?.kind && payload?.wheel?.id === props.highlightedWheel?.id
const isRelatedWheel = payload =>
  payload?.wheel?.kind === props.highlightedWheel?.kind &&
  props.highlightedWheel?.relatedIds?.includes(payload?.wheel?.id)
const sectorState = (sector) => {
  const payload = payloadFor(sector)
  if (!payload || !props.highlightedWheel || payload.wheel.kind !== props.highlightedWheel.kind) return 'idle'
  if (isSameWheel(payload)) return 'active'
  return isRelatedWheel(payload) ? 'related' : 'dimmed'
}
const emitPayload = (event, sector) => {
  const payload = payloadFor(sector)
  if (payload) emit(event, payload)
}
</script>

<template lang="pug">
g(:data-testid='testId')
  g(
    v-for='sector in sectors'
    :key='sector.key ?? sector.index'
    :aria-label='sector.title'
    :aria-pressed='isSameWheel(payloadFor(sector))'
    :data-highlight='sectorState(sector)'
    :data-wheel-kind='payloadFor(sector)?.wheel?.kind'
    :data-wheel-id='payloadFor(sector)?.wheel?.id'
    :role='isInteractive(sector) ? "button" : null'
    :tabindex='isInteractive(sector) ? 0 : null'
    class='segment-ring-sector'
    @mouseenter='emitPayload("highlight", sector)'
    @mouseleave='isInteractive(sector) && $emit("clear-highlight")'
    @focus='emitPayload("highlight", sector)'
    @blur='isInteractive(sector) && $emit("clear-highlight")'
    @click.stop='emitPayload("toggle-highlight", sector)'
    @keydown.enter.prevent='emitPayload("toggle-highlight", sector)'
    @keydown.space.prevent='emitPayload("toggle-highlight", sector)'
  )
    Arc(
      :inner-radius='innerRadius'
      :outer-radius='outerRadius'
      :start-longitude='sector.start'
      :end-longitude='sector.end'
      :fill='sector.fill'
      :stroke='stroke'
      :stroke-width='strokeWidth'
      :title='sector.title || ""'
      :highlight-state='sectorState(sector)'
      class='segment-ring-sector__arc'
    )
    text(
      :x='sector.label.x'
      :y='sector.label.y'
      :fill='sector.textFill || textFill'
      :font-family='fontFamily'
      :font-size='sector.fontSize || fontSize'
      :font-weight='fontWeight'
      :stroke='textStroke'
      stroke-width='1.8'
      paint-order='stroke fill'
      text-anchor='middle'
      dominant-baseline='central'
      :data-highlight='sectorState(sector)'
      class='segment-ring-sector__label'
    )
      title(v-if='sector.title') {{ sector.title }}
      | {{ sector.symbol }}
</template>

<style scoped>
.segment-ring-sector {
  cursor: pointer;
  outline: none;
}

.segment-ring-sector__arc,
.segment-ring-sector__label {
  transition: opacity 140ms ease, stroke-width 140ms ease, filter 140ms ease;
}

.segment-ring-sector[data-highlight='active'] .segment-ring-sector__arc,
.segment-ring-sector:hover .segment-ring-sector__arc,
.segment-ring-sector:focus-visible .segment-ring-sector__arc {
  filter: drop-shadow(0 0 4px var(--chart-angle-accent));
  opacity: 1;
  stroke-width: 1.4;
}

.segment-ring-sector[data-highlight='active'] .segment-ring-sector__label,
.segment-ring-sector:hover .segment-ring-sector__label,
.segment-ring-sector:focus-visible .segment-ring-sector__label {
  filter: drop-shadow(0 0 3px var(--chart-angle-accent));
}

.segment-ring-sector[data-highlight='related'] .segment-ring-sector__arc {
  filter: drop-shadow(0 0 2px var(--chart-overlay-accent));
  opacity: 0.86;
  stroke-width: 1;
}

.segment-ring-sector[data-highlight='related'] .segment-ring-sector__label {
  filter: drop-shadow(0 0 2px var(--chart-overlay-accent));
  opacity: 0.9;
}

.segment-ring-sector[data-highlight='dimmed'] .segment-ring-sector__arc,
.segment-ring-sector[data-highlight='dimmed'] .segment-ring-sector__label {
  opacity: 0.42;
}
</style>
