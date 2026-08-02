<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { houseOf } from '../../lib/astro/houses.js'
import { motionStateForSpeed } from '../../lib/astro/motion.js'
import { signAxisFor } from '../../lib/astro/sign-axes.js'
import { degInSign, signIndex } from '../../lib/astro/zodiac.js'

const props = defineProps({
  chart:     { type: Object, required: true },
  bodies:    { type: Array, default: () => [] },
  aspectKey: { type: String, default: '' },
  aspect:    { type: Object, default: null },
  wheel:     { type: Object, default: null },
  placement: { type: String, default: 'overlay', validator: value => ['overlay', 'below'].includes(value) },
})

const { t, tm, te } = useI18n()
const signs      = computed(() => tm('zodiac.signs'))
const houseNames = computed(() => {
  const names = tm('houses.names')
  return Array.isArray(names) ? names : []
})

const label = (scope, key) => {
  const path = `${scope}.${key}`
  return te(path) ? t(path) : key
}

const houseLabel = (house) => {
  const base = te('analysis.house_n') ? t('analysis.house_n', { house }) : `House ${house}`
  const name = houseNames.value[house - 1] || ''
  if (!name) return base
  return te('houses.numbered_name')
    ? t('houses.numbered_name', { house, name })
    : `${base} · ${name}`
}

const houseFact = (house) => {
  const name = houseNames.value[house - 1] || ''
  return [house, name].filter(Boolean).join(' · ')
}

const formatDegree = (longitude) => {
  const totalMinutes = Math.floor((degInSign(longitude) * 60) + 1e-6)
  const degrees      = Math.floor(totalMinutes / 60)
  const minutes      = totalMinutes % 60
  return `${degrees}°${minutes.toString().padStart(2, '0')}′`
}

const formatOrb = (value) => {
  if (!Number.isFinite(Number(value))) return ''
  const totalMinutes = Math.round(Math.abs(Number(value)) * 60)
  const degrees      = Math.floor(totalMinutes / 60)
  const minutes      = totalMinutes % 60
  return `${degrees}°${minutes.toString().padStart(2, '0')}′`
}

const motionLabel = (position) => {
  let state = position.motion
  if (!state && position.stationary) state = 'stationary'
  if (!state && position.retrograde) state = 'retrograde'
  if (!state && Number.isFinite(position.speed)) {
    state = motionStateForSpeed(position.speed)
  }
  if (!state && position.retrograde === false) state = 'direct'
  if (state === 'stationary') return t('chart.motion_markers.stationary')
  if (state === 'retrograde') return t('chart.motion_markers.retrograde')
  if (state === 'direct') return t('vedic.data.direct')
  return ''
}

const aspectSelection = computed(() => {
  if (!props.aspectKey) return null
  const parts = props.aspectKey.split('-')
  if (parts.length < 3) return null

  return {
    ...props.aspect,
    a:    props.bodies[0] || props.aspect?.a || parts[0],
    b:    props.bodies[1] || props.aspect?.b || parts.slice(1, -1).join('-'),
    type: props.aspect?.type || parts.at(-1),
  }
})

const selectedBodies = computed(() => {
  const names = aspectSelection.value ? [aspectSelection.value.a, aspectSelection.value.b] : props.bodies
  return [...new Set(names.filter(Boolean))]
})

const positionsByName = computed(() =>
  new Map((props.chart.positions || []).map(position => [position.name, position]))
)

const placements = computed(() =>
  selectedBodies.value.map((name) => {
    const position = positionsByName.value.get(name)
    if (!position) return { name, label: label('planets', name), detail: '' }

    const sign  = signs.value[signIndex(position.longitude)] || ''
    const house = houseOf(position.longitude, props.chart.cusps || [])
    return {
      name,
      label: label('planets', name),
      rows:  [
        { key: 'sign', label: t('chart.selection_details.sign'), value: sign },
        { key: 'degree', label: t('chart.selection_details.degree'), value: formatDegree(position.longitude) },
        { key: 'house', label: t('chart.selection_details.house'), value: house ? houseFact(house) : '' },
        { key: 'motion', label: t('chart.selection_details.motion'), value: motionLabel(position) },
      ].filter(row => row.value),
    }
  })
)

const wheelTitle = computed(() => {
  if (!props.wheel) return ''
  if (props.wheel.kind === 'sign') {
    const selected = signs.value[props.wheel.signIndex] || ''
    if (!props.wheel.axisId) return [selected, props.wheel.symbol].filter(Boolean).join(' ')

    const axis          = signAxisFor(props.wheel.signIndex)
    const oppositeIndex = props.wheel.oppositeSignIndex ?? axis?.signIndices.find(index => index !== props.wheel.signIndex)
    const opposite      = signs.value[oppositeIndex] || ''
    return t('chart.sign_axis.selected_title', { selected, opposite })
  }
  if (props.wheel.kind === 'house') return houseLabel(props.wheel.house)
  if (props.wheel.kind === 'cusp') return `${houseLabel(props.wheel.house)} cusp`
  return props.wheel.title || props.wheel.label || ''
})

const title = computed(() => {
  if (props.wheel) return wheelTitle.value
  if (!aspectSelection.value) return placements.value[0]?.label || ''
  return `${label('planets', aspectSelection.value.a)} ${label('aspects', aspectSelection.value.type)} ${label('planets', aspectSelection.value.b)}`
})

