<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { offsetMinutesForPerson, localToUtcMs } from '../../lib/astro/timezones.js'
import { createSkyScene } from '../../lib/sky/scene.js'
import MoonPhaseImage from './MoonPhaseImage.vue'

const props = defineProps({
  person: { type: Object, default: null },
  zodiac: { type: String, default: 'tropical' },
  houseSystem: { type: String, default: 'placidus' },
  mode: { type: String, default: 'astrology' },
  theme: { type: String, default: 'dark' },
})

const canvas = ref(null)
const moonFrame = ref(null)
const { t, locale } = useI18n()
let handle  = null

const moonStyle = computed(() => {
  if (!moonFrame.value) return null
  return {
    left: `${moonFrame.value.x}px`,
    top: `${moonFrame.value.y}px`,
  }
})

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
      theme: props.theme,
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
    theme: props.theme,
    planetLabels: planetLabels(),
  })
}

onMounted(async () => {
  if (!canvas.value) return
  if (window.matchMedia?.('(prefers-reduced-data: reduce)').matches) return
  await new Promise(r => requestAnimationFrame(r))
  try {
    handle = createSkyScene(canvas.value, {
      onMoonFrame: frame => {
        moonFrame.value = frame
      },
    })
    applyContext()
  }
  catch (e) { console.warn('sky disabled:', e) }
})

onBeforeUnmount(() => {
  handle?.dispose?.()
  moonFrame.value = null
})
watch(() => [props.person, props.zodiac, props.houseSystem, props.mode, props.theme, locale.value], applyContext, { deep: true })
</script>

<template lang="pug">
.sky-bg.absolute.inset-0.pointer-events-none(
  aria-hidden='true'
  data-testid='sky-bg'
  :data-theme='theme'
)
  canvas.block.w-full.h-full(ref='canvas')
  MoonPhaseImage.sky-bg__moon(
    v-if='moonFrame'
    :phase='moonFrame.phaseFraction'
    :size='moonFrame.size'
    :style='moonStyle'
    alt=''
  )
  .gradient-overlay
</template>

<style scoped>
.sky-bg {
  background: radial-gradient(ellipse at center, #17152b 0%, #0b0a1a 58%, #050410 100%);
}

.sky-bg[data-theme='light'] {
  background: radial-gradient(ellipse at center, #eef8ff 0%, #d8ebf8 54%, #bcd9ec 100%);
}

.gradient-overlay {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at center, rgba(11,10,26,0.08) 0%, rgba(11,10,26,0.18) 46%, rgba(11,10,26,0.55) 100%),
    linear-gradient(180deg, rgba(11,10,26,0) 0%, rgba(11,10,26,0.28) 70%, rgba(11,10,26,0.82) 100%);
  pointer-events: none;
}

.sky-bg__moon {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -50%);
}

.sky-bg[data-theme='light'] .gradient-overlay {
  background:
    radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, rgba(238,245,251,0.28) 48%, rgba(196,219,236,0.46) 100%),
    linear-gradient(180deg, rgba(248,251,255,0.20) 0%, rgba(222,237,248,0.34) 68%, rgba(190,216,235,0.56) 100%);
}
</style>
