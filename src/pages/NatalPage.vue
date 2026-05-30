<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { naturalAspects } from '../lib/astro/aspects.js'
import { transitsFor } from '../lib/astro/transits.js'
import { moonPhaseLabel } from '../lib/astro/ephemeris.js'
import { birthHeaderForPerson } from '../lib/people/labels.js'
import { hasPersonRouteQuery, natalRouteForPerson, personFromRouteQuery, samePersonRouteData } from '../lib/people/routeQuery.js'
import Wheel from '../components/chart/Wheel.vue'
import PlanetList from '../components/chart/PlanetList.vue'
import AspectMatrix from '../components/chart/AspectMatrix.vue'
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
const chartPanelRef = ref(null)
const sidePanelMaxHeight = ref('')
let chartPanelObserver = null

const savedPerson = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const hasRoutePerson = computed(() => hasPersonRouteQuery(route.query))
const routePerson = computed(() => hasRoutePerson.value ? personFromRouteQuery(route.query) : null)
const person  = computed(() => hasRoutePerson.value ? routePerson.value : savedPerson.value)
const chart   = useNatalChart(person, settings)
const transit = computed(() => person.value
  ? transitsFor(session.transitDateMs || Date.now(), person.value.lat, person.value.lon, {
    zodiac: settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode: settings.nodeMode,
  })
  : null
)
const phase   = computed(() => chart.value ? t(`moon_phase.${moonPhaseLabel(chart.value.jdUt)}`) : '')
const aspects = computed(() => chart.value ? naturalAspects(chart.value, settings.aspectOptions) : [])
const birthHeader = computed(() => birthHeaderForPerson(person.value))
const sidePanelStyle = computed(() =>
  sidePanelMaxHeight.value ? { '--natal-wheel-panel-height': sidePanelMaxHeight.value } : {}
)

const updateSidePanelHeight = () => {
  const height = chartPanelRef.value?.getBoundingClientRect?.().height || 0
  sidePanelMaxHeight.value = height ? `${Math.round(height)}px` : ''
}

const observeChartPanel = async () => {
  await nextTick()
  chartPanelObserver?.disconnect()
  chartPanelObserver = null
  updateSidePanelHeight()

  if (!chartPanelRef.value || typeof ResizeObserver === 'undefined') return
  chartPanelObserver = new ResizeObserver(updateSidePanelHeight)
  chartPanelObserver.observe(chartPanelRef.value)
}

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

watch(chart, () => {
  observeChartPanel()
}, { flush: 'post' })

onMounted(() => {
  observeChartPanel()
  window.addEventListener('resize', updateSidePanelHeight)
})

onBeforeUnmount(() => {
  chartPanelObserver?.disconnect()
  window.removeEventListener('resize', updateSidePanelHeight)
})
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
        RouterLink.rounded.px-3.py-2.text-sm.text-slate-300(
          to='/report'
          class='bg-white/5 hover:bg-white/10 hover:text-white'
          data-testid='open-report'
        ) {{ t('report.open') }}
        ModalityRouteSwitch(active='astrology')
    .grid.gap-6(class='xl:grid-cols-[minmax(220px,0.58fr)_minmax(460px,1fr)_minmax(220px,0.58fr)] xl:items-start')
      Insight.order-2.natal-side-panel(
        class='xl:order-1'
        :style='sidePanelStyle'
        :chart='chart'
        :aspects='aspects'
        :phase-label='phase'
        panel='left'
        v-if='chart'
      )
      .ui-panel.order-1(ref='chartPanelRef' class='xl:order-2' data-testid='natal-chart-panel')
        Wheel(
          :natal='chart'
          :overlay='transit'
          :aspect-options='settings.aspectOptions'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
          v-if='chart'
      )
      Insight.order-3.natal-side-panel(
        class='xl:order-3'
        :style='sidePanelStyle'
        :chart='chart'
        :aspects='aspects'
        :phase-label='phase'
        panel='right'
        v-if='chart'
      )
    .ui-panel.mt-6(v-if='chart && transit')
      AspectMatrix(
        :base='chart'
        :comparison='transit'
        :aspect-options='settings.aspectOptions'
        :base-label='t("chart.natal_positions")'
        :comparison-label='t("chart.transit_positions")'
        :planet-glyph-renderer='settings.planetGlyphRenderer'
      )
    InterpretationPanel.mt-6(:chart='chart' :aspects='aspects' v-if='chart')
    .grid.gap-6.mt-6(class='xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1fr)]')
      .ui-panel
        PlanetList(:chart='chart' v-if='chart')
        .mt-4.text-xs.text-slate-400(data-testid='moon-phase') {{ t('chart.moon_phase') }}: {{ phase }}
      .ui-panel(v-if='aspects.length')
        AspectTable(:aspects='aspects')
</template>

<style scoped>
@media (min-width: 1280px) {
  .natal-side-panel {
    max-height: var(--natal-wheel-panel-height);
    overflow-y: auto;
    scrollbar-gutter: stable;
  }
}
</style>
