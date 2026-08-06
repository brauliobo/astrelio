<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from './stores/settings.js'
import { usePeopleStore } from './stores/people.js'
import { useSessionStore } from './stores/session.js'
import { birthHeaderForPerson } from './lib/people/labels.js'
import { hasPersonRouteQuery, personFromRouteQuery } from './lib/people/routeQuery.js'
import { transitsFor } from './lib/astro/transits.js'
import { useNatalChart } from './composables/useChart.js'
import AppLogo from './components/AppLogo.vue'
import AppCommandPalette from './components/AppCommandPalette.vue'

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
const activeBirthHeader = computed(() => birthHeaderForPerson(activePerson.value))
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
const skyViewModes    = ['sky', 'planetarium']
const activeTheme     = computed(() => settings.theme === 'light' ? 'light' : 'dark')
const isVedicRoute    = computed(() => routeModality.value === 'vedic')
const backgroundChart = useNatalChart(activePerson, settings)
const planetariumChart = computed(() => backgroundChart.value || transitsFor(Date.now(), 0, 0, settings.chartOptions))
const planetariumCenterOffset = ref({ x: 0, y: 0 })
const showSkyView     = computed(() => settings.skyEnabled && settings.skyView === 'sky')
const showPlanetarium = computed(() => settings.skyEnabled && settings.skyView === 'planetarium')
const toggleThemeLabel = computed(() =>
  t(activeTheme.value === 'light' ? 'theme.switch_to_dark' : 'theme.switch_to_light')
)
const onLocale = (event) => {
  settings.setLocale(event.target.value)
  locale.value = settings.locale
}

const systemLabel = computed(() => {
  if (isVedicRoute.value) return `${t('modalities.vedic')} · ${t(`vedic.ayanamshas.${settings.vedic.ayanamsha}`)}`
  if (routeModality.value === 'humanDesign') return t('modalities.human_design')
  return `${t(`settings.${settings.zodiac}`)} · ${t(`houses.${settings.houseSystem}`)}`
})

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
  { to: '/synastry',            label: t('nav.relations'), id: 'relationships', workspace: 'relations' },
  { to: '/timing/transits',     label: t('nav.timing'),    id: 'timing',        workspace: 'timing' },
  { to: '/map/astrology/chart', label: t('nav.map'),       id: 'map',           workspace: 'map' },
  { to: '/',                    label: t('nav.charts'),    id: 'charts',        workspace: 'library' },
])

const showChartContext = computed(() => !['home', 'settings'].includes(route.name))

