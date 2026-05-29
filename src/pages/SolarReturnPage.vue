<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { solarReturnChart } from '../lib/astro/solar_return.js'
import ChartWheel from '../components/chart/ChartWheel.vue'
import PlanetList from '../components/chart/PlanetList.vue'

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const natal  = useNatalChart(person, settings)

const year   = ref(new Date().getFullYear())

const sr = computed(() => {
  if (!person.value || !natal.value) return null
  const sun  = natal.value.positions.find(p => p.name === 'Sun').longitude
  const near = new Date(`${year.value}-01-15T12:00Z`).getTime()
  return solarReturnChart(sun, near, person.value.lat, person.value.lon, { zodiac: settings.zodiac, houseSystem: settings.houseSystem })
})
</script>

<template lang="pug">
section.solar-return(data-testid='solar-return-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 Year
      input.bg-slate-900.border.rounded.px-2.py-1.text-sm.text-slate-100.w-24(
        class='border-white/10'
        type='number'
        v-model.number='year'
        data-testid='sr-year'
      )
    .grid.gap-6(class='lg:grid-cols-2')
      .border.rounded-xl.p-4(class='border-white/10 bg-night/40')
        ChartWheel(:natal='sr' v-if='sr')
      .border.rounded-xl.p-4(class='border-white/10 bg-night/40')
        PlanetList(:chart='sr' v-if='sr')
</template>
