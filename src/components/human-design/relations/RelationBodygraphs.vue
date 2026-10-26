<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { overlayChart } from '../../../lib/human-design/overlay.js'
import Bodygraph from '../bodygraph/Bodygraph.vue'

const props = defineProps({
  chartA:     { type: Object, required: true },
  chartB:     { type: Object, required: true },
  nameA:      { type: String, required: true },
  nameB:      { type: String, required: true },
  composite:  { type: Object, required: true },
  highlight:  { type: Object, default: null },
})

const { t }   = useI18n()
const overlay = computed(() => overlayChart(props.chartA, props.chartB, props.composite))
const panels  = computed(() => [
  { id: 'a', title: props.nameA, chart: props.chartA },
  { id: 'b', title: props.nameB, chart: props.chartB },
])
</script>

<template lang="pug">
.grid.gap-4(class='md:grid-cols-2 lg:grid-cols-3' data-testid='human-design-connection')
  .ui-panel(v-for='panel in panels' :key='panel.id' :data-person='panel.id')
    h2.mb-3.text-sm.font-semibold.text-slate-100 {{ panel.title }}
    Bodygraph.mx-auto.max-w-xs(:chart='panel.chart' size='compact' :highlight='highlight' :show-silhouette='false')
  .ui-panel(class='md:col-span-2 lg:col-span-1' data-testid='hd-composite-bodygraph')
    h2.mb-1.text-sm.font-semibold.text-slate-100 {{ t('human_design.ui.relations.composite_title') }}
    ul.mb-3.flex.flex-wrap.gap-x-4.gap-y-1.text-xs.text-slate-400
      li.flex.items-center.gap-2
        i.hd-legend__swatch(style='background: var(--hd-personality)')
        | {{ nameA }}
      li.flex.items-center.gap-2
        i.hd-legend__swatch(style='background: var(--hd-design)')
        | {{ nameB }}
    Bodygraph.mx-auto.max-w-xs(:chart='overlay' size='compact' :highlight='highlight' :show-silhouette='false')
</template>

<style scoped>
.hd-legend__swatch {
  border: 1px solid var(--hd-contrast);
  border-radius: 9999px;
  height: 0.7rem;
  width: 0.7rem;
}
</style>
