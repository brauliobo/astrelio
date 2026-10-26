<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignStateForGates } from '../../../lib/human-design/definition.js'
import { overlayChart } from '../../../lib/human-design/overlay.js'
import Bodygraph from '../bodygraph/Bodygraph.vue'

const props = defineProps({
  chart:        { type: Object, required: true },
  transitChart: { type: Object, required: true },
  highlight:    { type: Object, default: null },
})

const { t }    = useI18n()
const combined = computed(() => humanDesignStateForGates([...props.chart.gates, ...props.transitChart.gates]))
const overlay  = computed(() => overlayChart(props.chart, props.transitChart, combined.value))
const legend   = [
  { id: 'natal',   ink: 'var(--hd-personality)' },
  { id: 'transit', ink: 'var(--hd-design)' },
]
</script>

<template lang="pug">
figure.m-0.grid.gap-2(data-testid='hd-transit-bodygraph')
  Bodygraph(:chart='overlay' size='compact' :highlight='highlight' :show-silhouette='false')
  figcaption.flex.flex-wrap.justify-center.gap-x-4.gap-y-1.text-xs.text-slate-300
    span.inline-flex.items-center.gap-2(v-for='item in legend' :key='item.id')
      i.inline-block.h-3.w-3.rounded-full.border(class='border-slate-400' :style='{ background: item.ink }')
      | {{ t(`human_design.ui.timing.legend.${item.id}`) }}
    span.inline-flex.items-center.gap-2
      i.inline-block.h-3.w-3.rounded-full.border(
        class='border-slate-400'
        :style='{ background: "linear-gradient(90deg, var(--hd-personality) 50%, var(--hd-design) 50%)" }'
      )
      | {{ t('human_design.ui.timing.legend.both') }}
</template>
