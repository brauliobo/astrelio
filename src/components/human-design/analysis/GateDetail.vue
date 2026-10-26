<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHANNEL_CIRCUITS, GATE_CENTER, HARMONIC_GATES, CENTER_THEMES } from '../../../lib/human-design/constants.js'
import { channelKey } from '../../../lib/human-design/activations.js'
import { lineContent } from '../../../lib/human-design/content/index.js'
import {
  humanDesignCenterThemeLabel,
  humanDesignChannelLabel,
  humanDesignContentKey,
  humanDesignGateLabel,
  humanDesignValueLabel,
} from '../../../lib/human-design/labels.js'
import ActivationTag from './ActivationTag.vue'
import CenterGlyph from './CenterGlyph.vue'
import { activationsOf, layerOf } from './model.js'

const props = defineProps({
  chart: { type: Object, required: true },
  gate:  { type: Number, required: true },
})

defineEmits(['pick', 'select'])

const { t, locale } = useI18n()
const center        = computed(() => GATE_CENTER[props.gate])
const centerState   = computed(() => props.chart.centerStates.find(item => item.id === center.value).state)
const activations   = computed(() => activationsOf(props.chart, props.gate))
const layer         = computed(() => (activations.value.length ? layerOf([...new Set(activations.value.map(item => item.layer))].sort()) : 'none'))
const circuits      = computed(() => [...new Set((HARMONIC_GATES[props.gate]).map(partner => CHANNEL_CIRCUITS[channelKey(props.gate, partner)]))])
const partners      = computed(() => HARMONIC_GATES[props.gate].map((partner) => {
  const channel = channelKey(props.gate, partner)
  return { partner, channel, held: props.chart.gates.includes(partner), defined: props.chart.channels.includes(channel) }
}))
const lines         = computed(() => [1, 2, 3, 4, 5, 6].map(line => ({
  line,
  ...lineContent(locale.value, props.gate, line),
  tags: activations.value.filter(item => item.line === line),
})))
const layerText     = computed(() => (layer.value === 'both' ? t('human_design.bodygraph.both') : layer.value === 'none' ? t('human_design.bodygraph.inactive') : humanDesignValueLabel(t, 'layer', layer.value)))
const archetype     = line => t(humanDesignContentKey('line_archetypes', line, 'name'))
const partnerState  = item => (item.defined ? 'channel_defined' : item.held ? 'partner_held' : 'partner_missing')
</script>

<template lang="pug">
article.hda-card.hda-gate-detail(:data-gate='gate' data-testid='analysis-gate-detail')
  header.hda-card-head
    span.hda-gate-num(:data-layer='layer') {{ gate }}
    div
      h3.hda-title {{ humanDesignGateLabel(t, gate) }}
      .hda-row
        span.hda-chip(:data-tone='layer === "none" ? null : "strong"') {{ layerText }}
        span.hda-mark
          CenterGlyph(:center='center' :state='centerState' :size='24')
          | {{ humanDesignValueLabel(t, 'center', center) }}
  p.hda-sub {{ humanDesignCenterThemeLabel(t, CENTER_THEMES[center]) }}
  .hda-row
    span.hda-chip(v-for='circuit in circuits' :key='circuit') {{ humanDesignValueLabel(t, 'circuit', circuit) }}
    button.hda-btn(type='button' @click='$emit("select", { type: "gate", value: gate })') {{ t('human_design.ui.analysis.show_on_chart') }}

  section.hda-section(data-testid='analysis-gate-partners')
    h4.hda-h {{ t('human_design.harmonics') }}
    ul.hda-list
      li.hda-item(v-for='item in partners' :key='item.partner' :data-state='partnerState(item)')
        .hda-split
          button.hda-chip(type='button' @click='$emit("pick", item.partner)') {{ item.partner }} · {{ humanDesignGateLabel(t, item.partner) }}
          span.hda-sub {{ t(`human_design.ui.analysis.${partnerState(item)}`) }}
        p.hda-sub {{ item.channel }} · {{ humanDesignChannelLabel(t, item.channel) }}

  section.hda-section
    h4.hda-h {{ t('human_design.lines') }}
    ol.hda-list(data-testid='analysis-gate-lines')
      li.hda-item(v-for='row in lines' :key='row.line' :data-active='row.tags.length > 0' :data-line='row.line')
        .hda-split
          strong {{ gate }}.{{ row.line }} · {{ archetype(row.line) }}
          .hda-row
            ActivationTag(v-for='tag in row.tags' :key='`${tag.layer}-${tag.planet}`' :layer='tag.layer' :planet='tag.planet')
        p.hda-title {{ row.keynote }}
        p.hda-body {{ row.text }}
</template>

<style scoped>
.hda-gate-num {
  display: grid; place-items: center; flex: none; width: 56px; height: 56px;
  border: 2px solid var(--hd-text-muted); border-radius: 14px;
  background: var(--hd-surface); font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums;
}
.hda-gate-num[data-layer="personality"] { background: var(--hd-personality); border-color: var(--hd-personality); color: var(--hd-pers-on); }
.hda-gate-num[data-layer="design"] { background: var(--hd-design); border-color: var(--hd-design); color: var(--hd-design-on); }
.hda-gate-num[data-layer="both"] { background: linear-gradient(135deg, var(--hd-design) 50%, var(--hd-personality) 50%); border-color: var(--hd-text-muted); color: var(--hd-both-on); text-shadow: 0 0 3px var(--hd-both-halo), 0 0 3px var(--hd-both-halo); }
.hda-gate-num[data-layer="none"] { border-style: dashed; color: var(--hd-text-2); }
</style>
