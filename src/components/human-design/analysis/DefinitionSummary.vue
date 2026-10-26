<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignChannelLabel, humanDesignContentKey, humanDesignGateLabel, humanDesignValueKey, humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import CenterGlyph from './CenterGlyph.vue'
import { activationsOf, areaNumbers, bridgeRows } from './model.js'

const props = defineProps({ chart: { type: Object, required: true } })

defineEmits(['select'])

const { t }      = useI18n()
const text       = (...parts) => t(humanDesignContentKey(...parts))
const definition = computed(() => humanDesignValueKey('definition', props.chart.definition))
const bridges    = computed(() => bridgeRows(props.chart))
const hasBridges = computed(() => bridges.value.gates.length || bridges.value.channels.length)
const areaLabel  = areas => areaNumbers(areas).join(' + ')
const holders    = gate => [...new Set(activationsOf(props.chart, gate).map(item => item.layer))].map(layer => humanDesignValueLabel(t, 'layer', layer)).join(' / ')
</script>

<template lang="pug">
section.hda-card(data-testid='analysis-definition')
  div
    h3.hda-title {{ humanDesignValueLabel(t, 'definition', chart.definition) }}
    p.hda-body {{ text('definitions', definition, 'summary') }}

  ol.hda-areas(v-if='chart.definitionAreas.length')
    li.hda-item(v-for='(area, index) in chart.definitionAreas' :key='index' data-testid='analysis-area')
      h4.hda-h {{ t('human_design.ui.analysis.area', { n: index + 1 }) }}
      .hda-row
        span.hda-mark(v-for='center in area' :key='center')
          CenterGlyph(:center='center' state='defined' :size='24')
          | {{ humanDesignValueLabel(t, 'center', center) }}

  p.hda-body(v-if='chart.splitSize' data-testid='analysis-split-size')
    strong {{ t(`human_design.ui.analysis.split_${chart.splitSize}`) }}.
    |  {{ text('split_size', chart.splitSize) }}

  template(v-if='hasBridges')
    p.hda-body {{ text('bridge', 'summary') }}
    .hda-section(v-if='bridges.gates.length')
      h4.hda-h {{ t('human_design.ui.analysis.gate_bridges') }}
      ul.hda-list
        li.hda-item(v-for='row in bridges.gates' :key='row.gate' data-testid='analysis-gate-bridge')
          strong {{ row.gate }} · {{ humanDesignGateLabel(t, row.gate) }}
          p.hda-sub(v-for='item in row.channels' :key='item.channel')
            | {{ item.channel }} · {{ humanDesignChannelLabel(t, item.channel) }}:
            |  {{ t('human_design.ui.analysis.bridge_holds', { held: item.held, who: holders(item.held), areas: areaLabel(item.areas) }) }}
    .hda-section(v-if='bridges.channels.length')
      h4.hda-h {{ t('human_design.ui.analysis.channel_bridges') }}
      ul.hda-list
        li.hda-item(v-for='row in bridges.channels' :key='row.channel' data-testid='analysis-channel-bridge')
          strong {{ row.channel }} · {{ humanDesignChannelLabel(t, row.channel) }}
          p.hda-sub {{ t('human_design.ui.analysis.bridge_needs', { gates: row.gates.join(' + '), areas: areaLabel(row.areas) }) }}
</template>

<style scoped>
.hda-areas { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); }
</style>
