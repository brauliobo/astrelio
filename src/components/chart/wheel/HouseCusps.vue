<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Arc from './Arc.vue'
import { wheelHighlight } from '../../../lib/chart/highlight.js'
import { CENTER, WHEEL_RADII, longitudeLabel, midpointLongitude, norm360, polarPoint } from './geometry.js'

const props = defineProps({
  cusps:            { type: Array, required: true },
  wheelShift:       { type: Number, required: true },
  highlightedWheel: { type: Object, default: null },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])
const { t } = useI18n()

const ANGLE_AXIS_STROKES = {
  0: 'var(--chart-angle-asc, var(--chart-angle-accent))',
  3: 'var(--chart-angle-mc, var(--chart-angle-accent))',
  6: 'var(--chart-angle-asc, var(--chart-angle-accent))',
  9: 'var(--chart-angle-mc, var(--chart-angle-accent))',
}

const cusps = computed(() =>
  props.cusps.map((cusp, index) => {
    const angleStroke = ANGLE_AXIS_STROKES[index]
    const isAngle     = Boolean(angleStroke)
    const longitude   = norm360(cusp + props.wheelShift)
    return {
      index,
      inner:   polarPoint(WHEEL_RADII.houseInner, longitude),
      outer:   polarPoint(WHEEL_RADII.zodiacInner, longitude),
      stroke:  angleStroke || 'var(--chart-cusp-line)',
      opacity: isAngle ? 0.74 : 0.46,
      title:   `House ${index + 1} cusp: ${longitudeLabel(cusp)}`,
      payload: wheelHighlight('cusp', `cusp-${index + 1}`, {
        house:     index + 1,
        longitude: cusp,
        title:     `House ${index + 1} cusp`,
        details:   [
          { label: 'Longitude', value: longitudeLabel(cusp) },
          { label: 'Boundary', value: `Starts house ${index + 1}` },
        ],
      }),
      width:   isAngle ? 1.75 : 0.75,
    }
  })
)

const sectors = computed(() =>
  props.cusps.map((cusp, index) => ({
    index,
    start:    norm360(cusp + props.wheelShift),
    end:      norm360(props.cusps[(index + 1) % 12] + props.wheelShift),
    midpoint: midpointLongitude(cusp, props.cusps[(index + 1) % 12]),
    fill:     index % 2 === 0 ? 'var(--chart-house-fill-a)' : 'var(--chart-house-fill-b)',
    title:    `House ${index + 1}: ${longitudeLabel(cusp)} to ${longitudeLabel(props.cusps[(index + 1) % 12])}`,
    payload:  wheelHighlight('house', `house-${index + 1}`, {
      house:     index + 1,
      start:     cusp,
      end:       props.cusps[(index + 1) % 12],
      midpoint:  midpointLongitude(cusp, props.cusps[(index + 1) % 12]),
      title:     `House ${index + 1}`,
      details:   [
        { label: 'Cusp', value: longitudeLabel(cusp) },
        { label: 'Next cusp', value: longitudeLabel(props.cusps[(index + 1) % 12]) },
        { label: 'Midpoint', value: longitudeLabel(midpointLongitude(cusp, props.cusps[(index + 1) % 12])) },
      ],
    }),
  }))
)

const sameWheel = payload =>
  payload?.wheel?.kind === props.highlightedWheel?.kind && payload?.wheel?.id === props.highlightedWheel?.id
const layerIsActive = (kinds) => kinds.includes(props.highlightedWheel?.kind)
const houseState = (house) => {
  if (sameWheel(house.payload)) return 'active'
  if (!layerIsActive(['house', 'cusp'])) return 'idle'
  return props.highlightedWheel?.house === house.index + 1 ? 'active' : 'dimmed'
}
const cuspState = (cusp) => {
  if (sameWheel(cusp.payload)) return 'active'
  if (!layerIsActive(['house', 'cusp'])) return 'idle'
  return props.highlightedWheel?.house === cusp.index + 1 ? 'active' : 'dimmed'
}
const emitPayload = (event, payload) => emit(event, payload)
</script>

