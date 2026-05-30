<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CitySearch from './CitySearch.vue'
import { ianaOffsetMinutes } from '../../lib/astro/timezones.js'

const props = defineProps({
  initial:     { type: Object, default: null },
  submitLabel: { type: String, default: '' },
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const name = ref(props.initial?.name     || '')
const date = ref(props.initial?.isoLocal?.slice(0, 10) || '')
const time = ref(props.initial?.isoLocal?.slice(11, 16) || '12:00')
const city = ref(props.initial ? {
  name:     props.initial.placeLabel,
  lat:      props.initial.lat,
  lon:      props.initial.lon,
  tz:       props.initial.tzOffsetMinutes,
  ianaZone: props.initial.ianaZone,
} : null)

const attempted     = ref(false)
const valid         = computed(() => !!(name.value.trim() && date.value && time.value && city.value))
const missingFields = computed(() => attempted.value && !valid.value)
const buttonLabel   = computed(() => props.submitLabel || t('form.calculate'))

const submit = () => {
  attempted.value = true
  if (!valid.value) return
  const isoLocal        = `${date.value}T${time.value}`
  const tzOffsetMinutes = city.value.ianaZone
    ? ianaOffsetMinutes(isoLocal, city.value.ianaZone)
    : city.value.tz

  emit('submit', {
    name:            name.value.trim(),
    isoLocal,
    placeLabel: city.value.name,
    lat:        city.value.lat,
    lon:        city.value.lon,
    ianaZone:   city.value.ianaZone,
    tzOffsetMinutes,
  })
}
</script>

<template lang="pug">
form.natal-form.grid.gap-3(@submit.prevent='submit' data-testid='natal-form')
  div
    label.block.text-xs.text-slate-400.mb-1 {{ t('form.name') }}
    input.ui-control.ui-control-md.w-full(
      type='text' v-model='name' required data-testid='input-name'
    )
  .grid.grid-cols-2.gap-3
    div
      label.block.text-xs.text-slate-400.mb-1 {{ t('form.date') }}
      input.ui-control.ui-control-md.w-full(
        type='date' v-model='date' required data-testid='input-date'
      )
    div
      label.block.text-xs.text-slate-400.mb-1 {{ t('form.time') }}
      input.ui-control.ui-control-md.w-full(
        type='time' v-model='time' required data-testid='input-time'
      )
  CitySearch(v-model='city')
  p.text-xs.text-rose-300(v-if='missingFields' data-testid='form-validation') {{ t('form.complete_required') }}
  .flex.justify-end.gap-2.pt-2
    button.px-3.py-2.rounded.text-sm.text-slate-300(
      type='button'
      class='hover:text-white'
      @click='emit("cancel")'
      data-testid='btn-cancel'
    ) {{ t('form.cancel') }}
    button.ui-action-primary.px-4.py-2.text-sm.disabled-50(
      class='disabled:opacity-50'
      type='submit'
      :disabled='!valid'
      data-testid='btn-submit'
    ) {{ buttonLabel }}
</template>
