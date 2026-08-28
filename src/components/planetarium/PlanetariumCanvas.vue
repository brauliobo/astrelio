<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createPlanetarium, supportsWebgl } from './SolarSystemScene.js'
import { isMoon } from '../../lib/planetarium/moons.js'

const props = defineProps({
  state: { type: Object, required: true },
})
const emit = defineEmits(['pick'])
const { t } = useI18n()
const labelFor = name => (isMoon(name) ? t(`moons.${name}`) : t(`planets.${name}`))

const host       = ref(null)
const canvas     = ref(null)
const unsupported = ref(false)

let planetarium   = null
let animationFrame = 0
let resizeObserver = null

const renderLoop = () => {
  planetarium?.update(props.state)
  planetarium?.render()
  animationFrame = requestAnimationFrame(renderLoop)
}

const stopLoop = () => {
  cancelAnimationFrame(animationFrame)
  animationFrame = 0
}

const startLoop = () => {
  if (!animationFrame && planetarium) renderLoop()
}

const onPointerUp = event => planetarium?.pick(event)

const onVisibility = () => (document.hidden ? stopLoop() : startLoop())

onMounted(() => {
  if (!supportsWebgl()) {
    unsupported.value = true
    return
  }

  planetarium    = createPlanetarium({ canvas: canvas.value, host: host.value, labelFor, onPick: name => emit('pick', name) })
  resizeObserver = new ResizeObserver(() => planetarium.onResize())
  resizeObserver.observe(host.value)
  document.addEventListener('visibilitychange', onVisibility)
  startLoop()
})

onBeforeUnmount(() => {
  stopLoop()
  document.removeEventListener('visibilitychange', onVisibility)
  resizeObserver?.disconnect()
  planetarium?.dispose()
  planetarium = null
})

watch(() => props.state.view, () => planetarium?.frameCamera(props.state.view))
watch(() => props.state.focusBody, (name) => planetarium?.focusBody(name))
watch(() => props.state.trailBody, () => planetarium?.frameCamera(props.state.view))
watch(() => props.state.shadowAxis.token, () => planetarium?.alignShadowAxis(props.state.shadowAxis.kind))

defineExpose({
  reframe: () => planetarium?.frameCamera(props.state.view),
  canvasElement: () => canvas.value,
})
</script>

<template lang="pug">
.planetarium-canvas(ref='host' data-testid='planetarium-canvas')
  canvas.planetarium-canvas__surface(
    ref='canvas'
    data-testid='planetarium-canvas-surface'
    :aria-label='t("planetarium.canvas_aria")'
    role='img'
    @pointerup='onPointerUp'
  )
  .planetarium-canvas__fallback(v-if='unsupported' data-testid='planetarium-unsupported')
    span {{ t('planetarium.webgl_unavailable') }}
</template>

<style scoped>
.planetarium-canvas {
  background: radial-gradient(circle at 50% 40%, #0b1327 0%, #020617 70%);
  height: 100%;
  position: relative;
  touch-action: none;
  width: 100%;
}

.planetarium-canvas__surface {
  display: block;
  height: 100%;
  width: 100%;
}

.planetarium-canvas__fallback {
  align-items: center;
  color: rgb(226 232 240);
  display: flex;
  font-size: 0.8125rem;
  font-weight: 700;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: absolute;
  text-align: center;
}
</style>
