<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AU_KM, BODY_BY_NAME } from '../../lib/planetarium/constants.js'
import {
  constellationOf,
  eclipticLatitudeOf,
  eclipticLongitudeOf,
  geoEcliptic,
  helioEcliptic,
  illuminationOf,
  lengthAu,
  librationOf,
} from '../../lib/planetarium/ephemeris3d.js'
import { longitudeRate } from '../../lib/planetarium/retrograde.js'
import { MOON_BY_NAME, isApproximate, moonPosition } from '../../lib/planetarium/moons.js'
import { moonPhaseLighting } from '../../lib/planetarium/moonPhase.js'

const props = defineProps({
  body:   { type: String, default: '' },
  timeMs: { type: Number, required: true },
})
const emit = defineEmits(['clear'])
const { t } = useI18n()

const LIGHT_MINUTE_KM = 17987547.48

const moon = computed(() => {
  const entry = MOON_BY_NAME.get(props.body)
  if (!entry) return null

  const when = new Date(props.timeMs)
  return {
    ...entry,
    distanceKm:  lengthAu(moonPosition(entry, when)) * AU_KM,
    approximate: isApproximate(entry.name),
    retrograde:  entry.inclinationDeg > 90,
  }
})

const info = computed(() => {
  const name = props.body
  if (!name || !BODY_BY_NAME.has(name)) return null

  const when          = new Date(props.timeMs)
  const geoDistanceAu = name === 'Earth' ? 0 : lengthAu(geoEcliptic(name, when))
  const sunDistanceAu = name === 'Sun' ? 0 : lengthAu(helioEcliptic(name, when))
  const rate          = name === 'Earth' ? 0 : longitudeRate(name, when)
  const illumination  = name === 'Earth' ? null : illuminationOf(name, when)

  return {
    name,
    radiusKm:      BODY_BY_NAME.get(name).radiusKm,
    sunDistanceAu,
    geoDistanceAu,
    lightMinutes:  (geoDistanceAu * AU_KM) / LIGHT_MINUTE_KM,
    magnitude:     illumination?.magnitude,
    phasePercent:  illumination ? illumination.phaseFraction * 100 : null,
    longitude:     name === 'Earth' ? null : eclipticLongitudeOf(name, when),
    latitude:      name === 'Earth' ? null : eclipticLatitudeOf(name, when),
    constellation: name === 'Earth' ? null : constellationOf(name, when),
    retrograde:    rate < 0,
    rate,
    libration:     name === 'Moon' ? librationOf(when) : null,
    phase:         name === 'Moon' ? moonPhaseLighting(illumination.phaseFraction) : null,
  }
})
</script>

<template lang="pug">
section.planetarium-body(v-if='moon' data-testid='planetarium-body-info')
  header.planetarium-body__header
    h2.planetarium-body__title {{ t(`moons.${moon.name}`) }}
    button.planetarium-body__close(type='button' :aria-label='t("planetarium.details.close")' @click='emit("clear")')
      span(aria-hidden='true') ×
  dl.planetarium-body__grid
    dt {{ t('planetarium.body.orbits') }}
    dd {{ t(`planets.${moon.parent}`) }}
    dt {{ t('planetarium.body.orbital_radius') }}
    dd {{ Math.round(moon.distanceKm).toLocaleString() }} {{ t('planetarium.body.km') }}
    dt {{ t('planetarium.body.period') }}
    dd {{ moon.periodDays.toFixed(3) }} {{ t('planetarium.body.days') }}
    dt {{ t('planetarium.body.inclination') }}
    dd {{ moon.inclinationDeg.toFixed(2) }}° {{ moon.retrograde ? `· ${t('planetarium.stations.retrograde')}` : '' }}
    dt {{ t('planetarium.body.radius') }}
    dd {{ moon.radiusKm.toLocaleString() }} {{ t('planetarium.body.km') }}
  p.planetarium-body__note(v-if='moon.approximate' data-testid='planetarium-moon-approximate') {{ t('planetarium.body.approximate_orbit') }}

section.planetarium-body(v-else-if='info' data-testid='planetarium-body-info')
  header.planetarium-body__header
    h2.planetarium-body__title {{ t(`planets.${info.name}`) }}
    button.planetarium-body__close(type='button' :aria-label='t("planetarium.details.close")' @click='emit("clear")')
      span(aria-hidden='true') ×
  dl.planetarium-body__grid
    template(v-if='info.sunDistanceAu')
      dt {{ t('planetarium.body.sun_distance') }}
      dd {{ info.sunDistanceAu.toFixed(4) }} {{ t('planetarium.body.au') }}
    template(v-if='info.geoDistanceAu')
      dt {{ t('planetarium.body.earth_distance') }}
      dd {{ info.geoDistanceAu.toFixed(5) }} {{ t('planetarium.body.au') }} · {{ info.lightMinutes.toFixed(1) }} {{ t('planetarium.body.light_minutes') }}
    template(v-if='info.magnitude !== undefined')
      dt {{ t('planetarium.body.magnitude') }}
      dd {{ info.magnitude.toFixed(2) }}
    template(v-if='info.phasePercent !== null')
      dt {{ t('planetarium.body.illumination') }}
      dd {{ info.phasePercent.toFixed(1) }}%
    template(v-if='info.longitude !== null')
      dt {{ t('planetarium.body.ecliptic') }}
      dd {{ info.longitude.toFixed(2) }}° / {{ info.latitude.toFixed(2) }}°
    template(v-if='info.constellation')
      dt {{ t('planetarium.body.constellation') }}
      dd {{ info.constellation }}
    template(v-if='info.rate')
      dt {{ t('planetarium.body.motion') }}
      dd {{ info.rate.toFixed(4) }} °/{{ t('planetarium.body.per_day') }} · {{ t(info.retrograde ? 'planetarium.stations.retrograde' : 'planetarium.body.direct') }}
    template(v-if='info.libration')
      dt {{ t('planetarium.body.libration') }}
      dd {{ info.libration.longitudeDeg.toFixed(2) }}° / {{ info.libration.latitudeDeg.toFixed(2) }}°
    dt {{ t('planetarium.body.radius') }}
    dd {{ Math.round(info.radiusKm).toLocaleString() }} {{ t('planetarium.body.km') }}
</template>

<style scoped>
.planetarium-body {
  background: color-mix(in srgb, var(--app-panel-strong) 88%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem;
}

.planetarium-body__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.planetarium-body__title {
  color: var(--app-text);
  font-size: 0.875rem;
  font-weight: 700;
}

.planetarium-body__close {
  color: var(--app-text-muted);
  font-size: 1rem;
  line-height: 1;
  padding: 0.15rem 0.35rem;
}

.planetarium-body__grid {
  display: grid;
  gap: 0.1rem 0.6rem;
  grid-template-columns: auto minmax(0, 1fr);
}

.planetarium-body__grid dt {
  color: var(--app-text-muted);
  font-size: 0.6875rem;
}

.planetarium-body__note {
  color: var(--app-text-muted);
  font-size: 0.6875rem;
  line-height: 0.95rem;
}

.planetarium-body__grid dd {
  color: var(--app-text-soft);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  margin: 0;
}
</style>
