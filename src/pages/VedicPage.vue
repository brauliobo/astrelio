<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { buildVedicChart } from '../lib/vedic/chart.js'
import { buildVedicReadingDocument } from '../lib/vedic/reading.js'
import { AYANAMSHA_KEYS, VEDIC_BODY_COLORS, VEDIC_BODY_SYMBOLS, VEDIC_HOUSE_MODES } from '../lib/vedic/constants.js'
import { degInSign, signIndex } from '../lib/astro/zodiac.js'
import Wheel from '../components/chart/Wheel.vue'
import ReadingDocumentView from '../components/readings/ReadingDocumentView.vue'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'
import { broadcastChartHighlight } from '../lib/chart/highlight.js'

const props = defineProps({
  workspace: {
    type:    Boolean,
    default: false,
  },
  workspaceView: {
    type:    String,
    default: 'chart',
  },
})

const { t, tm } = useI18n()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const person          = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart           = ref(null)
const loading         = ref(false)
const diagnosticError = ref(null)
let requestId = 0

const signs            = computed(() => tm('zodiac.signs'))
const ayanamshaOptions = AYANAMSHA_KEYS
const houseModes       = VEDIC_HOUSE_MODES
const nodeModes        = ['mean', 'true']
const activeView       = computed(() => props.workspaceView)
const readingDocument = computed(() => chart.value ? buildVedicReadingDocument(chart.value) : null)
const bodyLabels       = computed(() => Object.fromEntries(
  chart.value?.positions.map(position => [position.name, t(`planets.${position.name}`)]) || []
))

