<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { EVENT_TYPES } from '../../lib/planetarium/events.js'
import { fractionInRange, timeAtFraction } from '../../lib/planetarium/time.js'

const props = defineProps({
  events:        { type: Array, default: () => [] },
  activeTypes:   { type: Array, default: () => [] },
  timeMs:        { type: Number, required: true },
  rangeStartMs:  { type: Number, required: true },
  rangeEndMs:    { type: Number, required: true },
  selectedId:    { type: String, default: '' },
  status:        { type: String, default: 'idle' },
})
const emit = defineEmits(['seek', 'select', 'toggle-type'])
const { t } = useI18n()

const EVENT_COLORS = {
  solar_eclipse:    '#f97316',
  lunar_eclipse:    '#c084fc',
  moon_quarter:     '#94a3b8',
  supermoon:        '#fbbf24',
  moon_node:        '#38bdf8',
  season:           '#4ade80',
  apsis:            '#64748b',
  elongation:       '#22d3ee',
  peak_magnitude:   '#fde68a',
  opposition:       '#f87171',
  conjunction:      '#a78bfa',
  station:          '#fb7185',
  transit:          '#fca5a5',
  pair_conjunction: '#67e8f9',
  occultation:      '#e879f9',
}

const pins = computed(() => props.events.map(event => ({
  ...event,
  color:   EVENT_COLORS[event.type] || '#94a3b8',
  percent: fractionInRange(event.timeMs, props.rangeStartMs, props.rangeEndMs) * 100,
})).filter(pin => pin.percent >= 0 && pin.percent <= 100))

// The list mirrors the pins: same window, capped so a dense decade stays scrollable.
const listed = computed(() => {
  const inRange = pins.value
  if (inRange.length <= 100) return inRange

  const nearest = inRange.reduce((best, event, index) =>
    (Math.abs(event.timeMs - props.timeMs) < Math.abs(inRange[best].timeMs - props.timeMs) ? index : best), 0)
  return inRange.slice(Math.max(0, nearest - 40), Math.max(0, nearest - 40) + 100)
})

const cursorPercent = computed(() => fractionInRange(props.timeMs, props.rangeStartMs, props.rangeEndMs) * 100)

const label = event => t(`planetarium.events.${event.type}`)

const detail = (event) => {
  const details = event.details || {}
  if (details.kind) return t(`planetarium.eclipse_kinds.${details.kind}`)
  if (details.phase && event.type !== 'supermoon') return t(`planetarium.phases.${details.phase}`)
  if (details.size) return t(`planetarium.supermoon.${details.size}`)
  if (details.season) return t(`planetarium.seasons.${details.season}`)
  if (details.apsis) return t(`planetarium.apsides.${details.apsis}`)
  if (details.node) return t(`planetarium.nodes.${details.node}`)
  if (details.direction) return t(`planetarium.stations.${details.direction}`)
  if (details.aspect) return t(`planetarium.aspects.${details.aspect}`)
  if (Number.isFinite(details.separation)) return `${details.separation.toFixed(2)}°`
  if (Number.isFinite(details.elongation)) return `${details.elongation.toFixed(1)}°`
  return event.bodies.map(name => t(`planets.${name}`)).join(' · ')
}

const stamp = event => DateTime.fromMillis(event.timeMs).toUTC().toFormat('yyyy-LL-dd HH:mm')

const onScrub = event => emit('seek', timeAtFraction(Number(event.target.value) / 1000, props.rangeStartMs, props.rangeEndMs))
</script>

