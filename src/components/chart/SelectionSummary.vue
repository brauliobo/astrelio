<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { houseOf } from '../../lib/astro/houses.js'
import { signAxisFor } from '../../lib/astro/sign-axes.js'
import { degInSign, signIndex } from '../../lib/astro/zodiac.js'

const props = defineProps({
  chart:     { type: Object, required: true },
  bodies:    { type: Array, default: () => [] },
  aspectKey: { type: String, default: '' },
  wheel:     { type: Object, default: null },
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

const formatDegree = (longitude) => {
  const totalMinutes = Math.floor((degInSign(longitude) * 60) + 1e-6)
  const degrees      = Math.floor(totalMinutes / 60)
  const minutes      = totalMinutes % 60
  return `${degrees}°${minutes.toString().padStart(2, '0')}′`
}

const aspect = computed(() => {
  if (!props.aspectKey) return null
  const parts = props.aspectKey.split('-')
  if (parts.length < 3) return null

  return {
    a:    props.bodies[0] || parts[0],
    b:    props.bodies[1] || parts.slice(1, -1).join('-'),
    type: parts.at(-1),
  }
})

const selectedBodies = computed(() => {
  const names = aspect.value ? [aspect.value.a, aspect.value.b] : props.bodies
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
      label:  label('planets', name),
      detail: `${formatDegree(position.longitude)} ${sign} · ${houseLabel(house)}`,
    }
  })
)

const placementText = (placement) =>
  [placement?.label, placement?.detail].filter(Boolean).join(' ')

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
  if (!aspect.value) return placementText(placements.value[0])
  return `${label('planets', aspect.value.a)} ${label('aspects', aspect.value.type)} ${label('planets', aspect.value.b)}`
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
      key:   'opposite',
      label: t('chart.sign_axis.opposite'),
      value: signs.value[oppositeIndex] || '',
    },
  ]
})

const hasSummary = computed(() =>
  placements.value.length > 0 || Boolean(aspect.value) || Boolean(props.wheel)
)

const selectionKind = computed(() =>
  props.wheel?.kind || (aspect.value ? 'aspect' : 'planet')
)
</script>

<template lang="pug">
.chart-selection-summary.chart-selection-summary--responsive.pointer-events-none.absolute.z-10.rounded-md.border.px-3.py-2.shadow-lg.backdrop-blur-sm(
  v-if='hasSummary'
  data-testid='chart-selection-summary'
  data-responsive-placement='desktop-side-mobile-bottom'
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
  .mt-1.grid(
    v-if='aspect && !wheel'
    class='gap-0.5'
  )
    .chart-selection-summary__line.text-xs.leading-snug(
      v-for='placement in placements'
      :key='placement.name'
      :data-selection-body='placement.name'
    )
      span.chart-selection-summary__label.font-medium {{ placement.label }}
      template(v-if='placement.detail') {{ ' ' }}{{ placement.detail }}
</template>

<style scoped>
.chart-selection-summary {
  background: var(--chart-selection-bg);
  border-color: var(--chart-selection-border);
  bottom: 0.5rem;
  color: var(--chart-selection-text);
  left: 0.5rem;
  max-height: min(11rem, calc(100% - 1rem));
  max-width: calc(100% - 1rem);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  right: 0.5rem;
  width: auto;
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
  .chart-selection-summary {
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
