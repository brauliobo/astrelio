<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BodygraphCore from './BodygraphCore.vue'
import HumanDesignActivationColumns from './HumanDesignActivationColumns.vue'

defineProps({
  chart: { type: Object, required: true },
})

const hover = ref(null)
const { t } = useI18n()
const setHover = value => { hover.value = value }
const clearHover = () => { hover.value = null }
</script>

<template lang="pug">
.bodygraph-chart(data-testid='bodygraph-chart')
  .bodygraph-dashboard
    HumanDesignActivationColumns(
      :chart='chart'
      side='design'
      :hover='hover'
      @hover='setHover'
      @leave='clearHover'
    )
    svg.bodygraph-svg(
      viewBox='0 0 520 840'
      role='img'
      :aria-label='t("human_design.bodygraph_aria")'
      data-testid='bodygraph-svg'
    )
      BodygraphCore(
        :chart='chart'
        :hover-state='hover'
        :no-defined-channels-label='t("human_design.no_defined_channels")'
        @hover-change='setHover'
      )
    HumanDesignActivationColumns(
      :chart='chart'
      side='personality'
      :hover='hover'
      @hover='setHover'
      @leave='clearHover'
    )
  .mt-3.flex.flex-wrap.gap-2.text-xs
    span.rounded-full.px-2.py-1.text-slate-300(
      v-for='channel in chart.channels'
      :key='channel'
      class='bg-white/5'
      data-testid='bodygraph-channel-chip'
    ) {{ channel }}
</template>

<style scoped>
.bodygraph-dashboard {
  display: grid;
  grid-template-columns: 82px minmax(330px, 430px) 82px;
  justify-content: center;
  gap: 10px;
  align-items: start;
}

.bodygraph-svg {
  display: block;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
}

@media (max-width: 760px) {
  .bodygraph-dashboard {
    grid-template-columns: 1fr;
  }
}
</style>
