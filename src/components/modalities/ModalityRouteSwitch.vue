<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  active: { type: String, required: true },
  items: { type: Array, default: null },
})

const { t } = useI18n()

const switchItems = computed(() => props.items || [
  { id: 'astrology', label: t('modalities.astrology'), to: '/natal', testId: 'modality-astrology' },
  { id: 'humanDesign', label: t('modalities.human_design'), to: '/human-design', testId: 'modality-human-design' },
])
</script>

<template lang="pug">
nav.modality-switch(:aria-label='t("modalities.switch_aria")' data-testid='modality-switch')
  RouterLink.modality-switch__item(
    v-for='item in switchItems'
    :key='item.id'
    :to='item.to'
    :class='{ active: item.id === active }'
    :aria-current='item.id === active ? "page" : null'
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
