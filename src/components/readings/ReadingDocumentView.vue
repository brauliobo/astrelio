<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  broadcastChartHighlight,
  CHART_HIGHLIGHT_EVENT,
  normalizeHighlight,
  sameHighlight,
  viewportRect,
} from '../../lib/chart/highlight.js'
import { normalizeReadingDocument } from '../../lib/readings/presentation.js'
import ReadingText from './ReadingText.vue'

const props = defineProps({
  document: { type: Object, required: true },
  chart:    { type: Object, default: null },
})

const { t } = useI18n()
const slots = useSlots()
const reading = computed(() => normalizeReadingDocument(props.document, t))
const hoverHighlight  = ref(null)
const pinnedHighlight = ref(null)
const pinnedAnchor    = ref(null)
let broadcasting      = false

const guidanceSections = computed(() => reading.value ? [
  { id: 'strengths', items: reading.value.guidance.strengths },
  { id: 'challenges', items: reading.value.guidance.challenges },
  { id: 'practices', items: reading.value.guidance.practices },
].filter(section => section.items.length) : [])

const activeHighlight    = computed(() => hoverHighlight.value || pinnedHighlight.value)
const referencePlacement = computed(() => {
  if (!slots.reference || !reading.value) return null
  if (reading.value.themes.length) return 'themes'
  if (reading.value.prominence.length) return 'prominence'
  if (reading.value.chapters.length) return 'chapter'
  return null
})

const broadcastHighlight = (highlight, pinned = false, anchor = null) => {
  broadcasting = true
  try {
    broadcastChartHighlight({ highlight, pinned, chart: props.chart, anchor })
  } finally {
    broadcasting = false
  }
}

const onSharedHighlight = (event) => {
  if (broadcasting) return
  const highlight = event.detail?.highlight ? normalizeHighlight(event.detail.highlight) : null
  if (event.detail?.pinned) {
    pinnedHighlight.value = highlight
    pinnedAnchor.value    = highlight ? event.detail?.anchor || null : null
    hoverHighlight.value  = null
  } else {
    hoverHighlight.value = highlight
  }
}

const eventAnchor = event => viewportRect(event?.currentTarget?.getBoundingClientRect())

const setHoverKeyword = (item, event) => {
  const anchor         = eventAnchor(event)
  hoverHighlight.value = item.highlight
  broadcastHighlight(item.highlight, false, anchor)
}

const clearHoverKeyword = () => {
  hoverHighlight.value = null
  broadcastHighlight(null)
}

const togglePinnedKeyword = (item, event) => {
  const clearing        = pinnedHighlight.value && sameHighlight(pinnedHighlight.value, item.highlight)
  pinnedHighlight.value = clearing ? null : item.highlight
  pinnedAnchor.value    = clearing ? null : eventAnchor(event)
  hoverHighlight.value  = null
  broadcastHighlight(pinnedHighlight.value, true, pinnedAnchor.value)
}

onMounted(() => window.addEventListener(CHART_HIGHLIGHT_EVENT, onSharedHighlight))
onBeforeUnmount(() => window.removeEventListener(CHART_HIGHLIGHT_EVENT, onSharedHighlight))
</script>

