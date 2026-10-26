<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignContentKey, humanDesignValueKey, humanDesignStreamLabel } from '../../../lib/human-design/labels.js'
import { circuitBalance, definedStreams } from './model.js'

const props = defineProps({ channels: { type: Array, required: true } })

const { t }   = useI18n()
const rows    = computed(() => circuitBalance(props.channels))
const streams = computed(() => definedStreams(props.channels))
const info    = key => t(humanDesignContentKey('circuits_info', key, 'summary'))
const percent = share => `${Math.round(share * 100)}%`
</script>

<template lang="pug">
section.hda-card(data-testid='analysis-circuit-balance')
  h3.hda-title {{ t('human_design.ui.analysis.balance_title') }}
  p.hda-sub {{ t('human_design.ui.analysis.balance_note') }}
  .hda-bars
    .hda-bar-row(v-for='row in rows' :key='row.id' :data-circuit='row.id')
      .hda-split
        strong {{ t(`human_design.circuit_groups.${row.id}`) }}
        span.hda-sub {{ t('human_design.ui.analysis.channel_count', { n: row.count }, row.count) }} · {{ percent(row.share) }}
      .hda-track(role='img' :aria-label='`${t(`human_design.circuit_groups.${row.id}`)} ${percent(row.share)}`')
        span.hda-seg(v-for='part in row.parts' :key='part.circuit' :data-circuit='humanDesignValueKey("circuit", part.circuit)' :style='{ width: percent(part.count / (channels.length || 1)) }')
      p.hda-sub(v-for='part in row.parts.filter(item => item.count)' :key='part.circuit') {{ info(humanDesignValueKey('circuit', part.circuit)) }}
  .hda-section(v-if='streams.length')
    h4.hda-h {{ t('human_design.defined_streams') }}
    ul.hda-list
      li.hda-item(v-for='item in streams' :key='item.stream' data-testid='analysis-stream')
        .hda-split
          strong {{ humanDesignStreamLabel(t, item.stream) }}
          .hda-row
            span.hda-chip(v-for='channel in item.channels' :key='channel') {{ channel }}
        p.hda-sub {{ info(humanDesignValueKey('subCircuit', item.stream)) }}
</template>

<style scoped>
.hda-bars { display: grid; gap: 14px; }
.hda-bar-row { display: grid; gap: 6px; }
.hda-track { display: flex; height: 14px; overflow: hidden; border-radius: 7px; background: var(--hd-surface); box-shadow: inset 0 0 0 1px var(--hda-line); }
.hda-seg { --c: var(--hd-circuit-individual); display: block; height: 100%; background: var(--c); }
.hda-seg + .hda-seg { border-left: 2px solid var(--hd-surface-2); }
.hda-seg[data-circuit="individual"] { --c: var(--hd-circuit-individual); }
.hda-seg[data-circuit="tribal"] { --c: var(--hd-circuit-tribal); background: repeating-linear-gradient(135deg, var(--c) 0 5px, var(--hd-surface) 5px 7px); }
.hda-seg[data-circuit="collective_logic"] { --c: var(--hd-circuit-logic); background: repeating-linear-gradient(90deg, var(--c) 0 8px, var(--hd-surface) 8px 11px); }
.hda-seg[data-circuit="collective_abstract"] { --c: var(--hd-circuit-abstract); background: radial-gradient(circle at 3px 50%, var(--c) 0 2.6px, transparent 3px) 0 0 / 7px 100%, color-mix(in srgb, var(--c) 30%, var(--hd-surface)); }
</style>
