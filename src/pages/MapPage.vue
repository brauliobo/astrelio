<script setup>
import { computed, defineAsyncComponent, provide } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'
import WorkspaceViewSwitch from '../components/modalities/WorkspaceViewSwitch.vue'

const route = useRoute()
const { t } = useI18n()

provide('mapWorkspaceShell', true)

const lensAliases = {
  astrology:      'astrology',
  natal:          'astrology',
  tropical:       'astrology',
  vedic:          'vedic',
  sidereal:       'vedic',
  'human-design': 'humanDesign',
  humandesign:    'humanDesign',
  hd:             'humanDesign',
}

const lensComponents = {
  astrology:   defineAsyncComponent(() => import('./NatalPage.vue')),
  vedic:       defineAsyncComponent(() => import('./VedicPage.vue')),
  humanDesign: defineAsyncComponent(() => import('./HumanDesignPage.vue')),
}

const canonicalLenses = {
  astrology:   'astrology',
  vedic:       'vedic',
  humanDesign: 'human-design',
}

const workspaceViews = new Set(['chart', 'reading', 'data'])

const activeLens = computed(() => {
  const key = String(route.params.lens || 'astrology').toLowerCase().replace(/_/g, '-')
  return lensAliases[key] || 'astrology'
})

const activeView = computed(() => {
  const view = String(route.params.view || 'chart').toLowerCase()
  return workspaceViews.has(view) ? view : 'chart'
})

const canonicalLens   = computed(() => canonicalLenses[activeLens.value])
const activeComponent = computed(() => lensComponents[activeLens.value] || lensComponents.astrology)
</script>

<template lang="pug">
section.map-page(
  data-testid='map-page'
  :data-map-lens='activeLens'
  :data-workspace-view='activeView'
)
  .map-page__toolbar.flex.flex-wrap.items-center.justify-between.gap-3.mb-4
    .flex.flex-wrap.items-center.gap-2
      ModalityRouteSwitch(:active='activeLens' :view='activeView' workspace-owner)
      WorkspaceViewSwitch(:active='activeView' :lens='canonicalLens')
    RouterLink.rounded.px-3.py-2.text-sm.text-slate-300(
      :to='{ name: "report", query: { modality: canonicalLens } }'
      class='bg-white/5 hover:bg-white/10 hover:text-white'
      data-testid='map-report-action'
    ) {{ t('report.open') }}
  component.map-page__content(
    :is='activeComponent'
    workspace
    :workspace-view='activeView'
  )
</template>
