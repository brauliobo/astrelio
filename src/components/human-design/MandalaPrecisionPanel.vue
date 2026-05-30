<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { activationCode } from '../../lib/human-design/activations.js'
import { humanDesignValueLabel } from '../../lib/human-design/labels.js'

const props = defineProps({
  chart: { type: Object, required: true },
})

const { t } = useI18n()

const rows = computed(() =>
  (props.chart.details?.activations || []).map(activation => {
    const longitude = Number.isFinite(activation.longitude) ? activation.longitude : null
    const progress = Number.isFinite(activation.progress) ? activation.progress : null
    return {
      ...activation,
      code: activation.code || activationCode(activation),
      longitudeLabel: longitude === null ? '—' : `${longitude.toFixed(3)}°`,
      progressLabel: progress === null ? '—' : `${(progress * 100).toFixed(2)}%`,
    }
  })
)
</script>

<template lang="pug">
.hd-mandala-precision(data-testid='hd-mandala-precision')
  .flex.items-start.justify-between.gap-3.mb-4
    div
      h2.text-sm.font-semibold.text-slate-100 {{ t('human_design.mandala_precision') }}
      p.text-xs.text-slate-500.mt-1 {{ t('human_design.mandala_precision_note') }}

  .overflow-x-auto
    table.w-full.text-sm
      thead.text-xs.text-slate-500
        tr.border-b(class='border-white/10')
          th.py-2.pr-3.text-left {{ t('human_design.planet') }}
          th.py-2.px-3.text-left {{ t('human_design.layer') }}
          th.py-2.px-3.text-left {{ t('human_design.code') }}
          th.py-2.px-3.text-left {{ t('human_design.center') }}
          th.py-2.px-3.text-left {{ t('human_design.longitude') }}
          th.py-2.pl-3.text-left {{ t('human_design.mandala_progress') }}
      tbody.divide-y(class='divide-white/10')
        tr(v-for='row in rows' :key='`${row.layer}-${row.planet}`')
          td.py-2.pr-3.text-slate-100 {{ row.planet }}
          td.py-2.px-3.text-slate-300 {{ humanDesignValueLabel(t, 'layer', row.layer) }}
          td.py-2.px-3.text-amber-200 {{ row.code }}
          td.py-2.px-3.text-slate-400 {{ humanDesignValueLabel(t, 'center', row.center) || '—' }}
          td.py-2.px-3.text-slate-300 {{ row.longitudeLabel }}
          td.py-2.pl-3.text-slate-300 {{ row.progressLabel }}
        tr(v-if='!rows.length')
          td.py-3.text-slate-500(colspan='6') {{ t('human_design.precision_unavailable') }}
</template>
