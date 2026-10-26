<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { modalityChart } from '../lib/modalities/index.js'
import { buildHumanDesignReadingDocument } from '../lib/human-design/readings/index.js'
import ReadingDocumentView from '../components/readings/ReadingDocumentView.vue'
import AnalysisTabs from '../components/human-design/analysis/AnalysisTabs.vue'
import Bodygraph from '../components/human-design/bodygraph/Bodygraph.vue'
import BodygraphStage from '../components/human-design/stage/BodygraphStage.vue'
import HdSummaryChips from '../components/human-design/stage/HdSummaryChips.vue'
import InsightsGlance from '../components/human-design/stage/InsightsGlance.vue'
import SelectionPanel from '../components/human-design/stage/SelectionPanel.vue'
import VariablesGlance from '../components/human-design/stage/VariablesGlance.vue'
import { useStageSelection } from '../components/human-design/stage/selectionModel.js'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'
import '../components/human-design/stage/stage.css'

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
const stage    = useStageSelection()

const activeView      = computed(() => props.workspaceView)
const person          = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart           = computed(() => modalityChart('humanDesign', person.value))
const readingDocument = computed(() => buildHumanDesignReadingDocument(chart.value))
</script>

<template lang="pug">
section.human-design-page.hd-scope(data-testid='human-design-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div.grid.gap-6(v-else-if='chart')
    .flex.flex-wrap.items-start.justify-between.gap-3(v-if='!workspace')
      div
        h1.text-2xl.font-semibold.text-slate-100 {{ t('human_design.title', { name: person.name }) }}
        p.text-xs.text-slate-400.mt-1 {{ t('human_design.subtitle') }}
      ModalityRouteSwitch(active='humanDesign')

    .hd-chart-view(v-if='activeView === "chart"' :data-pinned='String(Boolean(stage.pinned.value))' @keydown.esc='stage.clear')
      HdSummaryChips(:chart='chart' :pinned='stage.pinned.value' @select='stage.toggle')
      .hd-chart-grid
        BodygraphStage.hd-chart-stage(
          :chart='chart'
          :pinned='stage.pinned.value'
          :active='stage.active.value'
          :glyph-renderer='settings.planetGlyphRenderer'
          :visual-theme='settings.theme'
          @select='stage.select'
          @toggle='stage.toggle'
          @hover='stage.hover'
          @clear='stage.clear'
        )
        .hd-chart-side
          SelectionPanel(:chart='chart' :selection='stage.pinned.value' @select='stage.select' @clear='stage.clear')
          VariablesGlance(:chart='chart' :pinned='stage.pinned.value' @select='stage.toggle')
          InsightsGlance(:chart='chart' :pinned='stage.pinned.value' @select='stage.toggle')

    ReadingDocumentView(v-else-if='activeView === "reading"' :document='readingDocument' :chart='chart')
      template(#reference)
        .workspace-reference-chart(data-testid='workspace-reference-chart')
          Bodygraph(:chart='chart' size='compact')

    AnalysisTabs(v-else :chart='chart' :pinned='stage.pinned.value' data-testid='human-design-data' @select='stage.select')
</template>

<style scoped>
.hd-chart-view,
.hd-chart-side { display: grid; gap: 14px; min-width: 0; }

.hd-chart-grid { display: grid; gap: 14px; min-width: 0; }

@media (max-width: 1023px) {
  .hd-chart-view[data-pinned='true'] { padding-bottom: 38dvh; }
}

@media (min-width: 1024px) {
  .hd-chart-grid { grid-template-columns: minmax(0, 1fr) 360px; align-items: start; }
  .hd-chart-stage { position: sticky; top: 68px; }
  .hd-chart-stage[data-view='mandala'] { position: static; }
}

@media (min-width: 1440px) {
  .hd-chart-grid { grid-template-columns: minmax(0, 1fr) 380px; }
}
</style>
