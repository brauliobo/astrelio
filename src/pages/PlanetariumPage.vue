<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { usePlanetariumStore } from '../stores/planetarium.js'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { createEventWorkerClient } from '../lib/planetarium/eventWorkerClient.js'
import { BODIES, VIEW_MODES } from '../lib/planetarium/constants.js'
import { MOONS } from '../lib/planetarium/moons.js'
import { rateMsPerSecond } from '../lib/planetarium/time.js'
import PlanetariumCanvas from '../components/planetarium/PlanetariumCanvas.vue'
import ViewSwitcher from '../components/planetarium/ViewSwitcher.vue'
import TimeControls from '../components/planetarium/TimeControls.vue'
import EventTimeline from '../components/planetarium/EventTimeline.vue'
import EventDetails from '../components/planetarium/EventDetails.vue'
import BodyInfoPanel from '../components/planetarium/BodyInfoPanel.vue'

const { t, locale } = useI18n()
const route   = useRoute()
const router  = useRouter()
const store   = usePlanetariumStore()
const people  = usePeopleStore()
const session = useSessionStore()
store.normalize()

const client        = createEventWorkerClient()
const selectedBody  = ref('')
const panel         = ref('events')
const canvasRef     = ref(null)
const shadowAxis = ref({ token: 0, kind: 'solar' })
const shadowFocus = ref('all')

const activePerson = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const observerLocation = computed(() => {
  const person = activePerson.value
  if (!Number.isFinite(Number(person?.lat)) || !Number.isFinite(Number(person?.lon))) return null
  return { latitude: Number(person.lat), longitude: Number(person.lon), elevation: 0 }
})

const sceneState = computed(() => ({
  view:             store.view,
  timeMs:           store.simTimeMs,
  scaleMode:        store.scaleMode,
  sizeExaggeration: store.sizeExaggeration,
  showOrbits:       store.showOrbits,
  showLabels:       store.showLabels,
  showShadows:      store.showShadows,
  showStarMap:      store.showStarMap,
  showMoons:        store.showMoons,
  focusBody:        selectedBody.value,
  trailBody:        store.trailBody,
  trailSpanDays:    store.trailSpanDays,
  shadowAxis:       shadowAxis.value,
  shadowFocus:      shadowFocus.value,
}))

const moonGroups = computed(() => {
  const parents = [...new Set(MOONS.map(moon => moon.parent))]
  return parents.map(parent => ({ parent, moons: MOONS.filter(moon => moon.parent === parent) }))
})

const insetCaption = computed(() => {
  if (store.view === 'retrograde') return t('planetarium.inset.helio')
  if (store.view === 'moon' || store.view === 'eclipses') return t('planetarium.inset.from_earth')
  return ''
})

const viewFromRoute = () => {
  const value = String(route.params.view || '')
  if (VIEW_MODES.includes(value)) store.setView(value)
}

const selectView = (view) => {
  store.setView(view)
  router.replace({ name: 'planetarium', params: { view } })
}

const needsEvents = () => {
  const { startMs, endMs } = store.timelineRange
  const loaded = store.eventsRange
  return startMs < loaded.startMs || endMs > loaded.endMs
}

// One search at a time; when it lands, check whether the window moved on while it ran.
let searching = false

const loadEvents = async () => {
  if (searching || !needsEvents()) return

  const { startMs, endMs } = store.timelineRange
  const span  = endMs - startMs
  const range = { startMs: startMs - span / 2, endMs: endMs + span / 2 }
  searching = true
  store.eventsStatus = 'loading'

  try {
    store.setEvents(await client.search({ ...range, location: observerLocation.value }), range)
  } catch {
    store.eventsStatus = 'error'
    return
  } finally {
    searching = false
  }

  loadEvents()
}

let animationFrame = 0
let lastFrameMs    = 0

const tick = (now) => {
  if (store.playing) {
    const deltaSeconds = lastFrameMs ? (now - lastFrameMs) / 1000 : 0
    store.setTime(store.simTimeMs + rateMsPerSecond(store.rate) * store.direction * deltaSeconds)
  }
  lastFrameMs    = now
  animationFrame = requestAnimationFrame(tick)
}

const onPick = (name) => {
  selectedBody.value = selectedBody.value === name ? '' : name
  if (selectedBody.value) panel.value = 'body'
}

// Focusing by name rather than by clicking: at true scale a planet is far too small to hit.
const focusOn = (name) => {
  selectedBody.value = name
  if (name) panel.value = 'body'
}

const onSelectEvent = (id) => {
  store.selectEvent(id)
  panel.value = 'event'
  if (store.selectedEvent?.view) router.replace({ name: 'planetarium', params: { view: store.view } })
}

