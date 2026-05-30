<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { annualProfection } from '../lib/astro/profections.js'

const { t, tm } = useI18n()
const people = usePeopleStore()
const session = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const natal = useNatalChart(person, settings)

const dateMs = ref(Date.now())
const dateInput = computed({
  get: () => new Date(dateMs.value).toISOString().slice(0, 10),
  set: (v) => { dateMs.value = DateTime.fromISO(v).toMillis() },
})

const profection = computed(() => {
  if (!person.value || !natal.value) return null
  return annualProfection(natal.value.ascendant, person.value.isoLocal, dateInput.value)
})

const signs = computed(() => tm('zodiac.signs'))
const signLabel = computed(() => profection.value ? signs.value[profection.value.sign] : '')
const lordLabel = computed(() => profection.value ? t(`planets.${profection.value.lord}`) : '')
</script>

<template lang="pug">
section.profections-page(data-testid='profections-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div(v-else)
    .flex.flex-wrap.items-center.gap-3.mb-4
      label.text-xs.text-slate-400 {{ t('techniques.profections.date') }}
      input.ui-control.ui-control-sm(
        type='date'
        v-model='dateInput'
        data-testid='profection-date'
      )
      button.text-xs.text-amber-300(
        class='hover:text-amber-200'
        @click='dateInput = new Date().toISOString().slice(0,10)'
        data-testid='btn-today'
      ) {{ t('common.today') }}

    .ui-panel(v-if='profection' data-testid='profection-summary')
      h1.text-xl.font-semibold.text-slate-100.mb-1 {{ t('techniques.profections.title') }}
      p.text-sm.text-slate-400.mb-5 {{ t('techniques.profections.subtitle', { name: person.name }) }}
      .grid.gap-3(class='sm:grid-cols-2 lg:grid-cols-4')
        .rounded.border.p-3(class='border-white/10 bg-white/5')
          .text-xs.uppercase.tracking-wide.text-slate-500 {{ t('techniques.profections.age') }}
          .mt-1.text-2xl.font-semibold.text-slate-100(data-testid='profection-age') {{ profection.age }}
        .rounded.border.p-3(class='border-white/10 bg-white/5')
          .text-xs.uppercase.tracking-wide.text-slate-500 {{ t('techniques.profections.house') }}
          .mt-1.text-2xl.font-semibold.text-slate-100(data-testid='profection-house') {{ profection.profectedHouse }}
        .rounded.border.p-3(class='border-white/10 bg-white/5')
          .text-xs.uppercase.tracking-wide.text-slate-500 {{ t('techniques.profections.sign') }}
          .mt-1.text-lg.font-semibold.text-slate-100(data-testid='profection-sign') {{ signLabel }}
        .rounded.border.p-3(class='border-white/10 bg-white/5')
          .text-xs.uppercase.tracking-wide.text-slate-500 {{ t('techniques.profections.lord') }}
          .mt-1.text-lg.font-semibold.text-slate-100(data-testid='profection-lord') {{ lordLabel }}
      p.mt-4.text-xs.text-slate-400(data-testid='profection-cycle')
        | {{ t('techniques.profections.cycle', { cycle: profection.cycle }) }}
</template>
