<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ELEMENT_KEYS, relatedElementsFor, signIndicesForElement } from '../../../lib/astro/elements.js'

const defaultElements = () => ELEMENT_KEYS.map(key => ({
  key:             key,
  color:           `var(--chart-element-${key})`,
  fill:            `var(--chart-element-${key}-fill)`,
  signIndices:     signIndicesForElement(key),
  relatedElements: relatedElementsFor(key),
}))

const props = defineProps({
  elements: { type: Array, default: () => [] },
})

const { t, te } = useI18n()

const translated = (path, fallback) => te(path) ? t(path) : fallback
const title = computed(() => translated('chart.element_legend.title',
  te('analysis.element_balance') ? t('analysis.element_balance') : 'Elements'))
const description = computed(() => translated(
  'chart.element_legend.description',
  'Tropical zodiac sectors grouped by element',
))
const elements = computed(() => props.elements.length ? props.elements : defaultElements())
const items = computed(() => elements.value.filter(item => ELEMENT_KEYS.includes(item.key)))
const labelFor = key => translated(`analysis.elements.${key}`, key)
const itemStyle = item => ({
  '--element-color': item.color || `var(--chart-element-${item.key})`,
  '--element-fill':  item.fill || `var(--chart-element-${item.key}-fill)`,
})
</script>

<template lang="pug">
section.chart-element-legend(
  data-testid='element-legend'
  data-element-presentation='tropical'
  :aria-label='title'
)
  .chart-element-legend__heading.text-xs.font-semibold
    span {{ title }}
    span.sr-only {{ `: ${description}` }}
  .chart-element-legend__items(role='list')
    .chart-element-legend__item(
      v-for='item in items'
      :key='item.key'
      role='listitem'
      :aria-label='labelFor(item.key)'
      :data-element='item.key'
      :data-sign-indices='item.signIndices?.join(",")'
      :data-related-elements='item.relatedElements?.join(",")'
      :style='itemStyle(item)'
    )
      span.chart-element-legend__swatch(aria-hidden='true')
      span.chart-element-legend__label {{ labelFor(item.key) }}
</template>

<style scoped>
.chart-element-legend {
  background: var(--chart-element-legend-bg, var(--app-panel));
  border: 1px solid var(--chart-element-legend-border, var(--app-border-soft));
  border-radius: 0.375rem;
  color: var(--chart-selection-text);
  display: grid;
  gap: 0.35rem;
  margin-top: 0.5rem;
  padding: 0.45rem 0.6rem;
  width: 100%;
}

.chart-element-legend__heading {
  color: var(--chart-selection-title);
  line-height: 1.2;
}

.chart-element-legend__items {
  display: grid;
  gap: 0.25rem 0.5rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.chart-element-legend__item {
  align-items: center;
  display: inline-flex;
  gap: 0.3rem;
  min-width: 0;
}

.chart-element-legend__swatch {
  background: var(--element-fill);
  border: 1px solid var(--element-color);
  border-radius: 999px;
  flex: 0 0 auto;
  height: 0.55rem;
  width: 0.55rem;
}

.chart-element-legend__label {
  color: var(--chart-selection-text);
  font-size: 0.7rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 420px) {
  .chart-element-legend__items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
