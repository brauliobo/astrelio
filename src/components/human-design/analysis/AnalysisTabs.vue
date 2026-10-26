<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CentersView from './CentersView.vue'
import ChannelsView from './ChannelsView.vue'
import CyclesView from './CyclesView.vue'
import GatesView from './GatesView.vue'
import ProfileCrossVariablesView from './ProfileCrossVariablesView.vue'
import SensitivityView from './SensitivityView.vue'

const props = defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
  now:    { type: Number, default: () => Date.now() },
})

const emit = defineEmits(['select'])

const TABS = [
  { id: 'centers',     view: CentersView,               focus: 'center' },
  { id: 'channels',    view: ChannelsView,              focus: 'channel' },
  { id: 'gates',       view: GatesView,                 focus: 'gate' },
  { id: 'profile',     view: ProfileCrossVariablesView, now: true },
  { id: 'cycles',      view: CyclesView,                now: true },
  { id: 'sensitivity', view: SensitivityView },
]

const { t }     = useI18n()
const uid       = useId()
const tabFor    = pinned => pinned && TABS.find(tab => tab.focus === pinned.type)?.id
const active    = ref(tabFor(props.pinned) ?? TABS[0].id)
const list      = ref(null)
const current   = computed(() => TABS.find(tab => tab.id === active.value))
const viewProps = computed(() => ({ chart: props.chart, pinned: props.pinned, ...(current.value.now && { now: props.now }) }))
const tabId     = id => `${uid}-tab-${id}`
let origin      = null

const show = async (id) => {
  active.value = id
  await nextTick()
  list.value.querySelector(`#${tabId(id)}`).scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
}

const move = (event) => {
  const here   = TABS.findIndex(tab => tab.id === active.value)
  const target = { ArrowRight: here + 1, ArrowLeft: here - 1, Home: 0, End: TABS.length - 1 }[event.key]
  if (target === undefined) return
  event.preventDefault()
  const next = TABS[(target + TABS.length) % TABS.length].id
  show(next).then(() => list.value.querySelector(`#${tabId(next)}`).focus())
}

const forward = (selection) => {
  origin = selection
  emit('select', selection)
}

// A pin made inside a view keeps the user on that view; one made elsewhere (the bodygraph) opens the view that explains it.
watch(() => props.pinned, (pinned) => {
  const fromView = origin && pinned && origin.type === pinned.type && String(origin.value) === String(pinned.value)
  origin = null
  if (!fromView && tabFor(pinned)) show(tabFor(pinned))
})
</script>

<template lang="pug">
.hda(data-testid='human-design-analysis')
  .hda-tabs(ref='list' role='tablist' :aria-label='t("human_design.ui.analysis.tablist")' @keydown='move')
    button.hda-tab(
      v-for='tab in TABS'
      :id='tabId(tab.id)'
      :key='tab.id'
      type='button'
      role='tab'
      :aria-selected='active === tab.id'
      :aria-controls='`${uid}-panel`'
      :tabindex='active === tab.id ? 0 : -1'
      :data-testid='`analysis-tab-${tab.id}`'
      @click='show(tab.id)'
    ) {{ t(`human_design.ui.analysis.tabs.${tab.id}`) }}
  div(:id='`${uid}-panel`' role='tabpanel' :aria-labelledby='tabId(active)' tabindex='-1')
    component(:is='current.view' v-bind='viewProps' @select='forward')
</template>

<style src="./analysis.css"></style>
