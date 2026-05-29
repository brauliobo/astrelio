<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { anglePlacements, chartSignature, placementFor, topAspects } from '../../lib/astro/analysis.js'
import { degInSign } from '../../lib/astro/zodiac.js'

const props = defineProps({
  chart: { type: Object, required: true },
  aspects: { type: Array, default: () => [] },
  phaseLabel: { type: String, default: '' },
})

const { t, tm } = useI18n()
const signs = computed(() => tm('zodiac.signs'))
const signature = computed(() => chartSignature(props.chart))
const angles = computed(() => anglePlacements(props.chart))

const fmtDegree = (lon) => {
  const d = degInSign(lon)
  const dd = Math.floor(d)
  const mm = Math.floor((d - dd) * 60)
  return `${dd}°${mm.toString().padStart(2, '0')}'`
}

const placementRows = computed(() => {
  const sun = placementFor(props.chart, 'Sun')
  const moon = placementFor(props.chart, 'Moon')
  return [
    sun && {
      key: 'sun',
      label: t('analysis.sun'),
      value: signs.value[sun.signIndex],
      meta: t('analysis.house_n', { house: sun.house }),
      degree: fmtDegree(sun.longitude),
    },
    moon && {
      key: 'moon',
      label: t('analysis.moon'),
      value: signs.value[moon.signIndex],
      meta: props.phaseLabel || t('analysis.house_n', { house: moon.house }),
      degree: fmtDegree(moon.longitude),
    },
    {
      key: 'ascendant',
      label: t('chart.asc'),
      value: signs.value[angles.value.ascendant.signIndex],
      meta: t('analysis.horizon'),
      degree: fmtDegree(angles.value.ascendant.longitude),
    },
    {
      key: 'mc',
      label: t('chart.mc'),
      value: signs.value[angles.value.mc.signIndex],
      meta: t('analysis.meridian'),
      degree: fmtDegree(angles.value.mc.longitude),
    },
  ].filter(Boolean)
})

const houseRows = computed(() => signature.value.houses.filter(row => row.value > 0).slice(0, 4))
const featuredAspects = computed(() => topAspects(props.aspects, 4))

const pct = (share) => `${Math.round(share * 100)}%`
</script>

<template lang="pug">
.chart-insight.ui-panel(data-testid='chart-insight')
  .flex.flex-wrap.items-start.justify-between.gap-3.mb-4
    div
      h2.text-sm.font-semibold.text-slate-100 {{ t('analysis.title') }}
      p.text-xs.text-slate-400 {{ t('analysis.subtitle') }}
    .text-xs.text-slate-400.tabular-nums {{ t(`zodiac.${chart.zodiac}`) || chart.zodiac }}
  .grid.gap-4(class='lg:grid-cols-4')
    .min-w-0(v-for='row in placementRows' :key='row.key' :data-testid='`insight-${row.key}`')
      .text-xs.uppercase.tracking-wide.text-slate-500 {{ row.label }}
      .mt-1.flex.items-baseline.gap-2
        .text-lg.font-semibold.text-slate-100.truncate {{ row.value }}
        .text-xs.text-slate-400.tabular-nums {{ row.degree }}
      .text-xs.text-slate-400.truncate {{ row.meta }}
  .grid.gap-5.mt-5(class='lg:grid-cols-2')
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
  .grid.gap-5.mt-5(class='lg:grid-cols-3')
    section
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.house_emphasis') }}
      .flex.flex-wrap.gap-2
        span.rounded-full.px-2.py-1.text-xs.text-slate-300(
          class='bg-white/5'
          v-for='row in houseRows'
          :key='row.house'
        ) {{ t('analysis.house_n', { house: row.house }) }} · {{ row.value }}
    section
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.angularity') }}
      .grid.gap-1(v-if='signature.angularPlanets.length')
        .text-xs.text-slate-300(v-for='item in signature.angularPlanets' :key='`${item.name}-${item.angle}`')
          | {{ t(`planets.${item.name}`) }} · {{ t(`analysis.angles.${item.angle}`) }} · {{ item.orb.toFixed(1) }}°
      p.text-xs.text-slate-500(v-else) {{ t('analysis.no_angular') }}
    section
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.retrogrades') }}
      .flex.flex-wrap.gap-2(v-if='signature.retrogrades.length')
        span.rounded-full.px-2.py-1.text-xs.text-amber-200(
          class='bg-white/5'
          v-for='name in signature.retrogrades'
          :key='name'
        ) {{ t(`planets.${name}`) }} ℞
      p.text-xs.text-slate-500(v-else) {{ t('analysis.no_retrogrades') }}
  section.mt-5(v-if='featuredAspects.length')
    h3.text-xs.font-semibold.text-slate-300.mb-3 {{ t('analysis.top_aspects') }}
    .grid.gap-2(class='sm:grid-cols-2')
      .text-xs.text-slate-300(v-for='aspect in featuredAspects' :key='`${aspect.a}-${aspect.b}-${aspect.type}`')
        span.text-slate-100 {{ t(`planets.${aspect.a}`) }}
        span.text-slate-500  · 
        span {{ t(`aspects.${aspect.type}`) }}
        span.text-slate-500  · 
        span.text-slate-100 {{ t(`planets.${aspect.b}`) }}
        span.text-slate-500  · 
        span.tabular-nums {{ aspect.delta.toFixed(2) }}°
</template>
