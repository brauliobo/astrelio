<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import PlanetGlyph from './PlanetGlyph.vue'

const props = defineProps({
  layer:  { type: String, required: true },
  planet: { type: String, default: '' },
  code:   { type: String, default: '' },
})

const { t } = useI18n()
const label = computed(() => [humanDesignValueLabel(t, 'layer', props.layer), props.planet && t(`planets.${props.planet}`)].filter(Boolean).join(' '))
</script>

<template lang="pug">
span.hda-mark(:data-layer='layer' data-testid='analysis-activation-tag')
  span.hda-dot(:data-layer='layer' aria-hidden='true')
  PlanetGlyph(v-if='planet' :planet='planet')
  span.hda-sr {{ label }}
  span(v-if='code') {{ code }}
  span(v-else-if='!planet') {{ label }}
</template>
