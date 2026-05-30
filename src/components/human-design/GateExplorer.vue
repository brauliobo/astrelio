<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { activationCode } from '../../lib/human-design/activations.js'

const props = defineProps({
  chart: { type: Object, required: true },
})

const { t } = useI18n()
const query = ref('')
const selectedGate = ref(null)

const fallbackLineThemes = [
  { line: 1, role: 'Foundation', keynote: 'Inquiry', summary: 'Investigates the base pattern before trusting expression.' },
  { line: 2, role: 'Naturalness', keynote: 'Recognition', summary: 'Works best when an innate gift is recognized without pressure.' },
  { line: 3, role: 'Adaptation', keynote: 'Feedback', summary: 'Learns through contact, correction, and practical feedback.' },
  { line: 4, role: 'Influence', keynote: 'Network', summary: 'Carries the gate through trust, repetition, and exchange.' },
  { line: 5, role: 'Projection', keynote: 'Solution', summary: 'Meets expectations and needs clear boundaries around fixes.' },
  { line: 6, role: 'Perspective', keynote: 'Modeling', summary: 'Steps back over time to model the mature expression of the gate.' },
]

const gates = computed(() => props.chart.details?.gates || [])
const filteredGates = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return gates.value
  return gates.value.filter(gate =>
    String(gate.gate).includes(term) ||
    gate.name?.toLowerCase().includes(term) ||
    gate.center?.toLowerCase().includes(term) ||
    gate.harmonicGates?.some(harmonic => String(harmonic).includes(term)) ||
    gate.library?.streams?.some(stream => stream.toLowerCase().includes(term))
  )
})
const activeGate = computed(() =>
  gates.value.find(gate => gate.gate === selectedGate.value) || filteredGates.value[0] || null
)
const activeActivations = computed(() =>
  (activeGate.value?.activations || []).map(activation => ({
    ...activation,
    code: activation.code || activationCode(activation),
    lineDetail: activation.lineDetail || fallbackLineThemes.find(line => line.line === activation.line) || null,
    planetMeaning: activation.planetMeaning || `${activation.planet} applies this gate through the ${activation.layer} layer.`,
  }))
)
const lineRows = computed(() => {
  const sourceLines = activeGate.value?.lines?.length ? activeGate.value.lines : fallbackLineThemes
  return sourceLines.map(line => ({
    ...line,
    activations: activeActivations.value.filter(activation => activation.line === line.line),
  }))
})
const harmonicsLabel = computed(() => {
  if (!activeGate.value) return '—'
  if (activeGate.value.harmonicSuggestions?.length) {
    return activeGate.value.harmonicSuggestions.map(item => `${item.gate} (${item.channel})`).join(', ')
  }
  return activeGate.value.hangingHarmonics?.join(', ') || activeGate.value.harmonicGates?.join(', ') || '—'
})

watch(gates, value => {
  if (!selectedGate.value && value.length) selectedGate.value = value[0].gate
}, { immediate: true })
</script>

<template lang="pug">
.hd-gate-explorer(data-testid='hd-gate-explorer')
  .flex.flex-wrap.items-center.justify-between.gap-3.mb-4
    div
      h3.text-sm.font-semibold.text-slate-100 {{ t('human_design.gate_explorer') }}
      p.text-xs.text-slate-500.mt-1 {{ t('human_design.gate_explorer_note') }}
    input.ui-control.ui-control-sm.max-w-xs(
      v-model='query'
      type='search'
      :placeholder='t("human_design.search_gates")'
      data-testid='hd-gate-search'
    )

  .grid.gap-4(class='lg:grid-cols-[220px_minmax(0,1fr)]')
    .grid.gap-1.content-start.max-h-96.overflow-y-auto
      button.rounded.border.px-3.py-2.text-left.text-xs(
        v-for='gate in filteredGates'
        :key='gate.gate'
        type='button'
        class='border-white/10 hover:bg-white/10'
        :class='activeGate?.gate === gate.gate ? "bg-amber-300 text-slate-950" : "bg-white/5 text-slate-300"'
        @click='selectedGate = gate.gate'
        :data-testid='`hd-gate-option-${gate.gate}`'
      )
        .font-semibold {{ gate.gate }} · {{ gate.name }}
        .opacity-75 {{ gate.center }}
      p.text-xs.text-slate-500.p-2(v-if='!filteredGates.length') {{ t('human_design.no_gate_results') }}

    article.rounded.border.p-4(class='border-white/10 bg-white/5' v-if='activeGate')
      .flex.flex-wrap.items-start.justify-between.gap-3
        div
          h4.text-lg.font-semibold.text-slate-100 {{ activeGate.gate }} · {{ activeGate.name }}
          p.text-sm.text-slate-400.mt-1 {{ activeGate.summary || t('human_design.gate_contact_summary', { center: activeGate.center || t('human_design.center'), count: activeGate.activations?.length || 0 }) }}
        .text-xs.text-slate-400.text-right
          div {{ activeGate.center }}
          div {{ activeGate.library?.circuitGroups?.join(', ') || activeGate.layers?.join(', ') || 'Open' }}

      .grid.gap-3.mt-4(class='md:grid-cols-2')
        .rounded.border.p-3(class='border-white/10 bg-slate-950/20')
          .text-xs.uppercase.text-slate-500 {{ t('human_design.harmonics') }}
          .mt-1.text-sm.text-slate-200 {{ harmonicsLabel }}
        .rounded.border.p-3(class='border-white/10 bg-slate-950/20')
          .text-xs.uppercase.text-slate-500 {{ t('human_design.defined_streams') }}
          .mt-1.text-sm.text-slate-200 {{ activeGate.library?.streams?.join(', ') || '—' }}

      .overflow-x-auto.mt-4
        table.w-full.text-sm
          thead.text-xs.text-slate-500
            tr.border-b(class='border-white/10')
              th.py-2.pr-3.text-left {{ t('human_design.activations') }}
              th.py-2.px-3.text-left {{ t('human_design.line_detail') }}
              th.py-2.px-3.text-left {{ t('human_design.planet_specific') }}
              th.py-2.pl-3.text-left {{ t('human_design.mandala_precision') }}
          tbody.divide-y(class='divide-white/10')
            tr(v-for='activation in activeActivations' :key='`${activation.layer}-${activation.planet}`')
              td.py-2.pr-3.text-slate-100 {{ activation.layer }} {{ activation.planet }} · {{ activation.code }}
              td.py-2.px-3.text-slate-300
                .font-medium.text-slate-200 {{ activation.lineDetail?.role || t('human_design.line_detail') }} · {{ activation.lineDetail?.keynote || activation.line }}
                .text-xs.text-slate-500 {{ activation.lineDetail?.summary || '—' }}
              td.py-2.px-3.text-slate-400 {{ activation.planetMeaning }}
              td.py-2.pl-3.text-slate-400
                template(v-if='activation.mandala')
                  | {{ t('human_design.gate') }} {{ activation.mandala.gateDegrees }}° · {{ t('human_design.line') }} {{ activation.mandala.lineDegrees }}°
                template(v-else) —

      details.mt-4.rounded.border.p-3(class='border-white/10')
        summary.cursor-pointer.text-sm.font-medium.text-slate-200 {{ t('human_design.exaltation_lens') }}
        .grid.gap-2.mt-3.text-xs.text-slate-400
          p(v-for='line in lineRows' :key='line.line')
            span.text-slate-200 {{ t('human_design.line') }} {{ line.line }}:
            |  {{ line.exaltationTheme || line.summary }} / {{ line.detrimentTheme || t('human_design.metadata_pending') }}
</template>
