<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { transitsFor } from '../lib/astro/transits.js'
import { crossAspects } from '../lib/astro/aspects.js'
import Biwheel from '../components/chart/Biwheel.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import ComparisonInsightPanel from '../components/chart/ComparisonInsightPanel.vue'

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const natal  = useNatalChart(person, settings)

const dateMs = ref(session.transitDateMs || Date.now())
const dateInput = computed({
  get: () => new Date(dateMs.value).toISOString().slice(0, 16),
  set: (v) => { dateMs.value = new Date(v).getTime(); session.setTransitDate(dateMs.value) }
})

const transit = computed(() => person.value
  ? transitsFor(dateMs.value, person.value.lat, person.value.lon, { zodiac: settings.zodiac, houseSystem: settings.houseSystem })
  : null)

const aspects = computed(() => natal.value && transit.value ? crossAspects(natal.value, transit.value, settings.aspectOptions) : [])
</script>

<template lang="pug">
section.transits-page(data-testid='transits-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 {{ t('chart.transit_date') }}
      input.ui-control.ui-control-sm(
        type='datetime-local'
        v-model='dateInput'
        data-testid='transit-date'
      )
      button.text-xs.text-amber-300(
        class='hover:text-amber-200'
        @click='dateInput = new Date().toISOString().slice(0,16)'
        data-testid='btn-now'
      ) {{ t('common.now') }}
    ComparisonInsightPanel.mb-6(:aspects='aspects' mode='transit')
    .grid.gap-6(class='lg:grid-cols-2')
      .ui-panel
        Biwheel(
          :natal='natal'
          :overlay='transit'
          :aspect-options='settings.aspectOptions'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
          v-if='natal && transit'
        )
      .ui-panel(v-if='aspects.length')
        AspectTable(:aspects='aspects')
</template>
