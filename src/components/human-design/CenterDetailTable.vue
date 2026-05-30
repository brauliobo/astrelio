<script setup>
import { useI18n } from 'vue-i18n'
import {
  humanDesignCenterThemeLabel as centerThemeLabel,
  humanDesignValueLabel as valueLabel,
} from '../../lib/human-design/labels.js'

defineProps({
  chart: { type: Object, required: true },
})

const { t } = useI18n()
</script>

<template lang="pug">
.overflow-x-auto
  table.w-full.text-sm
    thead.text-xs.text-slate-500
      tr.border-b(class='border-white/10')
        th.py-2.pr-3.text-left {{ t('human_design.center') }}
        th.py-2.px-3.text-left {{ t('human_design.state') }}
        th.py-2.px-3.text-left {{ t('human_design.active_gates') }}
        th.py-2.pl-3.text-left {{ t('human_design.theme') }}
    tbody.divide-y(class='divide-white/10')
      tr(v-for='center in chart.details.centers' :key='center.center')
        td.py-2.pr-3.text-slate-100 {{ valueLabel(t, 'center', center.center) }}
        td.py-2.px-3(:class='center.defined ? "text-amber-200" : "text-slate-400"') {{ center.defined ? t('human_design.defined') : t('human_design.open_state') }}
        td.py-2.px-3.text-slate-300 {{ center.activeGates.join(', ') || '—' }}
        td.py-2.pl-3.text-slate-400 {{ centerThemeLabel(t, center.theme) }}
</template>
