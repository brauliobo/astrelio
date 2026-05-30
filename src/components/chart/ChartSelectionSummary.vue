<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { houseOf } from '../../lib/astro/houses.js'
import { degInSign, signIndex } from '../../lib/astro/zodiac.js'

const props = defineProps({
  chart: { type: Object, required: true },
  bodies: { type: Array, default: () => [] },
  aspectKey: { type: String, default: '' },
})

const { t, tm } = useI18n()
const signs = computed(() => tm('zodiac.signs'))

const label = (scope, key) => {
  const path = `${scope}.${key}`
  const translated = t(path)
  return translated === path ? key : translated
}

const formatDegree = (longitude) => {
  const totalMinutes = Math.floor((degInSign(longitude) * 60) + 1e-6)
  const degrees = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${degrees}°${minutes.toString().padStart(2, '0')}′`
}

const aspect = computed(() => {
  if (!props.aspectKey) return null
  const parts = props.aspectKey.split('-')
  if (parts.length < 3) return null

  return {
    a: props.bodies[0] || parts[0],
    b: props.bodies[1] || parts.slice(1, -1).join('-'),
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

    const sign = signs.value[signIndex(position.longitude)] || ''
    const house = houseOf(position.longitude, props.chart.cusps || [])
    return {
      name,
      label: label('planets', name),
      detail: `${formatDegree(position.longitude)} ${sign} · House ${house}`,
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
.chart-selection-summary.pointer-events-none.absolute.z-10.w-48.rounded-md.border.px-3.py-2.text-center.shadow-lg.backdrop-blur-sm(
  v-if='hasSummary'
  class='left-1/2 top-1/2 max-w-[44%] -translate-x-1/2 -translate-y-1/2 border-slate-900/10 bg-slate-950/80 text-slate-100'
  data-testid='chart-selection-summary'
  :data-selection-kind='aspect ? "aspect" : "planet"'
)
  .text-xs.font-semibold.leading-tight {{ title }}
  .mt-1(v-if='aspect' class='space-y-0.5')
    .text-xs.leading-tight.text-slate-300(
      v-for='placement in placements'
      :key='placement.name'
      :data-selection-body='placement.name'
    )
      span.font-medium.text-slate-100 {{ placement.label }}
      template(v-if='placement.detail') {{ ' ' }}{{ placement.detail }}
</template>
