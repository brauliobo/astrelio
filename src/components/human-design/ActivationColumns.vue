<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { HD_PLANETS } from '../../lib/human-design/constants.js'
import { centerByGate } from './bodygraphGateGeometry.js'
import { hoverMatchesGate } from './bodygraphInteraction.js'
import ActivationRow from './ActivationRow.vue'

const props = defineProps({
  chart: { type: Object, required: true },
  side: { type: String, required: true },
  hover: { type: Object, default: null },
  centered: { type: Boolean, default: false },
  visualTheme: { type: String, default: 'dark' },
  glyphRenderer: { type: String, default: null },
})

const emit = defineEmits(['hover', 'leave'])
const { t } = useI18n()

const rows = computed(() =>
  HD_PLANETS.map(planet => ({
    planet,
    activation: props.chart[props.side]?.[planet],
  })).filter(row => row.activation)
)

const isHighlighted = row => hoverMatchesGate(props.hover, row.activation.gate, centerByGate[row.activation.gate])
const hasHover = computed(() => Boolean(props.hover))
</script>

<template lang="pug">
.activation-column(:class='[side, { centered }]' :data-theme='visualTheme')
  .activation-title {{ side === 'design' ? t('human_design.design') : t('human_design.personality') }}
  ActivationRow(
    v-for='row in rows'
    :key='`${side}-${row.planet}`'
    :row='row'
    :side='side'
    :glyph-renderer='glyphRenderer'
    :highlighted='isHighlighted(row)'
    :dimmed='hasHover && !isHighlighted(row)'
    @hover='emit("hover", $event)'
    @leave='emit("leave")'
  )
</template>

<style scoped>
.activation-column {
  display: grid;
  gap: 10px;
  padding-top: 52px;
  color: var(--hd-personality, #f8fafc);
}

.activation-column.centered {
  align-self: center;
  padding-top: 0;
}

.activation-title {
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(216, 79, 81, 0.85);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.activation-column.design {
  color: var(--hd-design, #e0595b);
}

.activation-column.personality .activation-title {
  border-bottom-color: var(--hd-personality-rule, rgba(248, 250, 252, 0.72));
}

.activation-column.personality :deep(.activation-row) {
  grid-template-columns: 1fr 24px;
}

.activation-column.personality :deep(.activation-row.highlighted) {
  background: var(--hd-personality-highlight, rgba(248, 250, 252, 0.12));
}

.activation-column[data-theme='light'] {
  --hd-personality: #0f172a;
  --hd-personality-rule: rgba(15, 23, 42, 0.34);
  --hd-personality-highlight: rgba(15, 23, 42, 0.08);
}

.activation-column.personality :deep(.activation-code) {
  text-align: right;
}

@media (max-width: 760px) {
  .activation-column {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-top: 0;
  }

  .activation-title {
    grid-column: 1 / -1;
  }
}
</style>
