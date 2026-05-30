<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { modalityChart } from '../lib/modalities/index.js'
import { buildHumanDesignTransitChart, humanDesignTeamAnalysis, humanDesignTransitConnection } from '../lib/human-design/bodygraph.js'
import { humanDesignValueLabel } from '../lib/human-design/labels.js'
import ActivationTable from '../components/human-design/ActivationTable.vue'
import CircuitStreamPanel from '../components/human-design/CircuitStreamPanel.vue'
import CorrelationPanel from '../components/human-design/CorrelationPanel.vue'
import DetailTables from '../components/human-design/DetailTables.vue'
import GateExplorer from '../components/human-design/GateExplorer.vue'
import IncarnationCrossPanel from '../components/human-design/IncarnationCrossPanel.vue'
import InsightPanel from '../components/human-design/InsightPanel.vue'
import MandalaPrecisionPanel from '../components/human-design/MandalaPrecisionPanel.vue'
import RaveMandala from '../components/human-design/RaveMandala.vue'
import TeamPanel from '../components/human-design/TeamPanel.vue'
import TransitPanel from '../components/human-design/TransitPanel.vue'
import VariableSummary from '../components/human-design/VariableSummary.vue'
import Wheel from '../components/human-design/Wheel.vue'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'

const { t } = useI18n()
const people = usePeopleStore()
const session = useSessionStore()
const settings = useSettingsStore()

const activeTab = ref('overview')
const transitDateMs = ref(Date.now())
const selectedTeamIds = ref([])

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart = computed(() => modalityChart('humanDesign', person.value))
const strategyKeys = {
  'Wait to respond': 'wait_to_respond',
  'Wait to respond, then inform': 'wait_to_respond_inform',
  'Inform before acting': 'inform_before_acting',
  'Wait for recognition and invitation': 'wait_for_invitation',
  'Wait through the lunar cycle': 'wait_lunar_cycle',
}
const crossGeometryKeys = {
  'Right Angle': 'right_angle',
  Juxtaposition: 'juxtaposition',
  'Left Angle': 'left_angle',
}
const crossNameKeys = {
  Revolution: 'revolution',
}
const translatedStrategy = strategy => {
  const key = strategyKeys[strategy]
  return key ? t(`human_design.strategies.${key}`) : strategy
}
const translatedCrossName = cross => {
  if (!cross?.name) return '—'
  const geometryKey = crossGeometryKeys[cross.geometry]
  if (!geometryKey) return cross.name
  const rawName = cross.name.replace(`${cross.geometry} Cross of `, '')
  const nameKey = crossNameKeys[rawName]
  const translatedName = nameKey ? t(`human_design.cross_names.${nameKey}`) : rawName
  return t('human_design.cross_name_format', {
    geometry: t(`human_design.cross_geometries.${geometryKey}`),
    name: translatedName,
  })
}
const summaryRows = computed(() => chart.value ? [
  { label: t('human_design.type'), value: humanDesignValueLabel(t, 'type', chart.value.type), testId: 'hd-type' },
  { label: t('human_design.authority'), value: humanDesignValueLabel(t, 'authority', chart.value.authority), testId: 'hd-authority' },
  { label: t('human_design.profile'), value: chart.value.profile, testId: 'hd-profile' },
  { label: t('human_design.definition'), value: humanDesignValueLabel(t, 'definition', chart.value.definition), testId: 'hd-definition' },
  { label: t('human_design.strategy'), value: translatedStrategy(chart.value.strategy), testId: 'hd-strategy' },
  { label: t('human_design.incarnation_cross'), value: translatedCrossName(chart.value.incarnationCross), testId: 'hd-cross' },
] : [])

const tabs = computed(() => [
  { id: 'overview', label: t('human_design.tabs.overview') },
  { id: 'bodygraph', label: t('human_design.tabs.bodygraph') },
  { id: 'activations', label: t('human_design.tabs.activations') },
  { id: 'centers', label: t('human_design.tabs.centers') },
  { id: 'channels', label: t('human_design.tabs.channels') },
  { id: 'gates', label: t('human_design.tabs.gates') },
  { id: 'variables', label: t('human_design.tabs.variables') },
  { id: 'cross', label: t('human_design.tabs.cross') },
  { id: 'transits', label: t('human_design.tabs.transits') },
  { id: 'correlations', label: t('human_design.tabs.correlations') },
  { id: 'team', label: t('human_design.tabs.team') },
])

const transitDateInput = computed({
  get: () => new Date(transitDateMs.value).toISOString().slice(0, 16),
  set: value => {
    const parsed = new Date(value).getTime()
    if (Number.isFinite(parsed)) transitDateMs.value = parsed
  },
})

const transitChart = computed(() =>
  person.value ? buildHumanDesignTransitChart(transitDateMs.value, person.value.lat, person.value.lon) : null
)
const transitConnection = computed(() =>
  chart.value && transitChart.value
    ? humanDesignTransitConnection(chart.value, transitChart.value, { lat: person.value.lat, lon: person.value.lon })
    : null
)

