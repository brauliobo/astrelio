<script setup>
import { computed, ref } from 'vue'
import AspectTable from './AspectTable.vue'
import ChartWheel from './ChartWheel.vue'
import PlanetList from './PlanetList.vue'

defineProps({
  base: { type: Object, required: true },
  comparison: { type: Object, required: true },
  aspects: { type: Array, default: () => [] },
  baseLabel: { type: String, required: true },
  comparisonLabel: { type: String, required: true },
  chartSize: { type: Number, default: 520 },
})

const chartMaps = (base, comparison) => [
  {
    id: 'base',
    chart: base,
    color: '#111827',
    showAspects: false,
    showHouseLabels: false,
    planetBand: { inner: 140, outer: 152, tickRadius: 153 },
  },
  {
    id: 'comparison',
    chart: comparison,
    color: '#0f8f8f',
    showHouses: false,
    showHouseLabels: false,
    showAspects: false,
    showAngles: false,
    planetBand: { inner: 112, outer: 126, tickRadius: 128 },
  },
]

const hoverHighlight = ref(null)
const pinnedHighlight = ref(null)
const activeHighlight = computed(() => hoverHighlight.value || pinnedHighlight.value || { bodies: [], aspectKey: '' })

const normalizeHighlight = (payload) => ({
  bodies: [...new Set(payload?.bodies || [])],
  aspectKey: payload?.aspectKey || '',
})

const sameHighlight = (a, b) =>
  a.aspectKey === b.aspectKey &&
  a.bodies.length === b.bodies.length &&
  a.bodies.every(body => b.bodies.includes(body))

const setHighlight = (payload) => {
  hoverHighlight.value = normalizeHighlight(payload)
}

const clearHighlight = () => {
  hoverHighlight.value = null
}

const toggleHighlight = (payload) => {
  const highlight = normalizeHighlight(payload)
  pinnedHighlight.value = pinnedHighlight.value && sameHighlight(pinnedHighlight.value, highlight) ? null : highlight
  hoverHighlight.value = null
}
</script>

<template lang="pug">
.chart-comparison(data-testid='chart-comparison')
  .border.rounded-xl.p-4(class='border-white/10 bg-night/40' data-testid='comparison-chart-panel')
    .flex.flex-wrap.items-center.justify-between.gap-3.mb-4
      h2.text-sm.font-semibold.text-slate-200 {{ baseLabel }} / {{ comparisonLabel }}
      .flex.items-center.gap-4.text-xs
        .flex.items-center.gap-2
          span.inline-block.h-2.w-6.rounded-full.bg-slate-900
          span.text-slate-300 {{ baseLabel }}
        .flex.items-center.gap-2
          span.inline-block.h-2.w-6.rounded-full(style='background:#0f8f8f')
          span.text-slate-300 {{ comparisonLabel }}
    ChartWheel(
      :charts='chartMaps(base, comparison)'
      :size='chartSize'
      :highlighted-bodies='activeHighlight.bodies'
      :highlighted-aspect-key='activeHighlight.aspectKey'
      @highlight='setHighlight'
      @clear-highlight='clearHighlight'
      @toggle-highlight='toggleHighlight'
    )
  .grid.gap-6.mt-6(class='xl:grid-cols-2')
    .border.rounded-xl.p-4(class='border-white/10 bg-night/40' data-testid='base-positions')
      h2.text-sm.font-semibold.text-slate-200.mb-3 {{ baseLabel }}
      PlanetList(
        :chart='base'
        :highlighted-bodies='activeHighlight.bodies'
        @highlight='setHighlight'
        @clear-highlight='clearHighlight'
        @toggle-highlight='toggleHighlight'
      )
    .border.rounded-xl.p-4(class='border-white/10 bg-night/40' data-testid='comparison-positions')
      h2.text-sm.font-semibold.text-slate-200.mb-3 {{ comparisonLabel }}
      PlanetList(
        :chart='comparison'
        :highlighted-bodies='activeHighlight.bodies'
        @highlight='setHighlight'
        @clear-highlight='clearHighlight'
        @toggle-highlight='toggleHighlight'
      )
  .border.rounded-xl.p-4.mt-6(class='border-white/10 bg-night/40' v-if='aspects.length')
    AspectTable(
      :aspects='aspects'
      :highlighted-bodies='activeHighlight.bodies'
      :highlighted-aspect-key='activeHighlight.aspectKey'
      @highlight='setHighlight'
      @clear-highlight='clearHighlight'
      @toggle-highlight='toggleHighlight'
    )
</template>
