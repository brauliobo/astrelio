<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CitySearch from './CitySearch.vue'
import { ianaOffsetMinutes } from '../../lib/astro/timezones.js'

const props = defineProps({ initial: { type: Object, default: null } })
const emit  = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const name    = ref(props.initial?.name     || '')
const date    = ref(props.initial?.isoLocal?.slice(0, 10) || '')
const time    = ref(props.initial?.isoLocal?.slice(11, 16) || '12:00')
const city    = ref(props.initial ? {
  name: props.initial.placeLabel,
  lat: props.initial.lat,
  lon: props.initial.lon,
  tz: props.initial.tzOffsetMinutes,
  ianaZone: props.initial.ianaZone,
} : null)

const valid = ref(false)

watch([name, date, time, city], () => {
  valid.value = !!(name.value && date.value && time.value && city.value)
})

const submit = () => {
  if (!valid.value) return
  const isoLocal = `${date.value}T${time.value}`
  const tzOffsetMinutes = city.value.ianaZone
    ? ianaOffsetMinutes(isoLocal, city.value.ianaZone)
    : city.value.tz

  emit('submit', {
    name:            name.value,
    isoLocal,
    placeLabel:      city.value.name,
    lat:             city.value.lat,
    lon:             city.value.lon,
    ianaZone:        city.value.ianaZone,
    tzOffsetMinutes,
  })
}
</script>

<template lang="pug">
form.natal-form.grid.gap-3(@submit.prevent='submit' data-testid='natal-form')
  div
    label.block.text-xs.text-slate-400.mb-1 {{ t('form.name') }}
    input.w-full.bg-slate-900.border.rounded.px-3.py-2.text-slate-100.outline-none(
      class='border-white/10 focus:border-amber-300'
      type='text' v-model='name' data-testid='input-name'
    )
  .grid.grid-cols-2.gap-3
    div
      label.block.text-xs.text-slate-400.mb-1 {{ t('form.date') }}
      input.w-full.bg-slate-900.border.rounded.px-3.py-2.text-slate-100.outline-none(
        class='border-white/10 focus:border-amber-300'
        type='date' v-model='date' data-testid='input-date'
      )
    div
      label.block.text-xs.text-slate-400.mb-1 {{ t('form.time') }}
      input.w-full.bg-slate-900.border.rounded.px-3.py-2.text-slate-100.outline-none(
        class='border-white/10 focus:border-amber-300'
        type='time' v-model='time' data-testid='input-time'
      )
  CitySearch(v-model='city')
  .flex.justify-end.gap-2.pt-2
    button.px-3.py-2.rounded.text-sm.text-slate-300(
      type='button'
      class='hover:text-white'
      @click='emit("cancel")'
      data-testid='btn-cancel'
    ) {{ t('form.cancel') }}
    button.px-4.py-2.rounded.text-sm.font-medium.bg-amber-300.text-slate-900.disabled-50(
      class='hover:bg-amber-200 disabled:opacity-50'
      type='submit'
      :disabled='!valid'
      data-testid='btn-submit'
    ) {{ t('form.calculate') }}
</template>
