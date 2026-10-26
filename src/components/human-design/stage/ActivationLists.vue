<script setup>
import { computed, ref } from 'vue'
import { HD_PLANETS } from '../../../lib/human-design/constants.js'
import { sameSelection } from '../bodygraph/bodygraphSelection.js'
import CelestialGlyph from '../../common/CelestialGlyph.vue'
import { useHdText } from './useHdText.js'

const props = defineProps({
  chart:         { type: Object, required: true },
  lit:           { type: Object, default: null },
  pinned:        { type: Object, default: null },
  detail:        { type: Boolean, default: false },
  flank:         { type: Boolean, default: true },
  glyphRenderer: { type: String, default: null },
})

const emit = defineEmits(['hover', 'select'])

const { t, ui, planet } = useHdText()
const layer             = ref('design')
const SIDES             = ['design', 'personality']

const rows = side => HD_PLANETS
  .map(name => ({ side, planet: name, activation: props.chart[side]?.[name] }))
  .filter(row => row.activation)

const lists      = computed(() => SIDES.map(side => ({ side, title: t(`human_design.${side}`), rows: rows(side) })))
const litGates   = computed(() => props.lit && new Set(props.lit.gates))
const stateOf    = ({ activation }) => litGates.value ? (litGates.value.has(activation.gate) ? 'lit' : 'dim') : 'idle'
const itemOf     = ({ activation }) => ({ type: 'gate', value: activation.gate })
const code       = ({ activation: { gate, line } }) => `${gate}.${line}`
const extra      = ({ activation: { color, tone, base } }) => `${color}.${tone}.${base}`
const ariaOf     = row => ui('activation_aria', {
  layer:  t(`human_design.${row.side}`),
  planet: planet(row.planet),
  gate:   row.activation.gate,
  line:   row.activation.line,
})
</script>

<template lang="pug">
.hd-lists
  .hd-lists-grid(:data-layer='layer' :data-flank='String(flank)')
    .hd-lists-center
      slot
    .hd-seg.hd-lists-switch(role='group' :aria-label='ui("lists_aria")')
      button(
        v-for='side in SIDES'
        :key='side'
        type='button'
        :aria-pressed='String(layer === side)'
        @click='layer = side'
      ) {{ t(`human_design.${side}`) }}
    section.hd-list(
      v-for='list in lists'
      :key='list.side'
      :data-side='list.side'
      :data-testid='`hd-list-${list.side}`'
      :aria-label='list.title'
    )
      h3.hd-list-title
        span.hd-dot(:data-tone='list.side')
        | {{ list.title }}
      ul.hd-list-rows
        li(v-for='row in list.rows' :key='row.planet')
          button.hd-act(
            type='button'
            :data-state='stateOf(row)'
            :data-gate='row.activation.gate'
            :data-planet='row.planet'
            :aria-pressed='String(sameSelection(pinned, itemOf(row)))'
            :aria-label='ariaOf(row)'
            @pointerenter='emit("hover", itemOf(row))'
            @pointerleave='emit("hover", null)'
            @focus='emit("hover", itemOf(row))'
            @blur='emit("hover", null)'
            @click='emit("select", itemOf(row))'
          )
            CelestialGlyph.hd-act-glyph(:reference='row.planet' :renderer='glyphRenderer' :size='18' :weight='700')
            span.hd-act-code.hd-num {{ code(row) }}
            span.hd-act-extra.hd-num(v-if='detail') {{ extra(row) }}
</template>

<style scoped>
.hd-lists { container-type: inline-size; min-width: 0; }

.hd-lists-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'center' 'switch' 'list';
  gap: 14px;
  align-items: start;
}

.hd-lists-center { grid-area: center; min-width: 0; }
.hd-lists-switch { grid-area: switch; justify-self: center; }
.hd-list { grid-area: list; min-width: 0; }
.hd-lists-grid[data-layer='design'] .hd-list[data-side='personality'],
.hd-lists-grid[data-layer='personality'] .hd-list[data-side='design'] { display: none; }

.hd-list-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--hd-text);
  color: var(--hd-text);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.hd-list[data-side='design'] .hd-list-title { border-bottom-color: var(--hd-design); }
.hd-list[data-side='personality'] .hd-list-title { flex-direction: row-reverse; }

.hd-list-rows { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }

.hd-act {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--hd-text);
  font: inherit;
  font-size: 13.5px;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease, opacity 140ms ease;
}

.hd-act-glyph { flex: none; width: 24px; display: grid; place-items: center; }
.hd-act-code { flex: 1; font-weight: 700; }
.hd-act-extra { color: var(--hd-text-2); font-size: 11.5px; }
.hd-list[data-side='design'] .hd-act-glyph { color: var(--hd-design); }
.hd-list[data-side='personality'] .hd-act { flex-direction: row-reverse; }
.hd-list[data-side='personality'] .hd-act-code { text-align: right; }

.hd-act:hover { background: var(--hd-soft); }
.hd-act[data-state='dim'] { opacity: var(--hd-dim); }
.hd-act[data-state='lit'],
.hd-act[aria-pressed='true'] { opacity: 1; }
.hd-list[data-side='design'] .hd-act[data-state='lit'],
.hd-list[data-side='design'] .hd-act[aria-pressed='true'] { background: var(--hd-design); color: var(--hd-design-on); }
.hd-list[data-side='design'] .hd-act[data-state='lit'] .hd-act-glyph,
.hd-list[data-side='design'] .hd-act[aria-pressed='true'] .hd-act-glyph,
.hd-list[data-side='design'] .hd-act[data-state='lit'] .hd-act-extra { color: inherit; }
.hd-list[data-side='personality'] .hd-act[data-state='lit'],
.hd-list[data-side='personality'] .hd-act[aria-pressed='true'] { background: var(--hd-personality); color: var(--hd-pers-on); }
.hd-list[data-side='personality'] .hd-act[data-state='lit'] .hd-act-extra { color: inherit; }

@container (min-width: 440px) {
  .hd-lists-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas: 'center center' 'design personality';
    column-gap: 20px;
  }
  .hd-list[data-side='design'] { grid-area: design; }
  .hd-list[data-side='personality'] { grid-area: personality; }
  .hd-lists-grid[data-layer] .hd-list[data-side] { display: block; }
  .hd-lists-switch { display: none; }
}

@container (min-width: 600px) {
  .hd-lists-grid[data-flank='true'] {
    grid-template-columns: minmax(96px, 124px) minmax(0, 1fr) minmax(96px, 124px);
    grid-template-areas: 'design center personality';
    column-gap: 12px;
    align-items: center;
  }
}
</style>