const teamIds = computed(() => {
  if (selectedTeamIds.value.length) return selectedTeamIds.value
  return people.sorted.slice(0, 5).map(item => item.id)
})
const teamCharts = computed(() =>
  teamIds.value.map(id => modalityChart('humanDesign', people.byId(id))).filter(Boolean)
)
const teamAnalysis = computed(() => humanDesignTeamAnalysis(teamCharts.value))

const toggleTeamPerson = id => {
  const set = new Set(teamIds.value)
  if (set.has(id)) set.delete(id)
  else if (set.size < 5) set.add(id)
  selectedTeamIds.value = [...set]
}

const setTransitNow = () => { transitDateMs.value = Date.now() }
</script>

<template lang="pug">
section.human-design-page(data-testid='human-design-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div.grid.gap-6(v-else-if='chart')
    .flex.flex-wrap.items-start.justify-between.gap-3
      div
        h1.text-2xl.font-semibold.text-slate-100 {{ t('human_design.title', { name: person.name }) }}
        p.text-xs.text-slate-400.mt-1 {{ t('human_design.subtitle') }}
      ModalityRouteSwitch(active='humanDesign')

    .grid.gap-2(class='sm:grid-cols-2 lg:grid-cols-6')
      .rounded.border.p-3(
        v-for='row in summaryRows'
        :key='row.testId'
        class='border-white/10 bg-white/5'
      )
        .text-xs.uppercase.tracking-wide.text-slate-500 {{ row.label }}
        .mt-1.text-sm.font-semibold.leading-snug.text-slate-100(:data-testid='row.testId') {{ row.value }}

    .flex.flex-wrap.gap-1.rounded-lg.border.p-1(class='border-white/10 bg-white/5' data-testid='human-design-tabs')
      button.rounded-md.px-3.text-xs.font-medium(
        v-for='tab in tabs'
        :key='tab.id'
        class='py-1.5'
        type='button'
        :class='activeTab === tab.id ? "bg-amber-300 text-slate-950" : "text-slate-300 hover:bg-white/10"'
        @click='activeTab = tab.id'
        :data-testid='`hd-tab-${tab.id}`'
      ) {{ tab.label }}

    template(v-if='activeTab === "overview"')
      .ui-panel
        Wheel(
          :chart='chart'
          :visual-theme='settings.theme'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
        )
      VariableSummary(:variables='chart.variables')
      InsightPanel(:chart='chart')

    .ui-panel(v-else-if='activeTab === "bodygraph"')
      .grid.gap-5(class='xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]')
        Wheel(
          :chart='chart'
          :visual-theme='settings.theme'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
        )
        RaveMandala(:chart='chart' :visual-theme='settings.theme')
      .mt-5
        MandalaPrecisionPanel(:chart='chart')

    template(v-else-if='activeTab === "activations"')
      ActivationTable(:chart='chart' :glyph-renderer='settings.planetGlyphRenderer')
      .ui-panel
        MandalaPrecisionPanel(:chart='chart')

    .ui-panel(v-else-if='activeTab === "centers"')
      h2.text-sm.font-semibold.text-slate-100.mb-4 {{ t('human_design.centers_title') }}
      DetailTables(:chart='chart' mode='centers')

    .ui-panel(v-else-if='activeTab === "channels"')
      h2.text-sm.font-semibold.text-slate-100.mb-4 {{ t('human_design.channels') }}
      CircuitStreamPanel(:chart='chart')
      .mt-5
        DetailTables(:chart='chart' mode='channels')

    .ui-panel(v-else-if='activeTab === "gates"')
      GateExplorer(:chart='chart')
      details.mt-5
        summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('human_design.all_gate_rows') }}
        .mt-4
          DetailTables(:chart='chart' mode='gates')

    .ui-panel(v-else-if='activeTab === "variables"')
      h2.text-sm.font-semibold.text-slate-100.mb-4 {{ t('human_design.variables') }}
      p.text-xs.text-slate-400.mb-4 {{ t('human_design.variable_notice') }}
      VariableSummary(:variables='chart.variables')

    .ui-panel(v-else-if='activeTab === "cross"')
      IncarnationCrossPanel(:chart='chart')

    .ui-panel(v-else-if='activeTab === "transits"')
      h2.text-sm.font-semibold.text-slate-100.mb-4 {{ t('human_design.transits') }}
      TransitPanel(
        :transit-chart='transitChart'
        :connection='transitConnection'
        v-model:date-input='transitDateInput'
        @now='setTransitNow'
      )

    .ui-panel(v-else-if='activeTab === "correlations"')
      CorrelationPanel(
        :chart='chart'
        :transit-chart='transitChart'
        :transit-connection='transitConnection'
      )

    .ui-panel(v-else)
      h2.text-sm.font-semibold.text-slate-100.mb-4 {{ t('human_design.team') }}
      TeamPanel(
        :analysis='teamAnalysis'
        :people='people.sorted'
        :selected-ids='teamIds'
        @toggle='toggleTeamPerson'
      )
</template>
