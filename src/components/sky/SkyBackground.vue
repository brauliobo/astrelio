<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { offsetMinutesForPerson, localToUtcMs } from '../../lib/astro/timezones.js'
import { createSkyScene } from '../../lib/sky/scene.js'

const props = defineProps({
  person: { type: Object, default: null },
  zodiac: { type: String, default: 'tropical' },
  houseSystem: { type: String, default: 'placidus' },
  mode: { type: String, default: 'astrology' },
})

const canvas = ref(null)
const { t, locale } = useI18n()
let handle  = null

const planetLabels = () => Object.fromEntries(
  ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
    .map(planet => [planet, t(`planets.${planet}`)])
)

const applyContext = () => {
  if (!handle) return
  if (!props.person) {
    handle.setContext({
      date: new Date(),
      lat: 0,
      lon: 0,
      zodiac: props.zodiac,
      houseSystem: props.houseSystem,
      mode: props.mode,
      planetLabels: planetLabels(),
    })
    return
  }
  const offset = offsetMinutesForPerson(props.person)
  handle.setContext({
    date: new Date(localToUtcMs(props.person.isoLocal, offset)),
    lat: props.person.lat,
    lon: props.person.lon,
    zodiac: props.zodiac,
    houseSystem: props.houseSystem,
    mode: props.mode,
    planetLabels: planetLabels(),
  })
}

onMounted(async () => {
  if (!canvas.value) return
  if (window.matchMedia?.('(prefers-reduced-data: reduce)').matches) return
  await new Promise(r => requestAnimationFrame(r))
  try {
    handle = createSkyScene(canvas.value)
    applyContext()
  }
  catch (e) { console.warn('sky disabled:', e) }
})

onBeforeUnmount(() => handle?.dispose?.())
watch(() => [props.person, props.zodiac, props.houseSystem, props.mode, locale.value], applyContext, { deep: true })
</script>

<template lang="pug">
.sky-bg.absolute.inset-0.pointer-events-none(aria-hidden='true' data-testid='sky-bg')
  canvas.block.w-full.h-full(ref='canvas')
  .gradient-overlay
</template>

<style scoped>
.sky-bg { background: radial-gradient(ellipse at center, #17152b 0%, #0b0a1a 58%, #050410 100%); }
.gradient-overlay {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at center, rgba(11,10,26,0.08) 0%, rgba(11,10,26,0.18) 46%, rgba(11,10,26,0.55) 100%),
    linear-gradient(180deg, rgba(11,10,26,0) 0%, rgba(11,10,26,0.28) 70%, rgba(11,10,26,0.82) 100%);
  pointer-events: none;
}
</style>
