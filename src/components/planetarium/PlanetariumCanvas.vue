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
const captionFor = key => t(`planetarium.shadow.${key}`)

const host       = ref(null)
const canvas     = ref(null)
const unsupported = ref(false)
const tooltip    = ref(null)

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

const formatPeriod = (days) => {
  if (!days) return ''
  const value = days >= 100 ? Math.round(days).toLocaleString() : days.toFixed(3)
  return t('planetarium.hover.period', { days: value })
}

const hoverTitle = (hit) => {
  const kind = hit.kind || 'orbit'
  if (kind === 'orbit' || kind === 'trail' || kind === 'umbra' || kind === 'penumbra') {
    return hit.bodyName ? t(`planetarium.hover.${kind}`, { name: labelFor(hit.bodyName) }) : ''
  }
  return t(`planetarium.hover.${kind}`)
}

const hoverDetail = (hit) => {
  if (hit.radiusKm) return t('planetarium.hover.radius', { km: Math.round(hit.radiusKm).toLocaleString() })
  return formatPeriod(hit.periodDays)
}

const onPointerMove = (event) => {
  const hit   = planetarium?.hover(event)
  const title = hit ? hoverTitle(hit) : ''
  if (!title || !host.value) {
    tooltip.value = null
    return
  }
  const box = host.value.getBoundingClientRect()
  const x   = event.clientX - box.left + 14
  const y   = event.clientY - box.top + 16
  const flip = x > box.width - 176
  tooltip.value = {
    title,
    detail:    hoverDetail(hit),
    left:      `${Math.min(Math.max(8, x), box.width - 8)}px`,
    top:       `${Math.min(Math.max(8, y), box.height - 8)}px`,
    transform: flip ? 'translate(-100%, 4px)' : 'translate(0, 4px)',
  }
}

const onPointerLeave = () => {
  planetarium?.clearHover()
  tooltip.value = null
}

const onVisibility = () => (document.hidden ? stopLoop() : startLoop())

onMounted(() => {
  if (!supportsWebgl()) {
    unsupported.value = true
    return
  }

  planetarium    = createPlanetarium({ canvas: canvas.value, host: host.value, labelFor, captionFor, onPick: name => emit('pick', name) })
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

watch(() => props.state.view, () => {
  planetarium?.clearHover()
  tooltip.value = null
  planetarium?.frameCamera(props.state.view)
})
watch(() => props.state.focusBody, (name) => planetarium?.focusBody(name))
watch(() => props.state.scaleMode, () => {
  if (props.state.focusBody) planetarium?.focusBody(props.state.focusBody)
})
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
    :class='{ "is-hovering-orbit": tooltip }'
    :aria-label='t("planetarium.canvas_aria")'
    role='img'
    @pointerup='onPointerUp'
    @pointermove='onPointerMove'
    @pointerleave='onPointerLeave'
  )
  .planetarium-canvas__tooltip(
    v-if='tooltip'
    data-testid='planetarium-orbit-tooltip'
    :style='{ left: tooltip.left, top: tooltip.top, transform: tooltip.transform }'
  )
    strong {{ tooltip.title }}
    span(v-if='tooltip.detail') {{ tooltip.detail }}
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

.planetarium-canvas__surface.is-hovering-orbit {
  cursor: pointer;
}

.planetarium-canvas__tooltip {
  background: color-mix(in srgb, var(--app-panel-strong, #0f172a) 88%, transparent);
  border: 1px solid var(--app-border, rgb(51 65 85));
  border-radius: 0.55rem;
  color: rgb(226 232 240);
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  gap: 0.1rem;
  line-height: 1.1rem;
  max-width: 16rem;
  padding: 0.35rem 0.55rem;
  pointer-events: none;
  position: absolute;
  transform: translate(0, 0);
  z-index: 3;
}

.planetarium-canvas__tooltip strong {
  font-weight: 700;
}

.planetarium-canvas__tooltip span {
  color: rgb(148 163 184);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
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
