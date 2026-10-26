<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CENTERS } from '../../../lib/human-design/constants.js'
import { humanDesignGateLabel, humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import GateDetail from './GateDetail.vue'
import { filterGates, GATE_MODES, gateRows } from './model.js'

const props = defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
})

const emit = defineEmits(['select'])

const { t }     = useI18n()
const query     = ref('')
const mode      = ref('all')
const center    = ref('')
const circuit   = ref('')
const circuits  = ['Individual', 'Collective Logic', 'Collective Abstract', 'Tribal']
const rows      = computed(() => gateRows(props.chart, {
  gate:   gate => humanDesignGateLabel(t, gate),
  center: id => humanDesignValueLabel(t, 'center', id),
}))
const visible   = computed(() => filterGates(rows.value, { query: query.value, mode: mode.value, center: center.value, circuit: circuit.value }))
const firstGate = () => props.chart.details.gates[0]?.gate ?? 1
const selected  = ref(props.pinned?.type === 'gate' ? Number(props.pinned.value) : firstGate())
const layerText = layer => (layer === 'both' ? t('human_design.bodygraph.both') : layer ? humanDesignValueLabel(t, 'layer', layer) : t('human_design.bodygraph.inactive'))

watch(() => props.pinned, (pinned) => { if (pinned?.type === 'gate') selected.value = Number(pinned.value) })

const pick = (gate) => { selected.value = gate }
</script>

<template lang="pug">
.hda-panel(data-testid='analysis-gates')
  p.hda-intro {{ t('human_design.ui.analysis.gates_intro') }}

  .hda-filters
    input.hda-input(v-model='query' type='search' :placeholder='t("human_design.search_gates")' :aria-label='t("human_design.search_gates")' data-testid='analysis-gate-search')
    .hda-row(role='group' :aria-label='t("human_design.ui.analysis.filter")')
      button.hda-btn(v-for='item in GATE_MODES' :key='item' type='button' :aria-pressed='mode === item' :data-mode='item' @click='mode = item') {{ t(`human_design.ui.analysis.mode_${item}`) }}
    .hda-selects
      select.hda-input(v-model='center' :aria-label='t("human_design.center")')
        option(value='') {{ t('human_design.ui.analysis.all_centers') }}
        option(v-for='id in CENTERS' :key='id' :value='id') {{ humanDesignValueLabel(t, 'center', id) }}
      select.hda-input(v-model='circuit' :aria-label='t("human_design.circuit")')
        option(value='') {{ t('human_design.ui.analysis.all_circuits') }}
        option(v-for='id in circuits' :key='id' :value='id') {{ humanDesignValueLabel(t, 'circuit', id) }}

  .hda-gates-layout
    div.hda-section
      .hda-gates(role='group' :aria-label='t("human_design.gates")' data-testid='analysis-gate-grid')
        button.hda-gate(
          v-for='row in visible'
          :key='row.gate'
          type='button'
          :data-gate='row.gate'
          :data-layer='row.layer ?? "none"'
          :data-hanging='row.hanging'
          :aria-pressed='selected === row.gate'
          :aria-label='`${row.gate} ${row.name}, ${layerText(row.layer)}`'
          :title='`${row.name} · ${row.centerName}`'
          @click='pick(row.gate)'
        ) {{ row.gate }}
      p.hda-empty(v-if='!visible.length') {{ t('human_design.no_gate_results') }}
      ul.hda-legend
        li(v-for='layer in ["personality", "design", "both", "none"]' :key='layer')
          span.hda-gate-key(:data-layer='layer')
          | {{ layerText(layer === 'none' ? null : layer) }}
        li
          span.hda-gate-key(data-layer='none' data-hanging='true')
          | {{ t('human_design.hanging_gate') }}
    GateDetail(:chart='chart' :gate='selected' @pick='pick' @select='emit("select", $event)')
</template>

<style scoped>
.hda-filters { display: grid; gap: 10px; }
.hda-selects { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); }
.hda-gates-layout { display: grid; gap: 16px; min-width: 0; align-items: start; }
@container (min-width: 760px) {
  .hda-gates-layout { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); }
  .hda-gates-layout > :last-child { position: sticky; top: 8px; }
}
.hda-gates { display: grid; gap: 6px; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); }
.hda-gate, .hda-gate-key {
  --fill: var(--hd-surface); --ink: var(--hd-text-2); --edge: var(--hd-text-muted);
  display: grid; place-items: center; min-height: 44px; border: 1.5px dashed var(--edge); border-radius: 10px;
  background: var(--fill); color: var(--ink); font: inherit; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; cursor: pointer;
}
.hda-gate:hover { border-color: var(--hd-text); }
.hda-gate[aria-pressed="true"] { outline: 2px solid var(--hd-focus); outline-offset: 2px; }
.hda-gate[data-layer="personality"], .hda-gate-key[data-layer="personality"] { --fill: var(--hd-personality); --ink: var(--hd-pers-on); --edge: var(--hd-personality); border-style: solid; }
.hda-gate[data-layer="design"], .hda-gate-key[data-layer="design"] { --fill: var(--hd-design); --ink: var(--hd-design-on); --edge: var(--hd-design); border-style: solid; }
.hda-gate[data-layer="both"], .hda-gate-key[data-layer="both"] { --fill: linear-gradient(135deg, var(--hd-design) 50%, var(--hd-personality) 50%); --ink: var(--hd-both-on); --edge: var(--hd-text-muted); border-style: solid; text-shadow: 0 0 3px var(--hd-both-halo), 0 0 3px var(--hd-both-halo); }
.hda-gate[data-hanging="true"], .hda-gate-key[data-hanging="true"] { border-style: solid; box-shadow: inset 0 0 0 2px var(--hd-surface), inset 0 0 0 3.5px var(--ink); }
.hda-gate-key { width: 22px; min-height: 22px; height: 22px; border-radius: 6px; cursor: default; }
.hda-legend { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 4px 0 0; padding: 0; list-style: none; color: var(--hd-text-2); font-size: 12px; }
.hda-legend li { display: flex; gap: 6px; align-items: center; }
</style>
