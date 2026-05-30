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
  .inline-flex.rounded.border(class='border-white/10 bg-slate-950/50 p-0.5')
    slot
    button.px-2.py-1.text-xs.font-medium.transition(
      v-for='mode in modes'
      :key='mode'
      type='button'
      :class='mode === modelValue ? "rounded-sm bg-amber-300 text-slate-950" : "text-slate-300 hover:text-white"'
      :aria-pressed='mode === modelValue'
      :data-testid='`chart-mode-${mode}`'
      @click='selectMode(mode)'
    ) {{ t(`chart.display_modes.${mode}`) }}
</template>
