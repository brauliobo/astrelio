<script setup>
import { useI18n } from 'vue-i18n'
import { humanDesignChannelLabel } from '../../../lib/human-design/labels.js'

defineProps({
  completedChannels: { type: Array, default: () => [] },
  natalGates:        { type: Array, default: () => [] },
  focusChannel:      { type: String, default: null },
})

const emit  = defineEmits(['focus'])
const { t } = useI18n()
</script>

<template lang="pug">
.grid.gap-3(class='md:grid-cols-2' data-testid='hd-transit-hits')
  section.rounded.border.p-3(class='border-white/10 bg-white/5')
    h3.text-xs.font-semibold.uppercase.text-slate-300 {{ t('human_design.completed_channels') }}
    p.mt-1.text-xs.text-slate-400 {{ t('human_design.ui.timing.hits.completed_note') }}
    .mt-3.grid.gap-2
      button.rounded.px-3.py-2.text-left.text-xs.text-amber-200(
        v-for='channel in completedChannels'
        :key='channel'
        type='button'
        class='bg-amber-300/10 hover:bg-amber-300/20 aria-pressed:ring-1 aria-pressed:ring-amber-300'
        :aria-pressed='focusChannel === channel'
        @click='emit("focus", channel)'
      )
        b {{ channel }}
        |  · {{ humanDesignChannelLabel(t, channel) }}
      p.text-xs.text-slate-500(v-if='!completedChannels.length') {{ t('human_design.ui.timing.none') }}
  section.rounded.border.p-3(class='border-white/10 bg-white/5')
    h3.text-xs.font-semibold.uppercase.text-slate-300 {{ t('human_design.activated_natal_gates') }}
    p.mt-1.text-xs.text-slate-400 {{ t('human_design.ui.timing.hits.natal_note') }}
    .mt-3.flex.flex-wrap.gap-2
      span.rounded-full.px-3.py-1.text-xs.font-semibold.text-slate-100(v-for='gate in natalGates' :key='gate' class='bg-white/10') {{ gate }}
      p.text-xs.text-slate-500(v-if='!natalGates.length') {{ t('human_design.ui.timing.none') }}
</template>
