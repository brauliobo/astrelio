<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChartState } from '../composables/useChart.js'
import { naturalAspects } from '../lib/astro/aspects.js'
import { transitsFor } from '../lib/astro/transits.js'
import { moonPhaseLabel } from '../lib/astro/ephemeris.js'
import { tropicalReadingDocument } from '../lib/astro/interpretations.js'
import { hasPersonRouteQuery, natalRouteForPerson, personFromRouteQuery, samePersonRouteData } from '../lib/people/routeQuery.js'
import Wheel from '../components/chart/Wheel.vue'
import PlanetList from '../components/chart/PlanetList.vue'
import AspectMatrix from '../components/chart/AspectMatrix.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import Insight from '../components/chart/Insight.vue'
import InterpretationPanel from '../components/chart/InterpretationPanel.vue'
import ReadingDocumentView from '../components/readings/ReadingDocumentView.vue'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'

const props = defineProps({
  workspace: {
    type:    Boolean,
    default: false,
  },
  workspaceView: {
    type:      String,
    default:   'chart',
    validator: value => ['chart', 'reading', 'data'].includes(value),
  },
})

const { t }             = useI18n()
const route              = useRoute()
const router             = useRouter()
const people             = usePeopleStore()
const session            = useSessionStore()
const settings           = useSettingsStore()
const directView         = ref('chart')

const savedPerson    = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const hasRoutePerson = computed(() => hasPersonRouteQuery(route.query))
const routePerson    = computed(() => hasRoutePerson.value ? personFromRouteQuery(route.query) : null)
const person         = computed(() => hasRoutePerson.value ? routePerson.value : savedPerson.value)
const { chart, error: chartError } = useNatalChartState(person, settings)
const transit        = computed(() => person.value
  ? transitsFor(session.transitDateMs || Date.now(), person.value.lat, person.value.lon, {
    zodiac:      settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode:    settings.nodeMode,
  })
  : null
)
const phase          = computed(() => chart.value ? t(`moon_phase.${moonPhaseLabel(chart.value.jdUt)}`) : '')
const aspects        = computed(() => chart.value ? naturalAspects(chart.value, settings.aspectOptions) : [])
const activeView     = computed(() => props.workspace ? props.workspaceView : directView.value)
const reading        = computed(() => tropicalReadingDocument(chart.value, aspects.value))
const viewOptions    = computed(() => [
  { id: 'chart', label: t('map.views.chart') },
  { id: 'reading', label: t('map.views.reading') },
  { id: 'data', label: t('map.views.data') },
])

