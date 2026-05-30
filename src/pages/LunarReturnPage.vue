<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { lunarReturnChartForNatal } from '../lib/astro/lunar_return.js'
import { crossAspects, naturalAspects } from '../lib/astro/aspects.js'
import Comparison from '../components/chart/Comparison.vue'
import Insight from '../components/chart/Insight.vue'

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

const lunarReturn = computed(() => {
  if (!person.value || !natal.value) return null
  return lunarReturnChartForNatal(natal.value.jdUt, dateMs.value, person.value.lat, person.value.lon, {
    zodiac: settings.zodiac,
    houseSystem: settings.houseSystem,
  })
})

const aspects = computed(() => natal.value && lunarReturn.value ? crossAspects(natal.value, lunarReturn.value) : [])
const naturalReturnAspects = computed(() => lunarReturn.value ? naturalAspects(lunarReturn.value) : [])
const returnDate = computed(() => {
  if (!lunarReturn.value) return ''
  const date = new Date((lunarReturn.value.jdUt - 2440587.5) * 86_400_000)
  return new Intl.DateTimeFormat(settings.locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date)
})
</script>

<template lang="pug">
section.lunar-return-page(data-testid='lunar-return-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.flex-wrap.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 {{ t('techniques.lunar_return.date') }}
      input.ui-control.ui-control-sm(
        type='date'
        v-model='dateInput'
        data-testid='lunar-return-date'
      )
      button.text-xs.text-amber-300(
        class='hover:text-amber-200'
        @click='dateInput = new Date().toISOString().slice(0,10)'
        data-testid='btn-today'
      ) {{ t('common.today') }}
      .text-xs.text-slate-400(v-if='returnDate' data-testid='lunar-return-exact')
        | {{ t('techniques.lunar_return.exact') }}: {{ returnDate }} UTC
    Insight.mb-6(:chart='lunarReturn' :aspects='naturalReturnAspects' v-if='lunarReturn')
    Comparison(
      v-if='natal && lunarReturn'
      :base='natal'
      :comparison='lunarReturn'
      :aspects='aspects'
      :base-label='t("chart.natal_positions")'
      :comparison-label='t("techniques.lunar_return.positions")'
      :planet-glyph-renderer='settings.planetGlyphRenderer'
    )
</template>
