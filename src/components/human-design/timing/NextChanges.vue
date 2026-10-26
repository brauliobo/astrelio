<script setup>
import { useI18n } from 'vue-i18n'
import { humanDesignGateLabel } from '../../../lib/human-design/labels.js'

defineProps({
  changes: { type: Array, default: () => [] },
})

const { locale, t } = useI18n()
const formatDate    = ms => new Date(ms).toLocaleString(locale.value)
const spot          = ({ gate, line }) => `${gate}.${line}`
const levelOf       = change => change.from.gate === change.to.gate ? 'line' : 'gate'
</script>

<template lang="pug">
section(data-testid='hd-transit-next-changes')
  h3.text-sm.font-semibold.text-slate-100.mb-3 {{ t('human_design.next_line_changes') }}
  .grid.gap-2(class='md:grid-cols-2 xl:grid-cols-4')
    article.rounded.border.p-3.text-xs(
      v-for='change in changes'
      :key='change.planet'
      class='border-white/10 bg-white/5'
    )
      .flex.items-baseline.justify-between.gap-2
        b.text-sm.text-slate-100 {{ t(`planets.${change.planet}`) }}
        span.text-slate-500 {{ t(`human_design.ui.timing.changes.${levelOf(change)}`) }}
      .mt-1.text-slate-400 {{ formatDate(change.dateMs) }}
      .mt-2.text-amber-200 {{ spot(change.from) }} → {{ spot(change.to) }}
      .mt-1.text-slate-300 {{ humanDesignGateLabel(t, change.to.gate) }}
  p.text-xs.text-slate-500(v-if='!changes.length') {{ t('human_design.ui.timing.none') }}
</template>
