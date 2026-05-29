<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchCities } from '../../lib/geo/cities.js'

const props   = defineProps({ modelValue: { type: Object, default: null } })
const emit    = defineEmits(['update:modelValue'])
const { t }   = useI18n()
const query   = ref(props.modelValue?.name || '')
const open    = ref(false)
const loading = ref(false)
const results = ref([])
const activeIndex = ref(-1)
const blurred = ref(false)
const minQuery = 2
const debounceMs = 250
const listId = `city-list-${Math.random().toString(36).slice(2)}`
let requestId = 0
let debounceTimer = null
let blurTimer = null

const trimmedQuery = computed(() => query.value.trim())
const selectedCity = computed(() => props.modelValue)
const tooShort = computed(() => trimmedQuery.value.length > 0 && trimmedQuery.value.length < minQuery)
const invalid = computed(() => blurred.value && !!trimmedQuery.value && !props.modelValue)
const listOpen = computed(() => open.value && (loading.value || tooShort.value || results.value.length || trimmedQuery.value.length >= minQuery))
const activeOptionId = computed(() => activeIndex.value >= 0 ? `${listId}-option-${activeIndex.value}` : null)

const clearDebounce = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = null
}

const clearBlur = () => {
  if (blurTimer) clearTimeout(blurTimer)
  blurTimer = null
}

const refresh = async (value = trimmedQuery.value) => {
  if (value.length < minQuery) {
    results.value = []
    activeIndex.value = -1
    loading.value = false
    return
  }

  const id = ++requestId
  loading.value = true
  try {
    const next = await searchCities(value)
    if (id === requestId) {
      results.value = next
      activeIndex.value = next.length ? 0 : -1
    }
  } finally {
    if (id === requestId) loading.value = false
  }
}

const scheduleRefresh = (immediate = false) => {
  clearDebounce()
  if (trimmedQuery.value.length < minQuery) {
    results.value = []
    activeIndex.value = -1
    loading.value = false
    return
  }
  if (immediate) {
    refresh()
    return
  }
  debounceTimer = setTimeout(() => refresh(), debounceMs)
}

const select = (c) => {
  query.value = c.name
  open.value  = false
  blurred.value = false
  activeIndex.value = -1
  emit('update:modelValue', c)
}

const onInput = (e) => {
  query.value = e.target.value
  open.value  = true
  blurred.value = false
  if (props.modelValue) emit('update:modelValue', null)
  scheduleRefresh()
}

const onFocus = () => {
  clearBlur()
  blurred.value = false
  open.value = true
  if (!props.modelValue) scheduleRefresh(true)
}

const onBlur = () => {
  clearBlur()
  blurTimer = setTimeout(() => {
    open.value = false
    blurred.value = true
  }, 120)
}

const moveActive = (step) => {
  if (!results.value.length) return
  open.value = true
  activeIndex.value = (activeIndex.value + step + results.value.length) % results.value.length
}

const onKeydown = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!open.value) open.value = true
    moveActive(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveActive(-1)
  } else if (e.key === 'Enter' && open.value && activeIndex.value >= 0) {
    e.preventDefault()
    select(results.value[activeIndex.value])
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

watch(() => props.modelValue, (next) => {
  if (next) query.value = next.name
})

onBeforeUnmount(() => {
  clearDebounce()
  clearBlur()
})
</script>

<template lang="pug">
.city-search.relative
  label.block.text-xs.text-slate-400.mb-1 {{ t('form.place') }}
  input.ui-control.ui-control-md.w-full(
    type='text'
    role='combobox'
    autocomplete='off'
    :aria-expanded='listOpen'
    :aria-controls='listId'
    :aria-activedescendant='activeOptionId'
    :aria-invalid='invalid'
    :placeholder='t("form.search_place")'
    :value='query'
    @input='onInput'
    @focus='onFocus'
    @blur='onBlur'
    @keydown='onKeydown'
    data-testid='city-input'
  )
  ul.ui-control.absolute.left-0.right-0.mt-1.shadow-xl.z-30.max-h-72.overflow-y-auto(
    v-if='listOpen'
    :id='listId'
    role='listbox'
    data-testid='city-list'
  )
    li.px-3.py-2.text-sm.text-slate-400(v-if='loading') {{ t('common.loading') }}
    li.px-3.py-2.text-sm.text-slate-400(v-else-if='tooShort' data-testid='city-min-query') {{ t('form.city_min_query', { count: minQuery }) }}
    li.px-3.py-2.text-sm.text-slate-400(v-else-if='!results.length') {{ t('form.no_cities') }}
    template(v-else)
      li.px-3.py-2.text-sm.cursor-pointer(
        :class='i === activeIndex ? "bg-white/10 text-amber-200" : "hover:bg-white/5 text-slate-100"'
        v-for='(c, i) in results'
        :key='c.name'
        :id='`${listId}-option-${i}`'
        role='option'
        :aria-selected='i === activeIndex'
        @mousedown.prevent='select(c)'
        :data-testid='`city-${c.name}`'
      ) {{ c.name }}
  p.mt-2.text-xs.text-rose-300(v-if='invalid' data-testid='city-validation') {{ t('form.city_required') }}
  .mt-2.rounded.border.px-3.py-2.text-xs.text-slate-300(
    class='border-white/10 bg-white/5'
    v-if='selectedCity'
    data-testid='city-selected'
  )
    .font-medium.text-slate-100 {{ selectedCity.name }}
    .mt-1.text-slate-400 {{ t('form.city_detail', { lat: Number(selectedCity.lat).toFixed(2), lon: Number(selectedCity.lon).toFixed(2), zone: selectedCity.ianaZone || selectedCity.tz || 'UTC' }) }}
</template>
