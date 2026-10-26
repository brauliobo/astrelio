<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { modalityChart, modalityConnection } from '../lib/modalities/index.js'
import Biwheel from '../components/chart/Biwheel.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import ComparisonInsightPanel from '../components/chart/ComparisonInsightPanel.vue'
import CenterClassification from '../components/human-design/relations/CenterClassification.vue'
import CompositeSummary from '../components/human-design/relations/CompositeSummary.vue'
import RelationBodygraphs from '../components/human-design/relations/RelationBodygraphs.vue'
import RelationCards from '../components/human-design/relations/RelationCards.vue'
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

const aspects      = computed(() => modalityConnection('astrology', chartA.value, chartB.value, settings).aspects)
const hdConnection = computed(() => modalityConnection('humanDesign', hdChartA.value, hdChartB.value))
const hdHighlight  = ref(null)
const hdNames      = computed(() => ({ a: personA.value?.name, b: personB.value?.name }))
const hdOwners     = computed(() => ({ [hdChartA.value?.personId]: hdNames.value.a, [hdChartB.value?.personId]: hdNames.value.b }))

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
      { key: 'theme', label: t('human_design.connection_theme'), value: hdConnection.value?.connectionTheme || '—', testid: 'human-design-connection-theme' },
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
    RelationBodygraphs(
      v-else-if='hdChartA && hdChartB && hdConnection'
      :chart-a='hdChartA'
      :chart-b='hdChartB'
      :name-a='hdNames.a'
      :name-b='hdNames.b'
      :composite='hdConnection.composite'
      :highlight='hdHighlight'
    )

    .grid.gap-2(class='grid-cols-2 lg:grid-cols-4' data-testid='relationship-summary')
      .rounded.border.px-3.py-2(v-for='item in relationshipSummary' :key='item.key' class='border-white/10 bg-white/5' :data-testid='item.testid')
        .text-xs.uppercase.tracking-wide.text-slate-500 {{ item.label }}
        .text-sm.font-semibold.text-slate-100 {{ item.value }}

    template(v-if='relationshipModality === "astrology"')
      RelationshipSection(:title='t("relationship.insights")' open data-testid='synastry-insights-section')
        ComparisonInsightPanel(:aspects='aspects' :base='chartA' :comparison='chartB' mode='synastry')
      RelationshipSection(v-if='aspects.length' :title='t("relationship.aspect_table")' data-testid='synastry-aspects-section')
        AspectTable(:aspects='aspects' :chart='chartA')
    template(v-else)
      RelationshipSection(v-if='hdConnection' :title='t("human_design.connection")' open data-testid='human-design-connection-details')
        .grid.gap-5
          CompositeSummary(:connection='hdConnection')
          RelationCards(:connection='hdConnection' :owners='hdOwners' @highlight='hdHighlight = $event')
          section
            h3.mb-3.text-sm.font-semibold.text-slate-100 {{ t('human_design.centers_title') }}
            CenterClassification(:dynamics='hdConnection.centerDynamics' :names='hdNames' @highlight='hdHighlight = $event')
      HumanDesignTeamDisclosure(:people='people.sorted')
</template>
