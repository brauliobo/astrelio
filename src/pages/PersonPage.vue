<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue'
import { DateTime } from 'luxon'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { localToUtcMs, offsetMinutesForPerson, timezoneLabelForPerson } from '../lib/astro/timezones.js'
import { birthHeaderForPerson } from '../lib/people/labels.js'
import { natalRouteForPerson } from '../lib/people/routeQuery.js'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'

const route  = useRoute()
const router = useRouter()
const { t } = useI18n()
const people    = usePeopleStore()
const session   = useSessionStore()
const NatalForm = defineAsyncComponent(() => import('../components/form/NatalForm.vue'))

const editing          = ref(false)
const confirmingDelete = ref(false)

const personId = computed(() => String(route.params.id || ''))
const person   = computed(() => people.byId(personId.value) || null)

const timezoneOffset = computed(() => person.value ? offsetMinutesForPerson(person.value) : 0)
const timezoneLabel  = computed(() => timezoneLabelForPerson(person.value))
const birthHeader    = computed(() => birthHeaderForPerson(person.value))
const localTime      = computed(() => {
  if (!person.value) return ''
  const dt = DateTime.fromISO(person.value.isoLocal)
  return dt.isValid ? dt.toFormat('yyyy-LL-dd HH:mm') : person.value.isoLocal
})
const utcTime = computed(() => {
  if (!person.value) return ''
  return DateTime
    .fromMillis(localToUtcMs(person.value.isoLocal, timezoneOffset.value), { zone: 'utc' })
    .toFormat("yyyy-LL-dd HH:mm 'UTC'")
})
const coordinates = computed(() => {
  if (!person.value) return ''
  return `${Number(person.value.lat).toFixed(4)}, ${Number(person.value.lon).toFixed(4)}`
})
const formKey = computed(() => `person-edit-${person.value?.id || 'missing'}-${person.value?.updatedAt || ''}`)

const auditRows = computed(() => person.value ? [
  { label: t('person.local_time'), value: localTime.value, testId: 'person-local-time' },
  { label: t('person.utc_time'), value: utcTime.value, testId: 'person-utc-time' },
  { label: t('person.timezone'), value: timezoneLabel.value, testId: 'person-timezone' },
  { label: t('person.coordinates'), value: coordinates.value, testId: 'person-coordinates' },
  { label: t('person.source_city'), value: person.value.placeLabel, testId: 'person-source-city' }
] : [])

const activate = () => {
  if (person.value) session.setActive(person.value.id)
}

const save = (data) => {
  if (!person.value) return
  people.update(person.value.id, data)
  session.setActive(person.value.id)
  editing.value = false
}

const duplicate = () => {
  if (!person.value) return
  const copy = people.add({
    ...person.value,
    id:   null,
    name: t('person.copy_name', { name: person.value.name })
  })
  session.setActive(copy.id)
  router.push({ name: 'person', params: { id: copy.id } })
}

const remove = () => {
  if (!person.value) return
  if (!confirmingDelete.value) {
    confirmingDelete.value = true
    return
  }

  const id = person.value.id
  people.remove(id)
  if (session.activePersonId === id) session.setActive(people.sorted[0]?.id || null)
  router.push({ name: 'home' })
}

const openNatal = () => {
  activate()
  router.push(natalRouteForPerson(person.value))
}

const openReport = () => {
  activate()
  router.push({ name: 'report' })
}

const openHumanDesign = () => {
  activate()
  router.push({ name: 'human-design' })
}

watch(person, (next) => {
  editing.value          = false
  confirmingDelete.value = false
  if (next) session.setActive(next.id)
}, { immediate: true })

onBeforeUnmount(() => {
  confirmingDelete.value = false
})
</script>

<template lang="pug">
section.person-page(data-testid='person-page')
  div(v-if='!person' data-testid='person-not-found')
    .ui-panel
      h1.text-xl.font-semibold.text-slate-100 {{ t('person.not_found_title') }}
      p.mt-2.text-sm.text-slate-400 {{ t('person.not_found_description') }}
      RouterLink.inline-flex.mt-4.text-sm.text-amber-300(
        to='/'
        class='hover:text-amber-200'
        data-testid='person-back-home'
      ) {{ t('person.back_home') }}
  div.grid.gap-6(v-else)
    .flex.flex-wrap.items-start.justify-between.gap-3
      div
        h1.text-2xl.font-semibold.text-slate-100(data-testid='person-name') {{ person.name }}
        p.text-xs.text-slate-400.mt-1 {{ birthHeader }}
      .flex.flex-wrap.gap-2
        button.rounded.px-3.py-2.text-sm.text-slate-300(
          type='button'
          class='bg-white/5 hover:bg-white/10 hover:text-white'
          @click='openNatal'
          data-testid='person-open-natal'
        ) {{ t('person.open_natal') }}
        button.rounded.px-3.py-2.text-sm.text-slate-300(
          type='button'
          class='bg-white/5 hover:bg-white/10 hover:text-white'
          @click='openReport'
          data-testid='person-open-report'
        ) {{ t('person.open_report') }}
        button.rounded.px-3.py-2.text-sm.text-slate-300(
          type='button'
          class='bg-white/5 hover:bg-white/10 hover:text-white'
          @click='openHumanDesign'
          data-testid='person-open-human-design'
        ) {{ t('human_design.open') }}
    .grid.gap-6(class='lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]')
      .ui-panel
        .flex.items-center.justify-between.gap-3.mb-4
          h2.text-lg.font-semibold.text-slate-100 {{ editing ? t('person.edit_title') : t('person.birth_data') }}
          button.text-sm.text-amber-300(
            type='button'
            class='hover:text-amber-200'
            @click='editing = !editing'
            data-testid='person-edit-toggle'
          ) {{ editing ? t('form.cancel') : t('person.edit') }}
        NatalForm(
          v-if='editing'
          :key='formKey'
          :initial='person'
          :submit-label='t("form.save")'
          @submit='save'
          @cancel='editing = false'
        )
        dl.grid.gap-3(v-else data-testid='person-audit')
          div.rounded.border.p-3(
            v-for='row in auditRows'
            :key='row.testId'
            class='border-white/10 bg-white/5'
          )
            dt.text-xs.uppercase.tracking-wide.text-slate-500 {{ row.label }}
            dd.mt-1.text-sm.text-slate-100(:data-testid='row.testId') {{ row.value }}
      .ui-panel
        h2.text-lg.font-semibold.text-slate-100 {{ t('person.actions') }}
        p.mt-1.text-sm.text-slate-400 {{ t('person.actions_description') }}
        .mt-4.grid.gap-2
          button.ui-action-primary.px-3.py-2.text-sm(
            type='button'
            @click='duplicate'
            data-testid='person-duplicate'
          ) {{ t('person.duplicate') }}
          button.rounded.border.px-3.py-2.text-sm.text-rose-300(
            type='button'
            class='border-rose-300/30 hover:bg-rose-300/10 hover:text-rose-200'
            @click='remove'
            data-testid='person-delete'
          ) {{ confirmingDelete ? t('person.confirm_delete') : t('person.delete') }}
</template>
