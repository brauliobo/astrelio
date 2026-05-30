<script setup>
import { computed } from 'vue'
import { CENTERS } from '../../lib/human-design/constants.js'
import BodygraphCenterGroup from './BodygraphCenterGroup.vue'
import { centerFills, centerShapes, centerText } from './bodygraphCenterGeometry.js'
import { gateLayout } from './bodygraphGateGeometry.js'
import { activationTone, humanDesignPalette } from './humanDesignVisualTheme.js'

const props = defineProps({
  chart: { type: Object, required: true },
  hover: { type: Object, default: null },
  inactiveFill: { type: String, default: 'rgba(255,255,255,0.58)' },
  showShapes: { type: Boolean, default: true },
  showGates: { type: Boolean, default: true },
  visualTheme: { type: String, default: 'dark' },
})

const emit = defineEmits(['hover', 'leave'])

const definedCenters = computed(() => new Set(props.chart.centers || []))
const personalityGates = computed(() => new Set(props.chart.personalityGates || []))
const designGates = computed(() => new Set(props.chart.designGates || []))
const allGates = computed(() => new Set(props.chart.gates || []))
const hasHover = computed(() => Boolean(props.hover))
const palette = computed(() => humanDesignPalette(props.visualTheme))

const centerRows = computed(() =>
  CENTERS.map((center) => {
    const gates = (gateLayout.find(([name]) => name === center)?.[1] || [])
      .map(([gate, x, y]) => {
        const personality = personalityGates.value.has(gate)
        const design = designGates.value.has(gate)
        const tone = activationTone({ design, personality, mode: props.visualTheme })
        return {
          center,
          gate,
          x,
          y,
          active: allGates.value.has(gate),
          personality,
          design,
          fill: tone.fill,
          stroke: tone.stroke,
          text: design || personality ? tone.text : centerText[center],
          parts: tone.parts,
          inactiveFill: props.inactiveFill,
          highlightStroke: palette.value.highlight,
          dimmedText: props.visualTheme === 'light' ? 'rgba(71,85,105,0.38)' : 'rgba(203,213,225,0.34)',
        }
      })

    return {
      name: center,
      shape: centerShapes[center],
      defined: definedCenters.value.has(center),
      fill: centerFills[center],
      openFill: palette.value.openCenter,
      openStroke: palette.value.openCenterStroke,
      definedStroke: palette.value.centerStroke,
      highlightStroke: palette.value.highlight,
      gateNumbers: gates.map(({ gate }) => gate),
      gates,
    }
  })
)
</script>

<template lang="pug">
g(data-testid='bodygraph-centers')
  BodygraphCenterGroup(
    v-for='center in centerRows'
    :key='center.name'
    :center='center'
    :hover='hover'
    :has-hover='hasHover'
    :show-shape='showShapes'
    :show-gates='showGates'
    @center-hover='emit("hover", { type: "center", value: $event })'
    @gate-hover='emit("hover", { type: "gate", value: $event })'
    @leave='emit("leave")'
  )
</template>
