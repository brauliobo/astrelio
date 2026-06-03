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
.chart-display-mode.flex.flex-wrap.items-center.justify-between.gap-2(data-testid='chart-display-mode')
  span.text-xs.font-medium.text-slate-400 {{ t('chart.display_mode') }}
  .inline-flex.flex-wrap.rounded.border(class='border-white/10 bg-slate-950/50 p-0.5')
    slot
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
.chart-display-mode__button {
  flex: 0 0 auto;
  border-radius: 0.1875rem;
  color: rgb(203 213 225);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  min-height: 2rem;
  padding: 0.45rem 0.65rem;
  transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
  white-space: nowrap;
}

.chart-display-mode__button:hover,
.chart-display-mode__button:focus-visible {
  background: rgb(255 255 255 / 0.1);
  color: rgb(248 250 252);
}

.chart-display-mode__button.is-active {
  background: rgb(252 211 77);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.28);
  color: rgb(15 23 42);
}

.chart-display-mode > div {
  flex-wrap: nowrap;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.chart-display-mode > div::-webkit-scrollbar {
  display: none;
}
</style>
