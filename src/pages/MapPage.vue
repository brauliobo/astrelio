<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const lensAliases = {
  astrology:      'astrology',
  natal:          'astrology',
  tropical:       'astrology',
  vedic:          'vedic',
  sidereal:       'vedic',
  'human-design': 'humanDesign',
  humandesign:    'humanDesign',
  hd:             'humanDesign',
  report:         'report',
}

const lensComponents = {
  astrology:   defineAsyncComponent(() => import('./NatalPage.vue')),
  vedic:       defineAsyncComponent(() => import('./VedicPage.vue')),
  humanDesign: defineAsyncComponent(() => import('./HumanDesignPage.vue')),
  report:      defineAsyncComponent(() => import('./ReportPage.vue')),
}

const activeLens = computed(() => {
  const key = String(route.params.lens || 'astrology').toLowerCase().replace(/_/g, '-')
  return lensAliases[key] || 'astrology'
})

const activeComponent = computed(() => lensComponents[activeLens.value] || lensComponents.astrology)
</script>

<template lang="pug">
section.map-page(data-testid='map-page' :data-map-lens='activeLens')
  component(:is='activeComponent')
</template>
