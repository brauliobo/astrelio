<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from './stores/settings.js'
import { usePeopleStore } from './stores/people.js'
import { useSessionStore } from './stores/session.js'
import AppLogo from './components/AppLogo.vue'

const { t } = useI18n()
const settings = useSettingsStore()
settings.normalize()
const people = usePeopleStore()
const session = useSessionStore()
const activePerson = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const SkyBackground = defineAsyncComponent(() => import('./components/sky/SkyBackground.vue'))
const personPath = computed(() => activePerson.value ? `/person/${activePerson.value.id}` : '/')

const links = computed(() => [
  { to: '/',                 label: t('nav.home'),     id: 'home' },
  { to: '/natal',            label: t('nav.map'),      id: 'natal' },
  { to: '/timing/transits',  label: t('nav.timing'),   id: 'timing' },
  { to: '/synastry',         label: t('nav.relations'), id: 'synastry' },
  { to: personPath.value,    label: t('nav.library'),  id: 'library' },
  { to: '/settings',         label: t('nav.settings'), id: 'settings' }
])

const contextItems = computed(() => {
  const presetKey = settings.activePreset || 'custom'
  const items = [
    { key: 'system', label: t('context.system'), value: `${t(`settings.${settings.zodiac}`)} · ${t(`houses.${settings.houseSystem}`)}` },
    { key: 'aspects', label: t('context.aspects'), value: t(`settings.presets.${presetKey}`) },
  ]

  if (activePerson.value) {
    items.unshift(
      { key: 'person', label: t('context.chart'), value: activePerson.value.name },
      { key: 'birth', label: t('context.birth'), value: `${activePerson.value.isoLocal} · ${activePerson.value.placeLabel}` }
    )
  }

  return items
})
</script>

<template lang="pug">
.app-shell.relative.min-h-dvh.flex.flex-col
  SkyBackground.fixed.inset-0.z-0(
    :person='activePerson'
    :zodiac='settings.zodiac'
    :house-system='settings.houseSystem'
    v-if='settings.skyEnabled'
  )
  header.sticky.top-0.z-20.backdrop-blur-md.border-b(class='bg-night/70 border-white/5')
    nav.mx-auto.max-w-6xl.px-4.py-3.flex.items-center.gap-3.overflow-x-auto
      RouterLink(to='/' data-testid='brand' aria-label='Astrelio')
        AppLogo
      .grow
      RouterLink.text-sm.text-slate-300.px-2.py-1.rounded.transition.whitespace-nowrap(
        v-for='l in links'
        :key='l.to'
        :to='l.to'
        active-class='text-amber-300 bg-white/5'
        :data-testid='`nav-${l.id}`'
        class='hover:text-white'
      ) {{ l.label }}
    .border-t(class='border-white/5')
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
  main.relative.z-10.flex-1
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
