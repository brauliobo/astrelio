<script setup>
import { computed } from 'vue'
import AngleMarkers from './wheel/AngleMarkers.vue'
import ChartMap from './wheel/ChartMap.vue'
import TickRing from './wheel/TickRing.vue'
import WheelFrame from './wheel/WheelFrame.vue'
import ZodiacRing from './wheel/ZodiacRing.vue'
import { VIEWBOX_SIZE, mapsFromProps, norm360 } from './wheel/geometry.js'

const props = defineProps({
  natal: { type: Object, default: null },
  overlay: { type: Object, default: null },
  charts: { type: Array, default: () => [] },
  size: { type: Number, default: 520 },
})

const maps = computed(() => mapsFromProps(props))
const baseChart = computed(() => maps.value[0]?.chart || null)
const wheelShift = computed(() => norm360(-(baseChart.value?.cusps?.[0] || 0)))
const style = computed(() => ({
  width: `${props.size}px`,
  maxWidth: '100%',
}))
</script>

<template lang="pug">
.chart-wheel.relative.mx-auto(ref='host' data-testid='chart-wheel' :style='style')
  svg(
    v-if='baseChart'
    :viewBox='`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`'
    role='img'
    data-testid='chart-wheel-svg'
  )
    WheelFrame
    ChartMap(
      v-for='(map, index) in maps'
      :key='map.id'
      :map='map'
      :index='index'
      :count='maps.length'
      :wheel-shift='wheelShift'
    )
    ZodiacRing(:wheel-shift='wheelShift')
    TickRing(:wheel-shift='wheelShift')
    AngleMarkers(
      v-if='maps[0]?.showAngles'
      :chart='baseChart'
      :wheel-shift='wheelShift'
    )
</template>
