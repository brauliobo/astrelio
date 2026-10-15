<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectionSummary from './SelectionSummary.vue'
import DisplayMode from './DisplayMode.vue'
import AngleMarkers from './wheel/AngleMarkers.vue'
import ChartMap from './wheel/ChartMap.vue'
import NakshatraRing from './wheel/NakshatraRing.vue'
import TickRing from './wheel/TickRing.vue'
import Frame from './wheel/Frame.vue'
import SignAxisLayer from './wheel/SignAxisLayer.vue'
import TransitAspectLayer from './wheel/TransitAspectLayer.vue'
import TransitReadout from './wheel/TransitReadout.vue'
import ZodiacRing from './wheel/ZodiacRing.vue'
import { CENTER, VIEWBOX_SIZE, WHEEL_RADII, mapPlacements, mapsFromProps, norm360 } from './wheel/geometry.js'
import { isTropicalChart } from '../../lib/astro/analysis.js'
import { crossAspects } from '../../lib/astro/aspects.js'
import { broadcastChartHighlight, CHART_HIGHLIGHT_EVENT, normalizeHighlight, sameHighlight } from '../../lib/chart/highlight.js'
import { isRadialAlignment, RADIAL_ALIGNMENT } from '../../lib/chart/radialSpacing.js'

const displayModes = ['clean', 'aspects', 'detailed']
const modeSettings = {
  clean: {
    degrees:      false,
    aspects:      false,
    pointDetails: false,
  },
  aspects: {
    degrees:      false,
    aspects:      true,
    pointDetails: true,
  },
  detailed: {
    degrees:      true,
    aspects:      true,
    pointDetails: true,
  },
  print: {
    degrees:      true,
    aspects:      false,
    pointDetails: true,
  },
}

const normalizeMode = (mode) => mode in modeSettings ? mode : 'auto'

