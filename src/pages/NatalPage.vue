<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { naturalAspects } from '../lib/astro/aspects.js'
import { moonPhaseLabel } from '../lib/astro/ephemeris.js'
import ChartWheel from '../components/chart/ChartWheel.vue'
import PlanetList from '../components/chart/PlanetList.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import ChartInsight from '../components/chart/ChartInsight.vue'
import InterpretationPanel from '../components/chart/InterpretationPanel.vue'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person  = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart   = useNatalChart(person, settings)
const phase   = computed(() => chart.value ? t(`moon_phase.${moonPhaseLabel(chart.value.jdUt)}`) : '')
const aspects = computed(() => chart.value ? naturalAspects(chart.value, settings.aspectOptions) : [])
</script>

<template lang="pug">
section.natal-page(data-testid='natal-page')
  div(v-if='!person' data-testid='no-person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.flex-wrap.items-start.justify-between.gap-3.mb-4
      div
        h1.text-xl.font-semibold.text-slate-100.mb-1 {{ t('chart.natal_for', { name: person.name }) }}
        p.text-xs.text-slate-400 {{ person.isoLocal }} · {{ person.placeLabel }}
      .flex.flex-wrap.items-center.gap-2
        ModalityRouteSwitch(active='astrology')
    .grid.gap-6(class='lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]')
      .ui-panel
        ChartWheel(:natal='chart' :aspect-options='settings.aspectOptions' v-if='chart')
      ChartInsight(:chart='chart' :aspects='aspects' :phase-label='phase' v-if='chart')
    InterpretationPanel.mt-6(:chart='chart' :aspects='aspects' v-if='chart')
    .grid.gap-6.mt-6(class='xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1fr)]')
      .ui-panel
        PlanetList(:chart='chart' v-if='chart')
        .mt-4.text-xs.text-slate-400(data-testid='moon-phase') {{ t('chart.moon_phase') }}: {{ phase }}
      .ui-panel(v-if='aspects.length')
        AspectTable(:aspects='aspects')
</template>
