<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeReadingDocument } from '../../lib/readings/presentation.js'

const props = defineProps({
  document: { type: Object, required: true },
})

const { t } = useI18n()
const reading = computed(() => normalizeReadingDocument(props.document, t))

const guidanceSections = computed(() => reading.value ? [
  { id: 'strengths', items: reading.value.guidance.strengths },
  { id: 'challenges', items: reading.value.guidance.challenges },
  { id: 'practices', items: reading.value.guidance.practices },
].filter(section => section.items.length) : [])
</script>

<template lang="pug">
article.reading-document.grid.gap-6(v-if='reading' data-testid='reading-document-view')
  header
    h2.text-2xl.font-semibold.text-slate-100 {{ reading.title }}

  section.ui-panel(v-if='reading.themes.length' data-testid='reading-themes')
    h3.text-sm.font-semibold.text-slate-100 {{ t('readings.presentation.sections.themes') }}
    .grid.gap-3.mt-4(class='md:grid-cols-2')
      article.rounded.p-3.text-sm.leading-6.text-slate-300(
        v-for='theme in reading.themes'
        :key='theme.id'
        class='bg-white/5'
      )
        p {{ theme.text }}

  .grid.gap-4(v-if='reading.chapters.length' data-testid='reading-chapters')
    section.ui-panel(v-for='chapter in reading.chapters' :key='chapter.id' :data-testid='`reading-chapter-${chapter.id}`')
      h3.text-base.font-semibold.text-slate-100 {{ chapter.title }}
      .grid.gap-3.mt-4
        article.text-sm.leading-6.text-slate-300(v-for='item in chapter.items' :key='item.id')
          p {{ item.text }}

  section.ui-panel(v-if='reading.prominence.length' data-testid='reading-prominence')
    h3.text-sm.font-semibold.text-slate-100 {{ t('readings.presentation.sections.prominence') }}
    .grid.gap-2.mt-4
      article.rounded.px-3.py-2.text-xs.text-slate-300(
        v-for='item in reading.prominence'
        :key='item.id'
        class='bg-white/5'
      )
        p {{ item.text }}

  .grid.gap-4(v-if='guidanceSections.length' class='lg:grid-cols-3')
    section.ui-panel(
      v-for='section in guidanceSections'
      :key='section.id'
      :data-testid='`reading-${section.id}`'
    )
      h3.text-sm.font-semibold.text-slate-100 {{ t(`readings.presentation.sections.${section.id}`) }}
      .grid.gap-3.mt-4
        article.text-sm.leading-6.text-slate-300(v-for='item in section.items' :key='item.id')
          p {{ item.text }}

  aside.ui-panel(v-if='reading.caveats.length' data-testid='reading-caveats')
    h3.text-sm.font-semibold.text-slate-100 {{ t('readings.presentation.sections.caveats') }}
    p.mt-3.text-xs.leading-5.text-slate-400(v-for='(caveat, index) in reading.caveats' :key='index') {{ caveat }}
</template>
