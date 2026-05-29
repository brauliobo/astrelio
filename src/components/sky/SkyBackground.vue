<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { offsetMinutesForPerson, localToUtcMs } from '../../lib/astro/timezones.js'
import { createSkyScene } from '../../lib/sky/scene.js'

const props = defineProps({
  person: { type: Object, default: null }
})

const canvas = ref(null)
let handle  = null

const applyContext = () => {
  if (!handle) return
  if (!props.person) {
    handle.setContext({ date: new Date(), lat: 0, lon: 0 })
    return
  }
  const offset = offsetMinutesForPerson(props.person)
  handle.setContext({
    date: new Date(localToUtcMs(props.person.isoLocal, offset)),
    lat: props.person.lat,
    lon: props.person.lon,
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
watch(() => props.person, applyContext, { deep: true })
</script>

<template lang="pug">
.sky-bg.absolute.inset-0.pointer-events-none(aria-hidden='true' data-testid='sky-bg')
  canvas.block.w-full.h-full(ref='canvas')
  .gradient-overlay
</template>

<style scoped>
.sky-bg { background: radial-gradient(ellipse at center, #1a1530 0%, #0b0a1a 60%, #050410 100%); }
.gradient-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(11,10,26,0) 0%, rgba(11,10,26,0.4) 70%, rgba(11,10,26,0.85) 100%);
  pointer-events: none;
}
</style>
