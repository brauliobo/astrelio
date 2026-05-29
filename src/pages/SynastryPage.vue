<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { synastryAspects } from '../lib/astro/synastry.js'
import Biwheel from '../components/chart/Biwheel.vue'
import AspectTable from '../components/chart/AspectTable.vue'

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const personA = computed(() => people.byId(session.activePersonId)  || people.sorted[0] || null)
const personB = computed(() => people.byId(session.comparePersonId) || people.sorted[1] || null)

const chartA = useNatalChart(personA, settings)
const chartB = useNatalChart(personB, settings)

const aspects = computed(() => chartA.value && chartB.value ? synastryAspects(chartA.value, chartB.value) : [])

const compareWith = ref(session.comparePersonId)
const onChange = (e) => { session.setCompare(e.target.value); compareWith.value = e.target.value }
</script>

<template lang="pug">
section.synastry-page(data-testid='synastry-page')
  div(v-if='!personA')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 {{ t('chart.compare_with') }}
      select.bg-slate-900.border.rounded.px-2.py-1.text-sm.text-slate-100(
        class='border-white/10'
        @change='onChange'
        :value='compareWith'
        data-testid='compare-select'
      )
        option(value='' :selected='!compareWith') —
        option(v-for='p in people.sorted' :key='p.id' :value='p.id' :selected='p.id === compareWith') {{ p.name }}
    .grid.gap-6(class='lg:grid-cols-2')
      .border.rounded-xl.p-4(class='border-white/10 bg-night/40')
        Biwheel(:natal='chartA' :overlay='chartB' v-if='chartA && chartB')
      .border.rounded-xl.p-4(class='border-white/10 bg-night/40' v-if='aspects.length')
        AspectTable(:aspects='aspects')
</template>
