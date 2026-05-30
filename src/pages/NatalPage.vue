<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { naturalAspects } from '../lib/astro/aspects.js'
import { moonPhaseLabel } from '../lib/astro/ephemeris.js'
import { birthHeaderForPerson } from '../lib/people/labels.js'
import { hasPersonRouteQuery, natalRouteForPerson, personFromRouteQuery, samePersonRouteData } from '../lib/people/routeQuery.js'
import Wheel from '../components/chart/Wheel.vue'
import PlanetList from '../components/chart/PlanetList.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import Insight from '../components/chart/Insight.vue'
import InterpretationPanel from '../components/chart/InterpretationPanel.vue'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'

const { t }    = useI18n()
const route    = useRoute()
const router   = useRouter()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const savedPerson = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const hasRoutePerson = computed(() => hasPersonRouteQuery(route.query))
const routePerson = computed(() => hasRoutePerson.value ? personFromRouteQuery(route.query) : null)
const person  = computed(() => hasRoutePerson.value ? routePerson.value : savedPerson.value)
const chart   = useNatalChart(person, settings)
const phase   = computed(() => chart.value ? t(`moon_phase.${moonPhaseLabel(chart.value.jdUt)}`) : '')
const aspects = computed(() => chart.value ? naturalAspects(chart.value, settings.aspectOptions) : [])
const birthHeader = computed(() => birthHeaderForPerson(person.value))

watch(savedPerson, (next) => {
  if (!next || hasRoutePerson.value) return
  router.replace(natalRouteForPerson(next))
}, { immediate: true })

watch(routePerson, (next) => {
  if (!hasRoutePerson.value || !next) return

  const registered = people.list.find((candidate) => samePersonRouteData(candidate, next)) ||
    people.add({ ...next, id: null, shared: false })

  session.setActive(registered.id)
}, { immediate: true })
</script>

<template lang="pug">
section.natal-page(data-testid='natal-page')
  div(v-if='!person' data-testid='no-person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.flex-wrap.items-start.justify-between.gap-3.mb-4
      div
        h1.text-xl.font-semibold.text-slate-100.mb-1 {{ t('chart.natal_for', { name: person.name }) }}
        p.text-xs.text-slate-400 {{ birthHeader }}
      .flex.flex-wrap.items-center.gap-2
        ModalityRouteSwitch(active='astrology')
    .grid.gap-6(class='xl:grid-cols-[minmax(220px,0.58fr)_minmax(460px,1fr)_minmax(220px,0.58fr)] xl:items-start')
      Insight.order-2(
        class='xl:order-1'
        :chart='chart'
        :aspects='aspects'
        :phase-label='phase'
        panel='left'
        v-if='chart'
      )
      .ui-panel.order-1(class='xl:order-2' data-testid='natal-chart-panel')
        Wheel(
          :natal='chart'
          :aspect-options='settings.aspectOptions'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
          v-if='chart'
        )
      Insight.order-3(
        class='xl:order-3'
        :chart='chart'
        :aspects='aspects'
        :phase-label='phase'
        panel='right'
        v-if='chart'
      )
    InterpretationPanel.mt-6(:chart='chart' :aspects='aspects' v-if='chart')
    .grid.gap-6.mt-6(class='xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1fr)]')
      .ui-panel
        PlanetList(:chart='chart' v-if='chart')
        .mt-4.text-xs.text-slate-400(data-testid='moon-phase') {{ t('chart.moon_phase') }}: {{ phase }}
      .ui-panel(v-if='aspects.length')
        AspectTable(:aspects='aspects')
</template>
