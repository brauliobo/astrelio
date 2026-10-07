<script setup>
import { computed } from 'vue'
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
import RelationshipSection from '../components/relationships/RelationshipSection.vue'
import SynastryEmptyState from '../components/relationships/SynastryEmptyState.vue'
import SynastryPairBar from '../components/relationships/SynastryPairBar.vue'

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const personA = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const personB = computed(() => people.byId(session.comparePersonId) || people.sorted.find(p => p.id !== personA.value?.id) || null)

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

const relationshipModality = computed(() => session.relationshipModality || 'astrology')
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

const swap = () => {
  const [a, b] = [personA.value.id, personB.value?.id]
  session.setActive(b ?? a)
  session.setCompare(b ? a : null)
}
</script>

<template lang="pug">
section.synastry-page.flex.flex-col.gap-3(data-testid='synastry-page')
  SynastryEmptyState(v-if='people.sorted.length < 2')
  template(v-else)
    SynastryPairBar(
      :people='people.sorted'
      :person-a='personA'
      :person-b='personB'
      @update:a='session.setActive($event)'
      @update:b='session.setCompare($event)'
      @swap='swap'
    )

    template(v-if='relationshipModality === "astrology"')
      .ui-panel(v-if='chartA && chartB')
        Biwheel(
          :natal='chartA'
          :overlay='chartB'
          :aspect-options='settings.aspectOptions'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
        )
    .grid.gap-4(v-else class='lg:grid-cols-2' data-testid='human-design-connection')
      .ui-panel(v-if='hdChartA')
        h2.text-sm.font-semibold.text-slate-100.mb-3 {{ personA.name }}
        BodygraphChart(:chart='hdChartA' :visual-theme='settings.theme')
      .ui-panel(v-if='hdChartB')
        h2.text-sm.font-semibold.text-slate-100.mb-3 {{ personB?.name }}
        BodygraphChart(:chart='hdChartB' :visual-theme='settings.theme')

    .grid.gap-2(class='grid-cols-2 lg:grid-cols-4' data-testid='relationship-summary')
      .rounded.border.px-3.py-2(v-for='item in relationshipSummary' :key='item.key' class='border-white/10 bg-white/5')
        .text-xs.uppercase.tracking-wide.text-slate-500 {{ item.label }}
        .text-sm.font-semibold.text-slate-100 {{ item.value }}

    template(v-if='relationshipModality === "astrology"')
      RelationshipSection(:title='t("relationship.insights")' open data-testid='synastry-insights-section')
        ComparisonInsightPanel(:aspects='aspects' :base='chartA' :comparison='chartB' mode='synastry')
      RelationshipSection(v-if='aspects.length' :title='t("relationship.aspect_table")' data-testid='synastry-aspects-section')
        AspectTable(:aspects='aspects' :chart='chartA')
    template(v-else)
      RelationshipSection(v-if='hdConnection' :title='t("human_design.connection")' open data-testid='human-design-connection-details')
        InsightPanel(:connection='hdConnection')
        .grid.gap-3.mt-4(class='md:grid-cols-2')
          p.text-xs.text-slate-400 {{ t('human_design.shared_centers') }}: {{ sharedCenterLabel }}
          p.text-xs.text-slate-400 {{ t('human_design.open_centers') }}: {{ openCenterLabel }}
          p.text-xs.text-slate-400(data-testid='human-design-connection-theme') {{ t('human_design.connection_theme') }}: {{ hdConnection.connectionTheme }}
          p.text-xs.text-slate-400 {{ t('human_design.electromagnetic') }}: {{ channelListLabel(hdConnection.electromagnetic) }}
          p.text-xs.text-slate-400 {{ t('human_design.companionship') }}: {{ channelListLabel(hdConnection.companionship) }}
          p.text-xs.text-slate-400 {{ t('human_design.compromise') }}: {{ channelListLabel(hdConnection.compromise.map(item => item.channel)) }}
      RelationshipSection(v-if='hdConnection' :title='t("human_design.composite_channels")')
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
