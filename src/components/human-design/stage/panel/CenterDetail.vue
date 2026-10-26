<script setup>
import { computed } from 'vue'
import { CENTER_GATES } from '../../../../lib/human-design/layout.js'
import { centerStateOf, gateTones } from '../chartFacts.js'
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

const center    = computed(() => key('center', props.value))
const state     = computed(() => centerStateOf(props.chart, props.value))
const meaning   = computed(() => prose('centers', center.value, state.value.state === 'defined' ? 'defined' : 'undefined'))
const gateItem  = gate => ({ type: 'gate', value: gate, label: String(gate), tones: gateTones(props.chart, gate) })
const gates     = computed(() => CENTER_GATES[props.value].map(gateItem))
const hanging   = computed(() => state.value.hangingGates.map(gateItem))
const channels  = computed(() => state.value.channels.map(id => ({ type: 'channel', value: id, label: `${id} ${channel(id)}` })))
</script>

<template lang="pug">
.hd-detail(data-testid='hd-detail-center')
  PanelHead(:kicker='t("human_design.center")' :title='label("center", value)')
    span.hd-chip(:data-tone='state.state === "defined" ? "personality" : "muted"') {{ prose('center_states', state.state, 'label') }}
  p.hd-lead {{ prose('centers', center, 'role') }}
  p.hd-body {{ prose('center_states', state.state, 'summary') }}
  PanelBlock(:title='state.state === "defined" ? ui("when_defined") : ui("when_open")')
    p.hd-body {{ meaning }}
  PanelBlock(:title='ui("not_self_question")')
    p.hd-lead.hd-question {{ prose('centers', center, 'not_self_question') }}
  PanelBlock(:title='ui("healthy")')
    p.hd-body {{ prose('centers', center, 'healthy') }}
  PanelBlock(:title='t("human_design.gates")')
    RelatedChips(:items='gates' :pinned='pinned' @select='emit("select", $event)')
  PanelBlock(v-if='hanging.length' :title='t("human_design.hanging_gates")')
    RelatedChips(:items='hanging' :pinned='pinned' @select='emit("select", $event)')
    p.hd-body {{ ui('hanging_note') }}
  PanelBlock(v-if='channels.length' :title='t("human_design.channels")')
    RelatedChips(:items='channels' :pinned='pinned' @select='emit("select", $event)')
  PanelBlock(:title='ui("biology")')
    p.hd-body {{ prose('centers', center, 'biology') }}
</template>
