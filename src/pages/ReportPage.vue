<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { REPORT_PRESET_KEYS, useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { naturalAspects } from '../lib/astro/aspects.js'
import { transitsFor } from '../lib/astro/transits.js'
import { moonPhaseLabel } from '../lib/astro/ephemeris.js'
import { tropicalReadingDocument } from '../lib/astro/interpretations.js'
import { modalityChart } from '../lib/modalities/index.js'
import { buildHumanDesignReadingDocument } from '../lib/human-design/readings/index.js'
import { buildVedicChart } from '../lib/vedic/chart.js'
import { VEDIC_BODY_COLORS, VEDIC_BODY_SYMBOLS } from '../lib/vedic/constants.js'
import { buildVedicReadingDocument } from '../lib/vedic/reading.js'
import { birthHeaderForPerson } from '../lib/people/labels.js'
import { natalRouteForPerson } from '../lib/people/routeQuery.js'
import { normalizeReportModality, reportModalitySlug } from '../lib/reports/modality.js'
import AspectMatrix from '../components/chart/AspectMatrix.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import Insight from '../components/chart/Insight.vue'
import Wheel from '../components/chart/Wheel.vue'
import PlanetList from '../components/chart/PlanetList.vue'
import HumanDesignWheel from '../components/human-design/Wheel.vue'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'
import ReadingDocumentView from '../components/readings/ReadingDocumentView.vue'
import { downloadPng, downloadSvg } from '../lib/export/chartImage.js'
import { safeFilePart, timestampFilePart } from '../lib/export/download.js'

const { t } = useI18n()
const route    = useRoute()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person          = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const modality        = computed(() => normalizeReportModality(route.query.modality))
const modalitySlug    = computed(() => reportModalitySlug(modality.value))
const isTropical      = computed(() => modality.value === 'astrology')
const natalRoute      = computed(() => natalRouteForPerson(person.value))
const tropicalChart   = useNatalChart(person, settings)
const vedicChart      = ref(null)
const vedicLoading    = ref(false)
const diagnosticError = ref(null)
let vedicRequestId = 0

watch(
  () => [
    modality.value,
    person.value,
    settings.vedic.ayanamsha,
    settings.vedic.houseMode,
    settings.vedic.nodeMode,
    settings.vedic.includeModernPlanets,
  ],
  async ([activeModality, activePerson]) => {
    const currentRequest  = ++vedicRequestId
    vedicChart.value      = null
    diagnosticError.value = null
    vedicLoading.value    = false
    if (activeModality !== 'vedic' || !activePerson) return

    vedicLoading.value = true
    try {
      const nextChart = await buildVedicChart(activePerson, settings.vedic)
      if (currentRequest === vedicRequestId) vedicChart.value = nextChart
    } catch (error) {
      if (currentRequest === vedicRequestId) diagnosticError.value = error
    } finally {
      if (currentRequest === vedicRequestId) vedicLoading.value = false
    }
  },
  { immediate: true }
)

const humanDesignChart = computed(() => modality.value === 'humanDesign'
  ? modalityChart('humanDesign', person.value)
  : null
)
const activeChart = computed(() => ({
  astrology:   tropicalChart.value,
  vedic:       vedicChart.value,
  humanDesign: humanDesignChart.value,
})[modality.value] || null)
const transit = computed(() => person.value
  ? transitsFor(session.transitDateMs || Date.now(), person.value.lat, person.value.lon, {
    zodiac:      settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode:    settings.nodeMode,
  })
  : null
)
const aspects        = computed(() => tropicalChart.value ? naturalAspects(tropicalChart.value, settings.aspectOptions) : [])
const phase          = computed(() => tropicalChart.value ? t(`moon_phase.${moonPhaseLabel(tropicalChart.value.jdUt)}`) : '')
const birthHeader    = computed(() => birthHeaderForPerson(person.value))
const systemLabel    = computed(() => {
  if (modality.value === 'vedic') {
    return `${t('zodiac.sidereal')} · ${t(`vedic.ayanamshas.${settings.vedic.ayanamsha}`)} · ${t(`vedic.house_modes.${settings.vedic.houseMode}`)}`
  }
  if (modality.value === 'humanDesign') return t('modalities.human_design')
  return `${t(`settings.${settings.zodiac}`)} · ${t(`houses.${settings.houseSystem}`)}`
})
const reportTitle = computed(() => isTropical.value
  ? t('report.title', { name: person.value?.name })
  : t(`report.modality_titles.${modalitySlug.value}`, { name: person.value?.name })
)
const reportKicker = computed(() => isTropical.value
  ? t('report.kicker')
  : t(`report.modality_kickers.${modalitySlug.value}`)
)
const backRoute = computed(() => {
  if (isTropical.value) return natalRoute.value
  return { name: modality.value === 'vedic' ? 'vedic' : 'human-design' }
})
const readingDocument = computed(() => {
  if (modality.value === 'vedic') return buildVedicReadingDocument(vedicChart.value)
  if (modality.value === 'humanDesign') return buildHumanDesignReadingDocument(humanDesignChart.value)
  return tropicalReadingDocument(tropicalChart.value, aspects.value)
})
const vedicBodyLabels = computed(() => Object.fromEntries(
  vedicChart.value?.positions.map(position => [position.name, t(`planets.${position.name}`)]) || []
))
const vedicMaps = computed(() => vedicChart.value ? [{
  id:                  'report-vedic-rasi',
  chart:               vedicChart.value,
  color:               'var(--chart-ink)',
  showAspects:         false,
  planetSymbols:       VEDIC_BODY_SYMBOLS,
  planetColors:        VEDIC_BODY_COLORS,
  planetLabels:        vedicBodyLabels.value,
  planetGlyphRenderer: 'text',
}] : [])
const reportRoot     = ref(null)
const exportStatus   = ref('')
const isExportingPng = ref(false)
const sectionOptions = computed(() => [
  { key: 'wheel',           label: t('report.sections.wheel') },
  { key: 'positions',       label: t('report.sections.positions') },
  { key: 'insights',        label: t('report.sections.insights') },
  { key: 'aspectarian',     label: t('report.sections.aspectarian') },
  { key: 'interpretations', label: t('report.sections.interpretations') },
  { key: 'aspects',         label: t('report.sections.aspects') },
])
const reportPresetOptions = REPORT_PRESET_KEYS

const onReportPreset = (event) => {
  settings.applyReportPreset(event.target.value)
}

const printReport = () => window.print()

const hasSvgVisual = computed(() => Boolean(
  activeChart.value && (!isTropical.value || settings.reportSections.wheel)
))
const chartSvg = () => reportRoot.value?.querySelector('[data-report-visual] svg')

const chartFileBase = () => {
  const name = safeFilePart(person.value?.name, 'chart')
  const modalityPart = isTropical.value ? '' : `-${modalitySlug.value}`
  return `astrelio-${name}${modalityPart}-chart-${timestampFilePart()}`
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
  div(v-else :data-modality='modalitySlug')
    .report-toolbar.flex.flex-wrap.items-start.justify-between.gap-3.mb-5
      div
        h1.text-2xl.font-semibold.text-slate-100 {{ reportTitle }}
        p.text-xs.text-slate-400 {{ birthHeader }}
      div
        ModalityRouteSwitch.mb-2(:active='modality')
        .flex.flex-wrap.gap-2
          RouterLink.rounded.px-3.py-2.text-sm.text-slate-300(
            :to='backRoute'
            class='bg-white/5 hover:bg-white/10 hover:text-white'
            data-testid='report-back'
          ) {{ t('report.back') }}
          button.rounded.px-3.py-2.text-sm.text-slate-300(
            v-if='hasSvgVisual'
            type='button'
            class='bg-white/5 hover:bg-white/10 hover:text-white'
            @click='exportSvg'
            data-testid='report-svg'
          ) {{ t('export.chart.svg') }}
          button.rounded.px-3.py-2.text-sm.text-slate-300(
            v-if='hasSvgVisual'
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
    .report-builder.ui-panel.mb-5(v-if='isTropical' data-testid='report-builder')
      .flex.flex-wrap.items-center.justify-between.gap-3.mb-3
        h2.text-sm.font-semibold.text-slate-100 {{ t('report.builder') }}
        label.text-xs.text-slate-400
          span.mr-2 {{ t('report.preset') }}
          select.ui-control.ui-control-sm(:value='settings.activeReportPreset' @change='onReportPreset' data-testid='report-preset')
            option(value='custom' disabled) {{ t('report.presets.custom') }}
            option(v-for='preset in reportPresetOptions' :key='preset' :value='preset') {{ t(`report.presets.${preset}`) }}
      .flex.flex-wrap.gap-2
        label.report-section-toggle(
          v-for='section in sectionOptions'
          :key='section.key'
          :data-testid='`report-section-${section.key}`'
        )
          input(type='checkbox' :checked='settings.reportSections[section.key]' @change='settings.setReportSection(section.key, $event.target.checked)')
          span {{ section.label }}
    .ui-panel(v-if='vedicLoading' data-testid='report-loading')
      p.text-sm.text-slate-400 {{ t('vedic.loading') }}
    .ui-panel(v-else-if='diagnosticError' data-testid='report-error')
      p.text-sm.text-rose-300 {{ t('report.calculation_error') }}
    .report-print-surface(v-else-if='activeChart' :data-testid='`${modalitySlug}-print-report`')
      header.report-print-header
        div
          p.report-kicker {{ reportKicker }}
          h2.report-print-title {{ reportTitle }}
          p.report-print-subtitle {{ birthHeader }}
        dl.report-print-meta
          div
            dt {{ t('report.system') }}
            dd {{ systemLabel }}
          div(v-if='isTropical')
            dt {{ t('chart.moon_phase') }}
            dd {{ phase }}
      section.report-print-grid(v-if='isTropical && (settings.reportSections.wheel || settings.reportSections.positions)' data-testid='report-wheel-section')
        .report-chart-panel(v-if='settings.reportSections.wheel')
          h2.report-section-title {{ t('report.wheel') }}
          .report-visual(data-report-visual)
            Wheel(
              :natal='tropicalChart'
              :aspect-options='settings.aspectOptions'
              :planet-glyph-renderer='settings.planetGlyphRenderer'
              display-mode='print'
              :show-mode-controls='false'
            )
        .report-position-panel(v-if='settings.reportSections.positions' data-testid='report-position-lists')
          h2.report-section-title {{ t('report.positions') }}
          .report-position-lists
            section
              h3.report-subsection-title {{ t('chart.natal_positions') }}
              PlanetList(:chart='tropicalChart')
            section(v-if='transit')
              h3.report-subsection-title {{ t('chart.transit_positions') }}
              PlanetList(:chart='transit')
      .report-section(v-if='isTropical && settings.reportSections.insights' data-testid='report-insight-section')
        Insight(:chart='tropicalChart' :aspects='aspects' :phase-label='phase')
      .report-section(v-if='isTropical && settings.reportSections.aspectarian' data-testid='report-aspectarian-section')
        h2.report-section-title {{ t('report.aspectarian') }}
        AspectMatrix(
          :base='tropicalChart'
          :comparison='transit'
          :aspect-options='settings.aspectOptions'
          :base-label='t("chart.natal_positions")'
          :comparison-label='t("chart.transit_positions")'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
          v-if='transit'
        )
      .report-section.report-reading(
        v-if='isTropical && settings.reportSections.interpretations && readingDocument'
        data-testid='report-interpretations-section'
      )
        ReadingDocumentView(:document='readingDocument')
      .report-section(v-if='isTropical && settings.reportSections.aspects && aspects.length' data-testid='report-aspect-list-section')
        h2.report-section-title {{ t('report.aspect_list') }}
        AspectTable(:aspects='aspects' :chart='tropicalChart')
      template(v-if='!isTropical')
        section.report-chart-panel(data-testid='report-modality-visual')
          h2.report-section-title {{ t('report.wheel') }}
          .report-visual(data-report-visual)
            Wheel(
              v-if='modality === "vedic"'
              :charts='vedicMaps'
              :show-mode-controls='false'
              display-mode='print'
              :show-nakshatra-ring='true'
            )
            HumanDesignWheel(
              v-else
              :chart='humanDesignChart'
              :visual-theme='settings.theme'
              :planet-glyph-renderer='settings.planetGlyphRenderer'
            )
        section.report-section.report-reading(v-if='readingDocument' data-testid='report-interpretations-section')
          ReadingDocumentView(:document='readingDocument')
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

.report-section-toggle {
  align-items: center;
  background: var(--app-chip);
  border: 1px solid var(--app-border-soft);
  border-radius: 999px;
  color: var(--app-text-soft);
  cursor: pointer;
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 700;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
}

.report-section-toggle:hover {
  background: var(--app-chip-hover);
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

.report-visual {
  margin-inline: auto;
  max-width: 64rem;
}

@media (max-width: 900px) {
  .report-print-header,
  .report-print-grid,
  .report-position-lists {
    grid-template-columns: 1fr;
  }
}

@media print {
  .report-builder {
    display: none !important;
  }

  .report-print-surface {
    color: #111827;
    gap: 0.65rem;
  }

  .report-print-header {
    display: grid !important;
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

  .report-reading {
    border: 0;
    break-inside: auto;
    padding: 0;
  }

  .report-reading :deep(header) {
    display: block !important;
  }

  .report-reading :deep(.ui-panel) {
    background: transparent !important;
    border-color: #d1d5db;
    break-inside: avoid;
  }

  .report-reading :deep(.text-slate-100),
  .report-reading :deep(.text-slate-300) {
    color: #111827 !important;
  }

  .report-reading :deep(.text-slate-400) {
    color: #4b5563 !important;
  }
}
</style>
