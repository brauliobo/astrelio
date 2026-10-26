<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { broadcastChartHighlight, humanDesignHighlight } from '../../../lib/chart/highlight.js'
import { humanDesignChannelLabel, humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import { BODYGRAPH_VIEWBOX, CENTER_ORDER, CHANNEL_LAYOUT, GATE_LAYOUT } from '../../../lib/human-design/layout.js'
import BodygraphCenter from './BodygraphCenter.vue'
import BodygraphChannel from './BodygraphChannel.vue'
import BodygraphDefs from './BodygraphDefs.vue'
import BodygraphGate from './BodygraphGate.vue'
import BodygraphSilhouette from './BodygraphSilhouette.vue'
import { bodygraphState } from './bodygraphState.js'
import { zoomViewBox } from './bodygraphZoom.js'
import { useViewBoxTween } from './useViewBoxTween.js'
import { mergeRelated, relatedToHighlight, sameSelection, useBodygraphSelection } from './bodygraphSelection.js'

const props = defineProps({
  chart:          { type: Object, required: true },
  size:           { type: String, default: 'full' },
  layers:         { type: String, default: 'both' },
  showSilhouette: { type: Boolean, default: true },
  showLabels:     { type: Boolean, default: false },
  highlight:      { type: Object, default: null },
  pinned:         { type: Object, default: undefined },
  zoom:           { type: Object, default: null },
  animate:        { type: Boolean, default: true },
})

const emit = defineEmits(['hover', 'select', 'clear'])

const { t }       = useI18n()
const uid         = useId().replace(/\W/g, '')
const ids         = { stripe: `hd-stripe-${uid}`, sheen: `hd-sheen-${uid}`, glow: `hd-glow-${uid}`, hint: `hd-hint-${uid}` }
const root        = ref(null)
const width       = ref(1)
const selection   = useBodygraphSelection(() => props.pinned)
let observer      = null

provide('bodygraphIds', ids)

const base     = computed(() => BODYGRAPH_VIEWBOX[props.size])
const target   = computed(() => props.zoom ? zoomViewBox(base.value, props.zoom) : base.value)
const viewBox  = useViewBoxTween(target)
const aspect   = computed(() => `${viewBox.value[2]} / ${viewBox.value[3]}`)
const scale    = computed(() => viewBox.value[2] / Math.max(width.value, 1))
const state    = computed(() => bodygraphState(props.chart, props.layers))
const channels = computed(() => Object.values(CHANNEL_LAYOUT).map(layout => ({ ...layout, ...state.value.channels[layout.id] })))
const gates    = Object.values(GATE_LAYOUT)

const statusOrder     = { hanging: 0, defined: 1 }
const drawnChannels   = computed(() => channels.value.filter(({ status }) => status !== 'open').sort((a, b) => statusOrder[a.status] - statusOrder[b.status]))
const definedChannels = computed(() => channels.value.filter(({ status }) => status === 'defined'))
const hitChannels     = computed(() => [...channels.value].sort((a, b) => b.length - a.length))

const lit = computed(() => {
  const sets = [selection.lit.value, props.highlight && relatedToHighlight(props.highlight)].filter(Boolean)
  return sets.length ? sets.reduce(mergeRelated) : null
})

const emphasisOf = (group, id) => lit.value ? (lit.value[group].has(id) ? 'lit' : 'dim') : 'idle'
const isDefined  = center => state.value.centers.has(center)
const isActive   = (type, value) => sameSelection(selection.active.value, { type, value })
const isPinned   = (type, value) => sameSelection(selection.pinned.value, { type, value })
const isTabbable = (type, value) => sameSelection(selection.focus.value, { type, value })

const gateStateLabel = gateState => ({
  design:      t('human_design.design'),
  personality: t('human_design.personality'),
  both:        t('human_design.bodygraph.both'),
}[gateState] || t('human_design.bodygraph.inactive'))

const centerName   = center => humanDesignValueLabel(t, 'center', center)
const channelName  = (id) => {
  const name = humanDesignChannelLabel(t, id)
  return name === id ? id : `${id} ${name}`
}
const statusLabel  = status => ({ defined: t('human_design.defined_channel'), hanging: t('human_design.hanging_gate') }[status] || t('human_design.open_state'))

const labels = {
  center:  center => t('human_design.bodygraph.center_state_aria', {
    center: centerName(center),
    state:  isDefined(center) ? t('human_design.defined') : t('human_design.open_state'),
  }),
  gate:    gate => t('human_design.bodygraph.gate_aria', {
    gate,
    center: centerName(GATE_LAYOUT[gate].center),
    state:  gateStateLabel(state.value.gates[gate]),
  }),
  channel: id => t('human_design.bodygraph.channel_aria', {
    channel: channelName(id),
    from:    centerName(CHANNEL_LAYOUT[id].centers[0]),
    to:      centerName(CHANNEL_LAYOUT[id].centers[1]),
    state:   statusLabel(state.value.channels[id].status),
  }),
}

const announce = (item) => {
  emit('select', item)
  broadcastChartHighlight({ chart: props.chart, pinned: true, highlight: humanDesignHighlight(item.type, item.value) })
}

const release = () => {
  if (!selection.pinned.value) return
  selection.clear()
  emit('clear')
  broadcastChartHighlight({ chart: props.chart, pinned: false, highlight: null })
}

const pinItem = (item) => {
  selection.pin(item)
  announce(item)
}

const handlersFor = (type, value) => {
  const item = { type, value }
  return {
    hover:  () => { selection.hover(item); emit('hover', item) },
    leave:  () => { selection.leave(); emit('hover', null) },
    select: () => isPinned(type, value) ? release() : pinItem(item),
    focus:  () => selection.enter(item),
    blur:   selection.blur,
  }
}

const interactiveProps = (type, value) => ({
  pinned:   isPinned(type, value),
  tabbable: isTabbable(type, value),
  label:    labels[type](value),
})

const channelProps = channel => ({ channel, emphasis: emphasisOf('channels', channel.id), animate: props.animate })

const focusCurrent = async () => {
  await nextTick()
  const { type, value } = selection.focus.value
  root.value.querySelector(`[data-focus-id="${type}:${value}"]`)?.focus()
}

const onKeydown = (event) => {
  const transition = selection.press(event.key)
  if (!transition) return
  event.preventDefault()
  if (transition.clear) release()
  if (transition.pin) pinItem({ type: transition.pin.type, value: transition.pin.value })
  focusCurrent()
}

onMounted(() => {
  observer = new ResizeObserver(([entry]) => { width.value = entry.contentRect.width })
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template lang="pug">
svg.hd-bodygraph(
  ref='root'
  :viewBox='viewBox.join(" ")'
  role='group'
  :aria-label='t("human_design.bodygraph_aria")'
  :aria-describedby='ids.hint'
  data-testid='bodygraph-svg'
  :data-size='size'
  :data-layers='layers'
  :data-zoomed='String(Boolean(zoom))'
  :style='{ aspectRatio: aspect, "--hd-k": scale }'
  @click='release'
  @keydown='onKeydown'
)
  desc(:id='ids.hint') {{ t("human_design.bodygraph.hint") }}
  BodygraphDefs(:ids='ids')
  g(data-testid='bodygraph-chart' :data-compact='String(size === "compact")')
    BodygraphSilhouette(v-if='showSilhouette')
    g(data-layer='tracks')
      BodygraphChannel(v-for='channel in channels' :key='channel.id' layer='track' v-bind='channelProps(channel)')
    g(data-layer='halos')
      BodygraphChannel(v-for='channel in drawnChannels' :key='channel.id' layer='halo' v-bind='channelProps(channel)')
    g(data-layer='colors')
      BodygraphChannel(v-for='channel in drawnChannels' :key='channel.id' layer='color' v-bind='channelProps(channel)')
    g(data-layer='flow')
      BodygraphChannel(v-for='(channel, index) in definedChannels' :key='channel.id' layer='flow' :index='index' v-bind='channelProps(channel)')
    g(data-testid='bodygraph-centers')
      BodygraphCenter(
        v-for='center in CENTER_ORDER'
        :key='center'
        layer='base'
        :center='center'
        :defined='isDefined(center)'
        :emphasis='emphasisOf("centers", center)'
        :active='isActive("center", center)'
        :caption='showLabels || isActive("center", center) ? centerName(center) : ""'
      )
    g(data-layer='gates')
      BodygraphGate(
        v-for='item in gates'
        :key='item.gate'
        layer='base'
        :item='item'
        :state='state.gates[item.gate]'
        :defined='isDefined(item.center)'
        :emphasis='emphasisOf("gates", item.gate)'
        :active='isActive("gate", item.gate)'
      )
    g(data-layer='hit')
      BodygraphChannel(
        v-for='channel in hitChannels'
        :key='channel.id'
        layer='hit'
        :channel='channel'
        v-bind='interactiveProps("channel", channel.id)'
        v-on='handlersFor("channel", channel.id)'
      )
      BodygraphCenter(
        v-for='center in CENTER_ORDER'
        :key='center'
        layer='hit'
        :center='center'
        :defined='isDefined(center)'
        v-bind='interactiveProps("center", center)'
        v-on='handlersFor("center", center)'
      )
      BodygraphGate(
        v-for='item in gates'
        :key='item.gate'
        layer='hit'
        :item='item'
        v-bind='interactiveProps("gate", item.gate)'
        v-on='handlersFor("gate", item.gate)'
      )
</template>

<style scoped>
.hd-bodygraph {
  display: block;
  width: 100%;
  height: auto;
  max-height: min(88vh, 940px);
  font-family: inherit;
}
</style>
