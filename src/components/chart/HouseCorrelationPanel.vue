<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  correlations: { type: Object, default: null },
  limit: { type: Number, default: 5 },
})

const { t, tm, te } = useI18n()

const houseNames = computed(() => {
  const names = tm('houses.names')
  return Array.isArray(names) ? names : []
})

const topRows = computed(() =>
  (props.correlations?.ranked || []).slice(0, props.limit)
)
const allRows = computed(() => props.correlations?.houses || [])
const hasRows = computed(() => topRows.value.length > 0)

const houseLabel = (house) => {
  const name = houseNames.value[house - 1] || ''
  if (te('houses.numbered_name') && name) return t('houses.numbered_name', { house, name })
  return te('analysis.house_n') ? t('analysis.house_n', { house }) : `House ${house}`
}

const planetLabel = planet => planet ? t(`planets.${planet}`) : ''
const aspectLabel = aspect => aspect ? t(`aspects.${aspect}`) : ''
const pct = share => `${Math.round((share || 0) * 100)}%`

const reasonText = (reason) => {
  const key = `house_correlations.reasons.${reason.type}`
  if (!te(key)) return ''
  return t(key, {
    planet: planetLabel(reason.planet),
    partner: planetLabel(reason.partner),
    ruler: planetLabel(reason.ruler),
    aspect: aspectLabel(reason.aspect),
    house: reason.house,
    rulerHouse: reason.rulerHouse,
  })
}

const planetList = rows =>
  rows.map(row => planetLabel(row.planet)).filter(Boolean).join(', ')

const aspectList = rows =>
  rows
    .slice(0, 4)
    .map(row => `${planetLabel(row.a)} ${aspectLabel(row.type)} ${planetLabel(row.b)}`)
    .join(' · ')
</script>

<template lang="pug">
section.house-correlation-panel(data-testid='house-correlation-panel')
  .flex.flex-wrap.items-start.justify-between.gap-3.mb-3
    div
      h3.text-xs.font-semibold.text-slate-300 {{ t('house_correlations.title') }}
      p.text-xs.text-slate-500.mt-1 {{ t('house_correlations.subtitle') }}
    span.rounded-full.px-2.py-1.text-xs.text-slate-300(
      v-if='correlations?.summary?.dominantMode'
      class='bg-white/5'
    ) {{ t(`house_correlations.modes.${correlations.summary.dominantMode}`) }}

  .grid.gap-3(v-if='hasRows' data-testid='house-correlation-top')
    article.house-correlation-panel__row.rounded.border.p-3(
      v-for='row in topRows'
      :key='`top-${row.house}`'
      class='border-white/10 bg-white/5'
      data-testid='house-correlation-row'
    )
      .flex.items-start.justify-between.gap-3
        div.min-w-0
          h4.text-sm.font-semibold.text-slate-100 {{ houseLabel(row.house) }}
          p.text-xs.text-slate-500.mt-1 {{ t(row.topicsKey) }}
        .text-xs.text-amber-200.tabular-nums {{ pct(row.share) }}
      ul.mt-2.grid.gap-1
        li.text-xs.leading-5.text-slate-400(
          v-for='(reason, index) in row.reasons.slice(0, 4)'
          :key='`${row.house}-${reason.type}-${index}`'
        ) {{ reasonText(reason) }}

  p.text-xs.text-slate-500(v-else data-testid='house-correlation-empty') {{ t('house_correlations.empty') }}

  details.mt-4(v-if='allRows.length' data-testid='house-correlation-details')
    summary.cursor-pointer.text-xs.font-semibold.text-slate-300 {{ t('house_correlations.all_houses') }}
    .mt-3.grid.gap-2
      .house-correlation-panel__detail.rounded.border.p-2(
        v-for='row in allRows'
        :key='`detail-${row.house}`'
        class='border-white/10 bg-white/5'
      )
        .flex.flex-wrap.items-center.justify-between.gap-2
          .text-xs.font-semibold.text-slate-200 {{ houseLabel(row.house) }}
          .text-xs.text-slate-400.tabular-nums {{ pct(row.share) }}
        .mt-1.text-xs.leading-5.text-slate-500
          span(v-if='row.occupants.length') {{ t('house_correlations.occupants') }}: {{ planetList(row.occupants) }}
          span(v-if='row.occupants.length && row.ruler')  ·
          span(v-if='row.ruler') {{ t('house_correlations.ruler') }}: {{ planetLabel(row.ruler) }}
          span(v-if='row.rulerHouse')  {{ t('house_correlations.in_house', { house: row.rulerHouse }) }}
          span(v-if='row.activators.length')  · {{ t('house_correlations.activators') }}: {{ planetList(row.activators) }}
          span(v-if='row.aspects.length')  · {{ t('house_correlations.aspects') }}: {{ aspectList(row.aspects) }}
</template>

<style scoped>
.house-correlation-panel__row,
.house-correlation-panel__detail {
  min-width: 0;
}
</style>
