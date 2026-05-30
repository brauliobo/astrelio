<script setup>
import { computed } from 'vue'
import BodygraphGateMarker from './BodygraphGateMarker.vue'
import { centerText } from './bodygraphCenterGeometry.js'
import { gateLayout } from './bodygraphGateGeometry.js'
import { hoverMatchesGate } from './bodygraphInteraction.js'
import { activationTone, humanDesignPalette } from './visualTheme.js'

const props = defineProps({
  chart:        { type: Object, required: true },
  inactiveFill: { type: String, default: 'rgba(255,255,255,0.58)' },
  hover:        { type: Object, default: null },
  visualTheme:  { type: String, default: 'dark' },
})

const emit = defineEmits(['hover', 'leave'])

const personalityGates = computed(() => new Set(props.chart.personalityGates || []))
const designGates      = computed(() => new Set(props.chart.designGates || []))
const allGates         = computed(() => new Set(props.chart.gates || []))
const hasHover         = computed(() => Boolean(props.hover))
const palette          = computed(() => humanDesignPalette(props.visualTheme))

const gatePoints = computed(() =>
  gateLayout.flatMap(([center, gates]) =>
    gates.map(([gate, x, y]) => {
      const personality = personalityGates.value.has(gate)
      const design      = designGates.value.has(gate)
      const tone        = activationTone({ design, personality, mode: props.visualTheme })
      return {
        center,
        gate,
        x,
        y,
        active: allGates.value.has(gate),
        personality,
        design,
        fill:            tone.fill,
        stroke:          tone.stroke,
        text:            design || personality ? tone.text : centerText[center],
        parts:           tone.parts,
        inactiveFill:    props.inactiveFill,
        highlightStroke: palette.value.highlight,
        dimmedText:      props.visualTheme === 'light' ? 'rgba(71,85,105,0.38)' : 'rgba(203,213,225,0.34)',
      }
    }))
)
</script>

<template lang="pug">
g(data-testid='bodygraph-gates')
  BodygraphGateMarker(
    v-for='item in gatePoints'
    :key='`${item.center}-${item.gate}`'
    :item='item'
    :highlighted='hoverMatchesGate(hover, item.gate, item.center)'
    :dimmed='hasHover && !hoverMatchesGate(hover, item.gate, item.center)'
    @hover='emit("hover", $event)'
    @leave='emit("leave")'
  )
</template>
