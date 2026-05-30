<script setup>
import BodygraphChannelPath from './BodygraphChannelPath.vue'
import { hoverMatchesChannel } from './bodygraphInteraction.js'

defineProps({
  lines:       { type: Array, required: true },
  hover:       { type: Object, default: null },
  hasHover:    { type: Boolean, default: false },
  strokeWidth: { type: Number, required: true },
  testid:      { type: String, required: true },
  keyPrefix:   { type: String, required: true },
})

const emit = defineEmits(['hover', 'leave'])
</script>

<template lang="pug">
g(:data-testid='testid')
  BodygraphChannelPath(
    v-for='line in lines'
    :key='`${keyPrefix}-${line.channel}-${line.gate || "full"}`'
    :line='line'
    :path-id='`${keyPrefix}-${line.channel}-${line.gate || "full"}`'
    :stroke-width='strokeWidth'
    :highlighted='hoverMatchesChannel(hover, line.channel)'
    :dimmed='hasHover && !hoverMatchesChannel(hover, line.channel)'
    @hover='emit("hover", $event)'
    @leave='emit("leave")'
  )
</template>
