<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import EclipseDiagram from './EclipseDiagram.vue'
import MoonSizeCompare from './MoonSizeCompare.vue'

const props = defineProps({
  event: { type: Object, default: null },
})
defineEmits(['view', 'clear'])
const { t } = useI18n()

const NUMERIC_LABELS = {
  obscuration:      value => `${(value * 100).toFixed(1)}%`,
  separation:       value => `${value.toFixed(3)}°`,
  elongation:       value => `${value.toFixed(2)}°`,
  magnitude:        value => value.toFixed(2),
  distanceAu:       value => `${value.toFixed(4)} au`,
  distanceKm:       value => `${Math.round(value).toLocaleString()} km`,
  altitude:         value => `${value.toFixed(1)}°`,
  latitude:         value => `${value.toFixed(2)}°`,
  longitude:        value => `${value.toFixed(2)}°`,
  penumbraMinutes:  value => `${value.toFixed(0)} min`,
  partialMinutes:   value => `${value.toFixed(0)} min`,
  totalMinutes:     value => `${value.toFixed(0)} min`,
  separationArcmin: value => `${value.toFixed(2)}′`,
  lunarRadius:      value => `${value.toFixed(3)}°`,
}

const rows = computed(() => {
  if (!props.event) return []
  return Object.entries(props.event.details || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== false)
    .map(([key, value]) => ({
      key,
      label: t(`planetarium.details.${key}`),
      value: Number.isFinite(value) && NUMERIC_LABELS[key]
        ? NUMERIC_LABELS[key](value)
        : typeof value === 'number' ? String(value) : t(`planetarium.values.${value}`, String(value)),
    }))
})

const bodyNames = computed(() => (props.event?.bodies || []).map(name => t(`planets.${name}`)).join(' · '))

const stamp = computed(() => props.event
  ? DateTime.fromMillis(props.event.timeMs).toUTC().toFormat('yyyy-LL-dd HH:mm:ss')
  : '')
</script>

<template lang="pug">
section.planetarium-details(v-if='event' data-testid='planetarium-event-details')
  header.planetarium-details__header
    div
      h2.planetarium-details__title {{ t(`planetarium.events.${event.type}`) }}
      p.planetarium-details__meta {{ stamp }} {{ t('planetarium.time.utc') }} · {{ bodyNames }}
    button.planetarium-details__close(type='button' :aria-label='t("planetarium.details.close")' @click='$emit("clear")')
      span(aria-hidden='true') ×
  dl.planetarium-details__grid
    template(v-for='row in rows' :key='row.key')
      dt {{ row.label }}
      dd {{ row.value }}
  EclipseDiagram(v-if='event.type === "solar_eclipse" || event.type === "lunar_eclipse"' :event='event')
  MoonSizeCompare(v-else-if='event.type === "supermoon"' :distance-km='event.details.distanceKm')
  p.planetarium-details__why {{ t(`planetarium.why.${event.type}`) }}
  button.planetarium-details__action(type='button' data-testid='planetarium-view-event' @click='$emit("view", event)') {{ t('planetarium.details.view_in_3d') }}
</template>

<style scoped>
.planetarium-details {
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--app-panel-strong) 88%, transparent);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
}

.planetarium-details__header {
  align-items: start;
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}

.planetarium-details__title {
  color: var(--app-text);
  font-size: 0.875rem;
  font-weight: 700;
}

.planetarium-details__meta {
  color: var(--app-text-muted);
  font-size: 0.6875rem;
}

.planetarium-details__close {
  color: var(--app-text-muted);
  font-size: 1rem;
  line-height: 1;
  padding: 0.15rem 0.35rem;
}

.planetarium-details__grid {
  display: grid;
  gap: 0.1rem 0.6rem;
  grid-template-columns: auto minmax(0, 1fr);
}

.planetarium-details__grid dt {
  color: var(--app-text-muted);
  font-size: 0.6875rem;
}

.planetarium-details__grid dd {
  color: var(--app-text-soft);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  margin: 0;
}

.planetarium-details__why {
  color: var(--app-text-soft);
  font-size: 0.75rem;
  line-height: 1.15rem;
}

.planetarium-details__action {
  background: rgb(252 211 77);
  border-radius: 999px;
  color: rgb(15 23 42);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.8rem;
}
</style>
