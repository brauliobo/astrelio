<script setup>
defineProps({
  chart: { type: Object, required: true },
  mode: { type: String, required: true },
})
</script>

<template lang="pug">
.hd-detail-tables(data-testid='hd-detail-tables')
  .overflow-x-auto(v-if='mode === "centers"')
    table.w-full.text-sm
      thead.text-xs.text-slate-500
        tr.border-b(class='border-white/10')
          th.py-2.pr-3.text-left Center
          th.py-2.px-3.text-left State
          th.py-2.px-3.text-left Active gates
          th.py-2.pl-3.text-left Theme
      tbody.divide-y(class='divide-white/10')
        tr(v-for='center in chart.details.centers' :key='center.center')
          td.py-2.pr-3.text-slate-100 {{ center.center }}
          td.py-2.px-3(:class='center.defined ? "text-amber-200" : "text-slate-400"') {{ center.defined ? 'Defined' : 'Open' }}
          td.py-2.px-3.text-slate-300 {{ center.activeGates.join(', ') || '—' }}
          td.py-2.pl-3.text-slate-400 {{ center.theme }}

  .overflow-x-auto(v-else-if='mode === "channels"')
    table.w-full.text-sm
      thead.text-xs.text-slate-500
        tr.border-b(class='border-white/10')
          th.py-2.pr-3.text-left Channel
          th.py-2.px-3.text-left Centers
          th.py-2.px-3.text-left Circuit
          th.py-2.px-3.text-left Stream
          th.py-2.pl-3.text-left Source
      tbody.divide-y(class='divide-white/10')
        tr(v-for='channel in chart.details.channels' :key='channel.channel')
          td.py-2.pr-3.text-slate-100 {{ channel.channel }} · {{ channel.name }}
          td.py-2.px-3.text-slate-300 {{ channel.centers.join(' / ') }}
          td.py-2.px-3.text-slate-300 {{ channel.circuit }}
          td.py-2.px-3.text-slate-300 {{ channel.stream || '—' }}
          td.py-2.pl-3.text-slate-400 {{ channel.source }}
        tr(v-if='!chart.details.channels.length')
          td.py-3.text-slate-400(colspan='5') No defined channels

  .overflow-x-auto(v-else)
    table.w-full.text-sm
      thead.text-xs.text-slate-500
        tr.border-b(class='border-white/10')
          th.py-2.pr-3.text-left Gate
          th.py-2.px-3.text-left Center
          th.py-2.px-3.text-left Harmonics
          th.py-2.px-3.text-left Lines
          th.py-2.pl-3.text-left Activations
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
