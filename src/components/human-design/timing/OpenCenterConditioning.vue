<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GATE_CENTER } from '../../../lib/human-design/layout.js'
import { humanDesignContentKey, humanDesignValueLabel } from '../../../lib/human-design/labels.js'

const props = defineProps({
  centerStates: { type: Array, default: () => [] },
  transitGates: { type: Array, default: () => [] },
  focusCenter:  { type: String, default: null },
})

const emit  = defineEmits(['focus'])
const { t } = useI18n()

const conditioned = computed(() => props.centerStates
  .filter(state => state.white)
  .map(state => ({ ...state, gates: props.transitGates.filter(gate => GATE_CENTER[gate] === state.id) }))
  .filter(item => item.gates.length)
)
const content = (item, field) => t(humanDesignContentKey('centers', item.key, field))
</script>

<template lang="pug">
section(data-testid='hd-transit-conditioning')
  h3.text-sm.font-semibold.text-slate-100 {{ t('human_design.ui.timing.conditioning.title') }}
  p.mt-1.mb-3.text-xs.text-slate-400 {{ t('human_design.ui.timing.conditioning.note') }}
  .grid.gap-2(class='md:grid-cols-2 xl:grid-cols-3')
    button.rounded.border.p-3.text-left.text-xs(
      v-for='item in conditioned'
      :key='item.id'
      type='button'
      class='border-white/10 bg-white/5 hover:bg-white/10 aria-pressed:border-amber-300/60'
      :aria-pressed='focusCenter === item.id'
      @click='emit("focus", item)'
    )
      .flex.items-baseline.justify-between.gap-2
        b.text-sm.text-slate-100 {{ humanDesignValueLabel(t, 'center', item.id) }}
        span.text-amber-200 {{ t('human_design.ui.timing.conditioning.gates', { gates: item.gates.join(', ') }) }}
      p.mt-2.leading-5.text-slate-300 {{ content(item, 'undefined') }}
      p.mt-2.leading-5.text-amber-200 {{ content(item, 'not_self_question') }}
  p.text-xs.text-slate-500(v-if='!conditioned.length') {{ t('human_design.ui.timing.conditioning.none') }}
</template>
