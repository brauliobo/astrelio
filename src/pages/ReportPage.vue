<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { naturalAspects } from '../lib/astro/aspects.js'
import { transitsFor } from '../lib/astro/transits.js'
import { moonPhaseLabel } from '../lib/astro/ephemeris.js'
import { birthHeaderForPerson } from '../lib/people/labels.js'
import { natalRouteForPerson } from '../lib/people/routeQuery.js'
import AspectMatrix from '../components/chart/AspectMatrix.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import Insight from '../components/chart/Insight.vue'
import Wheel from '../components/chart/Wheel.vue'
import InterpretationPanel from '../components/chart/InterpretationPanel.vue'
import PlanetList from '../components/chart/PlanetList.vue'
import { downloadPng, downloadSvg } from '../lib/export/chartImage.js'
import { safeFilePart, timestampFilePart } from '../lib/export/download.js'

const { t } = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person     = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const natalRoute = computed(() => natalRouteForPerson(person.value))
const chart      = useNatalChart(person, settings)
const transit    = computed(() => person.value
  ? transitsFor(session.transitDateMs || Date.now(), person.value.lat, person.value.lon, {
    zodiac:      settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode:    settings.nodeMode,
  })
  : null
)
const aspects        = computed(() => chart.value ? naturalAspects(chart.value, settings.aspectOptions) : [])
const phase          = computed(() => chart.value ? t(`moon_phase.${moonPhaseLabel(chart.value.jdUt)}`) : '')
const birthHeader    = computed(() => birthHeaderForPerson(person.value))
const systemLabel    = computed(() => `${t(`settings.${settings.zodiac}`)} · ${t(`houses.${settings.houseSystem}`)}`)
const reportRoot     = ref(null)
const exportStatus   = ref('')
const isExportingPng = ref(false)

const printReport = () => window.print()

const chartSvg = () => reportRoot.value?.querySelector('[data-testid="chart-wheel-svg"]')

const chartFileBase = () => {
  const name = safeFilePart(person.value?.name, 'chart')
  return `astrelio-${name}-chart-${timestampFilePart()}`
}

const setExportStatus = (key) => {
  exportStatus.value = t(key)
}

const exportSvg = () => {
  try {
    downloadSvg(chartSvg(), `${chartFileBase()}.svg`)
    setExportStatus('export.chart.svg_ready')
  } catch (_error) {
    setExportStatus('export.chart.failed')
  }
}

const exportPng = async () => {
  isExportingPng.value = true

  try {
    await downloadPng(chartSvg(), `${chartFileBase()}.png`)
    setExportStatus('export.chart.png_ready')
  } catch (_error) {
    setExportStatus('export.chart.failed')
  } finally {
    isExportingPng.value = false
  }
}
</script>

