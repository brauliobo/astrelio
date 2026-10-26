<script setup>
import { computed } from 'vue'
import { CHANNEL_BY_KEY } from '../../../../lib/human-design/constants.js'
import { channelStatus, gateTones } from '../chartFacts.js'
import { useHdText } from '../useHdText.js'
import PanelBlock from './PanelBlock.vue'
import PanelHead from './PanelHead.vue'
import RelatedChips from './RelatedChips.vue'

const props = defineProps({
  chart:  { type: Object, required: true },
  value:  { type: String, required: true },
  pinned: { type: Object, default: null },
})

const emit = defineEmits(['select'])

const { t, ui, prose, label, key, channel } = useHdText()

const info    = computed(() => CHANNEL_BY_KEY[props.value])
const status  = computed(() => channelStatus(props.chart, props.value))
const gates   = computed(() => info.value.gates.map(gate => ({ type: 'gate', value: gate, label: String(gate), tones: gateTones(props.chart, gate) })))
const centers = computed(() => info.value.centers.map(center => ({ type: 'center', value: center, label: label('center', center) })))
const missing = computed(() => info.value.gates.filter(gate => !props.chart.gates.includes(gate)))
const circuits = computed(() => [['circuit', info.value.circuit], ['subCircuit', info.value.stream]].map(([group, value]) => ({
  title: label(group, value),
  body:  prose('circuits_info', key(group, value), 'summary'),
})))
const summary = computed(() => ui(`channel_${status.value}`, {
  from: label('center', info.value.centers[0]),
  to:   label('center', info.value.centers[1]),
  gate:  info.value.gates.find(gate => !missing.value.includes(gate)),
  other: missing.value[0],
}))
</script>

<template lang="pug">
.hd-detail(data-testid='hd-detail-channel')
  PanelHead(:kicker='t("human_design.channel")' :title='`${value} · ${channel(value)}`')
    span.hd-chip(:data-tone='status === "defined" ? "personality" : "muted"') {{ ui(`status_${status}`) }}
  p.hd-lead {{ summary }}
  PanelBlock(:title='t("human_design.gates")')
    RelatedChips(:items='gates' :pinned='pinned' @select='emit("select", $event)')
  PanelBlock(:title='t("human_design.centers_title")')
    RelatedChips(:items='centers' :pinned='pinned' @select='emit("select", $event)')
  PanelBlock(v-for='circuit in circuits' :key='circuit.title' :title='circuit.title')
    p.hd-body {{ circuit.body }}
</template>
