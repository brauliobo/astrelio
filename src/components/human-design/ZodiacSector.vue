<script setup>
defineProps({
  segment: { type: Object, required: true },
})
</script>

<template lang="pug">
path(
  :d='segment.path'
  :fill='segment.fill'
  :stroke='segment.stroke'
  stroke-width='0.75'
  data-testid='hd-zodiac-sector'
)
</template>
