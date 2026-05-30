<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  chart: { type: Object, required: true },
  mode: { type: String, required: true },
})

const { t } = useI18n()
</script>

<template lang="pug">
.hd-detail-tables(data-testid='hd-detail-tables')
  .overflow-x-auto(v-if='mode === "centers"')
    table.w-full.text-sm
      thead.text-xs.text-slate-500
        tr.border-b(class='border-white/10')
          th.py-2.pr-3.text-left {{ t('human_design.center') }}
          th.py-2.px-3.text-left {{ t('human_design.state') }}
          th.py-2.px-3.text-left {{ t('human_design.active_gates') }}
          th.py-2.pl-3.text-left {{ t('human_design.theme') }}
      tbody.divide-y(class='divide-white/10')
        tr(v-for='center in chart.details.centers' :key='center.center')
          td.py-2.pr-3.text-slate-100 {{ center.center }}
          td.py-2.px-3(:class='center.defined ? "text-amber-200" : "text-slate-400"') {{ center.defined ? t('human_design.defined') : t('human_design.open_state') }}
          td.py-2.px-3.text-slate-300 {{ center.activeGates.join(', ') || '—' }}
          td.py-2.pl-3.text-slate-400 {{ center.theme }}

  .overflow-x-auto(v-else-if='mode === "channels"')
    table.w-full.text-sm
      thead.text-xs.text-slate-500
        tr.border-b(class='border-white/10')
          th.py-2.pr-3.text-left {{ t('human_design.channel') }}
          th.py-2.px-3.text-left {{ t('human_design.centers_title') }}
          th.py-2.px-3.text-left {{ t('human_design.circuit') }}
          th.py-2.px-3.text-left {{ t('human_design.stream') }}
          th.py-2.pl-3.text-left {{ t('human_design.source') }}
      tbody.divide-y(class='divide-white/10')
        tr(v-for='channel in chart.details.channels' :key='channel.channel')
          td.py-2.pr-3.text-slate-100 {{ channel.channel }} · {{ channel.name }}
          td.py-2.px-3.text-slate-300 {{ channel.centers.join(' / ') }}
          td.py-2.px-3.text-slate-300 {{ channel.circuit }}
          td.py-2.px-3.text-slate-300 {{ channel.stream || '—' }}
          td.py-2.pl-3.text-slate-400 {{ channel.source }}
        tr(v-if='!chart.details.channels.length')
          td.py-3.text-slate-400(colspan='5') {{ t('human_design.no_defined_channels') }}

  .overflow-x-auto(v-else)
    table.w-full.text-sm
      thead.text-xs.text-slate-500
        tr.border-b(class='border-white/10')
          th.py-2.pr-3.text-left {{ t('human_design.gate') }}
          th.py-2.px-3.text-left {{ t('human_design.center') }}
          th.py-2.px-3.text-left {{ t('human_design.harmonics') }}
          th.py-2.px-3.text-left {{ t('human_design.lines') }}
          th.py-2.pl-3.text-left {{ t('human_design.activations') }}
      tbody.divide-y(class='divide-white/10')
        tr(v-for='gate in chart.details.gates' :key='gate.gate')
          td.py-2.pr-3.text-slate-100 {{ gate.gate }} · {{ gate.name }}
          td.py-2.px-3.text-slate-300 {{ gate.center }}
          td.py-2.px-3.text-slate-300 {{ gate.harmonicGates.join(', ') || '—' }}
          td.py-2.px-3.text-slate-300 {{ gate.lines.map(line => `${line.line}: ${line.role}`).join(', ') || '—' }}
          td.py-2.pl-3.text-slate-400
            span(v-for='activation in gate.activations' :key='`${gate.gate}-${activation.layer}-${activation.planet}`')
              | {{ activation.layer }} {{ activation.planet }} {{ activation.code }} · {{ activation.planetMeaning }}
              br
</template>
