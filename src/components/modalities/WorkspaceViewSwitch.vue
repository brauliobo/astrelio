<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  active: { type: String, default: 'chart' },
  lens:   { type: String, default: '' },
})

const { t } = useI18n()

const activeLens = computed(() => props.lens || 'astrology')
const mapView    = id => ({ name: 'map', params: { lens: activeLens.value, view: id } })
const views = computed(() => [
  { id: 'chart',   to: mapView('chart') },
  { id: 'reading', to: mapView('reading') },
  { id: 'data',    to: mapView('data') },
  { id: 'report',  to: { name: 'report', query: { modality: activeLens.value } } },
].map(view => ({ ...view, label: t(`map.views.${view.id}`) })))
</script>

<template lang="pug">
nav.workspace-view-switch(:aria-label='t("map.view_switch_aria")' data-testid='workspace-view-switch')
  RouterLink.workspace-view-switch__item(
    v-for='view in views'
    :key='view.id'
    :to='view.to'
    :class='{ active: view.id === active }'
    :aria-current='view.id === active ? "page" : null'
    :data-testid='`workspace-view-${view.id}`'
  ) {{ view.label }}
</template>

<style scoped>
.workspace-view-switch {
  display: inline-flex;
  gap: 0.125rem;
  padding: 0.125rem;
  border: 1px solid var(--modality-active-ring);
  border-radius: 0.5rem;
}

.workspace-view-switch__item {
  border-radius: 0.375rem;
  color: var(--modality-text);
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.25rem 0.5rem;
  text-decoration: none;
}

.workspace-view-switch__item:hover,
.workspace-view-switch__item:focus-visible {
  background: var(--modality-bg-hover);
  color: var(--modality-text-hover);
  outline: none;
}

.workspace-view-switch__item.active {
  background: var(--modality-active-bg);
  color: var(--modality-active-text);
}
</style>
