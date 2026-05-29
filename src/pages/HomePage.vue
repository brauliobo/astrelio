<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import NatalForm from '../components/form/NatalForm.vue'

const { t }   = useI18n()
const router  = useRouter()
const people  = usePeopleStore()
const session = useSessionStore()
const showForm = ref(false)

const list = computed(() => people.sorted)

const onSubmit = (data) => {
  const rec = people.add(data)
  session.setActive(rec.id)
  showForm.value = false
  router.push('/natal')
}

const open = (id) => {
  session.setActive(id)
  router.push('/natal')
}
</script>

<template lang="pug">
section.home(data-testid='home-page')
  .flex.items-baseline.justify-between.mb-4
    h1.text-2xl.font-semibold.text-slate-100 {{ t('home.heading') }}
    button.text-sm.px-3.py-2.rounded.bg-amber-300.text-slate-900.font-medium(
      class='hover:bg-amber-200'
      @click='showForm = !showForm'
      data-testid='btn-new'
    ) {{ t('home.new') }}
  .border.rounded-xl.p-4.mb-6(class='border-white/10 bg-night/40' v-if='showForm')
    NatalForm(@submit='onSubmit' @cancel='showForm = false')
  p.text-slate-400.text-sm(v-if='!list.length' data-testid='home-empty') {{ t('home.empty') }}
  ul.grid.gap-3(v-else)
    li.border.rounded-xl.p-4.flex.items-center.justify-between(
      class='border-white/10 bg-night/40'
      v-for='p in list'
      :key='p.id'
      :data-testid='`person-${p.id}`'
    )
      div
        .text-slate-100.font-medium(:data-testid='`person-name-${p.id}`') {{ p.name }}
        .text-xs.text-slate-400 {{ p.isoLocal }} · {{ p.placeLabel }}
      .flex.gap-2
        button.text-sm.text-amber-300(
          class='hover:text-amber-200'
          @click='open(p.id)'
          :data-testid='`open-${p.id}`'
        ) {{ t('home.open') }}
        button.text-sm.text-slate-400(
          class='hover:text-rose-300'
          @click='people.remove(p.id)'
          :data-testid='`delete-${p.id}`'
        ) {{ t('home.delete') }}
</template>
