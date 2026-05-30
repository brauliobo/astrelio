<script setup>
import { computed } from 'vue'
import { CHANNEL_CENTERS } from '../../lib/human-design/constants.js'
import BodygraphChannelLayer from './BodygraphChannelLayer.vue'
import { channelCurve, channelSegments, gateSegmentBounds, gateSegmentCurve } from './bodygraphChannelGeometry.js'
import { activationTone, humanDesignPalette } from './humanDesignVisualTheme.js'

const props = defineProps({
  chart: { type: Object, required: true },
  showOpen: { type: Boolean, default: true },
  showBase: { type: Boolean, default: true },
  showSegments: { type: Boolean, default: true },
  showDefinedBase: { type: Boolean, default: false },
  openOpacity: { type: Number, default: 0.12 },
  openStrokeWidth: { type: Number, default: 5 },
  definedStrokeWidth: { type: Number, default: 10 },
  hover: { type: Object, default: null },
  visualTheme: { type: String, default: 'dark' },
})

const emit = defineEmits(['hover', 'leave'])

const definedChannels = computed(() => new Set(props.chart.channels || []))
const designGates = computed(() => new Set(props.chart.designGates || []))
const personalityGates = computed(() => new Set(props.chart.personalityGates || []))
const activeGates = computed(() => new Set([
  ...(props.chart.gates || []),
  ...designGates.value,
  ...personalityGates.value,
]))
const hasHover = computed(() => Boolean(props.hover))
const channelKeys = computed(() => Object.keys(CHANNEL_CENTERS))
const palette = computed(() => humanDesignPalette(props.visualTheme))

const gateTone = (gate) => {
  const design = designGates.value.has(gate)
  const personality = personalityGates.value.has(gate)
  return activationTone({ design, personality, mode: props.visualTheme })
}

const splitAxisForBounds = bounds => bounds?.height > bounds?.width ? 'x' : 'y'

const fullChannelFill = (gates, defined) => {
  if (!defined) return palette.value.inactiveChannel
  const hasDesign = gates.some(gate => designGates.value.has(gate))
  const hasPersonality = gates.some(gate => personalityGates.value.has(gate))
  return activationTone({ design: hasDesign, personality: hasPersonality, mode: props.visualTheme }).fill
}

const channelLines = computed(() =>
  channelKeys.value.map((channel) => {
    const gates = channel.split('-').map(Number)
    const defined = definedChannels.value.has(channel)
    const hasDesign = gates.some(gate => designGates.value.has(gate))
    const hasPersonality = gates.some(gate => personalityGates.value.has(gate))
    const tone = activationTone({ design: hasDesign, personality: hasPersonality, mode: props.visualTheme })
    const fill = defined ? tone.fill : fullChannelFill(gates, defined)

    return {
      channel,
      d: channelCurve[channel],
      defined,
      fill,
      highlightFill: defined ? fill : palette.value.highlight,
      tone: defined ? tone.kind : 'open',
      opacity: defined ? 0.96 : props.openOpacity,
    }
  }).filter(item => item.d)
)

const displayChannelForGate = (gate) =>
  (props.chart.channels || []).find(channel => channel.split('-').map(Number).includes(gate)) ||
  channelKeys.value.find(channel => channel.split('-').map(Number).includes(gate)) ||
  `gate-${gate}`

const activeGateSegments = computed(() =>
  [...activeGates.value]
    .map(Number)
    .sort((a, b) => a - b)
    .map((gate) => {
      const tone = gateTone(gate)
      return {
        channel: displayChannelForGate(gate),
        gate,
        d: gateSegmentCurve[gate],
        defined: true,
        fill: tone.fill,
        highlightFill: tone.fill,
        tone: tone.kind,
        parts: tone.parts,
        splitBounds: gateSegmentBounds[gate],
        splitAxis: splitAxisForBounds(gateSegmentBounds[gate]),
        opacity: 0.96,
      }
    })
    .filter(segment => segment.d)
)

const baseChannelLines = computed(() =>
  channelLines.value.filter((line) => {
    if (!line.defined) return props.showOpen
    return props.showDefinedBase && !channelSegments[line.channel]?.length
  })
)
</script>

<template lang="pug">
g
  BodygraphChannelLayer(
    v-if='showBase'
    :lines='baseChannelLines'
    :hover='hover'
    :has-hover='hasHover'
    :stroke-width='openStrokeWidth'
    testid='bodygraph-channels'
    key-prefix='base'
    @hover='emit("hover", $event)'
    @leave='emit("leave")'
  )
  BodygraphChannelLayer(
    v-if='showSegments'
    :lines='activeGateSegments'
    :hover='hover'
    :has-hover='hasHover'
    :stroke-width='definedStrokeWidth'
    testid='bodygraph-channel-highlights'
    key-prefix='defined'
    @hover='emit("hover", $event)'
    @leave='emit("leave")'
  )
</template>