watch(savedPerson, (next) => {
  if (!next || hasRoutePerson.value || route.name !== 'natal') return
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
  div.grid.gap-6(v-else)
    .flex.flex-wrap.items-start.justify-between.gap-3.mb-4(v-if='!workspace')
      div
        h1.text-xl.font-semibold.text-slate-100.mb-1 {{ t('chart.natal_for', { name: person.name }) }}
      .flex.flex-wrap.items-center.gap-2
        RouterLink.rounded.px-3.py-2.text-sm.text-slate-300(
          to='/report'
          class='bg-white/5 hover:bg-white/10 hover:text-white'
          data-testid='open-report'
        ) {{ t('report.open') }}
        ModalityRouteSwitch(active='astrology')

    nav.flex.flex-wrap.gap-1.rounded-lg.border.p-1(
      v-if='!workspace'
      class='border-white/10 bg-white/5'
      role='tablist'
      :aria-label='t("map.view_switch_aria")'
      data-testid='natal-view-switch'
    )
      button.rounded-md.px-3.text-xs.font-medium(
        v-for='view in viewOptions'
        :key='view.id'
        class='py-1.5'
        type='button'
        role='tab'
        :aria-selected='activeView === view.id'
        :class='activeView === view.id ? "bg-amber-300 text-slate-950" : "text-slate-300 hover:bg-white/10"'
        :data-testid='`natal-view-${view.id}`'
        @click='directView = view.id'
      ) {{ view.label }}

    .ui-panel(v-if='chartError' data-testid='natal-error')
      p.text-sm.text-rose-300 {{ t('chart.calculation_error') }}

    template(v-else-if='activeView === "chart"')
      .ui-panel.mx-auto.w-full(data-testid='natal-chart-panel')
        Wheel(
          :natal='chart'
          :overlay='transit'
          :aspect-options='settings.aspectOptions'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
          v-if='chart'
        )
      Insight.mx-auto.w-full(
        :chart='chart'
        :aspects='aspects'
        :phase-label='phase'
        panel='left'
        v-if='chart'
      )

    .ui-panel(v-if='chart && chart.unavailableBodies?.length' data-testid='chart-warning')
      p.text-sm.text-amber-200 {{ t('chart.unavailable_points', { bodies: chart.unavailableBodies.map(name => t(`planets.${name}`)).join(', ') }) }}

    div(v-if='!chartError && activeView === "reading" && reading' data-testid='natal-reading')
      ReadingDocumentView(:document='reading' :chart='chart')
        template(#reference)
          .workspace-reference-chart(data-testid='workspace-reference-chart')
            Wheel(
              v-if='chart'
              :natal='chart'
              :show-mode-controls='false'
              selection-summary-placement='floating'
              :planet-glyph-renderer='settings.planetGlyphRenderer'
              display-mode='clean'
            )
    .ui-panel(v-else-if='!chartError && activeView === "reading"')
      p.text-sm.text-slate-400 {{ t('readings.document.unavailable') }}

    .grid.gap-6(v-else-if='!chartError && activeView === "data"' data-testid='natal-data')
      .ui-panel(v-if='chart && transit' data-testid='natal-aspect-matrix-panel')
        .natal-data-aspect-grid
          .min-w-0
            AspectMatrix(
              :base='chart'
              :comparison='transit'
              :aspect-options='settings.aspectOptions'
              :base-label='t("chart.natal_positions")'
              :comparison-label='t("chart.transit_positions")'
              :planet-glyph-renderer='settings.planetGlyphRenderer'
            )
          .workspace-reference-chart.natal-data-reference.rounded.border.p-3(
            class='border-white/10 bg-white/5'
            data-testid='workspace-reference-chart'
          )
            Wheel(
              :natal='chart'
              :show-mode-controls='false'
              selection-summary-placement='floating'
              :planet-glyph-renderer='settings.planetGlyphRenderer'
              display-mode='clean'
            )
      .grid.gap-6(class='xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1fr)]')
        .ui-panel
          PlanetList(:chart='chart' v-if='chart')
          .mt-4.text-xs.text-slate-400(data-testid='moon-phase') {{ t('chart.moon_phase') }}: {{ phase }}
        .ui-panel(v-if='aspects.length')
          AspectTable(:aspects='aspects' :chart='chart')
      details.ui-panel(v-if='chart')
        summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('interpretations.title') }}
        .mt-4
          InterpretationPanel(:chart='chart' :aspects='aspects' :placement-limit='3' :aspect-limit='2')
</template>

<style scoped>
.natal-page > .grid {
  grid-template-columns: minmax(0, 1fr);
}

.natal-page,
.natal-page > .grid,
.natal-page > .grid > *,
.natal-page [data-testid='natal-data'],
.natal-page [data-testid='natal-data'] > *,
.natal-data-aspect-grid,
.natal-data-aspect-grid > * {
  min-width: 0;
  max-width: 100%;
}

.natal-page [data-testid='natal-data'] {
  grid-template-columns: minmax(0, 1fr);
}

.natal-page [data-testid='natal-data'] > .grid {
  grid-template-columns: minmax(0, 1fr);
}

.natal-page [data-testid='natal-chart-panel'],
.natal-page :deep(.chart-insight) {
  max-width: 64rem;
}

.natal-data-aspect-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
}

.natal-data-reference {
  margin-inline: auto;
  max-width: 20rem;
  width: 100%;
}

@media (min-width: 1024px) {
  .natal-data-aspect-grid {
    align-items: start;
    grid-template-columns: minmax(0, 1fr) minmax(17.5rem, 20rem);
  }
}
</style>