const viewEventIn3d = (event) => {
  store.setTime(event.timeMs)
  store.playing = false
  const eclipse = event.type === 'solar_eclipse' || event.type === 'lunar_eclipse'
  shadowFocus.value = eclipse ? (event.type === 'lunar_eclipse' ? 'lunar' : 'solar') : 'all'
  if (eclipse) shadowAxis.value = { token: shadowAxis.value.token + 1, kind: shadowFocus.value }
  if (event.bodies?.length) selectedBody.value = event.bodies[event.bodies.length - 1]
}

onMounted(() => {
  viewFromRoute()
  loadEvents()
  animationFrame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
  client.terminate()
})

watch(() => route.params.view, viewFromRoute)
watch(() => store.view, view => {
  if (route.params.view !== view) router.replace({ name: 'planetarium', params: { view } })
})
watch(() => [store.simTimeMs, store.timelineSpanMs, observerLocation.value], loadEvents)
</script>

<template lang="pug">
section.planetarium-page(data-testid='planetarium-page')
  .planetarium-page__stage
    PlanetariumCanvas(ref='canvasRef' :key='locale' :state='sceneState' @pick='onPick')

    p.planetarium-page__inset-caption(v-if='insetCaption' data-testid='planetarium-inset-caption') {{ insetCaption }}

    p.planetarium-page__scale-note(
      v-if='store.view === "orrery" && store.scaleMode === "true"'
      data-testid='planetarium-scale-note'
    ) {{ t('planetarium.true_scale_note') }}

    .planetarium-page__views
      ViewSwitcher(:view='store.view' @select='selectView')

    .planetarium-page__hint(data-testid='planetarium-hint')
      h1.planetarium-page__title {{ t(`planetarium.views.${store.view}.label`) }}
      p.planetarium-page__lede {{ t(`planetarium.views.${store.view}.lede`) }}

    .planetarium-page__options(:aria-label='t("planetarium.options")' role='group')
      button.planetarium-page__toggle(
        type='button'
        :aria-pressed='store.scaleMode === "true"'
        :class='{ "is-active": store.scaleMode === "true" }'
        data-testid='planetarium-true-scale'
        @click='store.setScaleMode(store.scaleMode === "true" ? "compressed" : "true")'
      ) {{ t('planetarium.options_true_scale') }}
      button.planetarium-page__toggle(
        type='button'
        data-testid='planetarium-reframe'
        @click='canvasRef?.reframe()'
      ) {{ t('planetarium.options_reframe') }}
      button.planetarium-page__toggle(
        v-for='option in [["showOrbits", "orbits"], ["showLabels", "labels"], ["showShadows", "shadows"], ["showStarMap", "stars"], ["showMoons", "moons"]]'
        :key='option[0]'
        type='button'
        :aria-pressed='store[option[0]]'
        :class='{ "is-active": store[option[0]] }'
        :data-testid='`planetarium-toggle-${option[1]}`'
        @click='store[option[0]] = !store[option[0]]'
      ) {{ t(`planetarium.options_${option[1]}`) }}
      label.planetarium-page__slider(v-if='store.view === "orrery" && store.scaleMode !== "true"')
        span {{ t('planetarium.options_size') }}
        input(
          type='range'
          min='400'
          max='20000'
          step='100'
          :value='store.sizeExaggeration'
          :aria-label='t("planetarium.options_size")'
          data-testid='planetarium-size'
          @input='store.sizeExaggeration = Number($event.target.value)'
        )
      label.planetarium-page__slider
        span {{ t('planetarium.options_focus') }}
        select(
          :value='selectedBody'
          :aria-label='t("planetarium.options_focus")'
          data-testid='planetarium-focus-body'
          @change='focusOn($event.target.value)'
        )
          option(value='') {{ t('planetarium.options_focus_none') }}
          option(v-for='body in BODIES' :key='body.name' :value='body.name') {{ t(`planets.${body.name}`) }}
          optgroup(v-for='group in moonGroups' :key='group.parent' :label='t(`planets.${group.parent}`)')
            option(v-for='moon in group.moons' :key='moon.name' :value='moon.name') {{ t(`moons.${moon.name}`) }}
      label.planetarium-page__slider(v-if='store.view === "retrograde"')
        span {{ t('planetarium.options_trail') }}
        select(
          :value='store.trailBody'
          :aria-label='t("planetarium.options_trail")'
          data-testid='planetarium-trail-body'
          @change='store.trailBody = $event.target.value'
        )
          option(v-for='name in ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]' :key='name' :value='name') {{ t(`planets.${name}`) }}

  aside.planetarium-page__panel(data-testid='planetarium-panel')
    .planetarium-page__tabs(role='tablist' :aria-label='t("planetarium.panel_aria")')
      button.planetarium-page__tab(
        v-for='tab in ["events", "event", "body"]'
        :key='tab'
        type='button'
        role='tab'
        :aria-selected='panel === tab'
        :class='{ "is-active": panel === tab }'
        :data-testid='`planetarium-tab-${tab}`'
        @click='panel = tab'
      ) {{ t(`planetarium.tabs.${tab}`) }}

    EventTimeline(
      v-show='panel === "events"'
      :events='store.visibleEvents'
      :active-types='store.eventTypes'
      :time-ms='store.simTimeMs'
      :range-start-ms='store.timelineRange.startMs'
      :range-end-ms='store.timelineRange.endMs'
      :selected-id='store.selectedEventId'
      :status='store.eventsStatus'
      @seek='store.setTime($event)'
      @select='onSelectEvent'
      @toggle-type='store.toggleEventType($event)'
    )
    EventDetails(
      v-if='panel === "event"'
      :event='store.selectedEvent'
      @view='viewEventIn3d'
      @clear='panel = "events"'
    )
    BodyInfoPanel(
      v-if='panel === "body"'
      :body='selectedBody'
      :time-ms='store.simTimeMs'
      @clear='selectedBody = ""'
    )

  footer.planetarium-page__footer
    TimeControls(
      :time-ms='store.simTimeMs'
      :playing='store.playing'
      :rate='store.rate'
      :direction='store.direction'
      @update:time='store.setTime($event)'
      @toggle-play='store.togglePlay()'
      @update:rate='store.setRate($event)'
      @reverse='store.reverse()'
      @now='store.now()'
    )
