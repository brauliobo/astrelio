<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchCities } from '../../lib/geo/cities.js'

const props   = defineProps({ modelValue: { type: Object, default: null } })
const emit    = defineEmits(['update:modelValue'])
const { t }   = useI18n()
const query   = ref(props.modelValue?.name || '')
const open    = ref(false)
const loading = ref(false)
const results = ref([])
let requestId = 0

const refresh = async () => {
  const id = ++requestId
  loading.value = true
  try {
    const next = await searchCities(query.value)
    if (id === requestId) results.value = next
  } finally {
    if (id === requestId) loading.value = false
  }
}

const select = (c) => {
  query.value = c.name
  open.value  = false
  emit('update:modelValue', c)
}

const onInput = (e) => {
  query.value = e.target.value
  open.value  = true
  if (props.modelValue) emit('update:modelValue', null)
  refresh()
}

const onFocus = () => {
  open.value = true
  refresh()
}
</script>

<template lang="pug">
.city-search.relative
  label.block.text-xs.text-slate-400.mb-1 {{ t('form.place') }}
  input.w-full.bg-slate-900.border.rounded.px-3.py-2.text-slate-100.outline-none.focus-amber(
    class='border-white/10'
    type='text'
    :placeholder='t("form.search_place")'
    :value='query'
    @input='onInput'
    @focus='onFocus'
    data-testid='city-input'
  )
  ul.absolute.left-0.right-0.mt-1.bg-slate-900.border.rounded.shadow-xl.z-30.max-h-72.overflow-y-auto(
    class='border-white/10'
    v-if='open && (loading || results.length || query.length >= 2)'
    data-testid='city-list'
  )
    li.px-3.py-2.text-sm.text-slate-400(v-if='loading') {{ t('common.loading') }}
    li.px-3.py-2.text-sm.text-slate-400(v-else-if='!results.length') {{ t('form.no_cities') }}
    template(v-else)
      li.px-3.py-2.text-sm.cursor-pointer(
        class='hover:bg-white/5'
        v-for='c in results'
        :key='c.name'
        @mousedown.prevent='select(c)'
        :data-testid='`city-${c.name}`'
      ) {{ c.name }}
</template>

<style scoped>
.focus-amber:focus { border-color: rgb(252 211 77); }
</style>