<template lang="pug">
article.reading-document.grid.gap-6(v-if='reading' data-testid='reading-document-view')
  header
    h2.text-2xl.font-semibold.text-slate-100 {{ reading.title }}

  section.ui-panel(v-if='reading.themes.length' data-testid='reading-themes')
    h3.text-sm.font-semibold.text-slate-100 {{ t('readings.presentation.sections.themes') }}
    .reading-reference-layout.mt-4(
      :class='{ "reading-reference-layout--split": referencePlacement === "themes" }'
      :data-reading-reference-layout='referencePlacement === "themes" ? "themes" : undefined'
    )
      .grid.gap-3(data-testid='reading-theme-items' class='md:grid-cols-2')
        article.rounded.p-3.text-sm.leading-6.text-slate-300(
          v-for='theme in reading.themes'
          :key='theme.id'
          class='bg-white/5'
        )
          ReadingText(
            :row='theme'
            :active-highlight='activeHighlight'
            :pinned-highlight='pinnedHighlight'
            @hover='setHoverKeyword'
            @clear-hover='clearHoverKeyword'
            @toggle-pin='togglePinnedKeyword'
          )
      article.reading-reference-chart.rounded.p-3(
        v-if='referencePlacement === "themes"'
        data-testid='reading-reference-chart'
        class='bg-white/5'
      )
        slot(name='reference')

  .grid.gap-4(v-if='reading.chapters.length' data-testid='reading-chapters')
    section.ui-panel(v-for='chapter in reading.chapters' :key='chapter.id' :data-testid='`reading-chapter-${chapter.id}`')
      h3.text-base.font-semibold.text-slate-100 {{ chapter.title }}
      .reading-reference-layout.mt-4(
        :class='{ "reading-reference-layout--split": referencePlacement === "chapter" && chapter === reading.chapters[0] }'
        :data-reading-reference-layout='referencePlacement === "chapter" && chapter === reading.chapters[0] ? "chapter" : undefined'
      )
        .grid.gap-3(data-testid='reading-chapter-items')
          article.text-sm.leading-6.text-slate-300(v-for='item in chapter.items' :key='item.id')
            ReadingText(
              :row='item'
              :active-highlight='activeHighlight'
              :pinned-highlight='pinnedHighlight'
              @hover='setHoverKeyword'
              @clear-hover='clearHoverKeyword'
              @toggle-pin='togglePinnedKeyword'
            )
        article.reading-reference-chart.rounded.p-3(
          v-if='referencePlacement === "chapter" && chapter === reading.chapters[0]'
          data-testid='reading-reference-chart'
          class='bg-white/5'
        )
          slot(name='reference')

  section.ui-panel(v-if='reading.prominence.length' data-testid='reading-prominence')
    h3.text-sm.font-semibold.text-slate-100 {{ t('readings.presentation.sections.prominence') }}
    .reading-reference-layout.mt-4(
      :class='{ "reading-reference-layout--split": referencePlacement === "prominence" }'
      :data-reading-reference-layout='referencePlacement === "prominence" ? "prominence" : undefined'
    )
      .grid.gap-2(data-testid='reading-prominence-items')
        article.rounded.px-3.py-2.text-xs.text-slate-300(
          v-for='item in reading.prominence'
          :key='item.id'
          class='bg-white/5'
        )
          ReadingText(
            :row='item'
            :active-highlight='activeHighlight'
            :pinned-highlight='pinnedHighlight'
            @hover='setHoverKeyword'
            @clear-hover='clearHoverKeyword'
            @toggle-pin='togglePinnedKeyword'
          )
      article.reading-reference-chart.rounded.p-3(
        v-if='referencePlacement === "prominence"'
        data-testid='reading-reference-chart'
        class='bg-white/5'
      )
        slot(name='reference')

  .grid.gap-4(v-if='guidanceSections.length' class='lg:grid-cols-3')
    section.ui-panel(
      v-for='section in guidanceSections'
      :key='section.id'
      :data-testid='`reading-${section.id}`'
    )
      h3.text-sm.font-semibold.text-slate-100 {{ t(`readings.presentation.sections.${section.id}`) }}
      .grid.gap-3.mt-4
        article.text-sm.leading-6.text-slate-300(v-for='item in section.items' :key='item.id')
          ReadingText(
            :row='item'
            :active-highlight='activeHighlight'
            :pinned-highlight='pinnedHighlight'
            @hover='setHoverKeyword'
            @clear-hover='clearHoverKeyword'
            @toggle-pin='togglePinnedKeyword'
          )

  aside.ui-panel(v-if='reading.caveats.length' data-testid='reading-caveats')
    h3.text-sm.font-semibold.text-slate-100 {{ t('readings.presentation.sections.caveats') }}
    p.mt-3.text-xs.leading-5.text-slate-400(v-for='(caveat, index) in reading.caveats' :key='index') {{ caveat }}
</template>

<style scoped>
.reading-reference-layout {
  display: grid;
  gap: 1rem;
}

.reading-reference-chart {
  align-self: start;
  justify-self: center;
  max-width: 320px;
  pointer-events: auto;
  width: 100%;
}

@media (min-width: 1024px) {
  .reading-reference-layout--split {
    align-items: start;
    grid-template-columns: minmax(0, 1fr) minmax(300px, 330px);
  }

  .reading-reference-layout--split .reading-reference-chart {
    justify-self: end;
  }
}

</style>
