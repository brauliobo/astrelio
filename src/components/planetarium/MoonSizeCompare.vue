<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MOON_RADIUS_KM } from '../../lib/planetarium/constants.js'

const props = defineProps({
  distanceKm: { type: Number, required: true },
})
const { t } = useI18n()

// Mean lunar distance: the reference disc every supermoon or micromoon is compared against.
const MEAN_DISTANCE_KM = 384400

const apparentDeg = distanceKm => (2 * Math.asin(MOON_RADIUS_KM / distanceKm) * 180) / Math.PI

const caption = computed(() => t('planetarium.size.caption', {
  actual:  compare.value.actual.toFixed(3),
  mean:    compare.value.mean.toFixed(3),
  percent: `${compare.value.percent > 0 ? '+' : ''}${compare.value.percent.toFixed(1)}`,
}))

const compare = computed(() => {
  const actual = apparentDeg(props.distanceKm)
  const mean   = apparentDeg(MEAN_DISTANCE_KM)
  return {
    actual,
    mean,
    percent: ((actual / mean) - 1) * 100,
    radius:  36 * (actual / mean),
  }
})
</script>

<template lang="pug">
figure.moon-size(data-testid='planetarium-moon-size')
  svg(viewBox='-60 -44 120 88' role='img' :aria-label='t("planetarium.size.aria")')
    circle.moon-size__mean(cx='-28' cy='0' r='36')
    circle.moon-size__actual(cx='28' cy='0' :r='compare.radius')
  figcaption.moon-size__caption {{ caption }}
</template>

<style scoped>
.moon-size {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0;
}

.moon-size svg {
  background: rgb(2 6 23 / 0.6);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  width: 100%;
}

.moon-size__mean {
  fill: rgb(148 163 184 / 0.28);
  stroke: rgb(148 163 184 / 0.5);
  stroke-width: 0.8;
}

.moon-size__actual {
  fill: rgb(226 232 240 / 0.75);
}

.moon-size__caption {
  color: var(--app-text-muted);
  font-size: 0.6875rem;
  line-height: 0.95rem;
}
</style>
