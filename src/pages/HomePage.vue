<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'

const { t }   = useI18n()
const router  = useRouter()
const people  = usePeopleStore()
const session = useSessionStore()
const showForm = ref(false)
const dismissedEmptyForm = ref(false)
const formMode = ref('new')
const formPerson = ref(null)
const confirmingDeleteId = ref(null)
const deleted = ref(null)
const NatalForm = defineAsyncComponent(() => import('../components/form/NatalForm.vue'))
let undoTimer = null

const list = computed(() => people.sorted)
const activeId = computed(() => {
  if (session.activePersonId && people.byId(session.activePersonId)) return session.activePersonId
  return list.value[0]?.id || null
})
const formVisible = computed(() => showForm.value || (!list.value.length && !dismissedEmptyForm.value))
const formInitial = computed(() => formPerson.value)
const formKey = computed(() => `${formMode.value}-${formPerson.value?.id || 'blank'}-${formPerson.value?.name || ''}`)
const formTitle = computed(() => {
  if (formMode.value === 'edit') return t('home.edit_title')
  if (formMode.value === 'duplicate') return t('home.duplicate_title')
  return list.value.length ? t('home.new_title') : t('home.empty_title')
})
const formDescription = computed(() => list.value.length ? '' : t('home.empty_description'))
const formSubmitLabel = computed(() => {
  if (formMode.value === 'edit') return t('form.save')
  if (formMode.value === 'duplicate') return t('home.duplicate_submit')
  return t('form.calculate')
})

const onSubmit = (data) => {
  if (formMode.value === 'edit' && formPerson.value) {
    people.update(formPerson.value.id, data)
    session.setActive(formPerson.value.id)
    closeForm()
    return
  }

  const rec = people.add(data)
  session.setActive(rec.id)
  closeForm()
  router.push('/natal')
}

const open = (id) => {
  session.setActive(id)
  router.push({ name: 'person', params: { id } })
}

const clearUndo = () => {
  if (undoTimer) clearTimeout(undoTimer)
  undoTimer = null
}

const openNew = () => {
  formMode.value = 'new'
  formPerson.value = null
  dismissedEmptyForm.value = false
  showForm.value = true
}

const edit = (person) => {
  formMode.value = 'edit'
  formPerson.value = { ...person }
  showForm.value = true
  dismissedEmptyForm.value = false
}

const duplicate = (person) => {
  formMode.value = 'duplicate'
  formPerson.value = { ...person, id: null, name: t('home.copy_name', { name: person.name }) }
  showForm.value = true
  dismissedEmptyForm.value = false
}

const closeForm = () => {
  showForm.value = false
  formMode.value = 'new'
  formPerson.value = null
  if (!list.value.length) dismissedEmptyForm.value = true
}

const remove = (id) => {
  if (confirmingDeleteId.value !== id) {
    confirmingDeleteId.value = id
    return
  }

  const person = people.byId(id)
  if (!person) return
  clearUndo()
  deleted.value = { person: { ...person }, wasActive: activeId.value === id }
  people.remove(id)
  confirmingDeleteId.value = null

  if (session.activePersonId === id) {
    session.setActive(list.value[0]?.id || null)
  }

  undoTimer = setTimeout(() => {
    deleted.value = null
    undoTimer = null
  }, 8000)
}

const undoDelete = () => {
  if (!deleted.value) return
  clearUndo()
  if (!people.byId(deleted.value.person.id)) {
    people.list.push({ ...deleted.value.person })
  }
  if (deleted.value.wasActive) session.setActive(deleted.value.person.id)
  deleted.value = null
}

onBeforeUnmount(clearUndo)
</script>

<template lang="pug">
section.home(data-testid='home-page')
  .flex.items-baseline.justify-between.mb-4
    h1.text-2xl.font-semibold.text-slate-100 {{ t('home.heading') }}
    button.ui-action-primary.text-sm.px-3.py-2(
      @click='formVisible && list.length ? closeForm() : openNew()'
      data-testid='btn-new'
    ) {{ formVisible && list.length ? t('form.cancel') : t('home.new') }}
  .ui-panel.mb-6(v-if='formVisible' data-testid='home-form-panel')
    .mb-4
      h2.text-lg.font-semibold.text-slate-100(data-testid='home-form-title') {{ formTitle }}
      p.text-sm.text-slate-400.mt-1(v-if='formDescription' data-testid='home-empty') {{ formDescription }}
    NatalForm(
      :key='formKey'
      :initial='formInitial'
      :submit-label='formSubmitLabel'
      @submit='onSubmit'
      @cancel='closeForm'
    )
  .ui-panel.text-sm.text-slate-400(v-if='!list.length && !formVisible' data-testid='home-empty')
    p {{ t('home.empty') }}
    button.mt-3.text-amber-300(class='hover:text-amber-200' @click='openNew' data-testid='btn-empty-start') {{ t('home.empty_action') }}
  ul.grid.gap-3(v-if='list.length')
    li.ui-panel.flex.flex-col.gap-3(
      :class='p.id === activeId ? "border-amber-300/70 bg-amber-300/10" : ""'
      v-for='p in list'
      :key='p.id'
      :data-testid='`person-${p.id}`'
    )
      .flex.items-start.justify-between.gap-3
        div
          .flex.items-center.gap-2
            .text-slate-100.font-medium(:data-testid='`person-name-${p.id}`') {{ p.name }}
            span.rounded-full.px-2.text-xs.font-medium.bg-amber-300.text-slate-950(
              class='py-0.5'
              v-if='p.id === activeId'
              :data-testid='`active-${p.id}`'
            ) {{ t('home.active') }}
        .text-xs.text-slate-400 {{ p.isoLocal }} · {{ p.placeLabel }}
      .flex.flex-wrap.gap-3
        button.text-sm.text-amber-300(
          class='hover:text-amber-200'
          @click='open(p.id)'
          :data-testid='`open-${p.id}`'
        ) {{ t('home.open') }}
        button.text-sm.text-slate-300(
          class='hover:text-white'
          @click='edit(p)'
          :data-testid='`edit-${p.id}`'
        ) {{ t('home.edit') }}
        button.text-sm.text-slate-300(
          class='hover:text-white'
          @click='duplicate(p)'
          :data-testid='`duplicate-${p.id}`'
        ) {{ t('home.duplicate') }}
        button.text-sm.text-slate-400(
          class='hover:text-rose-300'
          @click='remove(p.id)'
          :data-testid='`delete-${p.id}`'
        ) {{ confirmingDeleteId === p.id ? t('home.confirm_delete') : t('home.delete') }}
  .fixed.left-4.right-4.bottom-16.z-40.mx-auto.max-w-xl.rounded.border.p-3.flex.items-center.justify-between.gap-3(
    class='border-white/10 bg-slate-950 text-slate-100 shadow-xl'
    v-if='deleted'
    data-testid='delete-undo'
  )
    span.text-sm {{ t('home.deleted', { name: deleted.person.name }) }}
    button.text-sm.text-amber-300(class='hover:text-amber-200' @click='undoDelete' data-testid='undo-delete') {{ t('home.undo') }}
</template>
