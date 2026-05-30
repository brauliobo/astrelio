<script setup>
import { computed } from 'vue'
import AspectLayer from './AspectLayer.vue'
import HouseCusps from './HouseCusps.vue'
import HouseNumbers from './HouseNumbers.vue'
import PlanetLayer from './PlanetLayer.vue'
import { planetBandFor, planetPlacements } from './geometry.js'

const props = defineProps({
  map: { type: Object, required: true },
  index: { type: Number, required: true },
  count: { type: Number, required: true },
  wheelShift: { type: Number, required: true },
  highlightedBodies: { type: Array, default: () => [] },
  highlightedAspectKey: { type: String, default: '' },
  aspectOptions: { type: Object, default: () => ({}) },
  glyphRenderer: { type: String, default: null },
})
defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const band = computed(() => planetBandFor(props.map, props.index, props.count))
const placements = computed(() =>
  planetPlacements(props.map.chart, props.wheelShift, band.value, props.map.planetSymbols || undefined)
)
</script>

<template lang="pug">
g(:data-chart-map='map.id')
  HouseCusps(
    v-if='map.showHouses'
    :cusps='map.chart.cusps'
    :wheel-shift='wheelShift'
  )
  AspectLayer(
    v-if='map.showAspects'
    :chart='map.chart'
    :wheel-shift='wheelShift'
    :colors='map.aspectColors'
    :highlighted-bodies='highlightedBodies'
    :highlighted-aspect-key='highlightedAspectKey'
    :aspect-options='aspectOptions'
    @highlight='$emit("highlight", $event)'
    @clear-highlight='$emit("clear-highlight")'
    @toggle-highlight='$emit("toggle-highlight", $event)'
  )
  PlanetLayer(
    :placements='placements'
    :color='map.color'
    :map-index='index'
    :symbols='map.planetSymbols'
    :colors='map.planetColors'
    :labels='map.planetLabels'
    :glyph-renderer='glyphRenderer'
    :highlighted-bodies='highlightedBodies'
    @highlight='$emit("highlight", $event)'
    @clear-highlight='$emit("clear-highlight")'
    @toggle-highlight='$emit("toggle-highlight", $event)'
  )
  HouseNumbers(
    v-if='map.showHouseLabels && count === 1'
    :cusps='map.chart.cusps'
    :wheel-shift='wheelShift'
  )
</template>
