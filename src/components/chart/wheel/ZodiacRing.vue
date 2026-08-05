<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SegmentRing from './SegmentRing.vue'
import { elementForSign, relatedElementsFor } from '../../../lib/astro/elements.js'
import { oppositeSignIndex, signAxisFor } from '../../../lib/astro/sign-axes.js'
import { wheelHighlight } from '../../../lib/chart/highlight.js'
import { CENTER, WHEEL_RADII, ZODIAC_SIGNS, polarPoint, norm360 } from './geometry.js'

const props = defineProps({
  wheelShift:            { type: Number, required: true },
  symbols:               { type: Array, default: () => ZODIAC_SIGNS },
  highlightedWheel:      { type: Object, default: null },
  tropical:              { type: Boolean, default: true },
  complementarySignAxis: { type: Boolean, default: true },
})
defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])
const { t, te } = useI18n()

const sectorFills = [
  'var(--chart-zodiac-fill-a)',
  'var(--chart-zodiac-fill-b)',
  'var(--chart-zodiac-fill-c)',
]

const elementAt = index => elementForSign(index)
const relatedElementsAt = element => [...new Set(relatedElementsFor(element).filter(Boolean))]

const translated = (path, params, fallback) => te(path) ? t(path, params) : fallback
const elementLabel = element => element
  ? translated(`analysis.elements.${element}`, null, element)
  : ''

const sectors = computed(() =>
  props.symbols.map((symbol, index) => {
    const start = norm360(index * 30 + props.wheelShift)
    const end   = norm360((index + 1) * 30 + props.wheelShift)
    const label = polarPoint((WHEEL_RADII.zodiacInner + WHEEL_RADII.zodiacOuter) / 2, index * 30 + 15 + props.wheelShift)
    const name  = t(`zodiac.signs.${index}`)
    const span  = t('chart.wheel_details.span_value', { start: `${index * 30}°`, end: `${(index + 1) * 30}°` })
    const element = props.tropical ? elementAt(index) : null
    const relatedElements = element ? relatedElementsAt(element) : []
    const elementName = elementLabel(element)
    const elementTitle = element
      ? translated(
        'chart.wheel_accessibility.zodiac_element',
        { sign: name, element: elementName },
        `${name}: ${elementName}`,
      )
      : ''
    const detail = {
      signIndex: index,
      symbol,
      title:     `${name} ${symbol}`,
      details:   [
        { label: t('chart.wheel_details.labels.span'), value: span },
        { label: t('chart.wheel_details.labels.mode'), value: t('chart.wheel_details.values.zodiac_sign_sector') },
      ],
    }

    if (element) Object.assign(detail, { element, relatedElements })

    if (props.complementarySignAxis) {
      const oppositeIndex = oppositeSignIndex(index)
      const axis          = signAxisFor(index)
      Object.assign(detail, {
        oppositeSignIndex: oppositeIndex,
        axisId:            axis.id,
        axis:              {
          id:          axis.id,
          modality:    axis.modality,
          polarity:    axis.polarity,
          elements:    [...axis.elements],
          signIndices: [...axis.signIndices],
        },
        relatedSectorId:   `sign-${oppositeIndex}`,
        relatedIds:        [`sign-${oppositeIndex}`],
        oppositeSymbol:    props.symbols[oppositeIndex],
        signName:          name,
        oppositeSignName:  t(`zodiac.signs.${oppositeIndex}`),
        startLongitude:    index * 30,
        endLongitude:      (index + 1) * 30,
        centerLongitude:   index * 30 + 15,
        oppositeLongitude: oppositeIndex * 30 + 15,
      })
    }

    return {
      symbol,
      index,
      start,
      end,
      label,
      fill:  element ? `var(--chart-element-${element}-fill)` : sectorFills[index % sectorFills.length],
      title: element ? `${name} (${symbol}) · ${elementName}` : `${name} (${symbol})`,
      element,
      elementLabel: elementName,
      elementTitle,
      relatedElements,
      payload: wheelHighlight('sign', `sign-${index}`, detail),
    }
  })
)
</script>

<template lang="pug">
g
  SegmentRing(
    test-id='zodiac-ring'
    :sectors='sectors'
    :inner-radius='WHEEL_RADII.zodiacInner'
    :outer-radius='WHEEL_RADII.zodiacOuter'
    :highlighted-wheel='highlightedWheel'
    :data-element-presentation='tropical ? "tropical" : "neutral"'
    stroke='var(--chart-zodiac-stroke)'
    stroke-width='0.5'
    font-size='23'
    @highlight='$emit("highlight", $event)'
    @clear-highlight='$emit("clear-highlight")'
    @toggle-highlight='$emit("toggle-highlight", $event)'
  )
  g.zodiac-element-metadata(
    data-testid='zodiac-element-metadata'
    :data-element-presentation='tropical ? "tropical" : "neutral"'
    aria-hidden='true'
    pointer-events='none'
  )
    g(
      v-for='sector in sectors'
      :key='`element-metadata-${sector.index}`'
      :data-sign-index='sector.index'
      :data-element='sector.element || undefined'
      :data-element-label='sector.elementLabel || undefined'
      :data-related-elements='sector.relatedElements.length ? sector.relatedElements.join(",") : undefined'
    )
      title(v-if='sector.elementTitle') {{ sector.elementTitle }}
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacOuter' fill='none' stroke='var(--chart-frame-stroke)' stroke-width='2.2')
    title {{ t('chart.wheel_accessibility.zodiac_outer_boundary') }}
  circle(:cx='CENTER' :cy='CENTER' :r='WHEEL_RADII.zodiacInner' fill='none' stroke='var(--chart-ink-muted)' stroke-width='1.35')
    title {{ t('chart.wheel_accessibility.zodiac_inner_boundary') }}
</template>
