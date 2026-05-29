<script setup>
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settings.js'
import { usePeopleStore } from '../stores/people.js'

const { t, locale } = useI18n()
const settings = useSettingsStore()
const people   = usePeopleStore()

const onLocale = (e) => {
  settings.setLocale(e.target.value)
  locale.value = e.target.value
}

const houses = ['placidus', 'koch', 'porphyry', 'regiomontanus', 'equal', 'whole_sign']

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
    label.flex.items-center.gap-2.text-sm.text-slate-300
      input(type='checkbox' v-model='settings.skyEnabled' data-testid='setting-sky')
      | {{ t('settings.sky_bg') }}
    button.mt-4.text-sm.text-rose-300.text-left(
      class='hover:text-rose-200'
      @click='reset'
      data-testid='btn-reset'
    ) {{ t('settings.reset') }}
</template>
