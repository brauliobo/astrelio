<script setup>
import { computed } from 'vue'
import { gateLines, lineContent } from '../../../../lib/human-design/content/index.js'
import { CHANNELS_BY_GATE, GATE_CENTER } from '../../../../lib/human-design/layout.js'
import { activationsAt, channelStatus, gateTones } from '../chartFacts.js'
import { useHdText } from '../useHdText.js'
import PanelBlock from './PanelBlock.vue'
import PanelHead from './PanelHead.vue'
import RelatedChips from './RelatedChips.vue'

const props = defineProps({
  chart:  { type: Object, required: true },
  value:  { type: Number, required: true },
  pinned: { type: Object, default: null },
})

const emit = defineEmits(['select'])

const { t, ui, locale, label, gate: gateName, channel, planet } = useHdText()

const tones       = computed(() => gateTones(props.chart, props.value))
const center      = computed(() => GATE_CENTER[props.value])
const activations = computed(() => activationsAt(props.chart, props.value).map(activation => ({
  ...activation,
  ...lineContent(locale.value, props.value, activation.line),
  title: ui('activation_title', { layer: t(`human_design.${activation.side}`), planet: planet(activation.planet), line: activation.line }),
})))
const lines       = computed(() => gateLines(locale.value, props.value).map(line => ({
  ...line,
  active: activations.value.some(activation => activation.line === line.line),
})))
const channels    = computed(() => CHANNELS_BY_GATE[props.value].map(id => ({
  type:  'channel',
  value: id,
  label: `${id} ${channel(id)}`,
  tones: channelStatus(props.chart, id) === 'defined' ? ['personality'] : [],
})))
const stateLabel   = computed(() => tones.value.length === 2 ? t('human_design.bodygraph.both') : tones.value[0] ? t(`human_design.${tones.value[0]}`) : t('human_design.bodygraph.inactive'))
const stateTone    = computed(() => tones.value.length === 1 ? tones.value[0] : 'muted')
</script>

<template lang="pug">
.hd-detail(data-testid='hd-detail-gate')
  PanelHead(:kicker='t("human_design.gate")' :title='`${value} · ${gateName(value)}`')
    span.hd-chip(:data-tone='stateTone') {{ stateLabel }}
    button.hd-chip(type='button' @click='emit("select", { type: "center", value: center })') {{ label('center', center) }}
  PanelBlock(v-if='activations.length' :title='t("human_design.activations")')
    article.hd-act-card(v-for='item in activations' :key='`${item.side}-${item.planet}`' :data-side='item.side')
      .hd-act-card-head
        span.hd-dot(:data-tone='item.side')
        strong {{ item.title }}
        span.hd-act-card-code.hd-num {{ item.color }}.{{ item.tone }}.{{ item.base }}
      p.hd-lead {{ item.keynote }}
      p.hd-body {{ item.text }}
  PanelBlock(:title='t("human_design.channels")')
    RelatedChips(:items='channels' :pinned='pinned' @select='emit("select", $event)')
  details.hd-lines(:open='!activations.length')
    summary {{ ui('all_lines') }}
    ol
      li(v-for='line in lines' :key='line.line' :data-active='String(line.active)')
        strong.hd-num {{ line.line }} · {{ line.keynote }}
        p.hd-body {{ line.text }}
</template>

<style scoped>
.hd-act-card {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--hd-line);
  border-left: 3px solid var(--hd-text);
  border-radius: 12px;
  background: var(--hd-soft);
}
.hd-act-card[data-side='design'] { border-left-color: var(--hd-design); }
.hd-act-card-head { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.hd-act-card-code { margin-left: auto; color: var(--hd-text-2); font-size: 12px; }

.hd-lines summary { color: var(--hd-text-2); font-size: 13px; font-weight: 600; cursor: pointer; }
.hd-lines ol { display: grid; gap: 10px; margin: 10px 0 0; padding: 0; list-style: none; }
.hd-lines li { padding-left: 12px; border-left: 2px solid var(--hd-line); }
.hd-lines li[data-active='true'] { border-left-color: var(--hd-focus); }
.hd-lines li p { margin-top: 2px; }
</style>
