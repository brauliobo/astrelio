<script setup>
import { computed } from 'vue'
import { MANDALA_GATE_ORDER } from '../../lib/human-design/constants.js'
import GateSector from './GateSector.vue'
import IChingRing from './IChingRing.vue'
import ZodiacSector from './ZodiacSector.vue'
import { wheelRingRadii } from './wheelCore.js'
import { gateSegmentLayout, zodiacSegmentLayout } from './ringSegmentGeometry.js'
import { humanDesignPalette, humanDesignWheelPalette } from './visualTheme.js'

const props = defineProps({
  chart: { type: Object, required: true },
  hover: { type: Object, default: null },
  visualTheme: { type: String, default: 'dark' },
})

const emit = defineEmits(['hover', 'leave'])

const activeGates = computed(() => new Set(props.chart.gates || []))
const personalityGates = computed(() => new Set(props.chart.personalityGates || []))
const designGates = computed(() => new Set(props.chart.designGates || []))
const mandalaGates = MANDALA_GATE_ORDER
const palette = computed(() => humanDesignPalette(props.visualTheme))
const wheelColors = computed(() => humanDesignWheelPalette(props.visualTheme))

const gateSegments = computed(() =>
  gateSegmentLayout({ inner: wheelRingRadii.gateInner, outer: wheelRingRadii.gateOuter, labelRadius: 406 }).map((segment) => {
    const gate = segment.gate
    const active = activeGates.value.has(gate)
    const personality = personalityGates.value.has(gate)
    const design = designGates.value.has(gate)

    return {
      ...segment,
      gate,
      active,
      personality,
      design,
      fill: active ? (personality && design ? wheelColors.value.gateBoth : design ? wheelColors.value.gateDesign : wheelColors.value.gatePersonality) : 'transparent',
      hoverFill: design ? 'rgba(239,85,87,0.95)' : wheelColors.value.gateHover,
      hoverStroke: palette.value.highlight,
      sectorStroke: wheelColors.value.sectorStroke,
      text: active ? wheelColors.value.activeText : wheelColors.value.inactiveText,
    }
  })
)

const isGateHovered = gate => props.hover?.type === 'gate' && Number(props.hover.value) === Number(gate)
const hasGateHover = computed(() => props.hover?.type === 'gate')

const zodiacSegments = computed(() =>
  zodiacSegmentLayout({ inner: wheelRingRadii.zodiacInner, outer: wheelRingRadii.zodiacOuter, labelRadius: 366 }).map((segment) => {
    const index = segment.index
    return {
      ...segment,
      fill: wheelColors.value.zodiacFills[index % wheelColors.value.zodiacFills.length],
      stroke: wheelColors.value.zodiacStroke,
    }
  })
)
</script>

<template lang="pug">
g.hd-wheel-rings
  circle(cx='520' cy='520' :r='wheelRingRadii.outerBorder' fill='transparent' :stroke='wheelColors.ringStroke')
  IChingRing(
    :gates='mandalaGates'
    :active-gates='chart.gates || []'
    :radius='wheelRingRadii.ichingRadius'
    :color='wheelColors.iching'
    :active-color='wheelColors.ichingActive'
  )
  circle(cx='520' cy='520' :r='wheelRingRadii.gateOuter' fill='transparent' :stroke='wheelColors.ringStroke')
  circle(cx='520' cy='520' :r='wheelRingRadii.gateInner' fill='transparent' :stroke='wheelColors.ringStroke')
  circle(cx='520' cy='520' :r='wheelRingRadii.zodiacInner' fill='transparent' :stroke='wheelColors.ringStroke')
  g(data-testid='hd-wheel-zodiac')
    ZodiacSector(
      v-for='segment in zodiacSegments'
      :key='segment.sign'
      :segment='segment'
    )
    text(
      v-for='segment in zodiacSegments'
      :key='`sign-${segment.sign}`'
      :x='segment.label.x'
      :y='segment.label.y + 7'
      text-anchor='middle'
      :fill='wheelColors.signText'
      font-size='22'
    ) {{ segment.sign }}
  g(data-testid='hd-wheel-rays')
    line(
      v-for='segment in gateSegments'
      :key='`ray-${segment.gate}`'
      :x1='segment.ray.a.x'
      :y1='segment.ray.a.y'
      :x2='segment.ray.b.x'
      :y2='segment.ray.b.y'
      :stroke='isGateHovered(segment.gate) ? palette.highlight : wheelColors.inactiveRay'
      :stroke-width='isGateHovered(segment.gate) ? 1.5 : 0.55'
      :stroke-opacity='isGateHovered(segment.gate) ? 0.42 : hasGateHover ? 0.03 : 0.16'
    )
  g(data-testid='hd-wheel-gates')
    GateSector(
      v-for='segment in gateSegments'
      :key='`gate-path-${segment.gate}`'
      :segment='segment'
      :hovered='isGateHovered(segment.gate)'
      :dimmed='hasGateHover && !isGateHovered(segment.gate)'
      @hover='emit("hover", $event)'
      @leave='emit("leave")'
    )
    line(
      v-for='segment in gateSegments'
      :key='`line-${segment.gate}`'
      :x1='segment.divider.a.x'
      :y1='segment.divider.a.y'
      :x2='segment.divider.b.x'
      :y2='segment.divider.b.y'
      :stroke='isGateHovered(segment.gate) ? palette.highlight : segment.active ? wheelColors.activeLine : wheelColors.inactiveLine'
      :stroke-width='isGateHovered(segment.gate) ? 1.5 : segment.active ? 0.85 : 0.55'
      :stroke-opacity='hasGateHover && !isGateHovered(segment.gate) ? 0.28 : 1'
    )
    text(
      v-for='segment in gateSegments'
      :key='segment.gate'
      :x='segment.label.x'
      :y='segment.label.y + 5'
      text-anchor='middle'
      :fill='isGateHovered(segment.gate) ? palette.highlight : segment.text'
      :font-size='isGateHovered(segment.gate) ? 16 : segment.active ? 12.5 : 11'
      :font-weight='isGateHovered(segment.gate) || segment.active ? 800 : 500'
      :opacity='hasGateHover && !isGateHovered(segment.gate) ? 0.28 : 1'
      :data-gate='segment.gate'
      :data-active='String(segment.active)'
      data-testid='mandala-gate'
      class='wheel-gate-label'
      @pointerenter='emit("hover", { type: "gate", value: segment.gate })'
      @pointerleave='emit("leave")'
    ) {{ segment.gate }}
</template>

<style scoped>
.hd-wheel-rings {
  opacity: 0.58;
  transition: opacity 160ms ease;
}

.hd-wheel-rings:hover {
  opacity: 0.92;
}

.wheel-gate-label {
  cursor: pointer;
  transition: fill 140ms ease, fill-opacity 140ms ease, font-size 140ms ease, opacity 140ms ease, stroke 140ms ease, stroke-width 140ms ease;
}
</style>
