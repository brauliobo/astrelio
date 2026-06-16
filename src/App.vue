<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from './stores/settings.js'
import { usePeopleStore } from './stores/people.js'
import { useSessionStore } from './stores/session.js'
import { birthHeaderForPerson } from './lib/people/labels.js'
import { hasPersonRouteQuery, natalRouteForPerson, personFromRouteQuery } from './lib/people/routeQuery.js'
import { transitsFor } from './lib/astro/transits.js'
import { useNatalChart } from './composables/useChart.js'
import AppLogo from './components/AppLogo.vue'

const { t, locale } = useI18n()
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
const PlanetariumView = defineAsyncComponent(() => import('./components/chart/wheel/PlanetariumView.vue'))
const personPath      = computed(() => storedActivePerson.value ? `/person/${storedActivePerson.value.id}` : '/')
const natalPath       = computed(() => natalRouteForPerson(storedActivePerson.value))
const skyMode         = computed(() => route.path === '/human-design' ? 'humanDesign' : 'astrology')
const skyViewModes    = ['sky', 'planetarium']
const activeTheme     = computed(() => settings.theme === 'light' ? 'light' : 'dark')
const isVedicRoute    = computed(() => route.path === '/vedic')
const backgroundChart = useNatalChart(activePerson, settings)
const planetariumChart = computed(() => backgroundChart.value || transitsFor(Date.now(), 0, 0, settings.chartOptions))
const planetariumCenterOffset = ref({ x: 0, y: 0 })
const showSkyView     = computed(() => settings.skyEnabled && settings.skyView === 'sky')
const showPlanetarium = computed(() => settings.skyEnabled && settings.skyView === 'planetarium')
const toggleThemeLabel = computed(() =>
  activeTheme.value === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
)
const onLocale = (event) => {
  settings.setLocale(event.target.value)
  locale.value = settings.locale
}

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

const links = computed(() => [
  { to: '/',                 label: t('nav.home'),     id: 'home' },
  { to: natalPath.value,     label: t('nav.map'),      id: 'natal' },
  { to: '/timing/transits',  label: t('nav.timing'),   id: 'timing' },
  { to: '/synastry',         label: t('nav.relations'), id: 'synastry' },
  { to: personPath.value,    label: t('nav.library'),  id: 'library' },
  { to: '/settings',         label: t('nav.settings'), id: 'settings' }
])

const contextItems = computed(() => {
  const presetKey = settings.activePreset || 'custom'
  const items     = [
    {
      key:   'system',
      label: t('context.system'),
      value: isVedicRoute.value
        ? `${t('modalities.vedic')} · ${t(`vedic.ayanamshas.${settings.vedic.ayanamsha}`)}`
        : `${t(`settings.${settings.zodiac}`)} · ${t(`houses.${settings.houseSystem}`)}`,
    },
    { key: 'aspects', label: t('context.aspects'), value: t(`settings.presets.${presetKey}`) },
  ]

  if (activePerson.value) {
    items.unshift(
      { key: 'person', label: t('context.chart'), value: activePerson.value.name },
      { key: 'birth', label: t('context.birth'), value: birthHeaderForPerson(activePerson.value) }
    )
  }

  return items
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
    PlanetariumView.absolute.inset-0.h-full.w-full(
      :chart='planetariumChart'
      :interactive='false'
      :center-offset='planetariumCenterOffset'
      background
    )
  header.app-header.fixed.inset-x-0.top-0.z-20.backdrop-blur-md.border-b
    nav.mx-auto.max-w-6xl.px-4.py-3.flex.items-center.gap-3
      RouterLink(to='/' data-testid='brand' aria-label='Astrelio')
        AppLogo
      .grow
      .app-sky-switcher.inline-flex.items-center.rounded.border(
        class='border-white/10 bg-slate-950/50 p-0.5'
        :aria-label='t("chart.view_mode")'
      )
        button.app-sky-switcher__button(
          v-for='mode in skyViewModes'
          :key='mode'
          type='button'
          :class='{ "is-active": settings.skyView === mode }'
          :aria-pressed='settings.skyView === mode'
          :data-testid='`sky-view-${mode}`'
          @click='settings.setSkyView(mode)'
        ) {{ t(`chart.view_modes.${mode}`) }}
      .flex.items-center.gap-2.overflow-x-auto
        RouterLink.text-sm.text-slate-300.px-2.py-1.rounded.transition.whitespace-nowrap(
          v-for='l in links'
          :key='l.id'
          :to='l.to'
          active-class='text-amber-300 bg-white/5'
          :data-testid='`nav-${l.id}`'
          class='hover:text-white'
        ) {{ l.label }}
      select.app-locale-select.h-8.rounded-full.border.text-xs.font-semibold.outline-none.transition(
        class='px-3 pr-8'
        :value='settings.locale'
        aria-label='Language'
        title='Language'
        data-testid='locale-select'
        @change='onLocale'
      )
        option(value='pt-BR') PT
        option(value='en') EN
      button.theme-toggle(
        type='button'
        :aria-label='toggleThemeLabel'
        :title='toggleThemeLabel'
        :data-theme='activeTheme'
        data-testid='theme-toggle'
        @click='settings.toggleTheme()'
      )
        span.theme-toggle__icon(aria-hidden='true') {{ activeTheme === 'light' ? '☾' : '☼' }}
    .app-context-border.border-t
      .mx-auto.max-w-6xl.px-4.py-2.flex.items-center.gap-2.overflow-x-auto(
        data-testid='chart-context-bar'
      )
        .rounded-full.px-2.py-1.text-xs.whitespace-nowrap(
          v-for='item in contextItems'
          :key='item.key'
          class='bg-white/5'
          :data-testid='`context-${item.key}`'
        )
          span.text-slate-500 {{ item.label }}
          span.text-slate-300.ml-1 {{ item.value }}
  main.relative.z-10.flex-1.pt-24
    .mx-auto.max-w-6xl.px-4.py-6
      RouterView
  footer.text-xs.text-slate-500.text-center.py-4.relative.z-0
    | Astrelio · MIT · {{ new Date().getFullYear() }} · 
    a.underline-offset-2(
      class='hover:text-slate-300 hover:underline'
      href='https://www.geonames.org/'
      target='_blank'
      rel='noreferrer'
    ) GeoNames
</template>

<style scoped>
.app-sky-switcher__button {
  border-radius: 0.1875rem;
  color: rgb(203 213 225);
  flex: 0 0 auto;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  min-height: 2rem;
  padding: 0.45rem 0.65rem;
  transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
  white-space: nowrap;
}

.app-sky-switcher__button:hover,
.app-sky-switcher__button:focus-visible {
  background: rgb(255 255 255 / 0.1);
  color: rgb(248 250 252);
}

.app-sky-switcher__button.is-active {
  background: rgb(252 211 77);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.28);
  color: rgb(15 23 42);
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
</style>
