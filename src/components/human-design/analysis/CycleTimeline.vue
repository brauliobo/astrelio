<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignContentKey } from '../../../lib/human-design/labels.js'
import PlanetGlyph from './PlanetGlyph.vue'

const props = defineProps({
  cycles: { type: Array, required: true },
  age:    { type: Number, required: true },
})

const { t, locale } = useI18n()
const MAX_AGE       = 90
const place         = age => `${Math.min(100, Math.max(0, (age / MAX_AGE) * 100))}%`
const date          = ms => new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeZone: 'UTC' }).format(ms)
const items         = computed(() => {
  const rows = props.cycles.map(cycle => ({ ...cycle, key: `${cycle.id}-${cycle.n}`, first: cycle.passes[0] }))
  const next = rows.find(row => row.first.ageYears >= props.age)
  return rows.map(row => ({ ...row, status: row.first.ageYears < props.age ? 'past' : row === next ? 'next' : 'future' }))
})
const years         = row => Math.abs(row.first.ageYears - props.age).toFixed(1)
const distance      = row => t(`human_design.ui.analysis.${row.status === 'past' ? 'years_ago' : 'in_years'}`, { n: years(row) })
const title         = row => `${t(humanDesignContentKey('cycles', row.id, 'name'))}${row.n > 1 ? ` (${t(`human_design.ui.analysis.nth_${row.n}`)})` : ''}`
</script>

<template lang="pug">
section.hda-section(data-testid='analysis-cycles')
  .hda-axis(role='img' :aria-label='t("human_design.ui.analysis.you_are_here")')
    .hda-axis-now(:style='{ left: place(age) }')
      span {{ t('human_design.ui.analysis.you_are_here') }} · {{ age.toFixed(1) }}
    .hda-axis-bar
    span.hda-axis-dot(v-for='row in items' :key='row.key' :data-status='row.status' :style='{ left: place(row.first.ageYears) }')
      PlanetGlyph(:planet='row.body' :size='13')
    .hda-axis-scale
      span(v-for='mark in [0, 30, 60, 90]' :key='mark' :style='{ left: place(mark) }') {{ mark }}

  ol.hda-list
    li.hda-item.hda-cycle(v-for='row in items' :key='row.key' :data-status='row.status' :data-cycle='row.key' data-testid='analysis-cycle')
      span.hda-cycle-node(aria-hidden='true')
        PlanetGlyph(:planet='row.body' :size='16')
      div
        .hda-split
          strong {{ title(row) }}
          span.hda-chip(:data-tone='row.status === "next" ? "strong" : null') {{ t(`human_design.ui.analysis.cycle_${row.status}`) }}
        p.hda-sub {{ date(row.first.ms) }} · {{ t('human_design.ui.analysis.age', { n: row.first.ageYears.toFixed(1) }) }} · {{ distance(row) }}
        p.hda-sub(v-if='row.passes.length > 1') {{ t('human_design.ui.analysis.also_passes') }}: {{ row.passes.slice(1).map(pass => date(pass.ms)).join(', ') }}
        p.hda-body {{ t(humanDesignContentKey('cycles', row.id, 'summary')) }}
</template>

<style scoped>
.hda-axis { position: relative; height: 92px; margin: 0 14px; }
.hda-axis-bar { position: absolute; left: 0; right: 0; top: 46px; height: 6px; border-radius: 3px; background: var(--hd-track); }
.hda-axis-now { position: absolute; top: 4px; bottom: 30px; width: 0; border-left: 2px solid var(--hd-text); }
.hda-axis-now span { position: absolute; top: -4px; left: 0; transform: translateX(-50%); padding: 2px 8px; border-radius: 999px; background: var(--hd-text); color: var(--hd-surface); font-size: 11px; font-weight: 700; white-space: nowrap; }
.hda-axis-dot { position: absolute; top: 36px; display: grid; place-items: center; width: 26px; height: 26px; margin-left: -13px; border: 2px solid var(--hd-text-muted); border-radius: 50%; background: var(--hd-surface-2); color: var(--hd-text); }
.hda-axis-dot[data-status="past"] { background: var(--hd-text); color: var(--hd-surface); border-color: var(--hd-text); }
.hda-axis-dot[data-status="next"] { border-color: var(--hd-focus); box-shadow: 0 0 0 3px var(--hd-surface-2), 0 0 0 5px var(--hd-text); }
.hda-axis-scale { position: absolute; left: 0; right: 0; bottom: 0; height: 18px; color: var(--hd-text-muted); font-size: 11px; }
.hda-axis-scale span { position: absolute; transform: translateX(-50%); }
.hda-cycle { grid-template-columns: auto minmax(0, 1fr); gap: 12px; align-items: start; }
.hda-cycle[data-status="next"] { border: 2px solid var(--hd-text); }
.hda-cycle-node { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--hd-surface-2); border: 1px solid var(--hda-line); }
.hda-cycle > div { display: grid; gap: 4px; min-width: 0; }
</style>
