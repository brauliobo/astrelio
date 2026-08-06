<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { relationshipHouseCorrelations, timingHouseCorrelations } from '../../lib/astro/house-correlations.js'
import { comparisonAspectInterpretations } from '../../lib/astro/interpretations.js'
import HouseCorrelationPanel from './HouseCorrelationPanel.vue'

const props = defineProps({
  aspects:    { type: Array, default: () => [] },
  base:       { type: Object, default: null },
  comparison: { type: Object, default: null },
  mode:       {
    type:      String,
    required:  true,
    validator: value => ['transit', 'progression', 'synastry'].includes(value),
  },
  limit: { type: Number, default: 3 },
})

const { t } = useI18n()

const interpretedAspects = computed(() =>
  comparisonAspectInterpretations(props.aspects, props.mode, {
    limit:           props.limit,
    baseChart:       props.base,
    comparisonChart: props.comparison,
  })
)

const dominantAspect = computed(() => {
  const scores = new Map()
  for (const aspect of props.aspects) {
    const current = scores.get(aspect.type) || { type: aspect.type, count: 0, strength: 0 }
    current.count += 1
    current.strength += aspect.strength || 0
    scores.set(aspect.type, current)
  }
  return [...scores.values()].sort((a, b) => b.strength - a.strength || b.count - a.count)[0] || null
})

const applyingCount     = computed(() => props.aspects.filter(aspect => aspect.applying).length)
const houseCorrelations = computed(() => {
  if (!props.base || !props.comparison) return null
  return props.mode === 'synastry'
    ? relationshipHouseCorrelations(props.base, props.comparison, props.aspects)
    : timingHouseCorrelations(props.base, props.comparison, props.aspects, props.mode)
})

const localizedPlanetList = planets =>
  planets.map(planet => t(`planets.${planet}`)).join(', ')

const rows = computed(() => interpretedAspects.value.map((item, index) => {
  if (item.kind === 'group') {
    return {
      key:     item.key,
      kind:    item.kind,
      eyebrow: t('comparison_insights.background'),
      title:   t(item.titleKey),
      detail:  t(item.textKey),
      meta:    t(item.metaKey, {
        count:   item.count,
        planets: localizedPlanetList(item.planets),
        orb:     item.aspect.delta.toFixed(2),
      }),
    }
  }

  const aspect = item.aspect

  return {
    key:     item.key,
    kind:    item.kind,
    eyebrow: t('comparison_insights.theme_n', { n: index + 1 }),
    title:   t(`comparison_insights.themes.${props.mode}.${aspect.type}`, {
      a: t(`planets.${aspect.a}`),
      b: t(`planets.${aspect.b}`),
    }),
    detail: t(item.textKey, {
      primary:   t(`planets.${item.primaryPlanet}`),
      secondary: t(`planets.${item.secondaryPlanet}`),
      tone:      t(item.toneKey),
    }),
    meta: item.kind === 'transit' && aspect.rank?.transitHouse
      ? t('comparison_insights.transit_aspect_meta', {
        a:      t(`planets.${aspect.a}`),
        aspect: t(`aspects.${aspect.type}`),
        b:      t(`planets.${aspect.b}`),
        orb:    aspect.delta.toFixed(2),
        motion: aspect.applying ? t('aspects.applying') : t('aspects.separating'),
        house:  aspect.rank.transitHouse,
      })
      : t('comparison_insights.aspect_meta', {
        a:      t(`planets.${aspect.a}`),
        aspect: t(`aspects.${aspect.type}`),
        b:      t(`planets.${aspect.b}`),
        orb:    aspect.delta.toFixed(2),
        motion: aspect.applying ? t('aspects.applying') : t('aspects.separating'),
      }),
  }
}))
</script>

<template lang="pug">
.comparison-insight-panel.ui-panel(
  data-testid='comparison-insight-panel'
  :data-flow='mode'
)
  .comparison-insight-panel__header.flex.flex-wrap.items-start.justify-between.gap-3.mb-4
    .comparison-insight-panel__heading
      h2.text-sm.font-semibold.text-slate-100 {{ t(`comparison_insights.titles.${mode}`) }}
      p.text-xs.text-slate-400 {{ t(`comparison_insights.subtitles.${mode}`) }}
    .comparison-insight-panel__summary.flex.flex-wrap.gap-2.text-xs(v-if='dominantAspect')
      span.rounded-full.px-2.py-1.text-slate-300(class='bg-white/5')
        | {{ t('comparison_insights.dominant', { aspect: t(`aspects.${dominantAspect.type}`), count: dominantAspect.count }) }}
      span.rounded-full.px-2.py-1.text-slate-300(class='bg-white/5')
        | {{ t('comparison_insights.applying_count', { count: applyingCount }) }}

  .comparison-insight-panel__rows(
    v-if='rows.length'
  )
    section.comparison-insight-panel__row(
      v-for='row in rows'
      :key='row.key'
      :data-insight-kind='row.kind'
      data-testid='comparison-insight-row'
    )
      .text-xs.uppercase.tracking-wide.text-slate-500 {{ row.eyebrow }}
      h3.mt-1.text-sm.font-semibold.text-slate-100 {{ row.title }}
      p.mt-2.text-xs.leading-5.text-slate-400 {{ row.detail }}
      p.mt-3.text-xs.text-amber-200 {{ row.meta }}

  p.text-sm.text-slate-400(v-else data-testid='comparison-insight-empty')
    | {{ t(`comparison_insights.empty.${mode}`) }}
  HouseCorrelationPanel.mt-5(
    v-if='houseCorrelations'
    :correlations='houseCorrelations'
  )
</template>

<style scoped>
.comparison-insight-panel {
  container-type: inline-size;
  max-width: 100%;
  min-width: 0;
  width: 100%;
}

.comparison-insight-panel__header,
.comparison-insight-panel__heading,
.comparison-insight-panel__summary,
.comparison-insight-panel__row {
  min-width: 0;
}

.comparison-insight-panel__heading {
  flex: 1 1 14rem;
}

.comparison-insight-panel__summary {
  flex: 0 1 auto;
  justify-content: flex-end;
}

.comparison-insight-panel__rows {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.comparison-insight-panel__row h3,
.comparison-insight-panel__row p {
  overflow-wrap: anywhere;
}

@container (min-width: 42rem) {
  .comparison-insight-panel__rows {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .comparison-insight-panel__row {
    border-right: 1px solid rgb(255 255 255 / 0.1);
    padding-right: 1rem;
  }

  .comparison-insight-panel__row:last-child {
    border-right: 0;
    padding-right: 0;
  }
}
</style>
