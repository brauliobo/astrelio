<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { sensitivityForChart } from '../../../lib/human-design/bodygraph.js'
import { LEVELS } from '../../../lib/human-design/sky.js'
import { humanDesignContentKey } from '../../../lib/human-design/labels.js'
import ActivationTag from './ActivationTag.vue'

const props = defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
})

defineEmits(['select'])

const { t }    = useI18n()
const text     = (...parts) => t(humanDesignContentKey('sensitivity', ...parts))
const report   = computed(() => sensitivityForChart(props.chart))
const windows  = computed(() => Object.keys(report.value.windows).map(Number))
const minutes  = ref(10)
const win      = computed(() => report.value.windows[minutes.value])
const bodies   = list => list.map((entry) => { const [layer, planet] = entry.split('.'); return { key: entry, layer, planet } })
const arrows   = computed(() => Object.entries(win.value.variables).filter(([, v]) => v.color || v.tone || v.base))
const gateHits = computed(() => win.value.changes.gate)
const headline = computed(() => [
  { id: 'profile',   changed: win.value.profile,       note: text('fields', 'profile') },
  { id: 'cross',     changed: win.value.cross,         note: text('fields', 'cross') },
  { id: 'variables', changed: arrows.value.length > 0, note: t('human_design.ui.analysis.variables_note'), arrows: arrows.value },
  { id: 'gates',     changed: gateHits.value.length > 0, note: text('fields', 'gate'), bodies: bodies(gateHits.value) },
  { id: 'type',      changed: gateHits.value.length > 0, note: `${text('fields', 'type')} ${text('fields', 'authority')}` },
])
const verdict  = computed(() => headline.value.filter(row => row.changed).length)
const closest  = computed(() => [...report.value.rows].sort((a, b) => a.margins.line - b.margins.line).slice(0, 5))
const span     = (m) => {
  if (m < 90) return t('human_design.ui.analysis.minutes', { n: Math.round(m) })
  return m < 2880 ? t('human_design.ui.analysis.hours', { n: (m / 60).toFixed(1) }) : t('human_design.ui.analysis.days', { n: (m / 1440).toFixed(1) })
}
const arrowText = ([id, v]) => `${t(`human_design.variable_labels.${id}.label`)}: ${['color', 'tone', 'base'].filter(key => v[key]).map(key => t(`human_design.${key}`)).join(', ')}`
</script>

<template lang="pug">
.hda-panel(data-testid='analysis-sensitivity')
  header.hda-section
    h3.hda-title {{ text('title') }}
    p.hda-intro {{ text('note') }}
    .hda-row(role='group' :aria-label='text("title")')
      button.hda-btn(v-for='value in windows' :key='value' type='button' :aria-pressed='minutes === value' :data-window='value' @click='minutes = value') ±{{ value }} {{ t('human_design.ui.analysis.min_unit') }}

  p.hda-verdict(:data-verdict='verdict ? "change" : "stable"' data-testid='analysis-verdict')
    strong {{ verdict ? t('human_design.ui.analysis.verdict_change', { n: verdict, minutes }, verdict) : t('human_design.ui.analysis.verdict_stable', { minutes }) }}

  ul.hda-list
    li.hda-item.hda-result(v-for='row in headline' :key='row.id' :data-result='row.id' :data-changed='row.changed')
      .hda-split
        strong {{ t(`human_design.ui.analysis.result_${row.id}`) }}
        span.hda-chip(:data-tone='row.changed ? "warn" : null') {{ row.changed ? t('human_design.ui.analysis.could_change') : t('human_design.ui.analysis.stable') }}
      p.hda-sub {{ row.note }}
      .hda-row(v-if='row.changed && row.bodies')
        ActivationTag(v-for='body in row.bodies' :key='body.key' :layer='body.layer' :planet='body.planet')
      .hda-row(v-if='row.changed && row.arrows')
        span.hda-chip(v-for='arrow in row.arrows' :key='arrow[0]') {{ arrowText(arrow) }}

  section.hda-section
    h4.hda-h {{ t('human_design.ui.analysis.fine_details') }}
    ul.hda-list
      li.hda-item(v-for='level in LEVELS' :key='level' :data-level='level')
        .hda-split
          strong {{ t(`human_design.ui.analysis.level_${level}`) }}
          span.hda-sub {{ t('human_design.ui.analysis.activations_count', { n: win.changes[level].length }, win.changes[level].length) }}
        p.hda-sub {{ text('fields', level) }}
        .hda-row(v-if='win.changes[level].length')
          ActivationTag(v-for='body in bodies(win.changes[level])' :key='body.key' :layer='body.layer' :planet='body.planet')

  section.hda-section(data-testid='analysis-closest')
    h4.hda-h {{ t('human_design.ui.analysis.closest') }}
    ul.hda-list
      li.hda-item(v-for='row in closest' :key='`${row.layer}-${row.planet}`')
        .hda-split
          ActivationTag(:layer='row.layer' :planet='row.planet' :code='`${row.gate}.${row.line}`')
          span.hda-sub {{ t('human_design.ui.analysis.line_in', { when: span(row.margins.line) }) }} · {{ t('human_design.ui.analysis.gate_in', { when: span(row.margins.gate) }) }}
</template>

<style scoped>
.hda-verdict { margin: 0; padding: 12px 14px; border: 1px solid var(--hda-line); border-radius: 12px; background: var(--hd-surface-2); }
.hda-verdict[data-verdict="change"] { border: 2px dashed var(--hd-text-muted); }
.hda-result[data-changed="true"] { border-style: dashed; border-color: var(--hd-text-muted); }
</style>
