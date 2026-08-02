<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChartInspectorStore } from '../../stores/chartInspector.js'
import { houseOf } from '../../lib/astro/houses.js'
import { motionMarker } from '../../lib/astro/motion.js'
import { degInSign, signIndex } from '../../lib/astro/zodiac.js'
import { humanDesignChannelLabel, humanDesignGateLabel, humanDesignValueLabel } from '../../lib/human-design/labels.js'
import { sameHighlight } from '../../lib/chart/highlight.js'

const props = defineProps({
  chart:       { type: Object, default: null },
  person:      { type: Object, default: null },
  systemLabel: { type: String, default: '' },
})

const { t, tm, te } = useI18n()
const inspector     = useChartInspectorStore()
const signs         = computed(() => tm('zodiac.signs'))
const activeChart   = computed(() => inspector.sourceChart || props.chart || null)
const drawerRef     = ref(null)
const closeButtonRef = ref(null)
const pinButtons    = ref([])
const pinFocusIndex = ref(0)
let returnFocusElement = null

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const label = (scope, key) => {
  const path = `${scope}.${key}`
  return te(path) ? t(path) : key
}

const formatDegree = (longitude) => {
  const totalMinutes = Math.floor((degInSign(longitude) * 60) + 1e-6)
  const degrees      = Math.floor(totalMinutes / 60)
  const minutes      = totalMinutes % 60
  return `${degrees}°${minutes.toString().padStart(2, '0')}′`
}

const positionsByName = computed(() =>
  new Map((activeChart.value?.positions || []).map(position => [position.name, position]))
)
const activeHumanDesign = computed(() => inspector.activeHumanDesign)

const aspect = computed(() => {
  const key = inspector.activeAspectKey
  if (!key) return null

  const parts = key.split('-')
  if (parts.length < 3) return null

  return {
    a:    inspector.activeBodies[0] || parts[0],
    b:    inspector.activeBodies[1] || parts.slice(1, -1).join('-'),
    type: parts.at(-1),
  }
})

const formatOrb = (value) => {
  if (!Number.isFinite(Number(value))) return ''
  const totalMinutes = Math.round(Math.abs(Number(value)) * 60)
  const degrees      = Math.floor(totalMinutes / 60)
  const minutes      = totalMinutes % 60
  return `${degrees}°${minutes.toString().padStart(2, '0')}′`
}

const aspectRows = computed(() => {
  const detail = inspector.activeHighlight.aspect
  if (!detail) return []

  return [
    { key: 'orb',      label: t('aspects.orb'),     value: formatOrb(detail.delta) },
    { key: 'allowed',  label: t('chart.inspector.allowed_orb'), value: formatOrb(detail.orb) },
    { key: 'exact',    label: t('chart.aspect_tooltip.exact'), value: Number.isFinite(Number(detail.exact)) ? `${detail.exact}°` : '' },
    { key: 'motion',   label: t('aspects.motion'),  value: detail.applying === true ? t('aspects.applying') : detail.applying === false ? t('aspects.separating') : '' },
    { key: 'strength', label: t('chart.inspector.strength'), value: Number.isFinite(Number(detail.strength)) ? `${Math.round(Number(detail.strength) * 100)}%` : '' },
  ].filter(row => row.value)
})

const selectedBodies = computed(() => {
  const bodies = aspect.value ? [aspect.value.a, aspect.value.b] : inspector.activeBodies
  return [...new Set(bodies.filter(Boolean))]
})

const title = computed(() => {
  if (activeHumanDesign.value) return humanDesignTitle(activeHumanDesign.value)
  if (aspect.value) {
    return `${label('planets', aspect.value.a)} ${label('aspects', aspect.value.type)} ${label('planets', aspect.value.b)}`
  }
  return selectedBodies.value.map(body => label('planets', body)).join(' + ') || t('chart.inspector.title')
})

