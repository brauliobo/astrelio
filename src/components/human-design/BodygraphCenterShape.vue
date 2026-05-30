<script setup>
import { useI18n } from 'vue-i18n'
import { humanDesignValueLabel } from '../../lib/human-design/labels.js'

defineProps({
  center: { type: Object, required: true },
  highlighted: { type: Boolean, default: false },
  dimmed: { type: Boolean, default: false },
})

const emit = defineEmits(['hover', 'leave'])
const { t } = useI18n()
</script>

<template lang="pug">
g(
  :data-center='center.name'
  :data-defined='String(center.defined)'
  :data-testid='center.defined ? "bodygraph-defined-center" : "bodygraph-open-center"'
  @pointerenter='emit("hover", center.name)'
  @pointerleave='emit("leave")'
  @focus='emit("hover", center.name)'
  @blur='emit("leave")'
  tabindex='0'
  role='button'
  :aria-label='t("human_design.center_aria", { center: humanDesignValueLabel(t, "center", center.name) })'
)
  path(
    :d='center.shape.d'
    :fill='center.defined ? center.fill : center.openFill'
    :fill-opacity='dimmed ? 0.42 : center.defined ? 0.98 : 0.92'
    :stroke='highlighted ? center.highlightStroke : center.defined ? center.definedStroke : center.openStroke'
    :stroke-width='highlighted ? 3 : 1'
    class='center-shape'
  )
</template>

<style scoped>
g {
  cursor: pointer;
  outline: none;
}

.center-shape {
  transition: fill-opacity 140ms ease, stroke 140ms ease, stroke-width 140ms ease;
}
</style>
