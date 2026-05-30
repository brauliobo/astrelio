<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BodygraphCore from './BodygraphCore.vue'
import ActivationColumns from './ActivationColumns.vue'
import WheelPlanets from './WheelPlanets.vue'
import WheelRings from './WheelRings.vue'
import { humanDesignPalette } from './visualTheme.js'

const props = defineProps({
  chart: { type: Object, required: true },
  visualTheme: { type: String, default: 'dark' },
})

const hover = ref(null)
const { t } = useI18n()
const palette = computed(() => humanDesignPalette(props.visualTheme))
const setHover = value => { hover.value = value }
const clearHover = () => { hover.value = null }
</script>

<template lang="pug">
.human-design-wheel(data-testid='rave-mandala' :data-theme='visualTheme')
  .wheel-layout
    ActivationColumns(
      :chart='chart'
      side='design'
      :hover='hover'
      centered
      :visual-theme='visualTheme'
      @hover='setHover'
      @leave='clearHover'
    )
    .wheel-viewport
      svg.hd-wheel-svg(
        viewBox='0 0 1040 1040'
        role='img'
        :aria-label='t("human_design.wheel_aria")'
        data-testid='bodygraph-svg'
      )
        defs
          filter#hd-wheel-shadow(x='-20%' y='-20%' width='140%' height='140%')
            feDropShadow(dx='0' dy='18' stdDeviation='20' flood-color='#000000' flood-opacity='0.26')
        WheelRings(
          :chart='chart'
          :hover='hover'
          :visual-theme='visualTheme'
          @hover='setHover'
          @leave='clearHover'
        )
        WheelPlanets(:chart='chart')
        g(data-testid='bodygraph-chart' transform='translate(317 242) scale(0.78)' filter='url(#hd-wheel-shadow)')
          BodygraphCore(
            :chart='chart'
            :hover-state='hover'
            :no-defined-channels-label='t("human_design.no_defined_channels")'
            :figure-fill='palette.figure'
            :figure-opacity='palette.figureOpacity'
            :show-open-channels='true'
            :open-channel-opacity='0.26'
            :defined-channel-width='13'
            :gate-inactive-fill='palette.gateInactiveFill'
            :visual-theme='visualTheme'
            @hover-change='setHover'
          )
    ActivationColumns(
      :chart='chart'
      side='personality'
      :hover='hover'
      centered
      :visual-theme='visualTheme'
      @hover='setHover'
      @leave='clearHover'
    )
</template>

<style scoped>
.human-design-wheel {
  width: 100%;
}

.wheel-layout {
  display: grid;
  grid-template-columns: minmax(94px, 130px) minmax(0, 1fr) minmax(94px, 130px);
  gap: 18px;
  align-items: center;
}

.wheel-viewport {
  min-width: 0;
}

.hd-wheel-svg {
  display: block;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .wheel-layout {
    grid-template-columns: 1fr;
  }
}
</style>