watch(
  () => [person.value, settings.vedic.ayanamsha, settings.vedic.houseMode, settings.vedic.nodeMode, settings.vedic.includeModernPlanets],
  async ([activePerson]) => {
    const currentRequest   = ++requestId
    chart.value            = null
    diagnosticError.value = null
    if (!activePerson) return

    loading.value = true
    try {
      const nextChart = await buildVedicChart(activePerson, settings.vedic)
      if (currentRequest === requestId) chart.value = nextChart
    } catch (err) {
      if (currentRequest === requestId) diagnosticError.value = err
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  },
  { immediate: true }
)

const fmtDegree = (longitude) => {
  const degree = degInSign(longitude)
  const dd     = Math.floor(degree)
  const mm     = Math.floor((degree - dd) * 60)
  return `${dd}°${mm.toString().padStart(2, '0')}'`
}

const jdDate = (jd) =>
  new Date((jd - 2440587.5) * 86_400_000).toLocaleDateString(settings.locale)

const calculatedAt = computed(() => chart.value
  ? new Date(chart.value.calculatedAt).toLocaleString(settings.locale)
  : ''
)

const signLabel      = (longitude) => signs.value[signIndex(longitude)] || ''
const nakshatraLabel = (nakshatra) =>
  nakshatra ? t(`vedic.nakshatras.${nakshatra.key}`) : ''
const dashaLord = (lord) => t(`vedic.dasha_lords.${lord}`)

const moon  = computed(() => chart.value?.positions.find(position => position.name === 'Moon') || null)
const sun   = computed(() => chart.value?.positions.find(position => position.name === 'Sun') || null)
const lagna = computed(() => chart.value ? {
  longitude: chart.value.ascendant,
  sign:      signLabel(chart.value.ascendant),
  degree:    fmtDegree(chart.value.ascendant),
  nakshatra: nakshatraLabel(chart.value.positions[0]?.nakshatra),
} : null)

const summaryRows = computed(() => chart.value ? [
  { key: 'lagna', label: t('vedic.lagna'), value: lagna.value.sign, meta: lagna.value.degree },
  { key: 'moon', label: t('vedic.moon_rasi'), value: signLabel(moon.value.longitude), meta: nakshatraLabel(moon.value.nakshatra) },
  { key: 'sun', label: t('vedic.sun_rasi'), value: signLabel(sun.value.longitude), meta: fmtDegree(sun.value.longitude) },
  {
    key:   'dasha',
    label: t('vedic.active_dasha'),
    value: chart.value.dashas?.active
      ? `${dashaLord(chart.value.dashas.active.mahadasha)} / ${dashaLord(chart.value.dashas.active.antardasha)}`
      : '—',
    meta: chart.value.dashas?.active ? `${jdDate(chart.value.dashas.active.startJd)} - ${jdDate(chart.value.dashas.active.endJd)}` : '',
  },
] : [])

const vedicMaps = computed(() => chart.value ? [{
  id:                  'vedic-rasi',
  chart:               chart.value,
  color:               'var(--chart-ink)',
  showAspects:         false,
  planetSymbols:       VEDIC_BODY_SYMBOLS,
  planetColors:        VEDIC_BODY_COLORS,
  planetLabels:        bodyLabels.value,
  planetGlyphRenderer: 'text',
}] : [])

const placementRows = computed(() => chart.value?.positions.map(position => ({
  name:       position.name,
  label:      bodyLabels.value[position.name],
  sign:       signLabel(position.longitude),
  degree:     fmtDegree(position.longitude),
  nakshatra:  nakshatraLabel(position.nakshatra),
  pada:       position.nakshatra.pada,
  retrograde: position.retrograde,
})) || [])

const navamsaRows = computed(() => chart.value?.navamsa.map(position => ({
  name:    position.name,
  label:   bodyLabels.value[position.name],
  rasi:    signs.value[position.rasiSignIndex],
  navamsa: signs.value[position.navamsaSignIndex],
})) || [])

const dashaRows = computed(() => chart.value?.dashas?.mahadashas.map(period => ({
  lord:   dashaLord(period.lord),
  start:  jdDate(period.startJd),
  end:    jdDate(period.endJd),
  active: chart.value.dashas.active?.mahadasha === period.lord,
})) || [])

const technicalRows = computed(() => chart.value ? [
  { label: t('vedic.data.julian_day'), value: chart.value.jdUt.toFixed(6) },
  { label: t('vedic.data.ayanamsha_value'), value: `${chart.value.ayanamshaValue.toFixed(6)}°` },
  { label: t('vedic.data.ascendant'), value: `${signLabel(chart.value.ascendant)} ${fmtDegree(chart.value.ascendant)}` },
  { label: t('vedic.data.midheaven'), value: `${signLabel(chart.value.mc)} ${fmtDegree(chart.value.mc)}` },
  { label: t('vedic.data.latitude'), value: chart.value.lat.toFixed(4) },
  { label: t('vedic.data.longitude'), value: chart.value.lon.toFixed(4) },
  { label: t('vedic.data.calculated_at'), value: calculatedAt.value },
] : [])

const selectedBody = ref(null)
const bodyHighlight = row => ({ bodies: [row.name], aspectKey: '' })
const broadcastBody = (row, pinned = false) => {
  broadcastChartHighlight({ chart: chart.value, highlight: row ? bodyHighlight(row) : null, pinned })
}
const toggleBody = (row) => {
  selectedBody.value = selectedBody.value === row.name ? null : row.name
  broadcastBody(selectedBody.value ? row : null, true)
}
</script>

<template lang="pug">
section.vedic-page(data-testid='vedic-page')
  div(v-if='!person' data-testid='no-person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div.grid.gap-6(v-else)
    .flex.flex-wrap.items-start.justify-between.gap-3(v-if='!workspace')
      div
        h1.text-2xl.font-semibold.text-slate-100 {{ t('vedic.title', { name: person.name }) }}
        p.text-xs.text-slate-400.mt-1 {{ person.isoLocal }} · {{ person.placeLabel }}
      ModalityRouteSwitch(active='vedic')

    .ui-panel(v-if='loading' data-testid='vedic-loading')
      p.text-sm.text-slate-400 {{ t('vedic.loading') }}
    .ui-panel(v-else-if='diagnosticError' data-testid='vedic-error')
      p.text-sm.text-rose-300 {{ t('vedic.error') }}
    template(v-else-if='chart')
      template(v-if='activeView === "chart"')
        .grid.gap-3(class='sm:grid-cols-2 xl:grid-cols-4' data-testid='vedic-summary')
          .rounded.border.p-3(
            v-for='row in summaryRows'
            :key='row.key'
            class='border-white/10 bg-white/5'
            :data-testid='`vedic-summary-${row.key}`'
          )
            .text-xs.uppercase.tracking-wide.text-slate-500 {{ row.label }}
            .mt-1.text-lg.font-semibold.text-slate-100 {{ row.value }}
            .text-xs.text-slate-400.mt-1 {{ row.meta }}

        .ui-panel.flex.justify-center(data-testid='vedic-chart-panel')
          Wheel(
            :charts='vedicMaps'
            :show-mode-controls='false'
            display-mode='print'
            :show-nakshatra-ring='true'
            :default-zoom-base='1.2'
            v-if='vedicMaps.length'
          )

      ReadingDocumentView(
        v-else-if='activeView === "reading" && readingDocument'
        :document='readingDocument'
        :chart='chart'
        data-testid='vedic-reading'
      )
        template(#reference)
          .workspace-reference-chart(data-testid='workspace-reference-chart')
            Wheel(
              v-if='vedicMaps.length'
              :charts='vedicMaps'
              :show-mode-controls='false'
              selection-summary-placement='floating'
              :show-nakshatra-ring='false'
              display-mode='clean'
            )

      .grid.gap-4(v-else-if='activeView === "data"' data-testid='vedic-data')
        details.ui-panel(open)
          summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('vedic.data.system_controls') }}
          .grid.gap-3.mt-4(class='md:grid-cols-4')
            div
              label.block.text-xs.text-slate-400.mb-1 {{ t('vedic.ayanamsha') }}
              select.ui-control.ui-control-sm.w-full(v-model='settings.vedic.ayanamsha' data-testid='vedic-ayanamsha')
                option(v-for='key in ayanamshaOptions' :key='key' :value='key') {{ t(`vedic.ayanamshas.${key}`) }}
            div
              label.block.text-xs.text-slate-400.mb-1 {{ t('vedic.house_mode') }}
              select.ui-control.ui-control-sm.w-full(v-model='settings.vedic.houseMode' data-testid='vedic-house-mode')
                option(v-for='key in houseModes' :key='key' :value='key') {{ t(`vedic.house_modes.${key}`) }}
            div
              label.block.text-xs.text-slate-400.mb-1 {{ t('vedic.node_mode') }}
              select.ui-control.ui-control-sm.w-full(v-model='settings.vedic.nodeMode' data-testid='vedic-node-mode')
                option(v-for='key in nodeModes' :key='key' :value='key') {{ t(`vedic.node_modes.${key}`) }}
            label.flex.items-center.gap-2.text-sm.text-slate-300.self-end
              input(type='checkbox' v-model='settings.vedic.includeModernPlanets' data-testid='vedic-modern-planets')
              | {{ t('settings.include_modern_planets') }}

        details.ui-panel(open data-testid='vedic-rasi-panel')
          summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('vedic.rasi_positions') }}
          .vedic-rasi-layout.mt-4
            .min-w-0.overflow-x-auto
              table.w-full.text-xs(data-testid='vedic-position-table')
                thead
                  tr.text-left.text-slate-400
                    th.py-1.pr-2(scope='col') {{ t('vedic.data.body') }}
                    th.py-1.px-2(scope='col') {{ t('vedic.data.sign') }}
                    th.py-1.px-2(scope='col') {{ t('vedic.data.degree') }}
                    th.py-1.px-2(scope='col') {{ t('vedic.data.nakshatra') }}
                    th.py-1.px-2(scope='col') {{ t('vedic.data.pada') }}
                    th.py-1.pl-2(scope='col') {{ t('vedic.data.motion') }}
                tbody
                  tr.border-t.cursor-pointer(
                    v-for='row in placementRows'
                    :key='row.name'
                    class='border-white/5'
                    role='button'
                    tabindex='0'
                    :aria-pressed='selectedBody === row.name'
                    :data-testid='`vedic-position-${row.name}`'
                    @mouseenter='broadcastBody(row)'
                    @mouseleave='broadcastBody(null)'
                    @focus='broadcastBody(row)'
                    @blur='broadcastBody(null)'
                    @click='toggleBody(row)'
                    @keydown.enter.prevent='toggleBody(row)'
                    @keydown.space.prevent='toggleBody(row)'
                  )
                    td.py-1.pr-2.text-slate-300 {{ row.label }}
                    td.py-1.px-2.text-slate-100 {{ row.sign }}
                    td.py-1.px-2.tabular-nums {{ row.degree }}
                    td.py-1.px-2.text-slate-400 {{ row.nakshatra }}
                    td.py-1.px-2.tabular-nums.text-slate-400 {{ row.pada }}
                    td.py-1.pl-2(:class='row.retrograde ? "text-amber-300" : "text-slate-400"')
                      | {{ t(row.retrograde ? 'vedic.data.retrograde' : 'vedic.data.direct') }}
            .workspace-reference-chart.vedic-data-reference.rounded.border.p-3(
              class='border-white/10 bg-white/5'
              data-testid='workspace-reference-chart'
            )
              Wheel(
                v-if='vedicMaps.length'
                :charts='vedicMaps'
                :show-mode-controls='false'
                selection-summary-placement='floating'
                :show-nakshatra-ring='false'
                display-mode='clean'
              )

        details.ui-panel(open)
          summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('vedic.navamsa') }}
          .overflow-x-auto.mt-4
            table.w-full.text-xs(data-testid='vedic-navamsa-table')
              thead
                tr.text-left.text-slate-400
                  th.py-1.pr-2(scope='col') {{ t('vedic.data.body') }}
                  th.py-1.px-2(scope='col') {{ t('vedic.data.rasi') }}
                  th.py-1.pl-2(scope='col') {{ t('vedic.navamsa') }}
              tbody
                tr.border-t(class='border-white/5' v-for='row in navamsaRows' :key='row.name')
                  td.py-1.pr-2.text-slate-300 {{ row.label }}
                  td.py-1.px-2.text-slate-400 {{ row.rasi }}
                  td.py-1.pl-2.text-slate-100 {{ row.navamsa }}

        details.ui-panel(open)
          summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('vedic.vimshottari') }}
          .grid.gap-2.mt-4(class='md:grid-cols-3' data-testid='vedic-dasha-table')
            .rounded.border.p-3(
              v-for='row in dashaRows'
              :key='row.lord'
              class='border-white/10 bg-white/5'
              :class='row.active ? "ring-1 ring-amber-300/40" : ""'
            )
              .text-sm.font-semibold.text-slate-100 {{ row.lord }}
              .text-xs.text-slate-400.mt-1 {{ row.start }} - {{ row.end }}

        details.ui-panel
          summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ t('vedic.data.technical_details') }}
          dl.grid.gap-3.mt-4(class='sm:grid-cols-2 lg:grid-cols-3')
            div(v-for='row in technicalRows' :key='row.label')
              dt.text-xs.text-slate-400 {{ row.label }}
              dd.mt-1.text-sm.text-slate-100.tabular-nums {{ row.value }}
</template>

<style scoped>
.vedic-rasi-layout {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
}

.vedic-data-reference {
  margin-inline: auto;
  max-width: 20rem;
  width: 100%;
}

@media (min-width: 1024px) {
  .vedic-rasi-layout {
    align-items: start;
    grid-template-columns: minmax(0, 1fr) minmax(17.5rem, 20rem);
  }
}
</style>
