<script setup>
import { computed } from 'vue'
import { MANDALA_GATE_ORDER } from '../../lib/human-design/constants.js'
import HumanDesignGateSector from './HumanDesignGateSector.vue'
import HumanDesignIChingRing from './HumanDesignIChingRing.vue'
import HumanDesignZodiacSector from './HumanDesignZodiacSector.vue'
import { gateSegmentLayout, wheelRingRadii, zodiacSegmentLayout } from './humanDesignWheelGeometry.js'

const props = defineProps({
  chart: { type: Object, required: true },
  hover: { type: Object, default: null },
})

const emit = defineEmits(['hover', 'leave'])

const activeGates = computed(() => new Set(props.chart.gates || []))
const personalityGates = computed(() => new Set(props.chart.personalityGates || []))
const designGates = computed(() => new Set(props.chart.designGates || []))
const mandalaGates = MANDALA_GATE_ORDER

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
      fill: active ? (personality && design ? 'rgba(95,78,70,0.42)' : design ? 'rgba(216,79,81,0.48)' : 'rgba(111,160,143,0.42)') : 'transparent',
      hoverFill: design ? 'rgba(239,85,87,0.95)' : 'rgba(248,250,252,0.88)',
      text: active ? 'rgba(248,250,252,0.76)' : 'rgba(226,232,240,0.28)',
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
      fill: index % 4 === 0 ? 'rgba(250,204,21,0.065)' : index % 4 === 1 ? 'rgba(45,212,191,0.055)' : index % 4 === 2 ? 'rgba(125,211,252,0.055)' : 'rgba(248,113,113,0.055)',
    }
  })
)
</script>

<template lang="pug">
g.hd-wheel-rings
  circle(cx='520' cy='520' :r='wheelRingRadii.outerBorder' fill='transparent' stroke='rgba(148,163,184,0.12)')
  HumanDesignIChingRing(:gates='mandalaGates' :active-gates='chart.gates || []' :radius='wheelRingRadii.ichingRadius')
  circle(cx='520' cy='520' :r='wheelRingRadii.gateOuter' fill='transparent' stroke='rgba(148,163,184,0.11)')
  circle(cx='520' cy='520' :r='wheelRingRadii.gateInner' fill='transparent' stroke='rgba(148,163,184,0.11)')
  circle(cx='520' cy='520' :r='wheelRingRadii.zodiacInner' fill='transparent' stroke='rgba(148,163,184,0.12)')
  g(data-testid='hd-wheel-zodiac')
    HumanDesignZodiacSector(
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
      fill='rgba(226,232,240,0.46)'
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
      :stroke='isGateHovered(segment.gate) ? "#f8fafc" : segment.active ? (segment.design ? "#ef5557" : "#f8fafc") : "rgba(148,163,184,0.12)"'
      :stroke-width='isGateHovered(segment.gate) ? 3 : segment.active ? 1.6 : 0.65'
      :stroke-opacity='isGateHovered(segment.gate) ? 0.48 : segment.active ? 0.11 : hasGateHover ? 0.04 : 0.11'
    )
  g(data-testid='hd-wheel-gates')
    HumanDesignGateSector(
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
      :x1='segment.line.a.x'
      :y1='segment.line.a.y'
      :x2='segment.line.b.x'
      :y2='segment.line.b.y'
      :stroke='isGateHovered(segment.gate) ? "#f8fafc" : segment.active ? "rgba(245,158,11,0.54)" : "rgba(148,163,184,0.09)"'
      :stroke-width='isGateHovered(segment.gate) ? 1.8 : segment.active ? 0.95 : 0.5'
      :stroke-opacity='hasGateHover && !isGateHovered(segment.gate) ? 0.28 : 1'
    )
    text(
      v-for='segment in gateSegments'
      :key='segment.gate'
      :x='segment.label.x'
      :y='segment.label.y + 5'
      text-anchor='middle'
      :fill='isGateHovered(segment.gate) ? "#ffffff" : segment.text'
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
