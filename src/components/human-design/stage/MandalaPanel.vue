<script setup>
import Bodygraph from '../bodygraph/Bodygraph.vue'
import Wheel from '../Wheel.vue'

defineProps({
  chart:         { type: Object, required: true },
  lit:           { type: Object, default: null },
  pinned:        { type: Object, default: null },
  glyphRenderer: { type: String, default: null },
  visualTheme:   { type: String, default: 'dark' },
})

const emit = defineEmits(['select', 'toggle', 'hover', 'clear'])
</script>

<template lang="pug">
.hd-mandala(data-testid='hd-mandala-panel')
  Wheel(
    :chart='chart'
    :lit='lit'
    :visual-theme='visualTheme'
    :planet-glyph-renderer='glyphRenderer'
    @hover='emit("hover", $event)'
    @select='emit("toggle", $event)'
    @leave='emit("hover", null)'
  )
    Bodygraph(
      :chart='chart'
      size='compact'
      :show-labels='false'
      :pinned='pinned'
      :highlight='lit'
      @hover='emit("hover", $event)'
      @select='emit("select", $event)'
      @clear='emit("clear")'
    )
</template>

<style scoped>
.hd-mandala { min-width: 0; padding: 8px; border-radius: 16px; background: var(--hd-surface); }
</style>
