<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { modalityChart } from '../lib/modalities/index.js'
import { humanDesignCrossTitleLabel, humanDesignValueLabel } from '../lib/human-design/labels.js'
import { buildHumanDesignReadingDocument } from '../lib/human-design/readings/index.js'
import ReadingDocumentView from '../components/readings/ReadingDocumentView.vue'
import ActivationTable from '../components/human-design/ActivationTable.vue'
import CircuitStreamPanel from '../components/human-design/CircuitStreamPanel.vue'
import DetailTables from '../components/human-design/DetailTables.vue'
import GateExplorer from '../components/human-design/GateExplorer.vue'
import IncarnationCrossPanel from '../components/human-design/IncarnationCrossPanel.vue'
import InsightPanel from '../components/human-design/InsightPanel.vue'
import MandalaPrecisionPanel from '../components/human-design/MandalaPrecisionPanel.vue'
import RaveMandala from '../components/human-design/RaveMandala.vue'
import VariableSummary from '../components/human-design/VariableSummary.vue'
import Wheel from '../components/human-design/Wheel.vue'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'

const props = defineProps({
  workspace: {
    type:    Boolean,
    default: false,
  },
  workspaceView: {
    type:      String,
    default:   'chart',
    validator: value => ['chart', 'reading', 'data'].includes(value),
  },
})

const { t } = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const activeView      = computed(() => props.workspaceView)
const person          = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart           = computed(() => modalityChart('humanDesign', person.value))
const readingDocument = computed(() => buildHumanDesignReadingDocument(chart.value))
const strategyKeys = {
  'Wait to respond':                     'wait_to_respond',
  'Wait to respond, then inform':        'wait_to_respond_inform',
  'Inform before acting':                'inform_before_acting',
  'Wait for recognition and invitation': 'wait_for_invitation',
  'Wait through the lunar cycle':        'wait_lunar_cycle',
}
const translatedStrategy = strategy => {
  const key = strategyKeys[strategy]
  return key ? t(`human_design.strategies.${key}`) : strategy
}
const summaryRows = computed(() => chart.value ? [
  { label: t('human_design.type'), value: humanDesignValueLabel(t, 'type', chart.value.type), testId: 'hd-type' },
  { label: t('human_design.authority'), value: humanDesignValueLabel(t, 'authority', chart.value.authority), testId: 'hd-authority' },
  { label: t('human_design.profile'), value: chart.value.profile, testId: 'hd-profile' },
  { label: t('human_design.definition'), value: humanDesignValueLabel(t, 'definition', chart.value.definition), testId: 'hd-definition' },
  { label: t('human_design.strategy'), value: translatedStrategy(chart.value.strategy), testId: 'hd-strategy' },
  { label: t('human_design.incarnation_cross'), value: humanDesignCrossTitleLabel(t, chart.value.incarnationCross), testId: 'hd-cross' },
] : [])

</script>

<template lang="pug">
section.human-design-page(data-testid='human-design-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div.grid.gap-6(v-else-if='chart')
    .flex.flex-wrap.items-start.justify-between.gap-3(v-if='!workspace')
      div
        h1.text-2xl.font-semibold.text-slate-100 {{ t('human_design.title', { name: person.name }) }}
        p.text-xs.text-slate-400.mt-1 {{ t('human_design.subtitle') }}
      ModalityRouteSwitch(active='humanDesign')

    template(v-if='activeView === "chart"')
      .grid.gap-2(class='sm:grid-cols-2 lg:grid-cols-6' data-testid='human-design-summary')
        .rounded.border.p-3(
          v-for='row in summaryRows'
          :key='row.testId'
          class='border-white/10 bg-white/5'
        )
          .text-xs.uppercase.tracking-wide.text-slate-500 {{ row.label }}
          .mt-1.text-sm.font-semibold.leading-snug.text-slate-100(:data-testid='row.testId') {{ row.value }}
      .ui-panel
        Wheel(
          :chart='chart'
          :visual-theme='settings.theme'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
        )
      VariableSummary(:variables='chart.variables')
      InsightPanel(:chart='chart')

    ReadingDocumentView(v-else-if='activeView === "reading"' :document='readingDocument')

    .grid.gap-3(v-else data-testid='human-design-data')
      details.ui-panel(data-testid='hd-data-section-bodygraph')
        summary.cursor-pointer.text-sm.font-semibold.text-slate-100(data-testid='hd-data-toggle-bodygraph') {{ t('human_design.data_sections.bodygraph_precision') }}
        .grid.gap-5.mt-5(class='xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]')
          Wheel(
            :chart='chart'
            :visual-theme='settings.theme'
            :planet-glyph-renderer='settings.planetGlyphRenderer'
          )
          RaveMandala(:chart='chart' :visual-theme='settings.theme')
        .mt-5
          MandalaPrecisionPanel(:chart='chart')

      details.ui-panel(data-testid='hd-data-section-activations')
        summary.cursor-pointer.text-sm.font-semibold.text-slate-100(data-testid='hd-data-toggle-activations') {{ t('human_design.activations') }}
        .grid.gap-5.mt-5
          ActivationTable(:chart='chart' :glyph-renderer='settings.planetGlyphRenderer')
          MandalaPrecisionPanel(:chart='chart')

      details.ui-panel(data-testid='hd-data-section-centers')
        summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('human_design.centers_title') }}
        .mt-5
          DetailTables(:chart='chart' mode='centers')

      details.ui-panel(data-testid='hd-data-section-channels')
        summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('human_design.channels') }}
        .mt-5
          CircuitStreamPanel(:chart='chart')
          .mt-5
            DetailTables(:chart='chart' mode='channels')

      details.ui-panel(data-testid='hd-data-section-gates')
        summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('human_design.gates') }}
        .mt-5
          GateExplorer(:chart='chart')
          details.mt-5
            summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('human_design.all_gate_rows') }}
            .mt-4
              DetailTables(:chart='chart' mode='gates')

      details.ui-panel(data-testid='hd-data-section-variables')
        summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('human_design.variables') }}
        .mt-5
          p.text-xs.text-slate-400.mb-4 {{ t('human_design.variable_notice') }}
          VariableSummary(:variables='chart.variables')

      details.ui-panel(data-testid='hd-data-section-cross')
        summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('human_design.incarnation_cross') }}
        .mt-5
          IncarnationCrossPanel(:chart='chart')

</template>
