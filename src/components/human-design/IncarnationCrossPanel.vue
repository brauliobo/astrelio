<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { activationCode } from '../../lib/human-design/activations.js'
import {
  humanDesignCrossTitleLabel,
  humanDesignGateLabel,
  humanDesignValueLabel,
} from '../../lib/human-design/labels.js'

const props = defineProps({
  chart: { type: Object, required: true },
})

const { t } = useI18n()

const cross              = computed(() => props.chart.incarnationCross || null)
const crossGeometryLabel = computed(() =>
  cross.value ? humanDesignValueLabel(t, 'crossGeometry', cross.value.geometry) : '—'
)
const crossQuarterName = computed(() => {
  const name = cross.value?.quarter?.name
  if (!name) return '—'
  const key        = `human_design.quarters.${name}`
  const translated = t(key)
  return translated === key ? name : translated
})
const crossQuarterTheme = computed(() => {
  const theme = cross.value?.quarter?.theme
  if (!theme) return ''
  const key        = `human_design.quarter_themes.${theme}`
  const translated = t(key)
  return translated === key ? theme : translated
})
const gateDetailsByGate = computed(() =>
  new Map((props.chart.details?.gates || []).map(gate => [gate.gate, gate]))
)
const axisRows = computed(() => {
  if (!cross.value?.activations) return []
  return [
    { id: 'personalitySun', label: t('human_design.personality_sun'), activation: cross.value.activations.personalitySun },
    { id: 'personalityEarth', label: t('human_design.personality_earth'), activation: cross.value.activations.personalityEarth },
    { id: 'designSun', label: t('human_design.design_sun'), activation: cross.value.activations.designSun },
    { id: 'designEarth', label: t('human_design.design_earth'), activation: cross.value.activations.designEarth },
  ].filter(row => row.activation).map(row => ({
    ...row,
    code: activationCode(row.activation),
    gate: gateDetailsByGate.value.get(row.activation.gate),
  }))
})
</script>

<template lang="pug">
.hd-cross-panel(data-testid='hd-cross-panel')
  template(v-if='cross')
    .grid.gap-3.mb-4(class='md:grid-cols-3')
      .rounded.border.p-3(class='border-white/10 bg-white/5')
        .text-xs.uppercase.text-slate-500 {{ t('human_design.incarnation_cross') }}
        .mt-1.text-sm.font-semibold.text-slate-100 {{ humanDesignCrossTitleLabel(t, cross) }}
      .rounded.border.p-3(class='border-white/10 bg-white/5')
        .text-xs.uppercase.text-slate-500 {{ t('human_design.geometry') }}
        .mt-1.text-sm.font-semibold.text-slate-100 {{ crossGeometryLabel }}
      .rounded.border.p-3(class='border-white/10 bg-white/5')
        .text-xs.uppercase.text-slate-500 {{ t('human_design.cross_quarter') }}
        .mt-1.text-sm.font-semibold.text-slate-100 {{ crossQuarterName }}
        .mt-1.text-xs.text-slate-500 {{ crossQuarterTheme }}

    .grid.gap-3(class='lg:grid-cols-4')
      article.rounded.border.p-3(
        v-for='row in axisRows'
        :key='row.id'
        class='border-white/10 bg-white/5'
      )
        .text-xs.uppercase.text-slate-500 {{ row.label }}
        .mt-1.text-lg.font-semibold.text-amber-200 {{ row.code }}
        .mt-2.text-sm.text-slate-100 {{ row.gate?.gate || row.activation.gate }} · {{ humanDesignGateLabel(t, row.activation.gate, row.gate?.name) }}
        .mt-1.text-xs.text-slate-400 {{ humanDesignValueLabel(t, 'center', row.gate?.center) || '—' }} · {{ t('human_design.harmonics') }} {{ row.gate?.harmonicGates?.join(', ') || '—' }}

    .mt-4.rounded.border.p-3(class='border-white/10 bg-white/5')
      h3.text-sm.font-semibold.text-slate-100 {{ t('human_design.cross_direction') }}
      p.mt-2.text-xs.leading-5.text-slate-400 {{ t('human_design.cross_direction_note') }}
  p.text-sm.text-slate-400(v-else) {{ t('human_design.cross_unavailable') }}
</template>
