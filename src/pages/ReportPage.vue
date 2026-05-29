<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { naturalAspects } from '../lib/astro/aspects.js'
import { moonPhaseLabel } from '../lib/astro/ephemeris.js'
import AspectTable from '../components/chart/AspectTable.vue'
import ChartInsight from '../components/chart/ChartInsight.vue'
import ChartWheel from '../components/chart/ChartWheel.vue'
import PlanetList from '../components/chart/PlanetList.vue'

const { t } = useI18n()
const people = usePeopleStore()
const session = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart = useNatalChart(person, settings)
const aspects = computed(() => chart.value ? naturalAspects(chart.value) : [])
const phase = computed(() => chart.value ? t(`moon_phase.${moonPhaseLabel(chart.value.jdUt)}`) : '')

const printReport = () => window.print()
</script>

<template lang="pug">
section.report-page(data-testid='report-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .report-toolbar.flex.flex-wrap.items-start.justify-between.gap-3.mb-5
      div
        h1.text-2xl.font-semibold.text-slate-100 {{ t('report.title', { name: person.name }) }}
        p.text-xs.text-slate-400 {{ person.isoLocal }} · {{ person.placeLabel }}
      .flex.gap-2
        RouterLink.rounded.px-3.py-2.text-sm.text-slate-300(
          to='/natal'
          class='bg-white/5 hover:bg-white/10 hover:text-white'
          data-testid='report-back'
        ) {{ t('report.back') }}
        button.ui-action-primary.px-3.py-2.text-sm(
          type='button'
          @click='printReport'
          data-testid='report-print'
        ) {{ t('report.print') }}
    .grid.gap-6(class='xl:grid-cols-[minmax(340px,0.85fr)_minmax(0,1fr)]')
      .grid.gap-6
        .ui-panel
          ChartWheel(:natal='chart' v-if='chart')
        .ui-panel
          PlanetList(:chart='chart' v-if='chart')
      .grid.gap-6
        ChartInsight(:chart='chart' :aspects='aspects' :phase-label='phase' v-if='chart')
        .ui-panel(v-if='aspects.length')
          AspectTable(:aspects='aspects')
</template>
