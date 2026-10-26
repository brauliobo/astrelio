<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCorrelationSections } from './timing/correlationSections.js'

const OPEN_SECTIONS = 2

const sectionTestIds = {
  diary:    'hd-correlation-event-diary',
  transits: 'hd-correlation-transit-clusters',
  bridge:   'hd-correlation-astrology-bridge',
}

const props = defineProps({
  chart:             { type: Object, required: true },
  transitChart:      { type: Object, default: null },
  transitConnection: { type: Object, default: null },
})

const { t }    = useI18n()
const sections = useCorrelationSections(props, t)

const scoreCards = computed(() => [
  { label: t('human_design.correlations.active_gates'),       value: props.chart.gates?.length || props.chart.details?.gates?.length || 0 },
  { label: t('human_design.correlations.defined_channels'),   value: props.chart.channels?.length || props.chart.details?.channels?.length || 0 },
  { label: t('human_design.correlations.transit_hits'),       value: props.transitConnection?.activatedNatalGates?.length || 0 },
  { label: t('human_design.correlations.completed_channels'), value: props.transitConnection?.completedChannels?.length || 0 },
])

const sectionTestId = key => sectionTestIds[key] || `hd-correlation-${key}`
</script>

<template lang="pug">
.hd-correlation-panel(data-testid='hd-correlations-panel')
  .flex.flex-wrap.items-start.justify-between.gap-3.mb-4
    div
      h2.text-sm.font-semibold.text-slate-100 {{ t('human_design.correlations.title') }}
      p.mt-1.text-xs.text-slate-400 {{ t('human_design.correlations.note') }}
    .grid.grid-cols-2.gap-2(class='sm:grid-cols-4')
      .rounded.border.px-3.py-2(v-for='card in scoreCards' :key='card.label' class='border-white/10 bg-white/5')
        .text-xs.text-slate-400 {{ card.label }}
        .text-lg.font-semibold.text-slate-100 {{ card.value }}

  p.rounded.border.p-3.mb-4.text-xs.leading-5.text-amber-200(class='border-amber-300/20 bg-amber-300/10') {{ t('human_design.correlations.clean_room_notice') }}

  .grid.items-start.gap-3(class='xl:grid-cols-2')
    details.rounded.border.p-3(
      v-for='(section, index) in sections'
      :key='section.key'
      class='border-white/10 bg-white/5'
      :open='index < OPEN_SECTIONS'
      :data-correlation='section.key'
      :data-testid='sectionTestId(section.key)'
    )
      summary.flex.cursor-pointer.items-center.justify-between.gap-2.text-sm.font-semibold.text-slate-100
        | {{ section.title }}
        span.rounded-full.px-2.text-xs.font-normal.text-slate-200(class='bg-white/10 py-0.5') {{ section.items.length }}
      .mt-3.grid.gap-2(v-if='section.items.length')
        p.rounded.p-2.text-xs.leading-5.text-slate-300(v-for='(item, n) in section.items' :key='n' class='bg-slate-950/25') {{ item }}
      p.mt-3.text-xs.text-slate-400(v-else) {{ t('human_design.correlations.no_data') }}
</template>
