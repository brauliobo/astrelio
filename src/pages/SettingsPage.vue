<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SETTING_PRESET_KEYS, useSettingsStore } from '../stores/settings.js'
import { usePeopleStore } from '../stores/people.js'
import BackupPanel from '../components/export/BackupPanel.vue'

const { t, locale } = useI18n()
const settings = useSettingsStore()
const people   = usePeopleStore()

const onLocale = (e) => {
  settings.setLocale(e.target.value)
  locale.value = settings.locale
}

const houses     = ['placidus', 'koch', 'porphyry', 'regiomontanus', 'equal', 'whole_sign']
const nodeModes  = ['mean', 'true']
const aspectSets = ['all', 'major']
const orbScales  = [
  { value: 0.75, key: 'tight' },
  { value: 1, key: 'standard' },
  { value: 1.25, key: 'wide' },
]

const labels = {
  en: {
    preset:        'Preset',
    custom:        'Custom',
    simple:        'Simple',
    traditional:   'Traditional',
    modern:        'Modern',
    technical:     'Technical',
    print:         'Print',
    advanced:      'Advanced settings',
    backup:        'Backup and reset',
    open:          'Open',
    glyphRenderer: 'Planet glyphs',
    glyphSvg:      'SVG symbols',
    glyphUtf8:     'Unicode symbols',
    glyphText:     'Text labels',
  },
  pt: {
    preset:        'Predefinição',
    custom:        'Personalizado',
    simple:        'Simples',
    traditional:   'Tradicional',
    modern:        'Moderno',
    technical:     'Técnico',
    print:         'Impressão',
    advanced:      'Configurações avançadas',
    backup:        'Backup e redefinição',
    open:          'Abrir',
    glyphRenderer: 'Símbolos planetários',
    glyphSvg:      'Símbolos SVG',
    glyphUtf8:     'Símbolos Unicode',
    glyphText:     'Rótulos de texto',
  },
}

const copy = computed(() => labels[locale.value === 'pt-BR' ? 'pt' : 'en'])

const onPreset = (e) => {
  settings.applyPreset(e.target.value)
}

const reset = () => {
  if (confirm(t('settings.reset') + '?')) {
    people.clear()
    settings.reset()
    locale.value = 'pt-BR'
  }
}
</script>

<template lang="pug">
section.settings.max-w-lg(data-testid='settings-page')
  h1.text-xl.font-semibold.text-slate-100.mb-4 {{ t('settings.title') }}
  .grid.gap-4
    .grid.gap-4.rounded-xl.border.p-4(class='border-white/10 bg-night/40')
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
        label.block.text-xs.text-slate-400.mb-1 {{ copy.preset }}
        select.ui-control.ui-control-md.w-full(
          :value='settings.activePreset'
          @change='onPreset'
          data-testid='setting-preset'
        )
          option(value='custom' disabled) {{ copy.custom }}
          option(v-for='preset in SETTING_PRESET_KEYS' :key='preset' :value='preset') {{ copy[preset] }}
    details.rounded-xl.border.p-4(class='border-white/10 bg-night/40')
      summary.flex.cursor-pointer.items-center.justify-between.gap-3.text-sm.font-semibold.text-slate-100(
        data-testid='settings-advanced-summary'
      )
        span {{ copy.advanced }}
        span.text-xs.font-normal.text-slate-500 {{ copy.open }}
      .mt-4.grid.gap-4
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
        div
          label.block.text-xs.text-slate-400.mb-1 {{ t('settings.node_mode') }}
          select.ui-control.ui-control-md.w-full(
            v-model='settings.nodeMode'
            data-testid='setting-node-mode'
          )
            option(v-for='mode in nodeModes' :key='mode' :value='mode') {{ t(`settings.node_modes.${mode}`) }}
        div
          label.block.text-xs.text-slate-400.mb-1 {{ copy.glyphRenderer }}
          select.ui-control.ui-control-md.w-full(
            v-model='settings.planetGlyphRenderer'
            data-testid='setting-planet-glyph-renderer'
          )
            option(value='svg') {{ copy.glyphSvg }}
            option(value='utf8') {{ copy.glyphUtf8 }}
            option(value='text') {{ copy.glyphText }}
        .grid.gap-3
          h2.text-sm.font-semibold.text-slate-100 {{ t('settings.aspect_options') }}
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
    details.rounded-xl.border.p-4(class='border-white/10 bg-night/40')
      summary.flex.cursor-pointer.items-center.justify-between.gap-3.text-sm.font-semibold.text-slate-100(
        data-testid='settings-backup-summary'
      )
        span {{ copy.backup }}
        span.text-xs.font-normal.text-slate-500 {{ copy.open }}
      .mt-4.grid.gap-4
        BackupPanel
        button.text-sm.text-rose-300.text-left(
          class='hover:text-rose-200'
          @click='reset'
          data-testid='btn-reset'
        ) {{ t('settings.reset') }}
</template>
