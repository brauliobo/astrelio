<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { anglePlacements, chartSignature, placementFor, topAspects } from '../../lib/astro/analysis.js'
import { combinedHouseCorrelations } from '../../lib/astro/house-correlations.js'
import { degInSign } from '../../lib/astro/zodiac.js'
import HouseCorrelationPanel from './HouseCorrelationPanel.vue'

const props = defineProps({
  chart:               { type: Object, required: true },
  aspects:             { type: Array, default: () => [] },
  phaseLabel:          { type: String, default: '' },
  panel:               { type: String, default: 'full' },
  timingChart:         { type: Object, default: null },
  timingAspects:       { type: Array, default: () => [] },
  timingMode:          { type: String, default: 'transit' },
  relationshipChart:   { type: Object, default: null },
  relationshipAspects: { type: Array, default: () => [] },
  houseCorrelations:   { type: Object, default: null },
})

const { t, tm } = useI18n()
const signs           = computed(() => tm('zodiac.signs'))
const signature       = computed(() => chartSignature(props.chart))
const angles          = computed(() => anglePlacements(props.chart))
const tropical        = computed(() => signature.value.tropical)
const activeDetailTab = ref('patterns')

const fmtDegree = (lon) => {
  const d  = degInSign(lon)
  const dd = Math.floor(d)
  const mm = Math.floor((d - dd) * 60)
  return `${dd}°${mm.toString().padStart(2, '0')}'`
}

const placementRows = computed(() => {
  const sun  = placementFor(props.chart, 'Sun')
  const moon = placementFor(props.chart, 'Moon')
  return [
    sun && {
      key:    'sun',
      label:  t('analysis.sun'),
      value:  signs.value[sun.signIndex],
      meta:   t('analysis.house_n', { house: sun.house }),
      degree: fmtDegree(sun.longitude),
    },
    moon && {
      key:    'moon',
      label:  t('analysis.moon'),
      value:  signs.value[moon.signIndex],
      meta:   props.phaseLabel || t('analysis.house_n', { house: moon.house }),
      degree: fmtDegree(moon.longitude),
    },
    {
      key:    'ascendant',
      label:  t('chart.asc'),
      value:  signs.value[angles.value.ascendant.signIndex],
      meta:   t('analysis.horizon'),
      degree: fmtDegree(angles.value.ascendant.longitude),
    },
    {
      key:    'mc',
      label:  t('chart.mc'),
      value:  signs.value[angles.value.mc.signIndex],
      meta:   t('analysis.meridian'),
      degree: fmtDegree(angles.value.mc.longitude),
    },
  ].filter(Boolean)
})

const houseRows      = computed(() => signature.value.houses.filter(row => row.value > 0).slice(0, 4))
const chartRuler     = computed(() => tropical.value?.chartRuler || null)
const houseRulerRows = computed(() => {
  const rulers = tropical.value?.houseRulers || []
  return houseRows.value
    .map(row => rulers[row.house - 1])
    .filter(Boolean)
})
const sect           = computed(() => tropical.value?.sect || null)
const hemisphereRows = computed(() => [
  signature.value.hemisphereEmphasis.horizontal,
  signature.value.hemisphereEmphasis.vertical,
].filter(Boolean))
const dignityRows     = computed(() => tropical.value?.dignityBasics?.slice(0, 4) || [])
const featuredAspects = computed(() => topAspects(props.aspects, 4))
const correlations    = computed(() =>
  props.houseCorrelations || combinedHouseCorrelations({
    natalChart:          props.chart,
    natalAspects:        props.aspects,
    timingChart:         props.timingChart,
    timingAspects:       props.timingAspects,
    timingMode:          props.timingMode,
    relationshipChart:   props.relationshipChart,
    relationshipAspects: props.relationshipAspects,
  })
)
const showPrimary   = computed(() => props.panel !== 'right')
const showDetails   = computed(() => props.panel !== 'left')
const useDetailTabs = computed(() => props.panel === 'right')
const detailTabs    = [
  { key: 'patterns', labelKey: 'analysis.detail_tabs.patterns' },
  { key: 'factors', labelKey: 'analysis.detail_tabs.factors' },
  { key: 'houses', labelKey: 'analysis.detail_tabs.houses' },
]
const placementGridClass = computed(() => props.panel === 'full' ? 'lg:grid-cols-4' : 'grid-cols-2')
const balanceGridClass   = computed(() => props.panel === 'full' ? 'lg:grid-cols-2' : '')
const detailGridClass    = computed(() => props.panel === 'full' ? 'lg:grid-cols-3' : '')
const aspectGridClass    = computed(() => props.panel === 'full' ? 'sm:grid-cols-2' : '')

