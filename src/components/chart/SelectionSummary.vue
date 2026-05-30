<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { houseOf } from '../../lib/astro/houses.js'
import { degInSign, signIndex } from '../../lib/astro/zodiac.js'

const props = defineProps({
  chart:     { type: Object, required: true },
  bodies:    { type: Array, default: () => [] },
  aspectKey: { type: String, default: '' },
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

const title = computed(() => {
  if (!aspect.value) return placementText(placements.value[0])
  return `${label('planets', aspect.value.a)} ${label('aspects', aspect.value.type)} ${label('planets', aspect.value.b)}`
})

const hasSummary = computed(() =>
  placements.value.length > 0 || Boolean(aspect.value)
)
</script>

<template lang="pug">
.chart-selection-summary.pointer-events-none.absolute.inset-x-2.bottom-2.z-10.rounded-md.border.px-3.py-2.shadow-lg.backdrop-blur-sm(
  v-if='hasSummary'
  class='sm:inset-x-4'
  data-testid='chart-selection-summary'
  :data-selection-kind='aspect ? "aspect" : "planet"'
)
  .chart-selection-summary__title.text-xs.font-semibold.leading-snug {{ title }}
  .mt-1.grid(
    v-if='aspect'
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
  color: var(--chart-selection-text);
  max-height: 6.75rem;
  overflow: hidden;
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
</style>
