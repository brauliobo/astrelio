<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { naturalAspects } from '../lib/astro/aspects.js'
import { moonPhaseLabel } from '../lib/astro/ephemeris.js'
import AspectTable from '../components/chart/AspectTable.vue'
import ChartInsight from '../components/chart/ChartInsight.vue'
import ChartWheel from '../components/chart/ChartWheel.vue'
import InterpretationPanel from '../components/chart/InterpretationPanel.vue'
import PlanetList from '../components/chart/PlanetList.vue'
import { downloadPng, downloadSvg } from '../lib/export/chartImage.js'
import { safeFilePart, timestampFilePart } from '../lib/export/download.js'

const { t } = useI18n()
const people = usePeopleStore()
const session = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart = useNatalChart(person, settings)
const aspects = computed(() => chart.value ? naturalAspects(chart.value, settings.aspectOptions) : [])
const phase = computed(() => chart.value ? t(`moon_phase.${moonPhaseLabel(chart.value.jdUt)}`) : '')
const reportRoot = ref(null)
const exportStatus = ref('')
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
        p.text-xs.text-slate-400 {{ person.isoLocal }} · {{ person.placeLabel }}
      div
        .flex.flex-wrap.gap-2
          RouterLink.rounded.px-3.py-2.text-sm.text-slate-300(
            to='/natal'
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
    .grid.gap-6(class='xl:grid-cols-[minmax(340px,0.85fr)_minmax(0,1fr)]')
      .grid.gap-6
        .ui-panel
          ChartWheel(:natal='chart' :aspect-options='settings.aspectOptions' display-mode='print' v-if='chart')
        .ui-panel
          PlanetList(:chart='chart' v-if='chart')
      .grid.gap-6
        ChartInsight(:chart='chart' :aspects='aspects' :phase-label='phase' v-if='chart')
        InterpretationPanel(:chart='chart' :aspects='aspects' v-if='chart')
        .ui-panel(v-if='aspects.length')
          AspectTable(:aspects='aspects')
</template>
