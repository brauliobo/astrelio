<script setup>
import { useSettingsStore } from '../../../stores/settings.js'
import CelestialGlyph from '../../common/CelestialGlyph.vue'

defineProps({ planet: { type: String, required: true }, size: { type: Number, default: 14 } })

const settings = useSettingsStore()
</script>

<template lang="pug">
CelestialGlyph(:reference='planet' :renderer='settings.planetGlyphRenderer' :size='size' :weight='700')
</template>
