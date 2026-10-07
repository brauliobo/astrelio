<script setup>
import { computed, defineAsyncComponent, provide } from 'vue'
import { useRoute } from 'vue-router'
import MapToolbar from '../components/map/MapToolbar.vue'

const route = useRoute()

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

const workspaceViews = new Set(['chart', 'reading', 'data'])

const activeLens = computed(() => {
  const key = String(route.params.lens || 'astrology').toLowerCase().replace(/_/g, '-')
  return lensAliases[key] || 'astrology'
})

const activeView = computed(() => {
  const view = String(route.params.view || 'chart').toLowerCase()
  return workspaceViews.has(view) ? view : 'chart'
})

const activeComponent = computed(() => lensComponents[activeLens.value] || lensComponents.astrology)
</script>

<template lang="pug">
section.map-page(
  data-testid='map-page'
  :data-map-lens='activeLens'
  :data-workspace-view='activeView'
)
  MapToolbar(:lens='activeLens' :view='activeView')
  component.map-page__content(
    :is='activeComponent'
    workspace
    :workspace-view='activeView'
  )
</template>