const props = defineProps({
  natal:                { type: Object, default: null },
  overlay:              { type: Object, default: null },
  charts:               { type: Array, default: () => [] },
  size:                 { type: Number, default: 520 },
  highlightedBodies:    { type: Array, default: () => [] },
  highlightedAspectKey: { type: String, default: '' },
  aspectOptions:        { type: Object, default: () => ({}) },
  displayMode:          { type: String, default: 'auto' },
  showModeControls:     { type: Boolean, default: true },
  showSelectionSummary: { type: Boolean, default: true },
  selectionSummaryPlacement: {
    type:      String,
    default:   'floating',
    validator: value => ['overlay', 'floating', 'below', 'hidden'].includes(value),
  },
  zodiacSymbols:        { type: Array, default: null },
  planetGlyphRenderer:  { type: String, default: null },
  planetAlignment:      { type: String, default: RADIAL_ALIGNMENT.CENTERED, validator: isRadialAlignment },
  showNakshatraRing:    { type: Boolean, default: false },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight', 'update:display-mode'])
const { t } = useI18n()

const hoverHighlight        = ref(null)
const pinnedHighlight       = ref(null)
const sharedHoverHighlight  = ref(null)
const sharedPinnedHighlight = ref(null)
const sharedHoverAnchor     = ref(null)
const sharedPinnedAnchor    = ref(null)
const stage                 = ref(null)
const localDisplayMode      = ref('')
const isSmallScreen         = ref(false)
const showExteriorOrbit     = ref(false)
const transitHover          = ref('')
const transitPinned         = ref('')
let smallScreenQuery        = null

const updateSmallScreen = () => {
  isSmallScreen.value = Boolean(smallScreenQuery?.matches)
}

const clearHighlightState = () => {
  hoverHighlight.value        = null
  pinnedHighlight.value       = null
  sharedHoverHighlight.value  = null
  sharedPinnedHighlight.value = null
  sharedHoverAnchor.value     = null
  sharedPinnedAnchor.value    = null
  transitHover.value          = ''
  transitPinned.value         = ''
}

const maps                 = computed(() => mapsFromProps(props))
const hasExteriorOrbitOption = computed(() => maps.value.some(map => map.exteriorOrbit))
const visibleMaps            = computed(() =>
  maps.value.filter(map => !map.exteriorOrbit || showExteriorOrbit.value)
)
const baseChart            = computed(() => maps.value[0]?.chart || null)
const tropicalChart        = computed(() => isTropicalChart(baseChart.value))
const isSimpleChart        = computed(() => visibleMaps.value.length === 1)
const hasExteriorOrbit     = computed(() => visibleMaps.value.some(map => map.exteriorOrbit))
const automaticDisplayMode = computed(() =>
  isSimpleChart.value && isSmallScreen.value ? 'clean' : 'detailed'
)
const activeDisplayMode = computed(() => {
  if (localDisplayMode.value) return localDisplayMode.value
  const propMode = normalizeMode(props.displayMode)
  return propMode === 'auto' ? automaticDisplayMode.value : propMode
})
const displayOptions = computed(() => modeSettings[activeDisplayMode.value])
const displayMaps    = computed(() =>
  visibleMaps.value.map(map => ({
    ...map,
    showAspects: displayOptions.value.aspects && map.showAspects,
  }))
)
const wheelShift = computed(() => norm360(-(baseChart.value?.cusps?.[0] || 0)))
const style      = computed(() => ({
  width:    `${props.size}px`,
  maxWidth: '100%',
}))
const wheelViewBox = computed(() => {
  if (hasExteriorOrbit.value) return '-20 -20 560 560'
  return props.showNakshatraRing ? `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}` : '40 40 440 440'
})
const displayAttributes = computed(() => ({
  'data-chart-mode':         activeDisplayMode.value,
  'data-show-degrees':       String(displayOptions.value.degrees),
  'data-show-point-details': String(displayOptions.value.pointDetails),
}))
const hasExternalHighlight = computed(() =>
  props.highlightedBodies.length > 0 || Boolean(props.highlightedAspectKey)
)
const localHighlight = computed(() =>
  hoverHighlight.value || pinnedHighlight.value || sharedHoverHighlight.value || sharedPinnedHighlight.value
)
const activeAnchor = computed(() => {
  if (hoverHighlight.value || pinnedHighlight.value) return null
  if (sharedHoverHighlight.value) return sharedHoverAnchor.value
  if (sharedPinnedHighlight.value) return sharedPinnedAnchor.value
  return null
})
const activeBodies = computed(() =>
  hasExternalHighlight.value ? props.highlightedBodies : localHighlight.value?.bodies || []
)
const activeAspectKey = computed(() =>
  hasExternalHighlight.value ? props.highlightedAspectKey : localHighlight.value?.aspectKey || ''
)
const activeAspect = computed(() =>
  hasExternalHighlight.value ? null : localHighlight.value?.aspect || null
)
const isTropicalSignWheel = wheel =>
  wheel?.kind === 'sign' && Boolean(wheel.axisId || wheel.element || wheel.relatedElements?.length)
const activeWheel = computed(() => {
  if (hasExternalHighlight.value) return null
  const wheel = localHighlight.value?.wheel || null
  return !tropicalChart.value && isTropicalSignWheel(wheel) ? null : wheel
})
const activeSignAxis = computed(() =>
  tropicalChart.value && activeWheel.value?.kind === 'sign' && activeWheel.value?.axisId
    ? {
        axisId:            activeWheel.value.axisId,
        signIndex:         activeWheel.value.signIndex,
        oppositeSignIndex: activeWheel.value.oppositeSignIndex,
      }
    : null
)
const activeSummaryPlacement = computed(() =>
  props.showSelectionSummary ? props.selectionSummaryPlacement : 'hidden'
)
const hasActiveSummary = computed(() =>
  activeBodies.value.length || activeAspectKey.value || activeWheel.value
)

const natalMap          = computed(() => displayMaps.value.find(map => !map.exteriorOrbit))
const transitMap        = computed(() => displayMaps.value.find(map => map.exteriorOrbit))
const placementsFor     = map => mapPlacements(map, displayMaps.value.indexOf(map), displayMaps.value.length, wheelShift.value, props.planetAlignment)
const natalPlacements   = computed(() => natalMap.value ? placementsFor(natalMap.value) : [])
const transitPlacements = computed(() => transitMap.value ? placementsFor(transitMap.value) : [])
const transitAspects    = computed(() =>
  transitMap.value && displayOptions.value.aspects
    ? crossAspects(natalMap.value.chart, transitMap.value.chart, props.aspectOptions)
    : []
)
const transitFocusName = computed(() => transitMap.value ? transitHover.value || transitPinned.value : '')
const crossFocus       = computed(() => {
  if (!transitMap.value) return null
  if (transitFocusName.value) return { side: 'b', name: transitFocusName.value }
  const { bodies = [], aspectKey = '' } = localHighlight.value || {}
  return bodies.length === 1 && !aspectKey ? { side: 'a', name: bodies[0] } : null
})
const focusedAspects = computed(() =>
  crossFocus.value ? transitAspects.value.filter(aspect => aspect[crossFocus.value.side] === crossFocus.value.name) : []
)
const focusPartners  = computed(() => focusedAspects.value.map(aspect => aspect[crossFocus.value.side === 'b' ? 'a' : 'b']))
const readoutPlanet  = computed(() =>
  transitFocusName.value && displayOptions.value.pointDetails
    ? transitMap.value.chart.positions.find(position => position.name === transitFocusName.value)
    : null
)

const bodiesFor = (map) => {
  const own = map.exteriorOrbit ? 'b' : 'a'
  if (!crossFocus.value) return map.exteriorOrbit ? [] : activeBodies.value
  if (crossFocus.value.side !== own) return focusPartners.value
  return map.exteriorOrbit ? [crossFocus.value.name] : activeBodies.value
}

const toggleTransitPin = (name) => {
  transitPinned.value = transitPinned.value === name ? '' : name
  transitHover.value  = ''
}

const onMapHighlight = (map, payload) =>
  map.exteriorOrbit ? transitHover.value = payload.bodies?.[0] || '' : setHoverHighlight(payload)
const onMapClear     = (map) => map.exteriorOrbit ? transitHover.value = '' : clearHoverHighlight()
const onMapToggle    = (map, payload) =>
  map.exteriorOrbit ? toggleTransitPin(payload.bodies?.[0] || '') : togglePinnedHighlight(payload)

const broadcastHighlight = (highlight, pinned = false) => {
  broadcastChartHighlight({ highlight, pinned, chart: baseChart.value })
}

const onSharedHighlight = (event) => {
  const highlight = event.detail?.highlight ? normalizeHighlight(event.detail.highlight) : null
  if (event.detail?.pinned) {
    sharedPinnedHighlight.value = highlight
    sharedPinnedAnchor.value    = highlight ? event.detail?.anchor || null : null
    sharedHoverHighlight.value  = null
    sharedHoverAnchor.value     = null
  } else {
    sharedHoverHighlight.value = highlight
    sharedHoverAnchor.value    = highlight ? event.detail?.anchor || null : null
  }
}

const stageRect = () => stage.value?.getBoundingClientRect() || null

const setHoverHighlight = (payload) => {
  const highlight      = normalizeHighlight(payload)
  hoverHighlight.value = highlight
  emit('highlight', highlight)
  broadcastHighlight(highlight)
}

const clearHoverHighlight = () => {
  hoverHighlight.value = null
  emit('clear-highlight')
  broadcastHighlight(null)
}

const togglePinnedHighlight = (payload) => {
  const highlight       = normalizeHighlight(payload)
  const clearing        = pinnedHighlight.value && sameHighlight(pinnedHighlight.value, highlight)
  pinnedHighlight.value = clearing ? null : highlight
  hoverHighlight.value  = null
  emit('toggle-highlight', highlight)
  broadcastHighlight(pinnedHighlight.value, true)
}

const selectDisplayMode = (mode) => {
  const normalizedMode = normalizeMode(mode)
  if (normalizedMode === 'auto') return
  localDisplayMode.value = normalizedMode
  emit('update:display-mode', normalizedMode)
}

const toggleExteriorOrbit = () => {
  showExteriorOrbit.value = !showExteriorOrbit.value
  transitHover.value      = ''
  transitPinned.value     = ''
}

watch(() => props.displayMode, () => {
  localDisplayMode.value = ''
})

watch(
  () => [baseChart.value, baseChart.value?.zodiac],
  (current, previous) => {
    if (!previous || current[0] !== previous[0] || current[1] !== previous[1]) clearHighlightState()
  },
)

onMounted(() => {
  window.addEventListener(CHART_HIGHLIGHT_EVENT, onSharedHighlight)
  smallScreenQuery = window.matchMedia?.('(max-width: 640px)') || null
  updateSmallScreen()
  if (smallScreenQuery?.addEventListener) {
    smallScreenQuery.addEventListener('change', updateSmallScreen)
  } else {
    smallScreenQuery?.addListener?.(updateSmallScreen)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener(CHART_HIGHLIGHT_EVENT, onSharedHighlight)
  if (smallScreenQuery?.removeEventListener) {
    smallScreenQuery.removeEventListener('change', updateSmallScreen)
  } else {
    smallScreenQuery?.removeListener?.(updateSmallScreen)
  }
})
</script>

<template lang="pug">
.chart-wheel.relative.mx-auto(
  ref='host'
  data-testid='chart-wheel'
  :style='style'
  v-bind='displayAttributes'
)
  .chart-wheel-toolbar.mb-3(v-if='showModeControls')
    DisplayMode(
      :model-value='activeDisplayMode'
      :modes='displayModes'
      @update:model-value='selectDisplayMode'
    )
      .chart-orbit-controls(
        v-if='baseChart && hasExteriorOrbitOption'
        :aria-label='t("chart.wheel_accessibility.orbit_controls")'
      )
        button.chart-transit-toggle(
          type='button'
          data-testid='chart-toggle-transit-orbit'
          :class='{ "is-active": showExteriorOrbit }'
          :aria-pressed='showExteriorOrbit'
          :aria-label='t("chart.transit_orbit")'
          @click='toggleExteriorOrbit'
        )
          span.chart-transit-toggle__dot
          | {{ t('chart.transit_orbit') }}
  .chart-wheel-stage.relative.aspect-square.overflow-hidden.rounded-md(
    ref='stage'
    v-if='baseChart'
    role='group'
    tabindex='0'
    data-testid='chart-wheel-stage'
    :aria-label='t("chart.wheel_accessibility.wheel")'
  )
    svg(
      class='block h-full w-full'
      :viewBox='wheelViewBox'
      role='img'
      data-testid='chart-wheel-svg'
    )
      Frame(
        :highlighted-wheel='activeWheel'
        @highlight='setHoverHighlight'
        @clear-highlight='clearHoverHighlight'
        @toggle-highlight='togglePinnedHighlight'
      )
      g(v-if='hasExteriorOrbit' data-testid='transit-orbit-frame' pointer-events='none')
        circle(
          :cx='CENTER'
          :cy='CENTER'
          :r='WHEEL_RADII.transitOuter'
          fill='none'
          stroke='var(--chart-overlay-accent)'
          stroke-width='1'
          stroke-opacity='0.5'
        )
        circle(
          :cx='CENTER'
          :cy='CENTER'
          :r='(WHEEL_RADII.transitOuter + WHEEL_RADII.transitInner) / 2'
          fill='none'
          stroke='var(--chart-overlay-accent)'
          :stroke-width='WHEEL_RADII.transitOuter - WHEEL_RADII.transitInner'
          stroke-opacity='0.08'
        )
      NakshatraRing(
        v-if='showNakshatraRing'
        :wheel-shift='wheelShift'
        :highlighted-wheel='activeWheel'
        @highlight='setHoverHighlight'
        @clear-highlight='clearHoverHighlight'
        @toggle-highlight='togglePinnedHighlight'
      )
      SignAxisLayer(
        v-if='activeSignAxis'
        :sign-axis='activeSignAxis'
        :wheel-shift='wheelShift'
      )
      ZodiacRing(
        :wheel-shift='wheelShift'
        :symbols='zodiacSymbols || undefined'
        :highlighted-wheel='activeWheel'
        :tropical='tropicalChart'
        :complementary-sign-axis='tropicalChart'
        @highlight='setHoverHighlight'
        @clear-highlight='clearHoverHighlight'
        @toggle-highlight='togglePinnedHighlight'
      )
      ChartMap(
        v-for='(map, index) in displayMaps'
        :key='map.id'
        :map='map'
        :index='index'
        :count='displayMaps.length'
        :wheel-shift='wheelShift'
        :highlighted-bodies='bodiesFor(map)'
        :highlighted-aspect-key='activeAspectKey'
        :highlighted-wheel='activeWheel'
        :sign-axis='activeSignAxis'
        :aspect-options='aspectOptions'
        :glyph-renderer='map.planetGlyphRenderer || planetGlyphRenderer'
        :planet-alignment='planetAlignment'
        @highlight='onMapHighlight(map, $event)'
        @clear-highlight='onMapClear(map)'
        @toggle-highlight='onMapToggle(map, $event)'
      )
      TransitAspectLayer(
        v-if='transitMap && displayOptions.aspects'
        :aspects='transitAspects'
        :natal-placements='natalPlacements'
        :transit-placements='transitPlacements'
        :focus='crossFocus'
        :show-idle='displayOptions.degrees'
      )
      TransitReadout(
        v-if='readoutPlanet'
        :planet='readoutPlanet'
        :aspects='focusedAspects'
        :show-degrees='displayOptions.degrees'
      )
      TickRing(:wheel-shift='wheelShift')
      AngleMarkers(
        v-if='displayMaps[0]?.showAngles'
        :chart='baseChart'
        :wheel-shift='wheelShift'
        :base-radius='hasExteriorOrbit ? WHEEL_RADII.transitOuter : WHEEL_RADII.zodiacOuter'
        :max-radius='hasExteriorOrbit ? 268 : undefined'
        :highlighted-wheel='activeWheel'
        @highlight='setHoverHighlight'
        @clear-highlight='clearHoverHighlight'
        @toggle-highlight='togglePinnedHighlight'
      )
    SelectionSummary(
      v-if='activeSummaryPlacement === "overlay" && hasActiveSummary'
      :chart='baseChart'
      :bodies='activeBodies'
      :aspect-key='activeAspectKey'
      :aspect='activeAspect'
      :wheel='activeWheel'
      placement='overlay'
    )
  SelectionSummary(
    v-if='activeSummaryPlacement === "below" && hasActiveSummary'
    :chart='baseChart'
    :bodies='activeBodies'
    :aspect-key='activeAspectKey'
    :aspect='activeAspect'
    :wheel='activeWheel'
    placement='below'
  )
  SelectionSummary(
    v-if='activeSummaryPlacement === "floating" && hasActiveSummary'
    :chart='baseChart'
    :bodies='activeBodies'
    :aspect-key='activeAspectKey'
    :aspect='activeAspect'
    :wheel='activeWheel'
    :anchor='activeAnchor || stageRect()'
    :anchor-element='activeAnchor ? null : stage'
    :avoid='stageRect()'
    :avoid-element='stage'
    placement='floating'
  )
</template>

<style>
.chart-wheel-stage:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}

.chart-wheel-toolbar {
  display: grid;
  gap: 0.5rem;
}

.chart-transit-toggle {
  align-items: center;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  color: rgb(203 213 225);
  display: inline-flex;
  font-size: 0.75rem;
  font-weight: 600;
  gap: 0.4rem;
  line-height: 1;
  min-height: 1.875rem;
  padding: 0 0.8rem 0 0.65rem;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}

.chart-transit-toggle__dot {
  background: transparent;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  height: 0.5rem;
  width: 0.5rem;
}

.chart-transit-toggle:hover {
  background: rgb(255 255 255 / 0.08);
  color: rgb(248 250 252);
}

.chart-transit-toggle:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.chart-transit-toggle.is-active {
  background: color-mix(in srgb, var(--chart-overlay-accent) 18%, transparent);
  border-color: var(--chart-overlay-accent);
  color: var(--chart-overlay-accent);
}

.chart-transit-toggle.is-active .chart-transit-toggle__dot {
  background: currentColor;
}

.chart-wheel[data-show-degrees="false"] [data-testid="planet-layer"] g[data-planet] text:not([data-role="symbol"]) {
  display: none;
}

.chart-wheel[data-show-point-details="false"] [data-testid="planet-layer"] g[data-planet] > line,
.chart-wheel[data-show-point-details="false"] [data-testid="planet-layer"] g[data-planet] > circle:not(.planet-hit-target):not(.planet-chip) {
  display: none;
}

@media print {
  .chart-display-mode {
    display: none !important;
  }
}
</style>
