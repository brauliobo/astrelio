<script setup>
import { computed } from 'vue'
import { CHANNEL_CIRCUITS } from '../../../lib/human-design/constants.js'
import { CENTER_ORDER } from '../../../lib/human-design/layout.js'
import { sameSelection } from '../bodygraph/bodygraphSelection.js'
import { centerStateOf } from './chartFacts.js'
import { useHdText } from './useHdText.js'

const props = defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
})

const emit = defineEmits(['select'])

const { t, ui, label, key } = useHdText()

const CIRCUIT_COLORS = {
  individual:          'var(--hd-circuit-individual)',
  collective_logic:    'var(--hd-circuit-logic)',
  collective_abstract: 'var(--hd-circuit-abstract)',
  tribal:              'var(--hd-circuit-tribal)',
}

const defined = computed(() => props.chart.centers.length)
const open    = computed(() => CENTER_ORDER.filter(center => centerStateOf(props.chart, center).state !== 'defined'))
const circuits = computed(() => Object.entries(Object.groupBy(props.chart.channels, id => CHANNEL_CIRCUITS[id])).map(([circuit, ids]) => ({
  name:  label('circuit', circuit),
  color: CIRCUIT_COLORS[key('circuit', circuit)],
  count: ids.length,
})))
const item = center => ({ type: 'center', value: center })
</script>

<template lang="pug">
section.hd-card.hd-insights(data-testid='hd-insights-glance')
  h3.hd-title {{ t('human_design.insights') }}
  .hd-stats
    .hd-stat
      .hd-kicker {{ t('human_design.centers_title') }}
      .hd-stat-value.hd-num {{ defined }} / 9
      .hd-meter(role='img' :aria-label='ui("defined_centers", { n: defined })')
        span(:style='{ width: `${defined / 9 * 100}%` }')
      .hd-stat-sub {{ ui('defined_open', { defined, open: 9 - defined }) }}
    .hd-stat
      .hd-kicker {{ t('human_design.channels') }}
      .hd-stat-value.hd-num {{ chart.channels.length }}
      .hd-stat-sub {{ ui('gates_active', { n: chart.gates.length }) }}
  .hd-circuits(v-if='circuits.length')
    .hd-kicker {{ ui('circuit_balance') }}
    .hd-balance(role='img' :aria-label='ui("circuit_balance")')
      span(v-for='circuit in circuits' :key='circuit.name' :style='{ flexGrow: circuit.count, background: circuit.color }')
    ul.hd-legend
      li(v-for='circuit in circuits' :key='circuit.name')
        span.hd-swatch(:style='{ background: circuit.color }')
        | {{ circuit.name }}
        b.hd-num {{ circuit.count }}
  .hd-open(v-if='open.length')
    .hd-kicker {{ ui('open_centers') }}
    .hd-open-chips
      button.hd-chip(
        v-for='center in open'
        :key='center'
        type='button'
        :aria-pressed='String(sameSelection(pinned, item(center)))'
        @click='emit("select", item(center))'
      ) {{ label('center', center) }}
</template>

<style scoped>
.hd-insights { display: grid; gap: 14px; padding: 16px; }
.hd-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.hd-stat { display: grid; gap: 4px; padding: 10px 12px; border: 1px solid var(--hd-line); border-radius: 12px; background: var(--hd-soft); }
.hd-stat-value { font-size: 24px; font-weight: 700; line-height: 1.1; }
.hd-stat-sub { color: var(--hd-text-2); font-size: 12px; }
.hd-meter { height: 6px; border-radius: 3px; background: var(--hd-faint); overflow: hidden; }
.hd-meter span { display: block; height: 100%; background: var(--hd-red); }
.hd-circuits, .hd-open { display: grid; gap: 8px; }
.hd-balance { display: flex; gap: 3px; height: 10px; }
.hd-balance span { min-width: 8px; border-radius: 5px; }
.hd-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 0; padding: 0; color: var(--hd-text-2); font-size: 12.5px; list-style: none; }
.hd-legend li { display: flex; align-items: center; gap: 6px; }
.hd-legend b { color: var(--hd-text); }
.hd-swatch { width: 10px; height: 10px; border-radius: 3px; }
.hd-open-chips { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
