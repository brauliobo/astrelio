<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignContentKey, humanDesignGateLabel, humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import CenterGlyph from './CenterGlyph.vue'
import StateBadge from './StateBadge.vue'

const props = defineProps({
  card:     { type: Object, required: true },
  pinned:   { type: Boolean, default: false },
  expanded: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'select'])

const { t }      = useI18n()
const text       = (...parts) => t(humanDesignContentKey(...parts))
const name       = computed(() => humanDesignValueLabel(t, 'center', props.card.id))
const stateLabel = computed(() => text('center_states', props.card.state, 'label'))
const biology    = computed(() => text('centers', props.card.key, 'biology'))
const meaning    = state => text('centers', props.card.key, state === 'defined' ? 'defined' : 'undefined')
const other      = computed(() => (props.card.state === 'defined' ? 'undefined' : 'defined'))
const secondary  = computed(() => props.card.classes.slice(1).map(id => t(`human_design.ui.analysis.center_classes.${id}.name`)).join(', '))
const gateLabel  = gate => `${gate} · ${humanDesignGateLabel(t, gate)}`
</script>

<template lang="pug">
article.hda-card.hda-center-card(
  :data-center='card.id'
  :data-state='card.state'
  :data-pinned='pinned'
  :data-testid='`analysis-center-${card.key}`'
)
  header.hda-card-head
    CenterGlyph(:center='card.id' :state='card.state' :size='48')
    div
      h4.hda-title {{ name }}
      .hda-row
        StateBadge(:state='card.state' :label='stateLabel')
        span.hda-sub {{ t('human_design.ui.analysis.gates_held', { held: card.activatedGates.length, total: card.total }) }}
        span.hda-chip(v-if='secondary') {{ t('human_design.ui.analysis.also_class', { class: secondary }) }}

  p.hda-body {{ text('centers', card.key, 'role') }}

  .hda-section(v-if='card.definedGates.length')
    h5.hda-h {{ t('human_design.ui.analysis.gates_in_channels') }}
    .hda-row
      button.hda-chip(v-for='gate in card.definedGates' :key='gate' type='button' @click='emit("select", { type: "gate", value: gate })') {{ gateLabel(gate) }}

  .hda-section(v-if='card.hangingGates.length' data-testid='analysis-center-hanging')
    h5.hda-h {{ t('human_design.ui.analysis.carriers_title') }}
    .hda-row
      button.hda-chip(v-for='gate in card.hangingGates' :key='gate' type='button' data-tone='warn' @click='emit("select", { type: "gate", value: gate })') {{ gateLabel(gate) }}

  .hda-section
    h5.hda-h {{ stateLabel }}
    p.hda-body {{ meaning(card.state) }}

  template(v-if='card.white')
    blockquote.hda-quote
      strong.hda-h {{ t('human_design.ui.analysis.not_self_question') }}
      br
      | {{ text('centers', card.key, 'not_self_question') }}
    p.hda-body
      strong {{ t('human_design.ui.analysis.healthy') }}.
      |  {{ text('centers', card.key, 'healthy') }}

  button.hda-btn(type='button' :aria-expanded='expanded' @click='emit("toggle")') {{ expanded ? t('human_design.ui.analysis.less') : t('human_design.ui.analysis.more') }}
  .hda-section(v-show='expanded')
    h5.hda-h {{ text('center_states', other, 'label') }}
    p.hda-body {{ meaning(other) }}
    h5.hda-h {{ t('human_design.ui.analysis.biology') }}
    p.hda-body {{ biology }}
</template>
