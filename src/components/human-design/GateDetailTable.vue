<script setup>
import { useI18n } from 'vue-i18n'
import {
  humanDesignGateLabel as gateLabel,
  humanDesignLineRoleLabel as lineRoleLabel,
  humanDesignValueLabel as valueLabel,
} from '../../lib/human-design/labels.js'

defineProps({
  chart: { type: Object, required: true },
})

const { t } = useI18n()
const lineRoles = gate =>
  gate.lines.map(line => `${line.line}: ${lineRoleLabel(t, line.role)}`).join(', ') || '—'
</script>

<template lang="pug">
.overflow-x-auto
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
        td.py-2.pr-3.text-slate-100 {{ gate.gate }} · {{ gateLabel(t, gate.gate, gate.name) }}
        td.py-2.px-3.text-slate-300 {{ valueLabel(t, 'center', gate.center) }}
        td.py-2.px-3.text-slate-300 {{ gate.harmonicGates.join(', ') || '—' }}
        td.py-2.px-3.text-slate-300 {{ lineRoles(gate) }}
        td.py-2.pl-3.text-slate-400
          span(v-for='activation in gate.activations' :key='`${gate.gate}-${activation.layer}-${activation.planet}`')
            | {{ valueLabel(t, 'layer', activation.layer) }} {{ activation.planet }} {{ activation.code }} · {{ t('human_design.planet_activation_summary', { planet: activation.planet, layer: valueLabel(t, 'layer', activation.layer), gate: gate.gate }) }}
            br
</template>
