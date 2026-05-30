<script setup>
import BodygraphCenterShape from './BodygraphCenterShape.vue'
import BodygraphGateMarker from './BodygraphGateMarker.vue'
import { hoverMatchesCenter, hoverMatchesGate } from './bodygraphInteraction.js'

defineProps({
  center:    { type: Object, required: true },
  hover:     { type: Object, default: null },
  hasHover:  { type: Boolean, default: false },
  showShape: { type: Boolean, default: true },
  showGates: { type: Boolean, default: true },
})

const emit = defineEmits(['center-hover', 'gate-hover', 'leave'])
</script>

<template lang="pug">
g(:data-center-group='center.name')
  BodygraphCenterShape(
    v-if='showShape'
    :center='center'
    :highlighted='hoverMatchesCenter(hover, center.name, center.gateNumbers)'
    :dimmed='hasHover && !hoverMatchesCenter(hover, center.name, center.gateNumbers)'
    @hover='emit("center-hover", $event)'
    @leave='emit("leave")'
  )
  BodygraphGateMarker(
    v-if='showGates'
    v-for='gate in center.gates'
    :key='`${center.name}-${gate.gate}`'
    :item='gate'
    :highlighted='hoverMatchesGate(hover, gate.gate, center.name)'
    :dimmed='hasHover && !hoverMatchesGate(hover, gate.gate, center.name)'
    @hover='emit("gate-hover", $event)'
    @leave='emit("leave")'
  )
</template>
