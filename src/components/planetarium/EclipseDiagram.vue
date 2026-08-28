<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { lunarShadowTrack, solarShadowTrack } from '../../lib/planetarium/eclipseGeometry.js'

const props = defineProps({
  event: { type: Object, required: true },
})
const { t } = useI18n()

const SIZE = 220

const isLunar = computed(() => props.event.type === 'lunar_eclipse')

// Lunar: Earth's shadow drawn face on, with the Moon's disc crossing it.
const lunar = computed(() => {
  if (!isLunar.value) return null

  const frames = lunarShadowTrack(props.event.timeMs)
  const extent = Math.max(...frames.map(frame => frame.penumbraKm * 1.05), ...frames.map(frame => Math.hypot(frame.xKm, frame.yKm)))
  const unit   = (SIZE / 2) / extent
  const peak   = frames[Math.floor(frames.length / 2)]

  return {
    penumbra: peak.penumbraKm * unit,
    umbra:    peak.umbraKm * unit,
    moon:     peak.moonRadiusKm * unit,
    path:     frames.map(frame => `${(frame.xKm * unit).toFixed(2)},${(-frame.yKm * unit).toFixed(2)}`).join(' '),
    discs:    frames.filter((_, index) => index % 6 === 0).map(frame => ({
      x: frame.xKm * unit,
      y: -frame.yKm * unit,
      r: frame.moonRadiusKm * unit,
    })),
  }
})

// Solar: the central shadow point traced over the globe as a longitude/latitude track.
const solar = computed(() => {
  if (isLunar.value) return null

  const points = solarShadowTrack(props.event.timeMs)
  if (!points.length) return null

  return {
    path: points.map(point => `${((point.longitude + 180) / 360 * SIZE).toFixed(2)},${((90 - point.latitude) / 180 * (SIZE / 2)).toFixed(2)}`).join(' '),
    peak: {
      x: (props.event.details.longitude + 180) / 360 * SIZE,
      y: (90 - props.event.details.latitude) / 180 * (SIZE / 2),
    },
    start: points[0],
    end:   points.at(-1),
  }
})

const stamp = point => DateTime.fromMillis(point.timeMs).toUTC().toFormat('HH:mm')
</script>

<template lang="pug">
figure.eclipse-diagram(data-testid='planetarium-eclipse-diagram')
  svg(v-if='lunar' :viewBox='`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`' role='img' :aria-label='t("planetarium.diagram.lunar_aria")')
    circle.eclipse-diagram__penumbra(cx='0' cy='0' :r='lunar.penumbra')
    circle.eclipse-diagram__umbra(cx='0' cy='0' :r='lunar.umbra')
    polyline.eclipse-diagram__path(:points='lunar.path')
    circle.eclipse-diagram__moon(v-for='(disc, index) in lunar.discs' :key='index' :cx='disc.x' :cy='disc.y' :r='disc.r')
  svg(v-else-if='solar' :viewBox='`0 0 ${SIZE} ${SIZE / 2}`' role='img' :aria-label='t("planetarium.diagram.solar_aria")')
    rect.eclipse-diagram__globe(x='0' y='0' :width='SIZE' :height='SIZE / 2')
    line.eclipse-diagram__equator(x1='0' :y1='SIZE / 4' :x2='SIZE' :y2='SIZE / 4')
    line.eclipse-diagram__meridian(:x1='SIZE / 2' y1='0' :x2='SIZE / 2' :y2='SIZE / 2')
    polyline.eclipse-diagram__path(:points='solar.path')
    circle.eclipse-diagram__peak(:cx='solar.peak.x' :cy='solar.peak.y' r='3')
  figcaption.eclipse-diagram__caption(v-if='lunar') {{ t('planetarium.diagram.lunar_caption') }}
  figcaption.eclipse-diagram__caption(v-else-if='solar') {{ t('planetarium.diagram.solar_caption', { start: stamp(solar.start), end: stamp(solar.end) }) }}
</template>

<style scoped>
.eclipse-diagram {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
}

.eclipse-diagram svg {
  background: rgb(2 6 23 / 0.6);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  width: 100%;
}

.eclipse-diagram__penumbra {
  fill: rgb(148 163 184 / 0.16);
}

.eclipse-diagram__umbra {
  fill: rgb(67 56 202 / 0.55);
}

.eclipse-diagram__moon {
  fill: rgb(226 232 240 / 0.5);
  stroke: rgb(248 250 252 / 0.75);
  stroke-width: 0.6;
}

.eclipse-diagram__path {
  fill: none;
  stroke: rgb(252 211 77);
  stroke-width: 1.4;
}

.eclipse-diagram__globe {
  fill: rgb(30 58 95 / 0.35);
}

.eclipse-diagram__equator,
.eclipse-diagram__meridian {
  stroke: rgb(148 163 184 / 0.4);
  stroke-width: 0.6;
}

.eclipse-diagram__peak {
  fill: rgb(249 115 22);
}

.eclipse-diagram__caption {
  color: var(--app-text-muted);
  font-size: 0.6875rem;
  line-height: 0.95rem;
}
</style>
