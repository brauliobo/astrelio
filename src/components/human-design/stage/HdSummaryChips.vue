<script setup>
import { toRef } from 'vue'
import { sameSelection } from '../bodygraph/bodygraphSelection.js'
import { useHdText } from './useHdText.js'
import { useSummary } from './useSummary.js'

const props = defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
})

const emit = defineEmits(['select'])

const { ui } = useHdText()
const facts  = useSummary(toRef(props, 'chart'))
const item   = ({ key }) => ({ type: 'summary', value: key })
</script>

<template lang="pug">
.hd-chips(data-testid='human-design-summary' role='group' :aria-label='ui("summary_aria")')
  button.hd-fact(
    v-for='fact in facts'
    :key='fact.key'
    type='button'
    :data-key='fact.key'
    :data-type-key='fact.typeKey'
    :aria-pressed='String(sameSelection(pinned, item(fact)))'
    :aria-label='ui("fact_aria", { label: fact.label, value: fact.value })'
    @click='emit("select", item(fact))'
  )
    span.hd-kicker {{ fact.label }}
    span.hd-fact-value(:data-testid='fact.testId') {{ fact.value }}
    span.hd-fact-sub(v-if='fact.sub') {{ fact.sub }}
</template>

<style scoped>
.hd-chips {
  display: flex;
  gap: 8px;
  margin-inline: -4px;
  padding: 2px 4px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

.hd-chips::-webkit-scrollbar { display: none; }

@media (min-width: 720px) {
  .hd-chips { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-inline: 0; padding: 0; overflow: visible; }
}

.hd-fact {
  display: grid;
  flex: 0 0 44%;
  align-content: start;
  gap: 3px;
  min-width: 0;
  scroll-snap-align: start;
  padding: 10px 12px 11px 14px;
  border: 1px solid var(--hd-line);
  border-left: 3px solid var(--hd-text-muted);
  border-radius: 12px;
  background: var(--hd-surface);
  color: var(--hd-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
}

.hd-fact:hover { background: var(--hd-soft); }
.hd-fact[aria-pressed="true"] { background: var(--hd-faint); border-color: var(--hd-text-muted); border-left-color: var(--hd-focus); }
.hd-fact[data-type-key="generator"],
.hd-fact[data-type-key="manifesting_generator"] { border-left-color: var(--hd-circuit-tribal); }
.hd-fact[data-type-key="manifestor"] { border-left-color: var(--hd-circuit-individual); }
.hd-fact[data-type-key="projector"]  { border-left-color: var(--hd-circuit-logic); }
.hd-fact[data-type-key="reflector"]  { border-left-color: var(--hd-circuit-abstract); }

.hd-fact-value {
  display: -webkit-box;
  overflow: hidden;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.25;
  overflow-wrap: anywhere;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.hd-fact-sub {
  color: var(--hd-text-2);
  font-size: 12px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
</style>