<template lang="pug">
.planetarium-timeline(data-testid='planetarium-timeline')
  .planetarium-timeline__track
    .planetarium-timeline__pin(
      v-for='pin in pins'
      :key='pin.id'
      :style='{ left: `${pin.percent}%`, background: pin.color }'
      :class='{ "is-selected": pin.id === selectedId }'
      :title='`${label(pin)} · ${stamp(pin)}`'
      :data-testid='`planetarium-pin-${pin.type}`'
      role='button'
      tabindex='0'
      @click='$emit("select", pin.id)'
      @keydown.enter='$emit("select", pin.id)'
    )
    .planetarium-timeline__cursor(:style='{ left: `${cursorPercent}%` }')
    input.planetarium-timeline__range(
      type='range'
      min='0'
      max='1000'
      :value='Math.round(cursorPercent * 10)'
      :aria-label='t("planetarium.timeline.scrub")'
      data-testid='planetarium-scrub'
      @input='onScrub'
    )

  details.planetarium-timeline__filters(data-testid='planetarium-filters')
    summary.planetarium-timeline__filters-summary {{ t('planetarium.timeline.filters') }}
    button.planetarium-timeline__filter(
      v-for='type in EVENT_TYPES'
      :key='type'
      type='button'
      :aria-pressed='activeTypes.includes(type)'
      :class='{ "is-active": activeTypes.includes(type) }'
      :style='{ "--pin-color": EVENT_COLORS[type] }'
      :data-testid='`planetarium-filter-${type}`'
      @click='$emit("toggle-type", type)'
    ) {{ t(`planetarium.events.${type}`) }}

  p.planetarium-timeline__status(v-if='status === "loading"' data-testid='planetarium-events-loading') {{ t('planetarium.timeline.loading') }}

  ul.planetarium-timeline__list(v-else data-testid='planetarium-event-list')
    li(v-for='event in listed' :key='event.id')
      button.planetarium-timeline__entry(
        type='button'
        :class='{ "is-selected": event.id === selectedId }'
        :data-testid='`planetarium-event-${event.type}`'
        @click='$emit("select", event.id)'
      )
        span.planetarium-timeline__dot(:style='{ background: EVENT_COLORS[event.type] }' aria-hidden='true')
        span.planetarium-timeline__entry-main
          strong.planetarium-timeline__entry-title {{ label(event) }}
          span.planetarium-timeline__entry-detail {{ detail(event) }}
        time.planetarium-timeline__entry-time {{ stamp(event) }}
</template>

<style scoped>
.planetarium-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 0;
}

.planetarium-timeline__track {
  flex: 0 0 auto;
  background: color-mix(in srgb, var(--app-panel-strong) 70%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  height: 2rem;
  position: relative;
}

.planetarium-timeline__pin {
  border-radius: 999px;
  cursor: pointer;
  height: 0.85rem;
  position: absolute;
  top: 0.28rem;
  transform: translateX(-50%);
  width: 0.2rem;
}

.planetarium-timeline__pin.is-selected {
  box-shadow: 0 0 0 2px rgb(252 211 77);
  height: 1.4rem;
}

.planetarium-timeline__cursor {
  background: rgb(252 211 77);
  bottom: 0.15rem;
  position: absolute;
  top: 0.15rem;
  transform: translateX(-50%);
  width: 2px;
}

.planetarium-timeline__range {
  inset: 0;
  opacity: 0;
  position: absolute;
  width: 100%;
}

.planetarium-timeline__filters {
  flex: 0 0 auto;
}

.planetarium-timeline__filters[open] {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.planetarium-timeline__filters-summary {
  color: var(--app-text-muted);
  cursor: pointer;
  font-size: 0.6875rem;
  font-weight: 700;
  width: 100%;
}

.planetarium-timeline__filter {
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  color: var(--app-text-muted);
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
}

.planetarium-timeline__filter.is-active {
  border-color: var(--pin-color);
  color: var(--app-text);
}

.planetarium-timeline__list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  list-style: none;
  margin: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 0;
}

.planetarium-timeline__entry {
  align-items: center;
  border-radius: 0.5rem;
  display: flex;
  gap: 0.5rem;
  padding: 0.35rem 0.45rem;
  text-align: left;
  width: 100%;
}

.planetarium-timeline__entry:hover,
.planetarium-timeline__entry.is-selected {
  background: var(--app-chip-hover);
}

.planetarium-timeline__dot {
  border-radius: 999px;
  flex: 0 0 auto;
  height: 0.5rem;
  width: 0.5rem;
}

.planetarium-timeline__entry-main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.planetarium-timeline__entry-title {
  color: var(--app-text);
  font-size: 0.75rem;
}

.planetarium-timeline__entry-detail,
.planetarium-timeline__entry-time {
  color: var(--app-text-muted);
  font-size: 0.6875rem;
}

.planetarium-timeline__entry-time {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
}

.planetarium-timeline__status {
  color: var(--app-text-muted);
  font-size: 0.75rem;
}
</style>
