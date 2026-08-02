<script setup>
import { computed, inject } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  active:         { type: String, default: '' },
  view:           { type: String, default: '' },
  workspaceOwner: { type: Boolean, default: false },
})

const { t } = useI18n()
const workspaceShell = inject('mapWorkspaceShell', false)

const activeView = computed(() => props.view || 'chart')
const switchItems = computed(() => [
  { id: 'astrology',   lens: 'astrology',    label: t('modalities.astrology'),    testId: 'modality-astrology' },
  { id: 'vedic',       lens: 'vedic',        label: t('modalities.vedic'),        testId: 'modality-vedic' },
  { id: 'humanDesign', lens: 'human-design', label: t('modalities.human_design'), testId: 'modality-human-design' },
].map(item => ({
  ...item,
  to: { name: 'map', params: { lens: item.lens, view: activeView.value } },
})))
const activeModality = computed(() => props.active || 'astrology')
const visible        = computed(() => props.workspaceOwner || !workspaceShell)
</script>

<template lang="pug">
nav.modality-switch(v-if='visible' :aria-label='t("modalities.switch_aria")' data-testid='modality-switch')
  RouterLink.modality-switch__item(
    v-for='item in switchItems'
    :key='item.id'
    :to='item.to'
    :class='{ active: item.id === activeModality }'
    :aria-current='item.id === activeModality ? "page" : null'
    :data-testid='item.testId'
  ) {{ item.label }}
</template>

<style scoped>
.modality-switch {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.modality-switch__item {
  border-radius: 999px;
  background: var(--modality-bg);
  color: var(--modality-text);
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.375rem 0.625rem;
  text-decoration: none;
  transition: box-shadow 140ms ease;
}

.modality-switch__item:hover,
.modality-switch__item:focus-visible {
  background: var(--modality-bg-hover);
  color: var(--modality-text-hover);
  outline: none;
}

.modality-switch__item.active {
  background: var(--modality-active-bg);
  color: var(--modality-active-text) !important;
  box-shadow: inset 0 0 0 1px var(--modality-active-ring);
}

:global(html[data-theme='light']) .modality-switch__item.active {
  color: var(--app-accent-text) !important;
}
</style>