<template lang="pug">
g(data-testid='house-cusps')
  g(
    v-for='sector in sectors'
    :key='`house-sector-${sector.index}`'
    :aria-label='sector.title'
    :aria-pressed='sameWheel(sector.payload)'
    :data-highlight='houseState(sector)'
    :data-wheel-kind='sector.payload.wheel.kind'
    :data-wheel-id='sector.payload.wheel.id'
    role='button'
    tabindex='0'
    class='house-sector'
    @mouseenter='emitPayload("highlight", sector.payload)'
    @mouseleave='$emit("clear-highlight")'
    @focus='emitPayload("highlight", sector.payload)'
    @blur='$emit("clear-highlight")'
    @click.stop='emitPayload("toggle-highlight", sector.payload)'
    @keydown.enter.prevent='emitPayload("toggle-highlight", sector.payload)'
    @keydown.space.prevent='emitPayload("toggle-highlight", sector.payload)'
  )
    Arc(
      :inner-radius='WHEEL_RADII.houseInner'
      :outer-radius='WHEEL_RADII.houseOuter'
      :start-longitude='sector.start'
      :end-longitude='sector.end'
      :fill='sector.fill'
      stroke='none'
      :title='sector.title'
      :highlight-state='houseState(sector)'
      class='house-sector__arc'
    )
  line(
    v-for='cusp in cusps'
    :key='cusp.index'
    :aria-label='cusp.title'
    :aria-pressed='sameWheel(cusp.payload)'
    :data-highlight='cuspState(cusp)'
    :data-wheel-kind='cusp.payload.wheel.kind'
    :data-wheel-id='cusp.payload.wheel.id'
    :x1='cusp.inner.x'
    :y1='cusp.inner.y'
    :x2='cusp.outer.x'
    :y2='cusp.outer.y'
    stroke='transparent'
    stroke-width='8'
    stroke-linecap='round'
    role='button'
    tabindex='0'
    class='house-cusp-hit'
    @mouseenter='emitPayload("highlight", cusp.payload)'
    @mouseleave='$emit("clear-highlight")'
    @focus='emitPayload("highlight", cusp.payload)'
    @blur='$emit("clear-highlight")'
    @click.stop='emitPayload("toggle-highlight", cusp.payload)'
    @keydown.enter.prevent='emitPayload("toggle-highlight", cusp.payload)'
    @keydown.space.prevent='emitPayload("toggle-highlight", cusp.payload)'
  )
    title {{ cusp.title }}
  line(
    v-for='cusp in cusps'
    :key='`visible-${cusp.index}`'
    :data-testid='`house-cusp-${cusp.index + 1}`'
    :x1='cusp.inner.x'
    :y1='cusp.inner.y'
    :x2='cusp.outer.x'
    :y2='cusp.outer.y'
    :stroke='cusp.stroke'
    :stroke-width='cusp.width'
    :stroke-opacity='cusp.opacity'
    stroke-linecap='round'
    pointer-events='none'
    :data-highlight='cuspState(cusp)'
    class='house-cusp-line'
  )
    title {{ cusp.title }}
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseOuter' fill='none' stroke='var(--chart-ink-muted)' stroke-width='1.05')
    title {{ t('chart.wheel_accessibility.house_outer_boundary') }}
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.houseInner' fill='none' stroke='var(--chart-frame-stroke)' stroke-width='1.55')
    title {{ t('chart.wheel_accessibility.house_inner_boundary') }}
</template>

<style scoped>
.house-sector,
.house-cusp-hit {
  cursor: pointer;
  outline: none;
}

.house-sector__arc,
.house-cusp-line {
  transition: filter 140ms ease, opacity 140ms ease, stroke-width 140ms ease, stroke-opacity 140ms ease;
}

.house-sector[data-highlight='active'] .house-sector__arc,
.house-sector:hover .house-sector__arc,
.house-sector:focus-visible .house-sector__arc {
  filter: drop-shadow(0 0 5px var(--chart-angle-accent));
  opacity: 1;
}

.house-sector[data-highlight='dimmed'] .house-sector__arc {
  opacity: 0.45;
}

.house-cusp-line[data-highlight='active'],
.house-cusp-hit:hover + .house-cusp-line,
.house-cusp-hit:focus-visible + .house-cusp-line {
  filter: drop-shadow(0 0 4px var(--chart-angle-accent));
  stroke-opacity: 0.95;
  stroke-width: 2.4;
}

.house-cusp-line[data-highlight='dimmed'] {
  opacity: 0.28;
}
</style>
