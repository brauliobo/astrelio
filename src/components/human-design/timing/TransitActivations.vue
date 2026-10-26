<script setup>
import { useI18n } from 'vue-i18n'
import { activationCode } from '../../../lib/human-design/activations.js'
import { humanDesignGateLabel } from '../../../lib/human-design/labels.js'

defineProps({
  activations: { type: Array, default: () => [] },
  natalGates:  { type: Array, default: () => [] },
  focusGate:   { type: Number, default: null },
})

const emit  = defineEmits(['focus'])
const { t } = useI18n()
</script>

<template lang="pug">
section(data-testid='hd-transit-activations')
  h3.text-sm.font-semibold.text-slate-100.mb-3 {{ t('human_design.ui.timing.activations.title') }}
  .grid.gap-2(class='grid-cols-1 sm:grid-cols-2 xl:grid-cols-3')
    button.rounded.border.px-3.py-2.text-left.text-xs(
      v-for='activation in activations'
      :key='activation.planet'
      type='button'
      class='border-white/10 bg-white/5 hover:bg-white/10 aria-pressed:border-amber-300/60'
      :aria-pressed='focusGate === activation.gate'
      :title='activationCode(activation)'
      @click='emit("focus", activation.gate)'
    )
      .flex.items-baseline.justify-between.gap-2
        span.text-slate-400 {{ t(`planets.${activation.planet}`) }}
        span.font-semibold.text-amber-200 {{ activation.gate }}.{{ activation.line }}
      .mt-1.text-slate-200 {{ humanDesignGateLabel(t, activation.gate, activation.name) }}
      .mt-1.text-amber-200(v-if='natalGates.includes(activation.gate)') {{ t('human_design.ui.timing.activations.hits_natal') }}
</template>
