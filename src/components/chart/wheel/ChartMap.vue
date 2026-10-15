<script setup>
import { computed } from 'vue'
import AspectLayer from './AspectLayer.vue'
import HouseCusps from './HouseCusps.vue'
import HouseNumbers from './HouseNumbers.vue'
import PlanetLayer from './PlanetLayer.vue'
import { mapPlacements } from './geometry.js'
import { isRadialAlignment, RADIAL_ALIGNMENT } from '../../../lib/chart/radialSpacing.js'

const props = defineProps({
  map:                  { type: Object, required: true },
  index:                { type: Number, required: true },
  count:                { type: Number, required: true },
  wheelShift:           { type: Number, required: true },
  highlightedBodies:    { type: Array, default: () => [] },
  highlightedAspectKey: { type: String, default: '' },
  highlightedWheel:     { type: Object, default: null },
  signAxis:             { type: Object, default: null },
  aspectOptions:        { type: Object, default: () => ({}) },
  glyphRenderer:        { type: String, default: null },
  planetAlignment:      { type: String, default: RADIAL_ALIGNMENT.CENTERED, validator: isRadialAlignment },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])

const placements = computed(() =>
  mapPlacements(props.map, props.index, props.count, props.wheelShift, props.planetAlignment)
)
</script>

<template lang="pug">
g(:data-chart-map='map.id')
  HouseCusps(
    v-if='map.showHouses'
    :cusps='map.chart.cusps'
    :wheel-shift='wheelShift'
    :highlighted-wheel='highlightedWheel'
    @highlight='emit("highlight", $event)'
    @clear-highlight='emit("clear-highlight")'
    @toggle-highlight='emit("toggle-highlight", $event)'
  )
  AspectLayer(
    v-if='map.showAspects'
    :chart='map.chart'
    :wheel-shift='wheelShift'
    :colors='map.aspectColors'
    :highlighted-bodies='highlightedBodies'
    :highlighted-aspect-key='highlightedAspectKey'
    :aspect-options='aspectOptions'
    :placements='placements'
    @highlight='emit("highlight", $event)'
    @clear-highlight='emit("clear-highlight")'
    @toggle-highlight='emit("toggle-highlight", $event)'
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
    :sign-axis='signAxis'
    @highlight='emit("highlight", $event)'
    @clear-highlight='emit("clear-highlight")'
    @toggle-highlight='emit("toggle-highlight", $event)'
  )
  HouseNumbers(
    v-if='map.showHouseLabels && (count === 1 || map.planetBand)'
    :cusps='map.chart.cusps'
    :wheel-shift='wheelShift'
    :highlighted-wheel='highlightedWheel'
    @highlight='emit("highlight", $event)'
    @clear-highlight='emit("clear-highlight")'
    @toggle-highlight='emit("toggle-highlight", $event)'
  )
</template>
