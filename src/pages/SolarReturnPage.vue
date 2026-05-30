<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { solarReturnChartForNatal } from '../lib/astro/solar_return.js'
import { crossAspects, naturalAspects } from '../lib/astro/aspects.js'
import Comparison from '../components/chart/Comparison.vue'
import Insight from '../components/chart/Insight.vue'

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const natal  = useNatalChart(person, settings)

const year = ref(new Date().getFullYear())

const sr = computed(() => {
  if (!person.value || !natal.value) return null
  const near = new Date(`${year.value}-01-15T12:00Z`).getTime()
  return solarReturnChartForNatal(natal.value.jdUt, near, person.value.lat, person.value.lon, settings.chartOptions)
})

const srAspects        = computed(() => natal.value && sr.value ? crossAspects(natal.value, sr.value, settings.aspectOptions) : [])
const srNaturalAspects = computed(() => sr.value ? naturalAspects(sr.value, settings.aspectOptions) : [])
const returnDate       = computed(() => {
  if (!sr.value) return ''
  const date = new Date((sr.value.jdUt - 2440587.5) * 86_400_000)
  return new Intl.DateTimeFormat(settings.locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone:  'UTC',
  }).format(date)
})
</script>

<template lang="pug">
section.solar-return(data-testid='solar-return-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.flex-wrap.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 {{ t('chart.solar_return_year') }}
      input.ui-control.ui-control-sm.w-24(
        type='number'
        v-model.number='year'
        data-testid='sr-year'
      )
      .text-xs.text-slate-400(v-if='returnDate' data-testid='sr-date') {{ t('chart.solar_return_exact') }}: {{ returnDate }} UTC
    Insight.mb-6(:chart='sr' :aspects='srNaturalAspects' v-if='sr')
    Comparison(
      v-if='natal && sr'
      :base='natal'
      :comparison='sr'
      :aspects='srAspects'
      :base-label='t("chart.natal_positions")'
      :comparison-label='t("chart.solar_return_positions")'
      :aspect-options='settings.aspectOptions'
      :planet-glyph-renderer='settings.planetGlyphRenderer'
    )
</template>
