<script setup>
import ChartWheel from './ChartWheel.vue'

defineProps({
  natal:   { type: Object, required: true },
  overlay: { type: Object, required: true }
})
</script>

<template lang="pug">
.biwheel(data-testid='biwheel')
  ChartWheel(:natal='natal' :overlay='overlay')
</template>
