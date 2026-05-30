<script setup>
import { computed } from 'vue'
import CelestialGlyph from '../../common/CelestialGlyph.vue'
import { PLANET_COLORS, PLANET_SYMBOLS, WHEEL_RADII, degreeLabel, planetGlyphScale } from './geometry.js'

const props = defineProps({
  placements: { type: Array, required: true },
  color: { type: String, default: 'var(--chart-ink)' },
  symbols: { type: Object, default: null },
  colors: { type: Object, default: null },
  labels: { type: Object, default: null },
  glyphRenderer: { type: String, default: null },
  mapIndex: { type: Number, default: 0 },
  highlightedBodies: { type: Array, default: () => [] },
})
defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const highlightedBodySet = computed(() => new Set(props.highlightedBodies))
const hasHighlight = computed(() => highlightedBodySet.value.size > 0)

const glyphs = computed(() =>
  props.placements.map((item) => {
    const glyph = item.glyphPoint || item.point
    const label = item.labelPoint || { x: glyph.x + 10, y: glyph.y - 9 }
    const retrograde = item.retrogradePoint || { x: glyph.x + 10, y: glyph.y + 7 }
    const symbols = props.symbols || PLANET_SYMBOLS
    const colors = props.colors || PLANET_COLORS
    const color = props.mapIndex === 0 ? colors[item.planet.name] || props.color : props.color
    const labelColor = props.mapIndex === 0 ? 'var(--chart-ink)' : props.color
    const name = props.labels?.[item.planet.name] || item.planet.displayName || item.planet.name
    const glyphScale = planetGlyphScale(item.planet.name)
    return {
      ...item,
      glyph,
      label,
      retrograde,
      color,
      labelColor,
      labelAnchor: item.labelAnchor || 'middle',
      name,
      symbol: symbols[item.planet.name],
      degree: degreeLabel(item.planet.longitude),
      showDegreeLabel: item.showDegreeLabel !== false,
      fontSize: props.mapIndex === 0 ? 22 : 17,
      glyphScale,
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
  circle(:cx='260' :cy='260' :r='WHEEL_RADII.aspect' fill='none' stroke='var(--chart-ink-muted)' stroke-width='0.45' stroke-opacity='0.25')
  g(
    v-for='item in glyphs'
    :key='`${item.planet.name}-${item.planet.longitude}`'
    :data-planet='item.planet.name'
    :data-testid='`planet-glyph-${item.planet.name}`'
    :data-highlight='glyphHighlightState(item.planet.name)'
    :aria-label='`${item.name} ${item.degree} degrees`'
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
    title {{ item.name }} {{ item.degree }}°
    circle.planet-hit-target(
      :cx='item.glyph.x'
      :cy='item.glyph.y'
      r='15'
      fill='var(--chart-hit-target-fill)'
      pointer-events='all'
      :data-testid='`planet-hit-${item.planet.name}`'
    )
    CelestialGlyph(
      mode='svg'
      :reference='item.planet.name'
      :symbol='item.symbol'
      :renderer='glyphRenderer'
      :x='item.glyph.x'
      :y='item.glyph.y'
      :color='item.color'
      :size='item.fontSize'
      :weight='glyphHighlightState(item.planet.name) === "active" ? 700 : 400'
      :scale='item.glyphScale'
      data-role='symbol'
    )
    text(
      :x='item.label.x'
      :y='item.label.y'
      :fill='item.labelColor'
      :font-size='mapIndex === 0 ? 7.8 : 6.6'
      font-weight='600'
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
.planet-glyph-group {
  pointer-events: bounding-box;
}

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

.planet-hit-target {
  stroke: none;
}
</style>
