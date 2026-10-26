<script setup>
import { computed } from 'vue'
import { sameSelection } from '../bodygraph/bodygraphSelection.js'
import { useHdText } from './useHdText.js'

const props = defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
})

const emit = defineEmits(['select'])

const { t, ui, prose } = useHdText()

const details = computed(() => props.chart.variableDetails)
const cards   = computed(() => props.chart.variables.map(variable => ({
  ...variable,
  item:  { type: 'variable', value: variable.id },
  arrow: details.value.arrows[variable.id],
})))
const glyph   = orientation => orientation === 'left' ? '←' : '→'
</script>

<template lang="pug">
section.hd-card.hd-vars(v-if='details' data-testid='hd-variables-glance')
  header.hd-vars-head
    h3.hd-title {{ t('human_design.variables') }}
    code.hd-vars-code.hd-num(:title='ui("variable_code", { code: details.shorthand })') {{ details.shorthand }}
  .hd-vars-grid
    button.hd-var(
      v-for='card in cards'
      :key='card.id'
      type='button'
      :data-layer='card.layer'
      :aria-pressed='String(sameSelection(pinned, card.item))'
      @click='emit("select", card.item)'
    )
      span.hd-var-arrow(aria-hidden='true') {{ glyph(card.arrow.orientation) }}
      span.hd-kicker {{ t(`human_design.variable_labels.${card.id}.label`) }}
      strong {{ t(`human_design.variable_colors.${card.id}.${card.color}`) }}
      span.hd-var-sub.hd-num {{ card.code }}
  p.hd-body.hd-vars-note {{ prose('variables', 'shorthand', 'note') }}
</template>

<style scoped>
.hd-vars { display: grid; gap: 12px; padding: 16px; }
.hd-vars-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.hd-vars-code { padding: 4px 10px; border-radius: 8px; background: var(--hd-faint); color: var(--hd-text); font-size: 14px; font-weight: 700; letter-spacing: 0.08em; }
.hd-vars-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.hd-vars-note { font-size: 12px; }

.hd-var {
  position: relative;
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--hd-line);
  border-top: 3px solid var(--hd-text);
  border-radius: 12px;
  background: var(--hd-soft);
  color: var(--hd-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 140ms ease;
}

.hd-var:hover { background: var(--hd-faint); }
.hd-var[data-layer='design'] { border-top-color: var(--hd-design); }
.hd-var[aria-pressed='true'] { background: var(--hd-faint); border-color: var(--hd-text-muted); }
.hd-var-arrow { position: absolute; top: 8px; right: 12px; font-size: 22px; font-weight: 700; line-height: 1; }
.hd-var strong { font-size: 15px; overflow-wrap: anywhere; }
.hd-var-sub { color: var(--hd-text-2); font-size: 12px; }
</style>
