<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { motionMarker } from '../../../lib/astro/motion.js'
import { CENTER, TRANSIT_PLANET_COLORS, longitudeLabel } from './geometry.js'

const MAX_ROWS = 4
const SYMBOLS  = { conjunction: '☌', opposition: '☍', trine: '△', square: '□', sextile: '✶', quincunx: '⚻' }

const props = defineProps({
  planet:      { type: Object, required: true },
  aspects:     { type: Array, required: true },
  showDegrees: { type: Boolean, default: true },
})
const { t, tm } = useI18n()

const planetName = name => t(`planets.${name}`)
const orbLabel   = delta => `${Math.floor(delta)}°${String(Math.round((delta % 1) * 60)).padStart(2, '0')}'`

const title = computed(() => `${planetName(props.planet.name)} ${motionMarker(props.planet)}`.trim())
const rows  = computed(() =>
  props.aspects.slice(0, MAX_ROWS).map(aspect => ({
    key:   `${aspect.a}-${aspect.type}`,
    text:  `${SYMBOLS[aspect.type]} ${planetName(aspect.a)}`,
    orb:   orbLabel(aspect.delta),
    color: `var(--aspect-${aspect.type})`,
  }))
)
</script>

<template lang="pug">
g.transit-readout(data-testid='transit-readout' pointer-events='none' text-anchor='middle' font-family='sans-serif')
  circle(:cx='CENTER' :cy='CENTER' r='62' fill='var(--chart-house-center)' fill-opacity='0.94')
  text(
    :x='CENTER'
    :y='CENTER - 30'
    font-size='11'
    font-weight='700'
    :fill='TRANSIT_PLANET_COLORS[planet.name] || "var(--chart-ink)"'
  ) {{ title }}
  text(
    v-if='showDegrees'
    :x='CENTER'
    :y='CENTER - 17'
    font-size='7.5'
    fill='var(--chart-ink-muted)'
  ) {{ longitudeLabel(planet.longitude, tm('zodiac.signs')) }}
  text(
    v-if='!rows.length'
    :x='CENTER'
    :y='CENTER + 8'
    font-size='7.5'
    fill='var(--chart-ink-muted)'
  ) {{ t('chart.transit_no_aspects') }}
  g(v-for='(row, index) in rows' :key='row.key' :transform='`translate(0 ${CENTER - 1 + index * 11})`')
    text(:x='CENTER - 4' font-size='8.5' font-weight='600' text-anchor='end' :fill='row.color') {{ row.text }}
    text(:x='CENTER + 4' font-size='8' text-anchor='start' fill='var(--chart-ink-muted)') {{ row.orb }}
</template>
