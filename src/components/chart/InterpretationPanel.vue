<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { natalInterpretationSections } from '../../lib/astro/interpretations.js'

const props = defineProps({
  chart:          { type: Object, required: true },
  aspects:        { type: Array, default: () => [] },
  placementLimit: { type: Number, default: 5 },
  aspectLimit:    { type: Number, default: 3 },
})

const { t, tm } = useI18n()
const signs = computed(() => tm('zodiac.signs'))

const formatPlacement = (item) => {
  const planet = t(`planets.${item.planet}`)

  return {
    key:   item.key,
    title: t(item.titleKey, {
      planet,
      sign:  signs.value[item.signIndex],
      house: item.house,
    }),
    lines: [
      t(item.signTextKey, {
        planet,
        role: t(item.roleKey),
        tone: t(item.signToneKey),
      }),
      t(item.houseTextKey, {
        house: item.house,
        area:  t(item.houseAreaKey),
      }),
    ],
  }
}

const formatAspect = (item) => {
  const aspect = item.aspect

  return {
    key:   item.key,
    title: t(item.titleKey, {
      a:      t(`planets.${aspect.a}`),
      aspect: t(`aspects.${aspect.type}`),
      b:      t(`planets.${aspect.b}`),
    }),
    lines: [
      t(item.textKey, {
        aspect: t(`aspects.${aspect.type}`),
        tone:   t(item.toneKey),
      }),
    ],
  }
}

const displaySections = computed(() =>
  natalInterpretationSections(props.chart, props.aspects, {
    placementLimit: props.placementLimit,
    aspectLimit:    props.aspectLimit,
  }).map(section => ({
    key:   section.key,
    title: t(section.titleKey),
    items: section.items.map(item => item.kind === 'placement' ? formatPlacement(item) : formatAspect(item)),
  }))
)
</script>

<template lang="pug">
.interpretation-panel.ui-panel(data-testid='interpretation-panel')
  .mb-4
    h2.text-sm.font-semibold.text-slate-100 {{ t('interpretations.title') }}
    p.text-xs.text-slate-400 {{ t('interpretations.subtitle') }}
  .grid.gap-5(class='lg:grid-cols-2')
    section.min-w-0(
      v-for='section in displaySections'
      :key='section.key'
      :data-testid='`interpretation-section-${section.key}`'
    )
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ section.title }}
      .grid.gap-3
        article.rounded.p-3(
          v-for='item in section.items'
          :key='item.key'
          class='bg-white/5'
          data-testid='interpretation-item'
        )
          h4.text-sm.font-semibold.text-slate-100 {{ item.title }}
          p.mt-2.text-xs.leading-5.text-slate-400(
            v-for='line in item.lines'
            :key='line'
          ) {{ line }}
</template>