const wheelDetails = computed(() => {
  if (props.wheel?.kind !== 'sign' || !props.wheel.axisId) return (props.wheel?.details || []).filter(Boolean)

  const axis = signAxisFor(props.wheel.signIndex)
  if (!axis) return []
  const oppositeIndex = props.wheel.oppositeSignIndex ?? axis.signIndices.find(index => index !== props.wheel.signIndex)

  return [
    {
      key:   'axis',
      label: t('chart.sign_axis.axis'),
      value: t(`chart.sign_axis.themes.${axis.id}`),
    },
    {
      key:   'selected',
      label: t('chart.sign_axis.selected_sign'),
      value: signs.value[props.wheel.signIndex] || '',
    },
    {
      key:   'opposite',
      label: t('chart.sign_axis.opposite'),
      value: signs.value[oppositeIndex] || '',
    },
  ]
})

const aspectRows = computed(() => {
  const detail = props.aspect
  if (!aspectSelection.value || !detail) return []
  return [
    { key: 'orb', label: t('aspects.orb'), value: formatOrb(detail.delta) },
    { key: 'allowed', label: t('chart.selection_details.allowed_orb'), value: formatOrb(detail.orb) },
    { key: 'exact', label: t('chart.aspect_tooltip.exact'), value: Number.isFinite(Number(detail.exact)) ? `${detail.exact}°` : '' },
    { key: 'motion', label: t('aspects.motion'), value: detail.applying === true ? t('aspects.applying') : detail.applying === false ? t('aspects.separating') : '' },
    { key: 'strength', label: t('chart.selection_details.strength'), value: Number.isFinite(Number(detail.strength)) ? `${Math.round(Number(detail.strength) * 100)}%` : '' },
  ].filter(row => row.value)
})

const hasSummary = computed(() =>
  placements.value.length > 0 || Boolean(aspectSelection.value) || Boolean(props.wheel)
)

const selectionKind = computed(() =>
  props.wheel?.kind || (aspectSelection.value ? 'aspect' : 'planet')
)
</script>

<template lang="pug">
.chart-selection-summary.rounded-md.border.px-3.py-2.shadow-lg.backdrop-blur-sm(
  v-if='hasSummary'
  :class='placement === "overlay" ? "chart-selection-summary--overlay chart-selection-summary--responsive pointer-events-none absolute z-10" : "chart-selection-summary--below"'
  data-testid='chart-selection-summary'
  :data-responsive-placement='placement === "overlay" ? "desktop-side-mobile-bottom" : "below-stage"'
  :data-selection-summary-placement='placement'
  :data-selection-kind='selectionKind'
)
  .chart-selection-summary__title.text-xs.font-semibold.leading-snug {{ title }}
  .mt-1.grid(
    v-if='wheelDetails.length'
    class='gap-0.5'
  )
    .chart-selection-summary__line.text-xs.leading-snug(
      v-for='detail in wheelDetails'
      :key='detail.key || detail.label || detail'
    )
      span.chart-selection-summary__label.font-medium(v-if='detail.label') {{ detail.label }}
      template(v-if='detail.label && detail.value') {{ ' ' }}
      template(v-if='detail.value') {{ detail.value }}
      template(v-else-if='typeof detail === "string"') {{ detail }}
  .mt-1.grid(v-if='aspectRows.length' class='gap-0.5')
    .chart-selection-summary__line.text-xs.leading-snug(
      v-for='row in aspectRows'
      :key='row.key'
      :data-selection-fact='row.key'
    )
      span.chart-selection-summary__label.font-medium {{ row.label }}
      | {{ ' ' }}{{ row.value }}
  .mt-1.grid(
    v-if='placements.length && !wheel'
    class='gap-0.5'
  )
    .chart-selection-summary__body(
      v-for='placement in placements'
      :key='placement.name'
      :data-selection-body='placement.name'
    )
      .chart-selection-summary__body-title.text-xs.font-medium(v-if='aspectSelection') {{ placement.label }}
      .chart-selection-summary__line.text-xs.leading-snug(
        v-for='row in placement.rows'
        :key='row.key'
        :data-selection-fact='row.key'
      )
        span.chart-selection-summary__label.font-medium {{ row.label }}
        | {{ ' ' }}{{ row.value }}
</template>

<style scoped>
.chart-selection-summary {
  background: var(--chart-selection-bg);
  border-color: var(--chart-selection-border);
  color: var(--chart-selection-text);
  overflow-wrap: anywhere;
}

.chart-selection-summary--overlay {
  bottom: 0.5rem;
  left: 0.5rem;
  max-height: min(11rem, calc(100% - 1rem));
  max-width: calc(100% - 1rem);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  right: 0.5rem;
  width: auto;
}

.chart-selection-summary--below {
  margin-top: 0.5rem;
  max-height: none;
  max-width: 100%;
  position: static;
  transform: none;
  width: 100%;
}

.chart-selection-summary__title {
  color: var(--chart-selection-title);
}

.chart-selection-summary__label {
  color: var(--chart-selection-title);
}

.chart-selection-summary__line {
  overflow-wrap: anywhere;
}

@media (min-width: 640px) {
  .chart-selection-summary--overlay {
    bottom: auto;
    left: auto;
    max-height: calc(100% - 1.5rem);
    max-width: 14rem;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: min(14rem, 34%);
  }
}
</style>
