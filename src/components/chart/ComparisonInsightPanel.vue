<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { comparisonAspectInterpretations } from '../../lib/astro/interpretations.js'

const props = defineProps({
  aspects: { type: Array, default: () => [] },
  mode: {
    type: String,
    required: true,
    validator: value => ['transit', 'progression', 'synastry'].includes(value),
  },
  limit: { type: Number, default: 3 },
})

const { t } = useI18n()

const interpretedAspects = computed(() =>
  comparisonAspectInterpretations(props.aspects, props.mode, { limit: props.limit })
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

const applyingCount = computed(() => props.aspects.filter(aspect => aspect.applying).length)

const localizedPlanetList = planets =>
  planets.map(planet => t(`planets.${planet}`)).join(', ')

const rows = computed(() => interpretedAspects.value.map((item, index) => {
  if (item.kind === 'group') {
    return {
      key: item.key,
      kind: item.kind,
      eyebrow: t('comparison_insights.background'),
      title: t(item.titleKey),
      detail: t(item.textKey),
      meta: t(item.metaKey, {
        count: item.count,
        planets: localizedPlanetList(item.planets),
        orb: item.aspect.delta.toFixed(2),
      }),
    }
  }

  const aspect = item.aspect

  return {
    key: item.key,
    kind: item.kind,
    eyebrow: t('comparison_insights.theme_n', { n: index + 1 }),
    title: t(`comparison_insights.themes.${props.mode}.${aspect.type}`, {
      a: t(`planets.${aspect.a}`),
      b: t(`planets.${aspect.b}`),
    }),
    detail: t(item.textKey, {
      primary: t(`planets.${item.primaryPlanet}`),
      secondary: t(`planets.${item.secondaryPlanet}`),
      tone: t(item.toneKey),
    }),
    meta: t('comparison_insights.aspect_meta', {
      a: t(`planets.${aspect.a}`),
      aspect: t(`aspects.${aspect.type}`),
      b: t(`planets.${aspect.b}`),
      orb: aspect.delta.toFixed(2),
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
  .flex.flex-wrap.items-start.justify-between.gap-3.mb-4
    div
      h2.text-sm.font-semibold.text-slate-100 {{ t(`comparison_insights.titles.${mode}`) }}
      p.text-xs.text-slate-400 {{ t(`comparison_insights.subtitles.${mode}`) }}
    .flex.flex-wrap.gap-2.text-xs(v-if='dominantAspect')
      span.rounded-full.px-2.py-1.text-slate-300(class='bg-white/5')
        | {{ t('comparison_insights.dominant', { aspect: t(`aspects.${dominantAspect.type}`), count: dominantAspect.count }) }}
      span.rounded-full.px-2.py-1.text-slate-300(class='bg-white/5')
        | {{ t('comparison_insights.applying_count', { count: applyingCount }) }}

  .grid(
    v-if='rows.length'
    class='gap-4 divide-white/10 md:grid-cols-3 md:divide-x'
  )
    section.min-w-0(
      v-for='row in rows'
      :key='row.key'
      :data-insight-kind='row.kind'
      data-testid='comparison-insight-row'
      class='md:pr-4 last:pr-0'
    )
      .text-xs.uppercase.tracking-wide.text-slate-500 {{ row.eyebrow }}
      h3.mt-1.text-sm.font-semibold.text-slate-100 {{ row.title }}
      p.mt-2.text-xs.leading-5.text-slate-400 {{ row.detail }}
      p.mt-3.text-xs.text-amber-200 {{ row.meta }}

  p.text-sm.text-slate-400(v-else data-testid='comparison-insight-empty')
    | {{ t(`comparison_insights.empty.${mode}`) }}
</template>
