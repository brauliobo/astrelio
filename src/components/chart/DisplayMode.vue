<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: String, required: true },
  modes:      { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const selectMode = (mode) => {
  if (mode !== props.modelValue) emit('update:modelValue', mode)
}
</script>

<template lang="pug">
.chart-display-mode(data-testid='chart-display-mode')
  slot
  .chart-display-mode__group(role='group' :aria-label='t("chart.display_mode")')
    button.chart-display-mode__button(
      v-for='mode in modes'
      :key='mode'
      type='button'
      :class='{ "is-active": mode === modelValue }'
      :aria-pressed='mode === modelValue'
      :data-testid='`chart-mode-${mode}`'
      @click='selectMode(mode)'
    ) {{ t(`chart.display_modes.${mode}`) }}
</template>

<style scoped>
.chart-display-mode {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
  min-width: 0;
}

.chart-display-mode__group {
  background: rgb(2 6 23 / 0.5);
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 0.5rem;
  display: inline-flex;
  margin-left: auto;
  padding: 0.125rem;
}

.chart-display-mode__button {
  border-radius: 0.375rem;
  color: rgb(203 213 225);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  min-height: 1.875rem;
  padding: 0 0.75rem;
  transition: background-color 140ms ease, color 140ms ease;
  white-space: nowrap;
}

.chart-display-mode__button:hover,
.chart-display-mode__button:focus-visible {
  background: rgb(255 255 255 / 0.08);
  color: rgb(248 250 252);
}

.chart-display-mode__button.is-active {
  background: rgb(252 211 77);
  color: rgb(15 23 42);
}
</style>
