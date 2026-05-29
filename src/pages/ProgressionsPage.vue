<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { secondaryProgression } from '../lib/astro/progressions.js'
import { localToJdUt, localToUtcMs, offsetMinutesForPerson } from '../lib/astro/timezones.js'
import { crossAspects } from '../lib/astro/aspects.js'
import Biwheel from '../components/chart/Biwheel.vue'
import AspectTable from '../components/chart/AspectTable.vue'

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const natal  = useNatalChart(person, settings)

const dateMs = ref(session.progressionDateMs || Date.now())
const dateInput = computed({
  get: () => new Date(dateMs.value).toISOString().slice(0, 10),
  set: (v) => { dateMs.value = DateTime.fromISO(v).toMillis(); session.setProgressionDate(dateMs.value) }
})

const progressed = computed(() => {
  if (!person.value) return null
  const tzOffsetMinutes = offsetMinutesForPerson(person.value)
  const birthMs   = localToUtcMs(person.value.isoLocal, tzOffsetMinutes)
  const natalJdUt = localToJdUt(person.value.isoLocal, tzOffsetMinutes)
  return secondaryProgression(natalJdUt, dateMs.value, birthMs, person.value.lat, person.value.lon, { zodiac: settings.zodiac, houseSystem: settings.houseSystem })
})

const aspects = computed(() => natal.value && progressed.value ? crossAspects(natal.value, progressed.value) : [])
</script>

<template lang="pug">
section.progressions-page(data-testid='progressions-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 {{ t('chart.progression_date') }}
      input.bg-slate-900.border.rounded.px-2.py-1.text-sm.text-slate-100(
        class='border-white/10'
        type='date'
        v-model='dateInput'
        data-testid='prog-date'
      )
    .grid.gap-6(class='lg:grid-cols-2')
      .border.rounded-xl.p-4(class='border-white/10 bg-night/40')
        Biwheel(:natal='natal' :overlay='progressed' v-if='natal && progressed')
      .border.rounded-xl.p-4(class='border-white/10 bg-night/40' v-if='aspects.length')
        AspectTable(:aspects='aspects')
</template>
