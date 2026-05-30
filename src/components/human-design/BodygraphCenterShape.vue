<script setup>
defineProps({
  center: { type: Object, required: true },
  highlighted: { type: Boolean, default: false },
  dimmed: { type: Boolean, default: false },
})

const emit = defineEmits(['hover', 'leave'])
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
  :aria-label='`${center.name} center`'
)
  path(
    :d='center.shape.d'
    :fill='center.defined ? center.fill : "#fbfaf4"'
    :fill-opacity='dimmed ? 0.42 : center.defined ? 0.98 : 0.92'
    :stroke='highlighted ? "#f8fafc" : center.defined ? "rgba(255,255,255,0.22)" : "rgba(15,23,42,0.1)"'
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
