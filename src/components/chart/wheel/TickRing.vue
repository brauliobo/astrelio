<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { wheelHighlight } from '../../../lib/chart/highlight.js'
import { WHEEL_RADII, longitudeLabel, norm360, polarPoint } from './geometry.js'

const props = defineProps({
  wheelShift:       { type: Number, required: true },
  highlightedWheel: { type: Object, default: null },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])
const { t, tm } = useI18n()
const localizedLongitude = longitude => longitudeLabel(longitude, tm('zodiac.signs'))

const ticks = computed(() =>
  Array.from({ length: 360 }, (_, degree) => {
    const isSign    = degree % 30 === 0
    const isDecan   = degree % 10 === 0
    const isFive    = degree % 5 === 0
    const longitude = norm360(degree + props.wheelShift)
    const outer     = polarPoint(WHEEL_RADII.zodiacInner - 1, longitude)
    const inner     = polarPoint(WHEEL_RADII.zodiacInner - (isSign ? 11 : isDecan ? 7 : isFive ? 5 : 2.6), longitude)
    return {
      degree,
      outer,
      inner,
      stroke:  isSign ? 'var(--chart-cusp-angle)' : 'var(--chart-ink-muted)',
      width:   isSign ? 1.35 : isDecan ? 0.8 : isFive ? 0.55 : 0.35,
      opacity: isSign ? 0.9 : isDecan ? 0.5 : isFive ? 0.34 : 0.18,
      title:   t('chart.wheel_details.titles.tick_position', { degree, longitude: localizedLongitude(degree) }),
      focusable: isSign || isDecan || isFive,
      payload: wheelHighlight('tick', `tick-${degree}`, {
        degree,
        title:   t('chart.wheel_details.titles.tick', { degree }),
        details: [
          { label: t('chart.wheel_details.labels.longitude'), value: localizedLongitude(degree) },
          { label: t('chart.wheel_details.labels.scale'), value: t(`chart.wheel_details.values.${isSign ? 'sign_boundary' : isDecan ? 'decan_marker' : isFive ? 'five_degree_marker' : 'degree_marker'}`) },
        ],
      }),
    }
  })
)

const tickState = (tick) => {
  if (props.highlightedWheel?.kind !== 'tick') return 'idle'
  return props.highlightedWheel.id === `tick-${tick.degree}` ? 'active' : 'dimmed'
}
const sameWheel = payload =>
  payload?.wheel?.kind === props.highlightedWheel?.kind && payload?.wheel?.id === props.highlightedWheel?.id
const emitPayload = (event, payload) => emit(event, payload)
</script>

<template lang="pug">
g(data-testid='tick-ring')
  g(
    v-for='tick in ticks'
    :key='tick.degree'
    :aria-label='tick.title'
    :aria-pressed='sameWheel(tick.payload)'
    :data-highlight='tickState(tick)'
    :data-wheel-kind='tick.payload.wheel.kind'
    :data-wheel-id='tick.payload.wheel.id'
    :role='tick.focusable ? "button" : null'
    :tabindex='tick.focusable ? 0 : null'
    class='tick-marker'
    @mouseenter='emitPayload("highlight", tick.payload)'
    @mouseleave='$emit("clear-highlight")'
    @focus='emitPayload("highlight", tick.payload)'
    @blur='$emit("clear-highlight")'
    @click.stop='emitPayload("toggle-highlight", tick.payload)'
    @keydown.enter.prevent='emitPayload("toggle-highlight", tick.payload)'
    @keydown.space.prevent='emitPayload("toggle-highlight", tick.payload)'
  )
    title {{ tick.title }}
    line(
      :x1='tick.inner.x'
      :y1='tick.inner.y'
      :x2='tick.outer.x'
      :y2='tick.outer.y'
      stroke='transparent'
      stroke-width='4'
      stroke-linecap='round'
    )
    line(
      :x1='tick.inner.x'
      :y1='tick.inner.y'
      :x2='tick.outer.x'
      :y2='tick.outer.y'
      :stroke='tick.stroke'
      :stroke-width='tick.width'
      :stroke-opacity='tick.opacity'
      stroke-linecap='round'
      pointer-events='none'
      class='tick-marker__line'
    )
</template>

<style scoped>
.tick-marker {
  cursor: crosshair;
  outline: none;
}

.tick-marker__line {
  transition: filter 120ms ease, opacity 120ms ease, stroke-width 120ms ease, stroke-opacity 120ms ease;
}

.tick-marker[data-highlight='active'] .tick-marker__line,
.tick-marker:hover .tick-marker__line,
.tick-marker:focus-visible .tick-marker__line {
  filter: drop-shadow(0 0 3px var(--chart-angle-accent));
  stroke-opacity: 0.95;
  stroke-width: 1.6;
}

.tick-marker[data-highlight='dimmed'] .tick-marker__line {
  opacity: 0.24;
}
</style>
