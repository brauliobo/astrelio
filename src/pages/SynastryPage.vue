<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { modalityChart, modalityConnection } from '../lib/modalities/index.js'
import { humanDesignListLabel } from '../lib/human-design/labels.js'
import Biwheel from '../components/chart/Biwheel.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import ComparisonInsightPanel from '../components/chart/ComparisonInsightPanel.vue'
import BodygraphChart from '../components/human-design/BodygraphChart.vue'
import InsightPanel from '../components/human-design/InsightPanel.vue'

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const personA = computed(() => people.byId(session.activePersonId)  || people.sorted[0] || null)
const personB = computed(() => people.byId(session.comparePersonId) || people.sorted[1] || null)

const chartA   = computed(() => modalityChart('astrology', personA.value, settings))
const chartB   = computed(() => modalityChart('astrology', personB.value, settings))
const hdChartA = computed(() => modalityChart('humanDesign', personA.value))
const hdChartB = computed(() => modalityChart('humanDesign', personB.value))

const aspects           = computed(() => modalityConnection('astrology', chartA.value, chartB.value, settings).aspects)
const hdConnection      = computed(() => modalityConnection('humanDesign', hdChartA.value, hdChartB.value))
const sharedCenterLabel = computed(() =>
  hdConnection.value?.sharedCenters?.length ? humanDesignListLabel(t, 'center', hdConnection.value.sharedCenters) : '—'
)
const openCenterLabel = computed(() =>
  hdConnection.value?.openCenters?.length ? humanDesignListLabel(t, 'center', hdConnection.value.openCenters) : '—'
)

const compareWith          = ref(session.comparePersonId)
const relationshipModality = ref('astrology')
const onChange             = (e) => { session.setCompare(e.target.value); compareWith.value = e.target.value }
</script>

<template lang="pug">
section.synastry-page(data-testid='synastry-page')
  div(v-if='!personA')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 {{ t('chart.compare_with') }}
      select.ui-control.ui-control-sm(
        @change='onChange'
        :value='compareWith'
        data-testid='compare-select'
      )
        option(value='' :selected='!compareWith') —
        option(v-for='p in people.sorted' :key='p.id' :value='p.id' :selected='p.id === compareWith') {{ p.name }}
    .inline-flex.flex-wrap.gap-1.rounded-lg.border.p-1.mb-4(class='border-white/10 bg-white/5' data-testid='relationship-modality-switch')
      button.rounded-md.px-3.text-xs.font-medium(
        class='py-1.5'
        type='button'
        :class='relationshipModality === "astrology" ? "bg-amber-300 text-slate-950" : "text-slate-300 hover:bg-white/10"'
        @click='relationshipModality = "astrology"'
        data-testid='relationship-modality-astrology'
      ) {{ t('modalities.astrology') }}
      button.rounded-md.px-3.text-xs.font-medium(
        class='py-1.5'
        type='button'
        :class='relationshipModality === "humanDesign" ? "bg-amber-300 text-slate-950" : "text-slate-300 hover:bg-white/10"'
        @click='relationshipModality = "humanDesign"'
        data-testid='relationship-modality-human-design'
      ) {{ t('modalities.human_design') }}

    template(v-if='relationshipModality === "astrology"')
      ComparisonInsightPanel.mb-6(:aspects='aspects' :base='chartA' :comparison='chartB' mode='synastry')
      .grid.gap-6(class='lg:grid-cols-2')
        .ui-panel
          Biwheel(
            :natal='chartA'
            :overlay='chartB'
            :aspect-options='settings.aspectOptions'
            :planet-glyph-renderer='settings.planetGlyphRenderer'
            v-if='chartA && chartB'
          )
        .ui-panel(v-if='aspects.length')
          AspectTable(:aspects='aspects')
    template(v-else)
      InsightPanel.mb-6(:connection='hdConnection' v-if='hdConnection')
      .grid.gap-6(class='lg:grid-cols-2' data-testid='human-design-connection')
        .ui-panel(v-if='hdChartA')
          h2.text-sm.font-semibold.text-slate-100.mb-3 {{ personA.name }}
          BodygraphChart(:chart='hdChartA' :visual-theme='settings.theme')
        .ui-panel(v-if='hdChartB')
          h2.text-sm.font-semibold.text-slate-100.mb-3 {{ personB?.name }}
          BodygraphChart(:chart='hdChartB' :visual-theme='settings.theme')
      .ui-panel.mt-6(v-if='hdConnection' data-testid='human-design-connection-details')
        h2.text-sm.font-semibold.text-slate-100.mb-3 {{ t('human_design.connection') }}
        .grid.gap-3(class='md:grid-cols-2')
          p.text-xs.text-slate-400 {{ t('human_design.shared_centers') }}: {{ sharedCenterLabel }}
          p.text-xs.text-slate-400 {{ t('human_design.open_centers') }}: {{ openCenterLabel }}
          p.text-xs.text-slate-400(data-testid='human-design-connection-theme') {{ t('human_design.connection_theme') }}: {{ hdConnection.connectionTheme }}
          p.text-xs.text-slate-400 {{ t('human_design.electromagnetic') }}: {{ hdConnection.electromagnetic.join(', ') || '—' }}
          p.text-xs.text-slate-400 {{ t('human_design.companionship') }}: {{ hdConnection.companionship.join(', ') || '—' }}
          p.text-xs.text-slate-400 {{ t('human_design.compromise') }}: {{ hdConnection.compromise.map(item => item.channel).join(', ') || '—' }}
      .ui-panel.mt-6(v-if='hdConnection')
        h2.text-sm.font-semibold.text-slate-100.mb-3 {{ t('human_design.composite_channels') }}
        .grid.gap-2(class='md:grid-cols-2')
          .rounded.border.p-2.text-xs(
            v-for='channel in hdConnection.compositeChannels'
            :key='channel.channel'
            class='border-white/10 bg-white/5'
          )
            .text-slate-100 {{ channel.channel }} · {{ channel.name }}
            .text-slate-400 {{ channel.centers.join(' / ') }}
</template>
