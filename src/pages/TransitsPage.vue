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
import AspectMatrix from '../components/chart/AspectMatrix.vue'
import ComparisonInsightPanel from '../components/chart/ComparisonInsightPanel.vue'

const { t }    = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const natal  = useNatalChart(person, settings)

const dateMs    = ref(session.transitDateMs || Date.now())
const dateInput = computed({
  get: () => new Date(dateMs.value).toISOString().slice(0, 16),
  set: (v) => { dateMs.value = new Date(v).getTime(); session.setTransitDate(dateMs.value) }
})

const transit = computed(() => person.value
  ? transitsFor(dateMs.value, person.value.lat, person.value.lon, settings.chartOptions)
  : null)

const aspects = computed(() => natal.value && transit.value ? crossAspects(natal.value, transit.value, settings.aspectOptions) : [])
</script>

<template lang="pug">
section.transits-page(data-testid='transits-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .transit-toolbar
      .transit-toolbar__title
        h2 {{ t('nav.transits') }}
        p {{ t('chart.natal_positions') }} × {{ t('chart.transit_positions') }}
      .transit-toolbar__controls
        label.transit-date-control
          span {{ t('chart.transit_date') }}
          input.ui-control.ui-control-sm(
            type='datetime-local'
            v-model='dateInput'
            data-testid='transit-date'
          )
        button.transit-now-button(
          type='button'
          @click='dateInput = new Date().toISOString().slice(0,16)'
          data-testid='btn-now'
        ) {{ t('common.now') }}
        .transit-count-pill(v-if='aspects.length')
          span {{ t('chart.summary') }}
          strong {{ aspects.length }}
    .transit-main-grid
      .transit-chart-panel
        Biwheel(
          :natal='natal'
          :overlay='transit'
          :aspect-options='settings.aspectOptions'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
          v-if='natal && transit'
        )
      .transit-side-panel
        ComparisonInsightPanel(:aspects='aspects' :base='natal' :comparison='transit' mode='transit')
        .transit-aspects-panel(v-if='aspects.length')
          AspectTable(:aspects='aspects')
    .transit-matrix-panel(v-if='natal && transit')
      AspectMatrix(
        :base='natal'
        :comparison='transit'
        :aspect-options='settings.aspectOptions'
        :base-label='t("chart.natal_positions")'
        :comparison-label='t("chart.transit_positions")'
        :planet-glyph-renderer='settings.planetGlyphRenderer'
      )
</template>

<style scoped>
.transit-toolbar {
  align-items: center;
  background: color-mix(in srgb, var(--app-panel-strong) 84%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  box-shadow: var(--app-shadow);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
}

.transit-toolbar__title h2 {
  color: var(--app-heading);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.15;
  margin: 0;
}

.transit-toolbar__title p {
  color: var(--app-text-muted);
  font-size: 0.78rem;
  line-height: 1.25;
  margin: 0.2rem 0 0;
}

.transit-toolbar__controls {
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.transit-date-control {
  color: var(--app-text-muted);
  display: grid;
  font-size: 0.72rem;
  font-weight: 700;
  gap: 0.25rem;
}

.transit-date-control input {
  min-width: 12.5rem;
}

.transit-now-button,
.transit-count-pill {
  align-items: center;
  border-radius: 0.25rem;
  display: inline-flex;
  min-height: 2rem;
}

.transit-now-button {
  background: rgb(252 211 77);
  color: rgb(15 23 42);
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.4rem 0.72rem;
}

.transit-now-button:hover,
.transit-now-button:focus-visible {
  background: rgb(253 230 138);
}

.transit-count-pill {
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  color: var(--app-text-soft);
  gap: 0.45rem;
  padding: 0.35rem 0.7rem;
}

.transit-count-pill span {
  color: var(--app-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.transit-count-pill strong {
  color: var(--app-heading);
  font-size: 0.9rem;
  line-height: 1;
}

.transit-main-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
}

.transit-chart-panel,
.transit-side-panel,
.transit-matrix-panel,
.transit-aspects-panel {
  background: color-mix(in srgb, var(--app-panel) 88%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  box-shadow: var(--app-shadow);
}

.transit-chart-panel {
  min-width: 0;
  padding: 0.9rem;
}

.transit-side-panel {
  align-content: start;
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 0.9rem;
}

.transit-side-panel :deep(.comparison-insight-panel) {
  background: transparent;
  border: 0;
  box-shadow: none;
  padding: 0;
}

.transit-aspects-panel {
  box-shadow: none;
  padding: 0.9rem;
}

.transit-matrix-panel {
  margin-top: 1rem;
  overflow: hidden;
  padding: 0.9rem;
}

@media (min-width: 1180px) {
  .transit-main-grid {
    align-items: start;
    grid-template-columns: minmax(34rem, 1.35fr) minmax(21rem, 0.65fr);
  }
}

@media (max-width: 640px) {
  .transit-toolbar {
    align-items: stretch;
  }

  .transit-toolbar__controls,
  .transit-date-control,
  .transit-date-control input,
  .transit-now-button {
    width: 100%;
  }

  .transit-now-button {
    justify-content: center;
  }
}
</style>
