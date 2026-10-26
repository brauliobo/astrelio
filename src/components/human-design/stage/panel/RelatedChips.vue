<script setup>
import { sameSelection } from '../../bodygraph/bodygraphSelection.js'

defineProps({
  items:  { type: Array, required: true },
  pinned: { type: Object, default: null },
})

const emit = defineEmits(['select'])
</script>

<template lang="pug">
.hd-related
  button.hd-chip(
    v-for='item in items'
    :key='`${item.type}:${item.value}`'
    type='button'
    :data-tone='item.tone'
    :aria-pressed='String(sameSelection(pinned, item))'
    @click='emit("select", { type: item.type, value: item.value })'
  )
    span.hd-dot(v-for='tone in item.tones' :key='tone' :data-tone='tone')
    span.hd-num {{ item.label }}
</template>

<style scoped>
.hd-related { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
