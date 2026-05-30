<script setup>
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settings.js'
import { usePeopleStore } from '../stores/people.js'
import BackupPanel from '../components/export/BackupPanel.vue'

const { t, locale } = useI18n()
const settings = useSettingsStore()
const people   = usePeopleStore()

const onLocale = (e) => {
  settings.setLocale(e.target.value)
  locale.value = e.target.value
}

const houses = ['placidus', 'koch', 'porphyry', 'regiomontanus', 'equal', 'whole_sign']
const aspectSets = ['all', 'major']
const orbScales = [
  { value: 0.75, key: 'tight' },
  { value: 1, key: 'standard' },
  { value: 1.25, key: 'wide' },
]

const reset = () => {
  if (confirm(t('settings.reset') + '?')) {
    people.clear()
    settings.reset()
    locale.value = 'pt-BR'
  }
}
</script>

<template lang="pug">
section.settings.max-w-md(data-testid='settings-page')
  h1.text-xl.font-semibold.text-slate-100.mb-4 {{ t('settings.title') }}
  .grid.gap-4
    div
      label.block.text-xs.text-slate-400.mb-1 {{ t('settings.language') }}
      select.ui-control.ui-control-md.w-full(
        :value='settings.locale'
        @change='onLocale'
        data-testid='setting-locale'
      )
        option(value='pt-BR') Português (Brasil)
        option(value='en') English
    div
      label.block.text-xs.text-slate-400.mb-1 {{ t('settings.house_system') }}
      select.ui-control.ui-control-md.w-full(
        v-model='settings.houseSystem'
        data-testid='setting-houses'
      )
        option(v-for='h in houses' :key='h' :value='h') {{ t(`houses.${h}`) }}
    div
      label.block.text-xs.text-slate-400.mb-1 {{ t('settings.ayanamsa') }}
      select.ui-control.ui-control-md.w-full(
        v-model='settings.zodiac'
        data-testid='setting-zodiac'
      )
        option(value='tropical') {{ t('settings.tropical') }}
        option(value='sidereal') {{ t('settings.sidereal') }}
    .ui-panel
      h2.text-sm.font-semibold.text-slate-100.mb-3 {{ t('settings.aspect_options') }}
      .grid.gap-3
        div
          label.block.text-xs.text-slate-400.mb-1 {{ t('settings.aspect_set') }}
          select.ui-control.ui-control-md.w-full(v-model='settings.aspectSet' data-testid='setting-aspect-set')
            option(v-for='set in aspectSets' :key='set' :value='set') {{ t(`settings.aspect_sets.${set}`) }}
        div
          label.block.text-xs.text-slate-400.mb-1 {{ t('settings.orb_width') }}
          select.ui-control.ui-control-md.w-full(v-model.number='settings.orbScale' data-testid='setting-orb-scale')
            option(v-for='scale in orbScales' :key='scale.key' :value='scale.value') {{ t(`settings.orb_scales.${scale.key}`) }}
        label.flex.items-center.gap-2.text-sm.text-slate-300
          input(type='checkbox' v-model='settings.applyingOnly' data-testid='setting-applying-only')
          | {{ t('settings.applying_only') }}
        label.flex.items-center.gap-2.text-sm.text-slate-300
          input(type='checkbox' v-model='settings.includeModernPlanets' data-testid='setting-modern-planets')
          | {{ t('settings.include_modern_planets') }}
    label.flex.items-center.gap-2.text-sm.text-slate-300
      input(type='checkbox' v-model='settings.skyEnabled' data-testid='setting-sky')
      | {{ t('settings.sky_bg') }}
    button.mt-4.text-sm.text-rose-300.text-left(
      class='hover:text-rose-200'
      @click='reset'
      data-testid='btn-reset'
    ) {{ t('settings.reset') }}
    BackupPanel
</template>
