<script setup>
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '../../stores/session.js'

const { t }   = useI18n()
const session = useSessionStore()
const options = [
  { id: 'astrology',   label: 'modalities.astrology',    testid: 'relationship-modality-astrology' },
  { id: 'humanDesign', label: 'modalities.human_design', testid: 'relationship-modality-human-design' },
]
</script>

<template lang="pug">
.inline-flex.gap-1.rounded-lg.border(class='border-white/10 bg-white/5 p-0.5' data-testid='relationship-modality-switch')
  button.rounded-md.px-3.text-xs.font-medium(
    v-for='option in options'
    :key='option.id'
    class='py-1'
    type='button'
    :aria-pressed='session.relationshipModality === option.id'
    :class='session.relationshipModality === option.id ? "bg-amber-300 text-slate-950" : "text-slate-300 hover:bg-white/10"'
    :data-testid='option.testid'
    @click='session.setRelationshipModality(option.id)'
  ) {{ t(option.label) }}
</template>
