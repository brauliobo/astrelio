<script setup>
import { computed, ref, watch } from 'vue'
import { useHdText } from './useHdText.js'
import CenterDetail from './panel/CenterDetail.vue'
import ChannelDetail from './panel/ChannelDetail.vue'
import ChartOverview from './panel/ChartOverview.vue'
import GateDetail from './panel/GateDetail.vue'
import SummaryDetail from './panel/SummaryDetail.vue'
import VariableDetail from './panel/VariableDetail.vue'

const props = defineProps({
  chart:     { type: Object, required: true },
  selection: { type: Object, default: null },
})

const emit = defineEmits(['select', 'clear'])

const DETAILS = {
  center:   CenterDetail,
  channel:  ChannelDetail,
  gate:     GateDetail,
  summary:  SummaryDetail,
  variable: VariableDetail,
}

const { ui }     = useHdText()
const expanded   = ref(false)
const detail     = computed(() => props.selection ? DETAILS[props.selection.type] : ChartOverview)
const detailProp = computed(() => props.selection?.type === 'gate' ? Number(props.selection.value) : props.selection?.value)
const scroller   = ref(null)

watch(() => props.selection, () => { expanded.value = false; scroller.value?.scrollTo({ top: 0 }) })
</script>

<template lang="pug">
aside.hd-panel.hd-card(
  data-testid='hd-selection-panel'
  :data-open='String(Boolean(selection))'
  :data-expanded='String(expanded)'
  :aria-label='ui("panel_aria")'
  @keydown.esc='emit("clear")'
)
  button.hd-panel-handle(type='button' :aria-label='ui(expanded ? "collapse" : "expand")' :aria-expanded='String(expanded)' @click='expanded = !expanded')
  .hd-panel-bar
    span.hd-kicker {{ selection ? ui('pinned') : ui('overview') }}
    button.hd-chip(v-if='selection' type='button' data-testid='hd-selection-clear' @click='emit("clear")') {{ ui('clear') }}
  .hd-panel-scroll(ref='scroller' aria-live='polite')
    component(
      :is='detail'
      :key='selection ? `${selection.type}:${selection.value}` : "overview"'
      :chart='chart'
      :value='detailProp'
      :pinned='selection'
      @select='emit("select", $event)'
    )
</template>

<style scoped>
.hd-panel { display: flex; flex-direction: column; padding: 0 18px 18px; }

.hd-panel-handle { display: none; }

.hd-panel-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 52px;
}

.hd-panel-scroll { flex: 1; min-width: 0; min-height: 0; }

@media (max-width: 1023px) {
  .hd-panel[data-open='true'] {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 40;
    max-height: 36dvh;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -12px 40px rgb(0 0 0 / 0.35);
    transition: max-height 220ms ease;
  }

  .hd-panel[data-open='true'][data-expanded='true'] { max-height: 72dvh; }

  @media (max-width: 52rem) {
    .hd-panel[data-open='true'] { bottom: calc(3.5rem + env(safe-area-inset-bottom)); }
  }
  .hd-panel[data-open='true'] .hd-panel-scroll { overflow-y: auto; overscroll-behavior: contain; padding-bottom: 18px; }

  .hd-panel[data-open='true'] .hd-panel-handle {
    display: block;
    width: 44px;
    height: 20px;
    margin: 0 auto;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .hd-panel[data-open='true'] .hd-panel-handle::after {
    display: block;
    width: 40px;
    height: 4px;
    margin: 8px auto 0;
    border-radius: 2px;
    background: var(--hd-text-muted);
    content: '';
  }

  .hd-panel[data-open='true'] .hd-panel-bar { min-height: 40px; }
}
</style>
