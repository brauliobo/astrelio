<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { activationCode } from '../../../lib/human-design/activations.js'
import { lineContent } from '../../../lib/human-design/content/index.js'
import { humanDesignContentKey, humanDesignCrossTitleLabel, humanDesignGateLabel, humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import ActivationTag from './ActivationTag.vue'

const props = defineProps({ chart: { type: Object, required: true } })

defineEmits(['select'])

const { t, locale } = useI18n()
const cross         = computed(() => props.chart.incarnationCross)
const quarter       = computed(() => cross.value.quarter)
const rows          = computed(() => cross.value.gateDetails.map(({ key, activation }) => ({
  key,
  gate:    activation.gate,
  planet:  activation.planet,
  layer:   key.startsWith('design') ? 'design' : 'personality',
  code:    activationCode(activation),
  content: lineContent(locale.value, activation.gate, activation.line),
})))
const text          = (...parts) => t(humanDesignContentKey(...parts))
const quarterText   = computed(() => text('quarters', quarter.value.name.toLowerCase(), 'summary'))
const geometryKey   = computed(() => cross.value.geometry.toLowerCase().replace(' ', '_'))
</script>

<template lang="pug">
section.hda-card(v-if='cross' data-testid='analysis-cross')
  header
    h3.hda-title {{ humanDesignCrossTitleLabel(t, cross) }}
    .hda-row
      span.hda-chip(data-tone='strong') {{ humanDesignValueLabel(t, 'crossGeometry', cross.geometry) }}
      span.hda-chip(v-if='quarter') {{ t('human_design.cross_quarter') }}: {{ t(`human_design.quarters.${quarter.name}`) }} · {{ t(`human_design.quarter_themes.${quarter.theme}`) }}
  p.hda-body {{ text('crosses', geometryKey, 'summary') }}
  p.hda-body(v-if='quarter') {{ quarterText }}

  ul.hda-list.hda-grid
    li.hda-item(v-for='row in rows' :key='row.key' :data-role='row.key')
      .hda-split
        h4.hda-h {{ t(`human_design.${row.layer}_${row.planet.toLowerCase()}`) }}
        ActivationTag(:layer='row.layer' :planet='row.planet')
      button.hda-chip(type='button' @click='$emit("select", { type: "gate", value: row.gate })') {{ row.code.split('.').slice(0, 2).join('.') }} · {{ humanDesignGateLabel(t, row.gate) }}
      p.hda-title {{ row.content.keynote }}
      p.hda-body {{ row.content.text }}
</template>
