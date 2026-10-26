<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LOVE_GATES, MATERIAL_CHANNELS, PENTA_GATES } from '../../../lib/human-design/constants.js'
import { humanDesignChannelLabel, humanDesignGateLabel, humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import ActivationTag from './ActivationTag.vue'
import ChannelCard from './ChannelCard.vue'
import CenterGlyph from './CenterGlyph.vue'
import CircuitBalance from './CircuitBalance.vue'
import DefinitionSummary from './DefinitionSummary.vue'
import { activationsOf, hangingGates } from './model.js'

const props = defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
})

defineEmits(['select'])

const { t }       = useI18n()
const root        = ref(null)
const channels    = computed(() => props.chart.details.channels)
const hanging     = computed(() => hangingGates(props.chart))
const pinnedKey   = computed(() => (props.pinned?.type === 'channel' ? props.pinned.value : null))
const stateOf     = center => props.chart.centerStates.find(item => item.id === center).state
const held        = list => list.filter(item => props.chart.gates.includes(item))
const themes      = computed(() => [
  { id: 'love',     items: held(LOVE_GATES).map(gate => ({ key: gate, label: `${gate} · ${humanDesignGateLabel(t, gate)}`, type: 'gate' })) },
  { id: 'material', items: MATERIAL_CHANNELS.filter(key => props.chart.channels.includes(key)).map(key => ({ key, label: `${key} · ${humanDesignChannelLabel(t, key)}`, type: 'channel' })) },
  { id: 'penta',    items: held(PENTA_GATES).map(gate => ({ key: gate, label: `${gate} · ${humanDesignGateLabel(t, gate)}`, type: 'gate' })) },
].filter(theme => theme.items.length))

const reveal = async (key) => {
  if (!key) return
  await nextTick()
  root.value?.querySelector(`[data-channel="${key}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

watch(pinnedKey, reveal, { immediate: true })
</script>

<template lang="pug">
.hda-panel(ref='root' data-testid='analysis-channels')
  p.hda-intro {{ t('human_design.ui.analysis.channels_intro') }}

  section.hda-section
    h3.hda-title {{ t('human_design.ui.analysis.defined_channels', { n: channels.length }) }}
    .hda-grid(v-if='channels.length')
      ChannelCard(v-for='channel in channels' :key='channel.channel' :chart='chart' :channel='channel' :pinned='pinnedKey === channel.channel' @select='$emit("select", $event)')
    p.hda-empty(v-else) {{ t('human_design.no_defined_channels') }}

  .hda-grid
    CircuitBalance(:channels='chart.channels')
    DefinitionSummary(:chart='chart' @select='$emit("select", $event)')

  section.hda-section(data-testid='analysis-hanging')
    h3.hda-title {{ t('human_design.hanging_gates') }}
    p.hda-sub {{ t('human_design.ui.analysis.hanging_note') }}
    ul.hda-list.hda-grid(v-if='hanging.length')
      li.hda-item(v-for='row in hanging' :key='row.gate' data-testid='analysis-hanging-gate')
        .hda-split
          button.hda-chip(type='button' data-tone='warn' @click='$emit("select", { type: "gate", value: row.gate })') {{ row.gate }} · {{ humanDesignGateLabel(t, row.gate) }}
          span.hda-mark
            CenterGlyph(:center='row.center' :state='stateOf(row.center)' :size='22')
            | {{ humanDesignValueLabel(t, 'center', row.center) }}
        .hda-row
          ActivationTag(v-for='tag in activationsOf(chart, row.gate)' :key='`${tag.layer}-${tag.planet}`' :layer='tag.layer' :planet='tag.planet' :code='tag.code')
        p.hda-sub(v-for='item in row.harmonicSuggestions' :key='item.gate') {{ t('human_design.ui.analysis.hanging_needs', { gate: item.gate, name: humanDesignGateLabel(t, item.gate), channel: item.channel }) }}
    p.hda-empty(v-else) {{ t('human_design.no_hanging_gates') }}

  section.hda-section(v-if='themes.length' data-testid='analysis-themes')
    h3.hda-title {{ t('human_design.ui.analysis.themes_title') }}
    .hda-grid
      article.hda-card(v-for='theme in themes' :key='theme.id' :data-theme='theme.id')
        h4.hda-h {{ t(`human_design.ui.analysis.theme_${theme.id}`) }}
        p.hda-sub {{ t(`human_design.ui.analysis.theme_${theme.id}_note`) }}
        .hda-row
          button.hda-chip(v-for='item in theme.items' :key='item.key' type='button' @click='$emit("select", { type: item.type, value: item.key })') {{ item.label }}
</template>
