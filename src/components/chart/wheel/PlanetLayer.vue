<script setup>
import { computed } from 'vue'
import { PLANET_COLORS, PLANET_SYMBOLS, WHEEL_RADII, degreeLabel } from './geometry.js'

const props = defineProps({
  placements: { type: Array, required: true },
  color: { type: String, default: '#111827' },
  mapIndex: { type: Number, default: 0 },
  highlightedBodies: { type: Array, default: () => [] },
})
defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const highlightedBodySet = computed(() => new Set(props.highlightedBodies))
const hasHighlight = computed(() => highlightedBodySet.value.size > 0)

const glyphs = computed(() =>
  props.placements.map((item) => {
    const exact = item.tick
    const glyph = item.glyphPoint || item.point
    const label = item.labelPoint || { x: glyph.x + 10, y: glyph.y - 9 }
    const retrograde = item.retrogradePoint || { x: glyph.x + 10, y: glyph.y + 7 }
    const color = props.mapIndex === 0 ? PLANET_COLORS[item.planet.name] || props.color : props.color
    const labelColor = props.mapIndex === 0 ? '#111827' : props.color
    return {
      ...item,
      exact,
      glyph,
      label,
      retrograde,
      color,
      labelColor,
      labelAnchor: item.labelAnchor || 'middle',
      symbol: PLANET_SYMBOLS[item.planet.name],
      degree: degreeLabel(item.planet.longitude),
      showDegreeLabel: item.showDegreeLabel !== false,
      fontSize: item.planet.name === 'Sun' && props.mapIndex === 0 ? 24 : props.mapIndex === 0 ? 21 : 17,
    }
  })
)

const highlightPayload = (body) => ({ bodies: [body], aspectKey: '' })
const glyphHighlightState = (body) => {
  if (!hasHighlight.value) return 'idle'
  return highlightedBodySet.value.has(body) ? 'active' : 'dimmed'
}
</script>

<template lang="pug">
g(data-testid='planet-layer' font-family='serif' text-anchor='middle')
  circle(:cx='260' :cy='260' :r='WHEEL_RADII.aspect' fill='none' stroke='#475569' stroke-width='0.45' stroke-opacity='0.25')
  g(
    v-for='item in glyphs'
    :key='`${item.planet.name}-${item.planet.longitude}`'
    :data-planet='item.planet.name'
    :data-testid='`planet-glyph-${item.planet.name}`'
    :data-highlight='glyphHighlightState(item.planet.name)'
    :aria-label='`${item.planet.name} ${item.degree} degrees`'
    :aria-pressed='highlightedBodySet.has(item.planet.name)'
    role='button'
    tabindex='0'
    class='planet-glyph-group cursor-pointer transition-opacity'
    :class='glyphHighlightState(item.planet.name) === "dimmed" ? "opacity-30" : "opacity-100"'
    @mouseenter='$emit("highlight", highlightPayload(item.planet.name))'
    @mouseleave='$emit("clear-highlight")'
    @focus='$emit("highlight", highlightPayload(item.planet.name))'
    @blur='$emit("clear-highlight")'
    @click.stop='$emit("toggle-highlight", highlightPayload(item.planet.name))'
    @keydown.enter.prevent='$emit("toggle-highlight", highlightPayload(item.planet.name))'
    @keydown.space.prevent='$emit("toggle-highlight", highlightPayload(item.planet.name))'
  )
    title {{ item.planet.name }} {{ item.degree }}°
    line(
      :x1='item.exact.x'
      :y1='item.exact.y'
      :x2='item.glyph.x'
      :y2='item.glyph.y'
      :stroke='item.color'
      :stroke-width='glyphHighlightState(item.planet.name) === "active" ? 1.1 : 0.58'
      :stroke-opacity='glyphHighlightState(item.planet.name) === "active" ? 0.76 : item.isCrowded ? 0.42 : 0.28'
      stroke-linecap='round'
    )
    circle(
      :cx='item.exact.x'
      :cy='item.exact.y'
      r='1.35'
      :fill='color'
      :fill-opacity='glyphHighlightState(item.planet.name) === "active" ? 1 : 0.72'
    )
    text(
      :x='item.glyph.x'
      :y='item.glyph.y'
      :fill='item.color'
      :stroke='item.planet.name === "Sun" && mapIndex === 0 ? "#facc15" : "none"'
      :stroke-width='glyphHighlightState(item.planet.name) === "active" ? 1.1 : item.planet.name === "Sun" && mapIndex === 0 ? 0.8 : 0'
      :font-size='item.fontSize'
      :font-weight='glyphHighlightState(item.planet.name) === "active" ? 700 : 400'
      dominant-baseline='central'
      data-role='symbol'
    ) {{ item.symbol }}
    text(
      :x='item.label.x'
      :y='item.label.y'
      :fill='item.labelColor'
      :font-size='mapIndex === 0 ? 7.2 : 6.4'
      :text-anchor='item.labelAnchor'
      :data-visible='item.showDegreeLabel || glyphHighlightState(item.planet.name) === "active"'
      class='planet-degree-label'
      dominant-baseline='central'
    ) {{ item.degree }}
    text(
      v-if='item.planet.retrograde'
      :x='item.retrograde.x'
      :y='item.retrograde.y'
      :fill='item.labelColor'
      :font-size='mapIndex === 0 ? 6.4 : 5.8'
      :text-anchor='item.labelAnchor'
      class='planet-retrograde-label'
      dominant-baseline='central'
    ) R
</template>

<style scoped>
.planet-degree-label {
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}

.planet-degree-label[data-visible='true'],
.planet-glyph-group:hover .planet-degree-label,
.planet-glyph-group:focus .planet-degree-label,
.planet-glyph-group[data-highlight='active'] .planet-degree-label {
  opacity: 1;
}

.planet-retrograde-label {
  pointer-events: none;
}
</style>