const humanDesignTitle = (selection) => {
  if (!selection) return ''
  if (selection.type === 'gate') return humanDesignGateLabel(t, selection.value)
  if (selection.type === 'center') return humanDesignValueLabel(t, 'center', selection.value)
  if (selection.type === 'channel') return humanDesignChannelLabel(t, selection.value)
  return String(selection.value || selection.type)
}

const titleForHighlight = (highlight) => {
  if (highlight?.hd) return humanDesignTitle(highlight.hd)
  if (highlight?.aspectKey) {
    const parts = highlight.aspectKey.split('-')
    const bodyA = highlight.bodies?.[0] || parts[0]
    const bodyB = highlight.bodies?.[1] || parts.slice(1, -1).join('-')
    return `${label('planets', bodyA)} ${label('aspects', parts.at(-1))} ${label('planets', bodyB)}`
  }
  return (highlight?.bodies || []).map(body => label('planets', body)).join(' + ')
}

const placementRows = computed(() =>
  selectedBodies.value.map((name) => {
    const position = positionsByName.value.get(name)
    if (!position) {
      return {
        name,
        label: label('planets', name),
        rows:  [],
      }
    }

    const house = Array.isArray(activeChart.value?.cusps) && activeChart.value.cusps.length >= 12
      ? houseOf(position.longitude, activeChart.value.cusps)
      : null
    const motion = motionMarker(position)

    return {
      name,
      label: label('planets', name),
      rows:  [
        { key: 'sign',   label: t('chart.inspector.sign'),   value: signs.value[signIndex(position.longitude)] || '' },
        { key: 'degree', label: t('chart.inspector.degree'), value: formatDegree(position.longitude) },
        { key: 'house',  label: t('chart.inspector.house'),  value: house ? String(house) : '' },
        { key: 'motion', label: t('chart.inspector.motion'), value: motion },
      ].filter(row => row.value),
    }
  })
)

const metaRows = computed(() => [
  { key: 'chart',  label: t('chart.inspector.active_chart'), value: props.person?.name || '' },
  { key: 'system', label: t('chart.inspector.system'),       value: props.systemLabel },
].filter(row => row.value))

const humanDesignRows = computed(() => {
  const selection = activeHumanDesign.value
  if (!selection) return []

  if (selection.type === 'gate') {
    const gate = Number(selection.value)
    const detail = activeChart.value?.details?.gates?.find(item => Number(item.gate) === gate)
    return [
      { key: 'gate', label: t('human_design.gate'), value: humanDesignGateLabel(t, gate, detail?.name) },
      { key: 'center', label: t('human_design.center'), value: detail?.center ? humanDesignValueLabel(t, 'center', detail.center) : '' },
      { key: 'lines', label: t('human_design.lines'), value: detail?.lines?.map(line => line.line || line.number || line).join(', ') || '' },
      { key: 'harmonics', label: t('human_design.harmonics'), value: detail?.harmonicGates?.join(', ') || '' },
    ].filter(row => row.value)
  }

  if (selection.type === 'center') {
    const detail = activeChart.value?.details?.centers?.find(item => item.center === selection.value)
    return [
      { key: 'center', label: t('human_design.center'), value: humanDesignValueLabel(t, 'center', selection.value) },
      { key: 'status', label: t('human_design.status'), value: detail?.defined ? t('human_design.defined') : t('human_design.open_state') },
      { key: 'gates', label: t('human_design.active_gates'), value: detail?.activeGates?.join(', ') || '' },
      { key: 'theme', label: t('human_design.theme'), value: detail?.theme || '' },
    ].filter(row => row.value)
  }

  if (selection.type === 'channel') {
    const detail = activeChart.value?.details?.channels?.find(item => item.channel === selection.value)
    return [
      { key: 'channel', label: t('human_design.channel'), value: humanDesignChannelLabel(t, selection.value, detail?.name) },
      { key: 'centers', label: t('human_design.centers_title'), value: detail?.centers?.map(center => humanDesignValueLabel(t, 'center', center)).join(' / ') || '' },
      { key: 'circuit', label: t('human_design.circuit'), value: detail?.circuit || '' },
      { key: 'stream', label: t('human_design.stream'), value: detail?.stream || '' },
    ].filter(row => row.value)
  }

  return []
})

