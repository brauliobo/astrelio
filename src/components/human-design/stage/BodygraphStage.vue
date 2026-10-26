<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useMediaQuery } from '../../../composables/useMediaQuery.js'
import Bodygraph from '../bodygraph/Bodygraph.vue'
import { isBodySelection, litBySelection } from './selectionModel.js'
import ActivationLists from './ActivationLists.vue'
import MandalaPanel from './MandalaPanel.vue'
import { useHdText } from './useHdText.js'

const props = defineProps({
  chart:         { type: Object, required: true },
  pinned:        { type: Object, default: null },
  active:        { type: Object, default: null },
  glyphRenderer: { type: String, default: null },
  visualTheme:   { type: String, default: 'dark' },
})

const emit = defineEmits(['select', 'toggle', 'hover', 'clear'])

const { t, ui } = useHdText()

const view   = ref('bodygraph')
const layers = ref('both')
const labels = ref(false)
const detail = ref(false)
const frame  = ref(null)
const zoom   = ref(null)

const compact = useMediaQuery('(max-width: 1023px)')
const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

const VIEWS  = ['bodygraph', 'mandala']
const LAYERS = ['both', 'design', 'personality']

const lit          = computed(() => litBySelection(props.chart, props.active))
const bodyPinned   = computed(() => isBodySelection(props.pinned) ? props.pinned : null)
const layerLabel   = layer => layer === 'both' ? ui('both') : t(`human_design.${layer}`)

// On small screens a pinned body selection zooms the figure in and scrolls it above the selection sheet.
const reveal = async () => {
  await nextTick()
  frame.value?.scrollIntoView({ block: 'start', behavior: reduced.value ? 'auto' : 'smooth' })
}

watch(bodyPinned, (pin) => {
  zoom.value = compact.value ? pin : null
  if (zoom.value) reveal()
})
</script>

<template lang="pug">
section.hd-stage.hd-card(data-testid='hd-stage' :data-view='view')
  .hd-stage-bar
    .hd-seg(role='group' :aria-label='ui("view_aria")')
      button(
        v-for='name in VIEWS'
        :key='name'
        type='button'
        :data-testid='`hd-view-${name}`'
        :aria-pressed='String(view === name)'
        @click='view = name'
      ) {{ ui(name) }}
    .hd-seg(v-if='view === "bodygraph"' role='group' :aria-label='ui("layers_aria")')
      button(
        v-for='layer in LAYERS'
        :key='layer'
        type='button'
        :data-testid='`hd-layer-${layer}`'
        :aria-pressed='String(layers === layer)'
        @click='layers = layer'
      ) {{ layerLabel(layer) }}
    .hd-stage-toggles
      button.hd-chip(v-if='view === "bodygraph"' type='button' data-testid='hd-toggle-labels' :aria-pressed='String(labels)' @click='labels = !labels') {{ ui('labels') }}
      button.hd-chip(type='button' data-testid='hd-toggle-detail' :aria-pressed='String(detail)' @click='detail = !detail') {{ ui('detail') }}
  ActivationLists(
    :chart='chart'
    :lit='lit'
    :pinned='pinned'
    :detail='detail'
    :flank='view === "bodygraph"'
    :glyph-renderer='glyphRenderer'
    @hover='emit("hover", $event)'
    @select='emit("toggle", $event)'
  )
    .hd-figure(v-if='view === "bodygraph"' ref='frame')
      Bodygraph(
        :chart='chart'
        :layers='layers'
        :show-labels='labels'
        :pinned='bodyPinned'
        :zoom='zoom'
        :highlight='lit'
        @hover='emit("hover", $event)'
        @select='emit("select", $event)'
        @clear='emit("clear")'
      )
      button.hd-chip.hd-zoom-reset(v-if='zoom' type='button' data-testid='hd-zoom-reset' @click='zoom = null') {{ ui('reset_zoom') }}
    MandalaPanel(
      v-else
      :chart='chart'
      :lit='lit'
      :pinned='bodyPinned'
      :glyph-renderer='glyphRenderer'
      :visual-theme='visualTheme'
      @hover='emit("hover", $event)'
      @select='emit("select", $event)'
      @toggle='emit("toggle", $event)'
      @clear='emit("clear")'
    )
</template>

<style scoped>
.hd-stage { display: grid; gap: 14px; padding: 12px 8px 16px; }

@media (min-width: 640px) {
  .hd-stage { padding: 14px 16px 18px; }
}

.hd-stage-bar { display: flex; align-items: center; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.hd-stage-bar > *, .hd-stage-toggles > * { flex: none; }
.hd-stage-toggles { display: flex; gap: 6px; margin-left: auto; }

@media (min-width: 640px) {
  .hd-stage-bar { flex-wrap: wrap; overflow: visible; }
}

.hd-figure { position: relative; scroll-margin-top: 72px; }
.hd-zoom-reset { position: absolute; top: 6px; right: 6px; background: var(--hd-surface); }

.hd-stage :deep(.hd-bodygraph) { max-height: calc(100svh - 190px); margin-inline: auto; }
.hd-stage :deep(.hd-bodygraph[data-zoomed='true']) { max-height: 40dvh; }
</style>