<template lang="pug">
section.report-page(ref='reportRoot' data-testid='report-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .report-toolbar.flex.flex-wrap.items-start.justify-between.gap-3.mb-5
      div
        h1.text-2xl.font-semibold.text-slate-100 {{ t('report.title', { name: person.name }) }}
        p.text-xs.text-slate-400 {{ birthHeader }}
      div
        .flex.flex-wrap.gap-2
          RouterLink.rounded.px-3.py-2.text-sm.text-slate-300(
            :to='natalRoute'
            class='bg-white/5 hover:bg-white/10 hover:text-white'
            data-testid='report-back'
          ) {{ t('report.back') }}
          button.rounded.px-3.py-2.text-sm.text-slate-300(
            type='button'
            class='bg-white/5 hover:bg-white/10 hover:text-white'
            @click='exportSvg'
            data-testid='report-svg'
          ) {{ t('export.chart.svg') }}
          button.rounded.px-3.py-2.text-sm.text-slate-300(
            type='button'
            class='bg-white/5 hover:bg-white/10 hover:text-white disabled:opacity-60'
            :disabled='isExportingPng'
            @click='exportPng'
            data-testid='report-png'
          ) {{ isExportingPng ? t('export.chart.png_working') : t('export.chart.png') }}
          button.ui-action-primary.px-3.py-2.text-sm(
            type='button'
            @click='printReport'
            data-testid='report-print'
          ) {{ t('report.print') }}
        p.mt-2.text-right.text-xs.text-slate-400(data-testid='report-export-status' v-if='exportStatus') {{ exportStatus }}
    .report-print-surface(data-testid='tropical-print-report')
      header.report-print-header
        div
          p.report-kicker {{ t('report.kicker') }}
          h2.report-print-title {{ t('report.title', { name: person.name }) }}
          p.report-print-subtitle {{ birthHeader }}
        dl.report-print-meta
          div
            dt {{ t('report.system') }}
            dd {{ systemLabel }}
          div
            dt {{ t('chart.moon_phase') }}
            dd {{ phase }}
      section.report-print-grid(data-testid='report-wheel-section')
        .report-chart-panel
          h2.report-section-title {{ t('report.wheel') }}
          Wheel(
            :natal='chart'
            :aspect-options='settings.aspectOptions'
            :planet-glyph-renderer='settings.planetGlyphRenderer'
            display-mode='print'
            :show-mode-controls='false'
            v-if='chart'
          )
        .report-position-panel(data-testid='report-position-lists')
          h2.report-section-title {{ t('report.positions') }}
          .report-position-lists
            section
              h3.report-subsection-title {{ t('chart.natal_positions') }}
              PlanetList(:chart='chart' v-if='chart')
            section(v-if='transit')
              h3.report-subsection-title {{ t('chart.transit_positions') }}
              PlanetList(:chart='transit')
      .report-section(data-testid='report-insight-section')
        Insight(:chart='chart' :aspects='aspects' :phase-label='phase' v-if='chart')
      .report-section(data-testid='report-aspectarian-section')
        h2.report-section-title {{ t('report.aspectarian') }}
        AspectMatrix(
          :base='chart'
          :comparison='transit'
          :aspect-options='settings.aspectOptions'
          :base-label='t("chart.natal_positions")'
          :comparison-label='t("chart.transit_positions")'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
          v-if='chart && transit'
        )
      .report-section(data-testid='report-interpretations-section')
        InterpretationPanel(:chart='chart' :aspects='aspects' :placement-limit='8' :aspect-limit='5' v-if='chart')
      .report-section(v-if='aspects.length' data-testid='report-aspect-list-section')
        h2.report-section-title {{ t('report.aspect_list') }}
        AspectTable(:aspects='aspects')
</template>

<style scoped>
.report-print-surface {
  display: grid;
  gap: 1.25rem;
}

.report-print-header {
  align-items: end;
  border-bottom: 1px solid var(--app-border);
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 0.42fr);
  padding-bottom: 1rem;
}

.report-kicker,
.report-subsection-title {
  color: var(--app-accent-text);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
  margin: 0 0 0.35rem;
  text-transform: uppercase;
}

.report-print-title {
  color: var(--app-heading);
  font-size: clamp(1.45rem, 4vw, 2.2rem);
  font-weight: 800;
  line-height: 1.05;
  margin: 0;
}

.report-print-subtitle {
  color: var(--app-text-muted);
  font-size: 0.86rem;
  margin: 0.45rem 0 0;
}

.report-print-meta {
  border: 1px solid var(--app-border);
  display: grid;
  gap: 0;
}

.report-print-meta div {
  display: grid;
  gap: 0.2rem;
  padding: 0.65rem 0.75rem;
}

.report-print-meta div + div {
  border-top: 1px solid var(--app-border);
}

.report-print-meta dt {
  color: var(--app-text-subtle);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}

.report-print-meta dd {
  color: var(--app-text-soft);
  font-size: 0.84rem;
  margin: 0;
}

.report-print-grid {
  align-items: start;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(19rem, 0.78fr) minmax(0, 1fr);
}

.report-chart-panel,
.report-position-panel,
.report-section {
  border: 1px solid var(--app-border);
  min-width: 0;
  padding: 1rem;
}

.report-section-title {
  color: var(--app-heading);
  font-size: 0.92rem;
  font-weight: 800;
  margin: 0 0 0.85rem;
}

.report-position-lists {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.report-position-lists > section {
  min-width: 0;
  overflow-x: auto;
}

.report-section :deep(.aspect-matrix) {
  min-width: 0;
  overflow-x: auto;
}

@media (max-width: 900px) {
  .report-print-header,
  .report-print-grid,
  .report-position-lists {
    grid-template-columns: 1fr;
  }
}

@media print {
  .report-print-surface {
    color: #111827;
    gap: 0.65rem;
  }

  .report-print-header,
  .report-chart-panel,
  .report-position-panel,
  .report-section,
  .report-print-meta,
  .report-print-meta div + div {
    border-color: #d1d5db;
  }

  .report-print-title,
  .report-section-title {
    color: #111827;
  }

  .report-print-subtitle,
  .report-print-meta dd {
    color: #374151;
  }

  .report-print-meta dt,
  .report-subsection-title {
    color: #6b7280;
  }

  .report-print-grid {
    grid-template-columns: 6.35in 1fr;
  }

  .report-chart-panel,
  .report-position-panel,
  .report-section {
    break-inside: avoid;
    padding: 0.28in;
  }
}
</style>
