<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { buildVedicChart } from '../lib/vedic/chart.js'
import { AYANAMSHA_KEYS, VEDIC_BODY_COLORS, VEDIC_BODY_LABELS, VEDIC_BODY_SYMBOLS, VEDIC_HOUSE_MODES } from '../lib/vedic/constants.js'
import { degInSign, signIndex } from '../lib/astro/zodiac.js'
import ChartWheel from '../components/chart/ChartWheel.vue'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'

const { t, tm } = useI18n()
const people = usePeopleStore()
const session = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart = ref(null)
const loading = ref(false)
const error = ref('')
let requestId = 0

const signs = computed(() => tm('zodiac.signs'))
const ayanamshaOptions = AYANAMSHA_KEYS
const houseModes = VEDIC_HOUSE_MODES
const nodeModes = ['mean', 'true']

watch(
  () => [person.value, settings.vedic.ayanamsha, settings.vedic.houseMode, settings.vedic.nodeMode, settings.vedic.includeModernPlanets],
  async ([activePerson]) => {
    const currentRequest = ++requestId
    chart.value = null
    error.value = ''
    if (!activePerson) return

    loading.value = true
    try {
      const nextChart = await buildVedicChart(activePerson, settings.vedic)
      if (currentRequest === requestId) chart.value = nextChart
    } catch (err) {
      if (currentRequest === requestId) error.value = err?.message || String(err)
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  },
  { immediate: true }
)

const fmtDegree = (longitude) => {
  const degree = degInSign(longitude)
  const dd = Math.floor(degree)
  const mm = Math.floor((degree - dd) * 60)
  return `${dd}°${mm.toString().padStart(2, '0')}'`
}

const jdDate = (jd) =>
  new Date((jd - 2440587.5) * 86_400_000).toLocaleDateString(settings.locale)

const signLabel = (longitude) => signs.value[signIndex(longitude)] || ''
const nakshatraLabel = (nakshatra) =>
  nakshatra ? t(`vedic.nakshatras.${nakshatra.key}`) : ''
const dashaLord = (lord) => t(`vedic.dasha_lords.${lord}`)

const moon = computed(() => chart.value?.positions.find(position => position.name === 'Moon') || null)
const sun = computed(() => chart.value?.positions.find(position => position.name === 'Sun') || null)
const lagna = computed(() => chart.value ? {
  longitude: chart.value.ascendant,
  sign: signLabel(chart.value.ascendant),
  degree: fmtDegree(chart.value.ascendant),
  nakshatra: nakshatraLabel(chart.value.positions[0]?.nakshatra),
} : null)

const summaryRows = computed(() => chart.value ? [
  { key: 'lagna', label: t('vedic.lagna'), value: lagna.value.sign, meta: lagna.value.degree },
  { key: 'moon', label: t('vedic.moon_rasi'), value: signLabel(moon.value.longitude), meta: nakshatraLabel(moon.value.nakshatra) },
  { key: 'sun', label: t('vedic.sun_rasi'), value: signLabel(sun.value.longitude), meta: fmtDegree(sun.value.longitude) },
  {
    key: 'dasha',
    label: t('vedic.active_dasha'),
    value: chart.value.dashas?.active
      ? `${dashaLord(chart.value.dashas.active.mahadasha)} / ${dashaLord(chart.value.dashas.active.antardasha)}`
      : '—',
    meta: chart.value.dashas?.active ? `${jdDate(chart.value.dashas.active.startJd)} - ${jdDate(chart.value.dashas.active.endJd)}` : '',
  },
] : [])

const vedicMaps = computed(() => chart.value ? [{
  id: 'vedic-rasi',
  chart: chart.value,
  color: 'var(--chart-ink)',
  showAspects: false,
  planetSymbols: VEDIC_BODY_SYMBOLS,
  planetColors: VEDIC_BODY_COLORS,
  planetLabels: VEDIC_BODY_LABELS,
}] : [])

const placementRows = computed(() => chart.value?.positions.map(position => ({
  name: position.name,
  label: VEDIC_BODY_LABELS[position.name] || position.name,
  sign: signLabel(position.longitude),
  degree: fmtDegree(position.longitude),
  nakshatra: nakshatraLabel(position.nakshatra),
  pada: position.nakshatra.pada,
  retrograde: position.retrograde,
})) || [])

const navamsaRows = computed(() => chart.value?.navamsa.map(position => ({
  name: position.name,
  label: VEDIC_BODY_LABELS[position.name] || position.name,
  rasi: signs.value[position.rasiSignIndex],
  navamsa: signs.value[position.navamsaSignIndex],
})) || [])

const dashaRows = computed(() => chart.value?.dashas?.mahadashas.slice(0, 9).map(period => ({
  lord: dashaLord(period.lord),
  start: jdDate(period.startJd),
  end: jdDate(period.endJd),
  active: chart.value.dashas.active?.mahadasha === period.lord,
})) || [])
</script>

<template lang="pug">
section.vedic-page(data-testid='vedic-page')
  div(v-if='!person' data-testid='no-person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div.grid.gap-6(v-else)
    .flex.flex-wrap.items-start.justify-between.gap-3
      div
        h1.text-2xl.font-semibold.text-slate-100 {{ t('vedic.title', { name: person.name }) }}
        p.text-xs.text-slate-400.mt-1 {{ person.isoLocal }} · {{ person.placeLabel }}
      ModalityRouteSwitch(active='vedic')

    .ui-panel
      .grid.gap-3(class='md:grid-cols-4')
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

    .ui-panel(v-if='loading' data-testid='vedic-loading')
      p.text-sm.text-slate-400 {{ t('vedic.loading') }}
    .ui-panel(v-else-if='error' data-testid='vedic-error')
      p.text-sm.text-rose-300 {{ error }}
    template(v-else-if='chart')
      .grid.gap-6(class='xl:grid-cols-[minmax(0,1fr)_minmax(552px,552px)_minmax(0,1fr)] xl:items-start')
        .grid.gap-3.order-2(class='sm:grid-cols-2 xl:order-1 xl:grid-cols-1')
          .rounded.border.p-3(
            v-for='row in summaryRows'
            :key='row.key'
            class='border-white/10 bg-white/5'
            :data-testid='`vedic-summary-${row.key}`'
          )
            .text-xs.uppercase.tracking-wide.text-slate-500 {{ row.label }}
            .mt-1.text-lg.font-semibold.text-slate-100 {{ row.value }}
            .text-xs.text-slate-400.mt-1 {{ row.meta }}

        .ui-panel.order-1.flex.justify-center(class='xl:order-2' data-testid='vedic-chart-panel')
          ChartWheel(
            :charts='vedicMaps'
            :show-mode-controls='false'
            display-mode='print'
            :show-nakshatra-ring='true'
            v-if='vedicMaps.length'
          )

        .grid.gap-6.order-3(class='xl:order-3')
          .ui-panel
            h2.text-sm.font-semibold.text-slate-100.mb-3 {{ t('vedic.rasi_positions') }}
            .overflow-x-auto
              table.w-full.text-xs(data-testid='vedic-position-table')
                tbody
                  tr.border-t(class='border-white/5' v-for='row in placementRows' :key='row.name')
                    td.py-1.pr-2.text-slate-300 {{ row.label }}
                    td.py-1.px-2.text-slate-100 {{ row.sign }}
                    td.py-1.px-2.tabular-nums {{ row.degree }}
                    td.py-1.px-2.text-slate-400 {{ row.nakshatra }} {{ row.pada }}
                    td.py-1.pl-2.text-amber-300(v-if='row.retrograde') R
                    td.py-1.pl-2(v-else)
          .ui-panel
            h2.text-sm.font-semibold.text-slate-100.mb-3 {{ t('vedic.navamsa') }}
            .overflow-x-auto
              table.w-full.text-xs(data-testid='vedic-navamsa-table')
                tbody
                  tr.border-t(class='border-white/5' v-for='row in navamsaRows' :key='row.name')
                    td.py-1.pr-2.text-slate-300 {{ row.label }}
                    td.py-1.px-2.text-slate-400 {{ row.rasi }}
                    td.py-1.pl-2.text-slate-100 {{ row.navamsa }}

      .ui-panel
        h2.text-sm.font-semibold.text-slate-100.mb-3 {{ t('vedic.vimshottari') }}
        .grid.gap-2(class='md:grid-cols-3' data-testid='vedic-dasha-table')
          .rounded.border.p-3(
            v-for='row in dashaRows'
            :key='row.lord'
            class='border-white/10 bg-white/5'
            :class='row.active ? "ring-1 ring-amber-300/40" : ""'
          )
            .text-sm.font-semibold.text-slate-100 {{ row.lord }}
            .text-xs.text-slate-400.mt-1 {{ row.start }} - {{ row.end }}
</template>
