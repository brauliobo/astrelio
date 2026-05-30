<script setup>
import { computed } from 'vue'
import WheelArc from './WheelArc.vue'
import { CENTER, WHEEL_RADII, midpointLongitude, norm360, polarPoint } from './geometry.js'

const props = defineProps({
  cusps: { type: Array, required: true },
  wheelShift: { type: Number, required: true },
})

const ANGLE_AXIS_STROKES = {
  0: 'var(--chart-angle-asc, var(--chart-angle-accent))',
  3: 'var(--chart-angle-mc, var(--chart-angle-accent))',
  6: 'var(--chart-angle-asc, var(--chart-angle-accent))',
  9: 'var(--chart-angle-mc, var(--chart-angle-accent))',
}

const cusps = computed(() =>
  props.cusps.map((cusp, index) => {
    const angleStroke = ANGLE_AXIS_STROKES[index]
    const isAngle = Boolean(angleStroke)
    const longitude = norm360(cusp + props.wheelShift)
    return {
      index,
      inner: polarPoint(WHEEL_RADII.houseInner, longitude),
      outer: polarPoint(WHEEL_RADII.zodiacInner, longitude),
      stroke: angleStroke || 'var(--chart-cusp-line)',
      opacity: isAngle ? 0.74 : 0.46,
      width: isAngle ? 1.75 : 0.75,
    }
  })
)

const sectors = computed(() =>
  props.cusps.map((cusp, index) => ({
    index,
    start: norm360(cusp + props.wheelShift),
    end: norm360(props.cusps[(index + 1) % 12] + props.wheelShift),
    midpoint: midpointLongitude(cusp, props.cusps[(index + 1) % 12]),
    fill: index % 2 === 0 ? 'var(--chart-house-fill-a)' : 'var(--chart-house-fill-b)',
  }))
)
</script>

<template lang="pug">
g(data-testid='house-cusps' pointer-events='none')
  WheelArc(
    v-for='sector in sectors'
    :key='`house-sector-${sector.index}`'
    :inner-radius='WHEEL_RADII.houseInner'
    :outer-radius='WHEEL_RADII.houseOuter'
    :start-longitude='sector.start'
    :end-longitude='sector.end'
    :fill='sector.fill'
    stroke='none'
  )
  line(
    v-for='cusp in cusps'
    :key='cusp.index'
    :data-testid='`house-cusp-${cusp.index + 1}`'
    :x1='cusp.inner.x'
    :y1='cusp.inner.y'
    :x2='cusp.outer.x'
    :y2='cusp.outer.y'
    :stroke='cusp.stroke'
    :stroke-width='cusp.width'
    :stroke-opacity='cusp.opacity'
    stroke-linecap='round'
  )
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseOuter' fill='none' stroke='var(--chart-ink-muted)' stroke-width='1.05')
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseInner' fill='none' stroke='var(--chart-frame-stroke)' stroke-width='1.55')
</template>
