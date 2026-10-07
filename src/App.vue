<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from './stores/settings.js'
import { usePeopleStore } from './stores/people.js'
import { useSessionStore } from './stores/session.js'
import { hasPersonRouteQuery, personFromRouteQuery } from './lib/people/routeQuery.js'
import { transitsFor } from './lib/astro/transits.js'
import { useNatalChart } from './composables/useChart.js'
import AppTopBar from './components/shell/AppTopBar.vue'

const { locale } = useI18n()
const route    = useRoute()
const settings = useSettingsStore()
settings.normalize()
const people             = usePeopleStore()
const session            = useSessionStore()
const storedActivePerson = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const routePerson        = computed(() =>
  route.name === 'natal' && hasPersonRouteQuery(route.query) ? personFromRouteQuery(route.query) : null
)
const activePerson = computed(() =>
  route.name === 'natal' && hasPersonRouteQuery(route.query) ? routePerson.value : storedActivePerson.value
)
const Background      = defineAsyncComponent(() => import('./components/sky/Background.vue'))
const ChartBackdrop   = defineAsyncComponent(() => import('./components/planetarium/ChartBackdrop.vue'))
const mapLensModality = (lens) => {
  const key = String(lens || '').toLowerCase().replace(/_/g, '-')
  if (key === 'vedic' || key === 'sidereal') return 'vedic'
  if (key === 'human-design' || key === 'humandesign' || key === 'hd') return 'humanDesign'
  return 'astrology'
}
const routeModality = computed(() =>
  route.name === 'map' ? mapLensModality(route.params.lens) : route.meta?.modality || 'astrology'
)
const skyMode         = computed(() => routeModality.value === 'humanDesign' ? 'humanDesign' : 'astrology')
const activeTheme     = computed(() => settings.theme === 'light' ? 'light' : 'dark')
const backgroundChart = useNatalChart(activePerson, settings)
const planetariumChart = computed(() => backgroundChart.value || transitsFor(Date.now(), 0, 0, settings.chartOptions))
const planetariumCenterOffset = ref({ x: 0, y: 0 })
const isPlanetarium   = computed(() => route.name === 'planetarium')
const showSkyView     = computed(() => settings.skyEnabled && settings.skyView === 'sky' && !isPlanetarium.value)
const showPlanetarium = computed(() => settings.skyEnabled && settings.skyView === 'planetarium' && !isPlanetarium.value)
const mainContentClass = computed(() => route.meta?.fullBleed ? 'app-main__content--full' : 'mx-auto max-w-6xl px-4 py-6')

const updatePlanetariumCenter = async () => {
  await nextTick()
  if (typeof window === 'undefined') return
  const target = document.querySelector('[data-testid="chart-wheel-stage"]') || document.querySelector('[data-testid="chart-wheel"]')
  if (!target) {
    planetariumCenterOffset.value = { x: 0, y: 0 }
    return
  }

  const rect = target.getBoundingClientRect()
  planetariumCenterOffset.value = {
    x: rect.left + rect.width / 2 - window.innerWidth / 2,
    y: rect.top + rect.height / 2 - window.innerHeight / 2,
  }
}

locale.value = settings.locale

watchEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme     = activeTheme.value
  document.documentElement.style.colorScheme = activeTheme.value
})

watch(() => [route.fullPath, settings.skyView, showPlanetarium.value], updatePlanetariumCenter, { flush: 'post' })

onMounted(() => {
  updatePlanetariumCenter()
  window.addEventListener('resize', updatePlanetariumCenter)
  window.addEventListener('scroll', updatePlanetariumCenter, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePlanetariumCenter)
  window.removeEventListener('scroll', updatePlanetariumCenter)
})

</script>

<template lang="pug">
.app-shell.relative.min-h-dvh.flex.flex-col(:data-sky-view='settings.skyView')
  Background.fixed.inset-0.z-0(
    :person='activePerson'
    :zodiac='settings.zodiac'
    :house-system='settings.houseSystem'
    :mode='skyMode'
    :theme='activeTheme'
    v-if='showSkyView'
  )
  .app-planetarium-bg(v-else-if='showPlanetarium')
    ChartBackdrop.absolute.inset-0.h-full.w-full(
      :chart='planetariumChart'
      :interactive='false'
      :center-offset='planetariumCenterOffset'
      background
    )
  AppTopBar(:person='activePerson' :active-id='storedActivePerson?.id' :chart='backgroundChart')
  main.app-main.relative.z-10.flex-1
    .app-main__content(:class='mainContentClass')
      RouterView
  footer.text-xs.text-slate-500.text-center.py-4.relative.z-0(v-if='!isPlanetarium')
    | Astrelio · MIT · {{ new Date().getFullYear() }} · 
    a.underline-offset-2(
      class='hover:text-slate-300 hover:underline'
      href='https://www.geonames.org/'
      target='_blank'
      rel='noreferrer'
    ) GeoNames
</template>

<style scoped>
.app-shell {
  --app-header-height: 3.25rem;
  min-width: 0;
}

.app-main,
.app-main__content {
  min-width: 0;
}

.app-main__content--full {
  height: 100%;
}

.app-planetarium-bg {
  inset: 0;
  opacity: 0.82;
  pointer-events: none;
  position: fixed;
  z-index: 0;
}

.app-shell[data-sky-view="planetarium"] :deep([data-testid="natal-chart-panel"]) {
  background: rgb(11 10 26 / 0.18);
}

.app-shell[data-sky-view="planetarium"] :deep([data-testid="chart-wheel"]) {
  --chart-shadow-fill: rgb(2 6 23 / 0.12);
  --chart-zodiac-fill-a: rgb(38 54 83 / 0.38);
  --chart-zodiac-fill-b: rgb(29 42 66 / 0.34);
  --chart-zodiac-fill-c: rgb(48 65 95 / 0.38);
  --chart-house-fill-a: rgb(24 36 58 / 0.16);
  --chart-house-fill-b: rgb(33 48 74 / 0.16);
  --chart-house-center: rgb(7 17 31 / 0.08);
}

@media (max-width: 52rem) {
  .app-shell {
    padding-bottom: calc(3.5rem + env(safe-area-inset-bottom));
  }
}
</style>
