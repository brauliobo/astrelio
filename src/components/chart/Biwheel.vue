<script setup>
import Wheel from './Wheel.vue'

defineProps({
  natal:               { type: Object, required: true },
  overlay:             { type: Object, required: true },
  aspectOptions:       { type: Object, default: () => ({}) },
  planetGlyphRenderer: { type: String, default: null },
})
</script>

<template lang="pug">
.biwheel(data-testid='biwheel')
  Wheel(
    :natal='natal'
    :overlay='overlay'
    :aspect-options='aspectOptions'
    :planet-glyph-renderer='planetGlyphRenderer'
  )
</template>