const contextItems = computed(() => {
  const presetKey = settings.activePreset || 'custom'
  return [
    {
      key:   'system',
      label: t('context.system'),
      value: systemLabel.value,
      to:    { name: 'settings' },
    },
    { key: 'preset', label: t('settings.preset'), value: t(`settings.presets.${presetKey}`), to: { name: 'settings' } },
  ]
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
  header.app-header.sticky.top-0.z-20.backdrop-blur-md.border-b
    nav.app-header__nav.mx-auto.max-w-6xl.px-4.py-3
      RouterLink(to='/' data-testid='brand' :aria-label='t("app.title")')
        AppLogo
      .app-primary-nav
        RouterLink.text-sm.text-slate-300.px-2.py-1.rounded.transition.whitespace-nowrap(
          v-for='l in links'
          :key='l.id'
          :to='l.to'
          :class='{ "text-amber-300 bg-white/5": route.meta?.workspace === l.workspace }'
          :data-testid='`nav-${l.id}`'
          class='hover:text-white'
        ) {{ l.label }}
      .app-utilities(data-testid='shell-utilities')
        AppCommandPalette(:chart='backgroundChart')
        details.app-utility-menu(data-testid='utility-menu')
          summary.app-utility-menu__summary(
            :aria-label='t("shell.utilities")'
            :title='t("shell.utilities")'
            data-testid='utility-menu-summary'
          )
            span(aria-hidden='true') ...
          .app-utility-menu__panel(:aria-label='t("shell.utilities")' role='group')
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
            select.app-locale-select.h-8.rounded-full.border.text-xs.font-semibold.outline-none.transition(
              class='px-3 pr-8'
              :value='settings.locale'
              :aria-label='t("settings.language")'
              :title='t("settings.language")'
              data-testid='locale-select'
              @change='onLocale'
            )
              option(value='pt-BR') {{ t('settings.languages.pt_BR') }}
              option(value='en') {{ t('settings.languages.en') }}
            button.theme-toggle(
              type='button'
              :aria-label='toggleThemeLabel'
              :title='toggleThemeLabel'
              :data-theme='activeTheme'
              data-testid='theme-toggle'
              @click='settings.toggleTheme()'
            )
              span.theme-toggle__icon(aria-hidden='true') {{ activeTheme === 'light' ? '☾' : '☼' }}
            RouterLink.app-settings-link.rounded-full.px-3.py-2.text-xs.font-semibold.whitespace-nowrap(
              to='/settings'
              class='bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              data-testid='utility-settings'
            ) {{ t('nav.settings') }}
    .app-context-border.border-t(v-if='showChartContext')
      .app-chart-context.mx-auto.max-w-6xl.px-4.py-2(
        data-testid='chart-context-bar'
      )
        RouterLink.app-chart-context__identity(
          v-if='activePerson'
          :to='personPath'
          :aria-label='`${t("context.chart")}: ${activePerson.name}`'
        )
          span.app-chart-context__eyebrow {{ t('context.chart') }}
          strong.app-chart-context__name(data-testid='context-person') {{ activePerson.name }}
          span.app-chart-context__birth(data-testid='context-birth') {{ activeBirthHeader }}
        .app-chart-context__meta
          component.app-chart-context__chip(
            v-for='item in contextItems'
            :is='item.to ? RouterLink : "div"'
            :key='item.key'
            :to='item.to || undefined'
            :class='{ "app-chart-context__chip--link": item.to }'
            :data-testid='`context-${item.key}`'
          )
            span.app-chart-context__label {{ item.label }}
            span.app-chart-context__value {{ item.value }}
  main.app-main.relative.z-10.flex-1
    .app-main__content.mx-auto.max-w-6xl.px-4.py-6
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
.app-shell {
  min-width: 0;
}

.app-main,
.app-main__content {
  min-width: 0;
}

.app-chart-context {
  align-items: center;
  background: color-mix(in srgb, var(--app-panel) 42%, transparent);
  display: grid;
  gap: 0.65rem 1rem;
  grid-template-columns: minmax(0, 1fr) auto;
  min-width: 0;
}

.app-chart-context__identity {
  border-left: 2px solid rgb(252 211 77 / 0.8);
  display: block;
  min-width: 0;
  padding-left: 0.7rem;
}

.app-chart-context__identity:hover .app-chart-context__name,
.app-chart-context__identity:focus-visible .app-chart-context__name {
  color: rgb(253 230 138);
}

.app-chart-context__name,
.app-chart-context__birth {
  display: block;
  overflow-wrap: anywhere;
  white-space: normal;
}

.app-chart-context__eyebrow {
  color: var(--app-accent-text);
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 0.9rem;
  text-transform: uppercase;
}

.app-chart-context__name {
  color: var(--app-text);
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: color 140ms ease;
}

.app-chart-context__birth {
  color: var(--app-text-soft);
  font-size: 0.6875rem;
  line-height: 1rem;
}

.app-chart-context__meta {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
  min-width: 0;
}

.app-chart-context__chip {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.6875rem;
  line-height: 1rem;
  max-width: 18rem;
  min-width: 0;
  padding: 0.3rem 0.6rem;
  transition: background-color 140ms ease, color 140ms ease;
}

.app-chart-context__chip {
  background: var(--app-chip);
}

.app-chart-context__chip--link:hover,
.app-chart-context__chip--link:focus-visible {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.app-chart-context__label {
  color: var(--app-text-muted);
  flex: 0 0 auto;
}

.app-chart-context__value {
  color: var(--app-text-soft);
  margin-left: 0.3rem;
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: normal;
}

.app-header__nav {
  align-items: center;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-width: 0;
}

.app-primary-nav,
.app-utilities {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  min-width: 0;
}

.app-primary-nav {
  justify-content: center;
  overflow-x: auto;
  scrollbar-width: none;
}

.app-primary-nav::-webkit-scrollbar {
  display: none;
}

.app-utilities {
  justify-content: flex-end;
}

.app-utility-menu {
  flex: 0 0 auto;
  position: relative;
}

.app-utility-menu__summary {
  align-items: center;
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  color: var(--app-text-soft);
  cursor: pointer;
  display: flex;
  font-size: 0.875rem;
  font-weight: 800;
  height: 2rem;
  justify-content: center;
  list-style: none;
  width: 2rem;
}

.app-utility-menu__summary::-webkit-details-marker {
  display: none;
}

.app-utility-menu__summary:hover,
.app-utility-menu__summary:focus-visible,
.app-utility-menu[open] .app-utility-menu__summary {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.app-utility-menu:not([open]) .app-utility-menu__panel {
  display: none;
}

.app-utility-menu__panel {
  align-items: center;
  background: color-mix(in srgb, var(--app-panel-strong) 96%, var(--app-bg));
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  box-shadow: 0 18px 45px rgb(0 0 0 / 0.35);
  display: flex;
  gap: 0.5rem;
  max-width: calc(100vw - 2rem);
  padding: 0.65rem;
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  width: max-content;
  z-index: 30;
}

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

@media (max-width: 52rem) {
  .app-header__nav {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .app-primary-nav {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: flex-start;
  }

  .app-utilities {
    grid-column: 2;
    grid-row: 1;
  }

  .app-utility-menu__panel {
    flex-wrap: wrap;
    justify-content: flex-end;
    width: min(18rem, calc(100vw - 2rem));
  }

  .app-chart-context {
    align-items: start;
    grid-template-columns: minmax(0, 1fr);
  }

  .app-chart-context__meta {
    justify-content: flex-start;
  }

  .app-chart-context__chip {
    max-width: min(18rem, calc(100vw - 2rem));
  }
}
</style>
