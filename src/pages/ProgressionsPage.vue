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
import Comparison from '../components/chart/Comparison.vue'
import ComparisonInsightPanel from '../components/chart/ComparisonInsightPanel.vue'

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
  return secondaryProgression(natalJdUt, dateMs.value, birthMs, person.value.lat, person.value.lon, settings.chartOptions)
})

const aspects = computed(() => natal.value && progressed.value ? crossAspects(natal.value, progressed.value, settings.aspectOptions) : [])
</script>

<template lang="pug">
section.progressions-page(data-testid='progressions-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 {{ t('chart.progression_date') }}
      input.ui-control.ui-control-sm(
        type='date'
        v-model='dateInput'
        data-testid='prog-date'
      )
      button.text-xs.text-amber-300(
        class='hover:text-amber-200'
        @click='dateInput = new Date().toISOString().slice(0,10)'
        data-testid='btn-today'
      ) {{ t('common.today') }}
    ComparisonInsightPanel.mb-6(:aspects='aspects' mode='progression')
    Comparison(
      v-if='natal && progressed'
      :base='natal'
      :comparison='progressed'
      :aspects='aspects'
      :base-label='t("chart.natal_positions")'
      :comparison-label='t("chart.current_positions")'
      :aspect-options='settings.aspectOptions'
      :planet-glyph-renderer='settings.planetGlyphRenderer'
    )
</template>
