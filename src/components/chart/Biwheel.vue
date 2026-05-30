<script setup>
import ChartWheel from './ChartWheel.vue'

defineProps({
  natal:   { type: Object, required: true },
  overlay: { type: Object, required: true },
  aspectOptions: { type: Object, default: () => ({}) },
})
</script>

<template lang="pug">
.biwheel(data-testid='biwheel')
  ChartWheel(:natal='natal' :overlay='overlay' :aspect-options='aspectOptions')
</template>