const hasPlacementData = computed(() =>
  placementRows.value.some(body => body.rows.length)
)

const closeDrawer = () => inspector.closeDrawer()

const focusReturnTarget = () => {
  if (returnFocusElement?.isConnected) return returnFocusElement
  return document.querySelector('[data-testid="context-open-inspector"]')
}

const focusFirstControl = async () => {
  await nextTick()
  ;(closeButtonRef.value || document.querySelector('[data-testid="chart-inspector-close"]') || drawerRef.value)?.focus?.()
}

const focusPin = async (index) => {
  if (!inspector.pinnedHighlights.length) return
  pinFocusIndex.value = Math.max(0, Math.min(index, inspector.pinnedHighlights.length - 1))
  await nextTick()
  pinButtons.value?.[pinFocusIndex.value]?.focus?.()
}

const selectPin = (pin, index) => {
  pinFocusIndex.value = index
  inspector.setPinnedHighlight(pin)
}

const onDrawerKeydown = (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeDrawer()
    return
  }

  if (event.key !== 'Tab' || !drawerRef.value) return

  const focusable = [...drawerRef.value.querySelectorAll(focusableSelector)]
    .filter(element => element.offsetParent !== null || element === document.activeElement)
  if (!focusable.length) return

  const first = focusable[0]
  const last  = focusable.at(-1)

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const onPinKeydown = (event, pin, index) => {
  if (['ArrowDown', 'ArrowRight'].includes(event.key)) {
    event.preventDefault()
    focusPin((index + 1) % inspector.pinnedHighlights.length)
  } else if (['ArrowUp', 'ArrowLeft'].includes(event.key)) {
    event.preventDefault()
    focusPin((index - 1 + inspector.pinnedHighlights.length) % inspector.pinnedHighlights.length)
  } else if (event.key === 'Home') {
    event.preventDefault()
    focusPin(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    focusPin(inspector.pinnedHighlights.length - 1)
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectPin(pin, index)
  }
}

watch(() => inspector.drawerOpen, async (open) => {
  if (open) {
    returnFocusElement = document.activeElement
    await focusFirstControl()
  } else {
    await nextTick()
    focusReturnTarget()?.focus?.()
  }
}, { flush: 'post' })

watch(() => inspector.activeHighlight, () => {
  const index = inspector.pinnedHighlights.findIndex(pin => sameHighlight(pin, inspector.activeHighlight))
  pinFocusIndex.value = Math.max(0, index)
})
</script>

<template lang="pug">
Teleport(to='body')
  .chart-inspector-backdrop(
    v-if='inspector.drawerOpen && inspector.hasSelection'
    data-testid='chart-inspector-backdrop'
    @click='closeDrawer()'
  )
  aside.chart-inspector-drawer(
    v-if='inspector.drawerOpen && inspector.hasSelection'
    aria-live='polite'
    aria-modal='true'
    aria-labelledby='chart-inspector-title'
    data-testid='chart-inspector-drawer'
    ref='drawerRef'
    role='dialog'
    tabindex='-1'
    @keydown='onDrawerKeydown'
  )
    header.chart-inspector-drawer__header
      div
        p.chart-inspector-drawer__kicker {{ t('chart.inspector.kicker') }}
        h2#chart-inspector-title.chart-inspector-drawer__title {{ title }}
        span.chart-inspector-drawer__count(
          v-if='inspector.pinnedCount'
          data-testid='chart-inspector-pin-count'
        ) {{ inspector.pinnedCount }} {{ t('chart.inspector.pinned_count') }}
      .chart-inspector-drawer__actions
        button.chart-inspector-drawer__action(
          type='button'
          @click='inspector.clearAll()'
          data-testid='chart-inspector-clear'
        ) {{ t('chart.inspector.clear') }}
        button.chart-inspector-drawer__close(
          type='button'
          :aria-label='t("chart.inspector.close")'
          @click='closeDrawer()'
          data-testid='chart-inspector-close'
          ref='closeButtonRef'
        )
          span(aria-hidden='true') x

    .chart-inspector-drawer__content
      dl.chart-inspector-drawer__meta(v-if='metaRows.length')
        div(v-for='row in metaRows' :key='row.key')
          dt {{ row.label }}
          dd {{ row.value }}

      section.chart-inspector-drawer__section(v-if='aspect')
        h3 {{ t('chart.inspector.aspect') }}
        .chart-inspector-drawer__aspect(data-testid='chart-inspector-aspect')
          p.chart-inspector-drawer__aspect-title {{ title }}
          dl.chart-inspector-drawer__placements(v-if='aspectRows.length')
            div(v-for='row in aspectRows' :key='row.key')
              dt {{ row.label }}
              dd {{ row.value }}

      section.chart-inspector-drawer__section(v-if='activeHumanDesign')
        h3 {{ t('chart.inspector.human_design') }}
        dl.chart-inspector-drawer__placements.chart-inspector-drawer__aspect(data-testid='chart-inspector-human-design')
          div(v-for='row in humanDesignRows' :key='row.key')
            dt {{ row.label }}
            dd {{ row.value }}

      section.chart-inspector-drawer__section(v-if='!activeHumanDesign')
        h3 {{ t('chart.inspector.bodies') }}
        .chart-inspector-drawer__body(
          v-for='body in placementRows'
          :key='body.name'
          :data-testid='`chart-inspector-body-${body.name}`'
        )
          .chart-inspector-drawer__body-title {{ body.label }}
          dl.chart-inspector-drawer__placements(v-if='body.rows.length')
            div(v-for='row in body.rows' :key='row.key')
              dt {{ row.label }}
              dd {{ row.value }}
          p.chart-inspector-drawer__empty(v-else) {{ t('chart.inspector.unavailable') }}

      p.chart-inspector-drawer__empty(v-if='!activeHumanDesign && !hasPlacementData') {{ t('chart.inspector.context_hint') }}

      section.chart-inspector-drawer__section(v-if='inspector.pinnedCount')
        .chart-inspector-drawer__section-heading
          h3 {{ t('chart.inspector.pinned') }}
          button.chart-inspector-drawer__link-action(
            type='button'
            data-testid='chart-inspector-clear-pins'
            @click='inspector.clearPinnedHighlights()'
          ) {{ t('chart.inspector.clear_pins') }}
        .chart-inspector-drawer__pins(data-testid='chart-inspector-pins')
          button.chart-inspector-drawer__pin(
            v-for='(pin, index) in inspector.pinnedHighlights'
            :key='`${pin.aspectKey || "selection"}-${pin.bodies?.join("-") || ""}-${pin.hd?.type || ""}-${pin.hd?.value || ""}`'
            type='button'
            :class='{ active: sameHighlight(pin, inspector.activeHighlight) }'
            :tabindex='index === pinFocusIndex ? 0 : -1'
            @click='selectPin(pin, index)'
            @keydown='onPinKeydown($event, pin, index)'
            data-testid='chart-inspector-pin'
            ref='pinButtons'
          ) {{ titleForHighlight(pin) }}
</template>

<style scoped>
.chart-inspector-backdrop {
  background: rgb(2 6 23 / 0.28);
  inset: 0;
  position: fixed;
  z-index: 35;
}

.chart-inspector-drawer {
  background: color-mix(in srgb, var(--app-panel-strong) 94%, var(--app-bg));
  border-left: 1px solid var(--app-border);
  box-shadow: -20px 0 50px rgb(0 0 0 / 0.34);
  color: var(--app-text-soft);
  display: grid;
  gap: 1rem;
  grid-template-rows: auto minmax(0, 1fr);
  inset: 0 0 0 auto;
  max-width: min(28rem, calc(100vw - 1.5rem));
  overflow: hidden;
  padding: 1.1rem;
  position: fixed;
  width: 100%;
  z-index: 40;
}

.chart-inspector-drawer__content {
  align-content: start;
  display: grid;
  gap: 1rem;
  min-height: 0;
  overflow-y: auto;
}

.chart-inspector-drawer__header {
  align-items: start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.chart-inspector-drawer__kicker {
  color: var(--app-accent-text);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0 0 0.35rem;
  text-transform: uppercase;
}

.chart-inspector-drawer__title {
  color: var(--app-heading);
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.08;
  margin: 0;
}

.chart-inspector-drawer__count {
  color: var(--app-text-muted);
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  margin-top: 0.35rem;
}

.chart-inspector-drawer__actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 0.4rem;
}

.chart-inspector-drawer__action,
.chart-inspector-drawer__close {
  border-radius: 999px;
  color: var(--app-text-soft);
}

.chart-inspector-drawer__action {
  background: var(--app-chip);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
}

.chart-inspector-drawer__close {
  background: var(--app-chip);
  font-size: 1.25rem;
  height: 2rem;
  line-height: 1;
  width: 2rem;
}

.chart-inspector-drawer__action:hover,
.chart-inspector-drawer__close:hover {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.chart-inspector-drawer__meta,
.chart-inspector-drawer__placements {
  display: grid;
  gap: 0.45rem;
  margin: 0;
}

.chart-inspector-drawer__meta div,
.chart-inspector-drawer__placements div {
  align-items: baseline;
  display: flex;
  gap: 0.8rem;
  justify-content: space-between;
}

.chart-inspector-drawer__meta {
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.chart-inspector-drawer__meta dt,
.chart-inspector-drawer__placements dt {
  color: var(--app-text-subtle);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
}

.chart-inspector-drawer__meta dd,
.chart-inspector-drawer__placements dd {
  color: var(--app-text-soft);
  font-size: 0.82rem;
  margin: 0;
  text-align: right;
}

.chart-inspector-drawer__section {
  display: grid;
  gap: 0.7rem;
}

.chart-inspector-drawer__section h3 {
  color: var(--app-heading);
  font-size: 0.82rem;
  font-weight: 800;
  margin: 0;
}

.chart-inspector-drawer__section-heading {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.chart-inspector-drawer__link-action {
  color: var(--app-text-muted);
  font-size: 0.72rem;
  font-weight: 800;
}

.chart-inspector-drawer__link-action:hover {
  color: var(--app-accent-text);
}

.chart-inspector-drawer__aspect,
.chart-inspector-drawer__body {
  background: var(--app-chip);
  border: 1px solid var(--app-border-soft);
  border-radius: 0.75rem;
  margin: 0;
  padding: 0.75rem;
}

.chart-inspector-drawer__aspect-title {
  color: var(--app-heading);
  font-size: 0.9rem;
  font-weight: 800;
  margin: 0 0 0.55rem;
}

.chart-inspector-drawer__body-title {
  color: var(--app-heading);
  font-size: 0.92rem;
  font-weight: 800;
  margin-bottom: 0.55rem;
}

.chart-inspector-drawer__empty {
  color: var(--app-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
  margin: 0;
}

.chart-inspector-drawer__pins {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chart-inspector-drawer__pin {
  background: var(--app-chip);
  border: 1px solid var(--app-border-soft);
  border-radius: 999px;
  color: var(--app-text-soft);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.6rem;
}

.chart-inspector-drawer__pin:hover,
.chart-inspector-drawer__pin.active {
  background: rgb(252 211 77 / 0.16);
  border-color: rgb(252 211 77 / 0.28);
  color: var(--app-accent-text);
}
</style>
