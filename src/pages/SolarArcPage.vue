<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { solarArcDirections } from '../lib/astro/solar_arc.js'
import { localToJdUt, localToUtcMs, offsetMinutesForPerson } from '../lib/astro/timezones.js'
import { crossAspects } from '../lib/astro/aspects.js'
import Comparison from '../components/chart/Comparison.vue'

const { t } = useI18n()
const people = usePeopleStore()
const session = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const natal = useNatalChart(person, settings)

const dateMs = ref(Date.now())
const dateInput = computed({
  get: () => new Date(dateMs.value).toISOString().slice(0, 10),
  set: (v) => { dateMs.value = DateTime.fromISO(v).toMillis() },
})

const directed = computed(() => {
  if (!person.value || !natal.value) return null
  const tzOffsetMinutes = offsetMinutesForPerson(person.value)
  const birthMs = localToUtcMs(person.value.isoLocal, tzOffsetMinutes)
  const natalJdUt = localToJdUt(person.value.isoLocal, tzOffsetMinutes)
  return solarArcDirections(natal.value, natalJdUt, dateMs.value, birthMs, person.value.lat, person.value.lon, {
    zodiac: settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode: settings.nodeMode,
  })
})

const aspects = computed(() => natal.value && directed.value ? crossAspects(natal.value, directed.value) : [])
const arcLabel = computed(() => directed.value ? directed.value.solarArc.toFixed(2) : '')
</script>

<template lang="pug">
section.solar-arc-page(data-testid='solar-arc-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.flex-wrap.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 {{ t('techniques.solar_arc.date') }}
      input.ui-control.ui-control-sm(
        type='date'
        v-model='dateInput'
        data-testid='solar-arc-date'
      )
      button.text-xs.text-amber-300(
        class='hover:text-amber-200'
        @click='dateInput = new Date().toISOString().slice(0,10)'
        data-testid='btn-today'
      ) {{ t('common.today') }}
      .text-xs.text-slate-400(v-if='directed' data-testid='solar-arc-degrees')
        | {{ t('techniques.solar_arc.arc') }}: {{ arcLabel }}°
    Comparison(
      v-if='natal && directed'
      :base='natal'
      :comparison='directed'
      :aspects='aspects'
      :base-label='t("chart.natal_positions")'
      :comparison-label='t("techniques.solar_arc.positions")'
      :planet-glyph-renderer='settings.planetGlyphRenderer'
    )
</template>
