<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { modalityChart, modalityConnection } from '../lib/modalities/index.js'
import {
  humanDesignChannelLabel,
  humanDesignListLabel,
} from '../lib/human-design/labels.js'
import Biwheel from '../components/chart/Biwheel.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import ComparisonInsightPanel from '../components/chart/ComparisonInsightPanel.vue'
import BodygraphChart from '../components/human-design/BodygraphChart.vue'
import InsightPanel from '../components/human-design/InsightPanel.vue'
import HumanDesignTeamDisclosure from '../components/relationships/HumanDesignTeamDisclosure.vue'

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
const channelLabel = channel => `${channel} · ${humanDesignChannelLabel(t, channel)}`
const channelListLabel = channels => channels?.length ? channels.map(channelLabel).join(', ') : '—'

const compareWith          = ref(session.comparePersonId)
const relationshipModality = computed({
  get: () => session.relationshipModality || 'astrology',
  set: value => session.setRelationshipModality(value),
})
const onChange             = (e) => { session.setCompare(e.target.value); compareWith.value = e.target.value }
const dominantAspect = computed(() => [...aspects.value].sort((a, b) => (b.strength || 0) - (a.strength || 0))[0] || null)
const relationshipSummary = computed(() => relationshipModality.value === 'astrology'
  ? [
      { key: 'mode', label: t('relationship.overlay'), value: personB.value?.name || '—' },
      { key: 'aspects', label: t('chart.summary'), value: aspects.value.length },
      { key: 'tight', label: t('aspects.tight'), value: aspects.value.filter(aspect => aspect.delta <= 1).length },
      { key: 'dominant', label: t('relationship.dominant_aspect'), value: dominantAspect.value ? `${t(`planets.${dominantAspect.value.a}`)} ${t(`aspects.${dominantAspect.value.type}`)} ${t(`planets.${dominantAspect.value.b}`)}` : '—' },
    ]
  : [
      { key: 'mode', label: t('relationship.composite'), value: personB.value?.name || '—' },
      { key: 'theme', label: t('human_design.connection_theme'), value: hdConnection.value?.connectionTheme || '—' },
      { key: 'shared', label: t('human_design.shared_centers'), value: hdConnection.value?.sharedCenters?.length || 0 },
      { key: 'channels', label: t('human_design.composite_channels'), value: hdConnection.value?.compositeChannels?.length || 0 },
    ]
)
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

    .grid.gap-2.mb-4(class='sm:grid-cols-2 lg:grid-cols-4' data-testid='relationship-summary')
      .rounded.border.p-3(v-for='item in relationshipSummary' :key='item.key' class='border-white/10 bg-white/5')
        .text-xs.uppercase.tracking-wide.text-slate-500 {{ item.label }}
        .mt-1.text-lg.font-semibold.text-slate-100 {{ item.value }}

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
          AspectTable(:aspects='aspects' :chart='chartA')
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
          p.text-xs.text-slate-400 {{ t('human_design.electromagnetic') }}: {{ channelListLabel(hdConnection.electromagnetic) }}
          p.text-xs.text-slate-400 {{ t('human_design.companionship') }}: {{ channelListLabel(hdConnection.companionship) }}
          p.text-xs.text-slate-400 {{ t('human_design.compromise') }}: {{ channelListLabel(hdConnection.compromise.map(item => item.channel)) }}
      .ui-panel.mt-6(v-if='hdConnection')
        h2.text-sm.font-semibold.text-slate-100.mb-3 {{ t('human_design.composite_channels') }}
        .grid.gap-2(class='md:grid-cols-2')
          .rounded.border.p-2.text-xs(
            v-for='channel in hdConnection.compositeChannels'
            :key='channel.channel'
            class='border-white/10 bg-white/5'
          )
            .text-slate-100 {{ channelLabel(channel.channel) }}
            .text-slate-400 {{ humanDesignListLabel(t, 'center', channel.centers).replaceAll(', ', ' / ') }}
      HumanDesignTeamDisclosure(:people='people.sorted')
</template>