const pct           = (share) => `${Math.round(share * 100)}%`
const showDetailTab = tab => !useDetailTabs.value || activeDetailTab.value === tab
</script>

<template lang="pug">
.chart-insight.ui-panel(data-testid='chart-insight' :data-panel='panel')
  .flex.flex-wrap.items-start.justify-between.gap-3.mb-4(v-if='showPrimary')
    div
      h2.text-sm.font-semibold.text-slate-100 {{ t('analysis.title') }}
      p.text-xs.text-slate-400 {{ t('analysis.subtitle') }}
    .text-xs.text-slate-400.tabular-nums {{ t(`zodiac.${chart.zodiac}`) || chart.zodiac }}
  .grid.gap-4(v-if='showPrimary' :class='placementGridClass')
    .min-w-0(v-for='row in placementRows' :key='row.key' :data-testid='`insight-${row.key}`')
      .text-xs.uppercase.tracking-wide.text-slate-500 {{ row.label }}
      .mt-1.flex.items-baseline.gap-2
        .text-lg.font-semibold.text-slate-100.truncate {{ row.value }}
        .text-xs.text-slate-400.tabular-nums {{ row.degree }}
      .text-xs.text-slate-400.truncate {{ row.meta }}
  .grid.gap-5.mt-5(v-if='showPrimary' :class='balanceGridClass')
    section
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.element_balance') }}
      .grid.gap-2
        .grid.items-center.gap-3(class='grid-cols-[5rem_1fr_3rem]' v-for='row in signature.elements' :key='row.key')
          .text-xs.text-slate-400 {{ t(`analysis.elements.${row.key}`) }}
          .h-2.rounded-full(class='bg-white/10')
            .h-2.rounded-full.bg-amber-300(:style='{ width: pct(row.share) }')
          .text-xs.text-right.text-slate-400.tabular-nums {{ pct(row.share) }}
    section
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.modality_balance') }}
      .grid.gap-2
        .grid.items-center.gap-3(class='grid-cols-[5rem_1fr_3rem]' v-for='row in signature.modalities' :key='row.key')
          .text-xs.text-slate-400 {{ t(`analysis.modalities.${row.key}`) }}
          .h-2.rounded-full(class='bg-white/10')
            .h-2.rounded-full.bg-sky-300(:style='{ width: pct(row.share) }')
          .text-xs.text-right.text-slate-400.tabular-nums {{ pct(row.share) }}
  .chart-insight__tabs.mt-1.mb-4(
    v-if='showDetails && useDetailTabs'
    role='tablist'
    :aria-label='t("analysis.detail_tabs.label")'
    data-testid='insight-detail-tabs'
  )
    button.chart-insight__tab(
      v-for='tab in detailTabs'
      :key='tab.key'
      type='button'
      role='tab'
      :aria-selected='activeDetailTab === tab.key'
      :data-testid='`insight-tab-${tab.key}`'
      :class='activeDetailTab === tab.key ? "chart-insight__tab--active" : ""'
      @click='activeDetailTab = tab.key'
    ) {{ t(tab.labelKey) }}
  .grid.gap-5(:class='[showPrimary ? "mt-5" : "", detailGridClass]' v-if='showDetails && showDetailTab("patterns")')
    section
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.house_emphasis') }}
      .flex.flex-wrap.gap-2
        span.rounded-full.px-2.py-1.text-xs.text-slate-300(
          class='bg-white/5'
          v-for='row in houseRows'
          :key='row.house'
        ) {{ t('analysis.house_n', { house: row.house }) }} · {{ row.value }}
    section(v-if='chartRuler')
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.chart_ruler') }}
      .text-xs.text-slate-300
        span.text-slate-100 {{ t(`planets.${chartRuler.planet}`) }}
        span.text-slate-500  ·
        span {{ signs[chartRuler.signIndex] }}
        span.text-slate-500  ·
        span {{ t('analysis.house_n', { house: chartRuler.house }) }}
      p.mt-1.text-xs.text-slate-500 {{ t('analysis.ruler_of_asc', { sign: signs[chartRuler.ascSignIndex] }) }}
    section(v-if='sect')
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.sect_hemispheres') }}
      .flex.flex-wrap.gap-2
        span.rounded-full.px-2.py-1.text-xs.text-slate-300(class='bg-white/5')
          | {{ t(`analysis.sect_types.${sect.type}`) }} · {{ t(`planets.${sect.light}`) }}
        span.rounded-full.px-2.py-1.text-xs.text-slate-300(
          class='bg-white/5'
          v-for='row in hemisphereRows'
          :key='row.key'
        ) {{ t(`analysis.hemispheres.${row.key}`) }} · {{ pct(row.share) }}
      p.mt-2.text-xs.text-slate-500
        | {{ t('analysis.sect_detail', { benefic: t(`planets.${sect.benefic}`), malefic: t(`planets.${sect.maleficInSect}`) }) }}
    section(v-if='houseRulerRows.length')
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.house_rulers') }}
      .grid.gap-1
        .text-xs.text-slate-300(v-for='row in houseRulerRows' :key='row.house')
          span.text-slate-500 {{ t('analysis.house_n', { house: row.house }) }}
          span.text-slate-500  ·
          span.text-slate-100 {{ t(`planets.${row.ruler}`) }}
          span(v-if='row.rulerHouse')
            span.text-slate-500  ·
            span {{ t('analysis.house_n', { house: row.rulerHouse }) }}
  .grid.gap-5(:class='[showPrimary ? "mt-5" : "", detailGridClass]' v-if='showDetails && showDetailTab("factors")')
    section
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.angularity') }}
      .grid.gap-1(v-if='signature.angularPlanets.length')
        .text-xs.text-slate-300(v-for='item in signature.angularPlanets' :key='`${item.name}-${item.angle}`')
          | {{ t(`planets.${item.name}`) }} · {{ t(`analysis.angles.${item.angle}`) }} · {{ item.orb.toFixed(1) }}°
      p.text-xs.text-slate-500(v-else) {{ t('analysis.no_angular') }}
    section
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.retrogrades') }}
      .flex.flex-wrap.gap-2(v-if='signature.retrogrades.length')
        span.insight-retrograde-chip.rounded-full.px-2.py-1.text-xs(
          class='bg-white/5'
          v-for='name in signature.retrogrades'
          :key='name'
        ) {{ t(`planets.${name}`) }} ℞
      p.text-xs.text-slate-500(v-else) {{ t('analysis.no_retrogrades') }}
    section(v-if='dignityRows.length')
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.dignity_basics') }}
      .grid.gap-1
        .text-xs.text-slate-300(v-for='row in dignityRows' :key='`${row.planet}-${row.dignities.join("-")}`')
          span.text-slate-100 {{ t(`planets.${row.planet}`) }}
          span.text-slate-500  ·
          span {{ row.dignities.map(dignity => t(`analysis.dignities.${dignity}`)).join(', ') }}
          span.text-slate-500  ·
          span {{ signs[row.signIndex] }}
  section.mt-5(v-if='showDetails && showDetailTab("factors") && featuredAspects.length')
    h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.top_aspects') }}
    .grid.gap-2(:class='aspectGridClass')
      .text-xs.text-slate-300(v-for='aspect in featuredAspects' :key='`${aspect.a}-${aspect.b}-${aspect.type}`')
        span.text-slate-100 {{ t(`planets.${aspect.a}`) }}
        span.text-slate-500  ·
        span {{ t(`aspects.${aspect.type}`) }}
        span.text-slate-500  ·
        span.text-slate-100 {{ t(`planets.${aspect.b}`) }}
        span.text-slate-500  ·
        span.tabular-nums {{ aspect.delta.toFixed(2) }}°
  HouseCorrelationPanel.mt-5(
    v-if='showDetails && showDetailTab("houses")'
    :correlations='correlations'
  )
</template>

<style scoped>
.chart-insight__tabs {
  background: color-mix(in srgb, var(--app-panel-muted, #ffffff) 8%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  display: grid;
  gap: 0.25rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0.25rem;
}

.chart-insight__tab {
  border-radius: 0.375rem;
  color: var(--app-text-soft);
  font-size: 0.75rem;
  font-weight: 700;
  min-height: 1.875rem;
  padding: 0.25rem 0.375rem;
}

.chart-insight__tab:hover,
.chart-insight__tab:focus-visible {
  background: var(--chart-control-hover-bg);
  color: var(--chart-control-text);
}

.chart-insight__tab:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.chart-insight__tab--active {
  background: rgb(252 211 77);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.28);
  color: rgb(15 23 42);
}

.insight-retrograde-chip {
  color: var(--chart-retrograde-text);
}
</style>
