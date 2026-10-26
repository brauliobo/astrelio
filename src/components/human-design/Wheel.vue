<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WheelPlanets from './WheelPlanets.vue'
import WheelRings from './WheelRings.vue'
import { isRadialAlignment, RADIAL_ALIGNMENT } from '../../lib/chart/radialSpacing.js'

const props = defineProps({
  chart:               { type: Object, required: true },
  lit:                 { type: Object, default: null },
  visualTheme:         { type: String, default: 'dark' },
  planetGlyphRenderer: { type: String, default: null },
  planetAlignment:     { type: String, default: RADIAL_ALIGNMENT.OUTER, validator: isRadialAlignment },
})

const emit = defineEmits(['hover', 'select', 'leave'])

const { t }    = useI18n()
const litGates = computed(() => props.lit && new Set(props.lit.gates))
</script>

<template lang="pug">
.human-design-wheel(data-testid='rave-mandala' :data-theme='visualTheme')
  svg.hd-wheel-svg(
    viewBox='0 0 1040 1040'
    role='group'
    :aria-label='t("human_design.wheel_aria")'
    data-testid='mandala-svg'
  )
    circle.wheel-disc(cx='520' cy='520' r='490')
    WheelRings(
      :chart='chart'
      :lit-gates='litGates'
      :visual-theme='visualTheme'
      @hover='emit("hover", $event)'
      @select='emit("select", $event)'
      @leave='emit("leave")'
    )
    WheelPlanets(
      :chart='chart'
      :glyph-renderer='planetGlyphRenderer'
      :planet-alignment='planetAlignment'
    )
  .wheel-center
    slot
</template>

<style scoped>
.human-design-wheel {
  position: relative;
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
}

.hd-wheel-svg {
  display: block;
  width: 100%;
  height: auto;
}

.wheel-disc {
  fill: var(--hd-surface);
  stroke: var(--hd-wheel-ring-stroke);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 41%;
  transform: translate(-50%, -50%);
}
</style>
