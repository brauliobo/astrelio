<script setup>
import { computed, ref } from 'vue'
import BodygraphCenters from './BodygraphCenters.vue'
import BodygraphChannels from './BodygraphChannels.vue'
import BodygraphFigure from './BodygraphFigure.vue'
import { humanDesignPalette } from './visualTheme.js'

const props = defineProps({
  chart:                  { type: Object, required: true },
  figureFill:             { type: String, default: '#3b3b3e' },
  figureOpacity:          { type: Number, default: 0.66 },
  showOpenChannels:       { type: Boolean, default: true },
  openChannelOpacity:     { type: Number, default: 0.12 },
  openChannelWidth:       { type: Number, default: 5 },
  definedChannelWidth:    { type: Number, default: 10 },
  gateInactiveFill:       { type: String, default: 'rgba(255,255,255,0.58)' },
  visualTheme:            { type: String, default: 'dark' },
  hoverState:             { type: Object, default: null },
  noDefinedChannelsLabel: { type: String, default: '' },
})

const emit = defineEmits(['hover-change'])

const hasChannels   = computed(() => (props.chart.channels || []).length > 0)
const internalHover = ref(null)
const hover         = computed(() => props.hoverState || internalHover.value)
const palette       = computed(() => humanDesignPalette(props.visualTheme))

const setHover = (value) => {
  internalHover.value = value
  emit('hover-change', value)
}
const setChannelHover = value => setHover({ type: 'channel', value })
const clearHover      = () => setHover(null)
</script>

<template lang="pug">
g
  BodygraphFigure(:fill='figureFill' :opacity='figureOpacity')
  BodygraphChannels(
    :chart='chart'
    :show-open='showOpenChannels'
    :show-base='true'
    :show-segments='false'
    :open-opacity='openChannelOpacity'
    :open-stroke-width='openChannelWidth'
    :defined-stroke-width='definedChannelWidth'
    :hover='hover'
    :visual-theme='visualTheme'
    @hover='setChannelHover'
    @leave='clearHover'
  )
  BodygraphCenters(
    :chart='chart'
    :hover='hover'
    :inactive-fill='gateInactiveFill'
    :show-gates='false'
    :visual-theme='visualTheme'
    @hover='setHover'
    @leave='clearHover'
  )
  BodygraphChannels(
    :chart='chart'
    :show-open='false'
    :show-base='false'
    :show-segments='true'
    :open-opacity='openChannelOpacity'
    :open-stroke-width='openChannelWidth'
    :defined-stroke-width='definedChannelWidth'
    :hover='hover'
    :visual-theme='visualTheme'
    @hover='setChannelHover'
    @leave='clearHover'
  )
  BodygraphCenters(
    :chart='chart'
    :hover='hover'
    :inactive-fill='gateInactiveFill'
    :show-shapes='false'
    :visual-theme='visualTheme'
    @hover='setHover'
    @leave='clearHover'
  )
  text(
    v-if='!hasChannels'
    x='260'
    y='822'
    text-anchor='middle'
    :fill='palette.emptyText'
    font-size='13'
  ) {{ noDefinedChannelsLabel }}
</template>
