<script setup>
import { activationCode } from '../../lib/human-design/activations.js'
import CelestialGlyph from '../common/CelestialGlyph.vue'

defineProps({
  row: { type: Object, required: true },
  side: { type: String, required: true },
  highlighted: { type: Boolean, default: false },
  dimmed: { type: Boolean, default: false },
})

const emit = defineEmits(['hover', 'leave'])
</script>

<template lang="pug">
.activation-row(
  :class='{ highlighted, dimmed }'
  @pointerenter='emit("hover", { type: "gate", value: row.activation.gate })'
  @pointerleave='emit("leave")'
)
  template(v-if='side === "design"')
    span.activation-glyph
      CelestialGlyph(:reference='row.planet' :size='20' :weight='700')
    span.activation-code {{ activationCode(row.activation) }}
  template(v-else)
    span.activation-code {{ activationCode(row.activation) }}
    span.activation-glyph
      CelestialGlyph(:reference='row.planet' :size='20' :weight='700')
</template>

<style scoped>
.activation-row {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 8px;
  align-items: center;
  min-height: 24px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 13px;
  transition: background 140ms ease, color 140ms ease, opacity 140ms ease, transform 140ms ease;
}

.activation-row.highlighted {
  background: rgba(216, 79, 81, 0.92);
  color: #ffffff;
  opacity: 1;
  transform: translateX(2px);
}

.activation-row.dimmed {
  opacity: 0.28;
}

.activation-glyph {
  display: grid;
  place-items: center;
}

.activation-code {
  font-weight: 700;
  white-space: nowrap;
}
</style>