</template>

<style scoped>
.planetarium-page {
  display: grid;
  gap: 0;
  grid-template-areas: 'stage panel' 'footer panel';
  grid-template-columns: minmax(0, 1fr) 22rem;
  grid-template-rows: minmax(0, 1fr) auto;
  height: calc(100dvh - var(--app-header-height, 3.5rem));
  min-height: 30rem;
}

.planetarium-page__stage {
  grid-area: stage;
  min-height: 0;
  position: relative;
}

.planetarium-page__views {
  left: 0.75rem;
  position: absolute;
  top: 0.75rem;
  z-index: 2;
}

.planetarium-page__hint {
  left: 5.75rem;
  max-width: 22rem;
  pointer-events: none;
  position: absolute;
  top: 0.9rem;
  z-index: 1;
}

.planetarium-page__title {
  color: rgb(248 250 252);
  font-size: 1rem;
  font-weight: 700;
}

.planetarium-page__lede {
  color: rgb(148 163 184);
  font-size: 0.75rem;
  line-height: 1.05rem;
}

.planetarium-page__inset-caption {
  color: rgb(148 163 184);
  font-size: 0.6875rem;
  position: absolute;
  right: 1rem;
  text-align: right;
  top: 0.9rem;
  z-index: 2;
}

.planetarium-page__scale-note {
  bottom: 3rem;
  color: rgb(148 163 184);
  font-size: 0.6875rem;
  left: 0.75rem;
  max-width: 26rem;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}

.planetarium-page__options {
  bottom: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  left: 0.75rem;
  position: absolute;
  right: 0.75rem;
  z-index: 2;
}

.planetarium-page__toggle {
  background: rgb(15 23 42 / 0.72);
  border: 1px solid rgb(148 163 184 / 0.25);
  border-radius: 999px;
  color: rgb(203 213 225);
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
}

.planetarium-page__toggle.is-active {
  background: rgb(252 211 77);
  border-color: rgb(252 211 77);
  color: rgb(15 23 42);
}

.planetarium-page__slider {
  align-items: center;
  background: rgb(15 23 42 / 0.72);
  border: 1px solid rgb(148 163 184 / 0.25);
  border-radius: 999px;
  color: rgb(203 213 225);
  display: flex;
  font-size: 0.6875rem;
  gap: 0.4rem;
  padding: 0.15rem 0.6rem;
}

.planetarium-page__panel {
  border-left: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  grid-area: panel;
  min-height: 0;
  overflow-y: auto;
  padding: 0.75rem;
}

.planetarium-page__tabs {
  display: flex;
  gap: 0.25rem;
}

.planetarium-page__tab {
  border-radius: 999px;
  color: var(--app-text-muted);
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
}

.planetarium-page__tab.is-active {
  background: rgb(252 211 77);
  color: rgb(15 23 42);
}

.planetarium-page__footer {
  border-top: 1px solid var(--app-border);
  grid-area: footer;
  padding: 0.5rem 0.75rem;
}

@media (max-width: 60rem) {
  .planetarium-page {
    grid-template-areas: 'stage' 'footer' 'panel';
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(18rem, 55dvh) auto minmax(0, 1fr);
    height: auto;
  }

  .planetarium-page__panel {
    border-left: 0;
    border-top: 1px solid var(--app-border);
    max-height: 60dvh;
  }

  .planetarium-page__hint {
    display: none;
  }
}
</style>
