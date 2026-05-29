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

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person  = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart   = useNatalChart(person, settings)
const phase   = computed(() => chart.value ? t(`moon_phase.${moonPhaseLabel(chart.value.jdUt)}`) : '')
const aspects = computed(() => chart.value ? naturalAspects(chart.value) : [])
</script>

<template lang="pug">
section.natal-page(data-testid='natal-page')
  div(v-if='!person' data-testid='no-person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    h1.text-xl.font-semibold.text-slate-100.mb-1 {{ t('chart.natal_for', { name: person.name }) }}
    p.text-xs.text-slate-400.mb-4 {{ person.isoLocal }} · {{ person.placeLabel }}
    .grid.gap-6(class='lg:grid-cols-2')
      .border.rounded-xl.p-4(class='border-white/10 bg-night/40')
        ChartWheel(:natal='chart' v-if='chart')
      .border.rounded-xl.p-4(class='border-white/10 bg-night/40')
        PlanetList(:chart='chart' v-if='chart')
        .mt-4.text-xs.text-slate-400(data-testid='moon-phase') {{ t('chart.moon_phase') }}: {{ phase }}
    .border.rounded-xl.p-4.mt-6(class='border-white/10 bg-night/40' v-if='aspects.length')
      AspectTable(:aspects='aspects')
</template>
