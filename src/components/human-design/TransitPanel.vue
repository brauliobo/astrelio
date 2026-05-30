<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { activationCode } from '../../lib/human-design/activations.js'
import { humanDesignGateLabel as gateLabel } from '../../lib/human-design/labels.js'
import DetailTables from './DetailTables.vue'

const props = defineProps({
  transitChart: { type: Object, default: null },
  connection: { type: Object, default: null },
  dateInput: { type: String, required: true },
})

const emit = defineEmits(['update:dateInput', 'now'])
const { t } = useI18n()
const activationRows = computed(() => props.connection?.activationWatch || [])
const completedChannels = computed(() => props.connection?.completedChannels || [])
const activatedNatalGates = computed(() => props.connection?.activatedNatalGates || [])
const formatChange = change => new Date(change.dateMs).toLocaleString()
const changeActivationCode = activation => activation ? activationCode(activation) : '—'
</script>

<template lang="pug">
.hd-transit-panel(data-testid='hd-transit-panel')
  .flex.flex-wrap.items-center.gap-2.mb-4
    input.ui-control.ui-control-sm(
      type='datetime-local'
      :value='dateInput'
      @input='emit("update:dateInput", $event.target.value)'
      data-testid='hd-transit-date'
    )
    button.rounded.px-3.py-2.text-xs.text-slate-200(
      type='button'
      class='bg-white/10 hover:bg-white/15'
      @click='emit("now")'
      data-testid='hd-transit-now'
    ) {{ t('human_design.now') }}
  .grid.gap-4(class='lg:grid-cols-2')
    section
      h3.text-sm.font-semibold.text-slate-100.mb-3 {{ t('human_design.activation_watch') }}
      .overflow-x-auto
        table.w-full.text-sm
          thead.text-xs.text-slate-500
            tr.border-b(class='border-white/10')
              th.py-2.pr-3.text-left {{ t('human_design.planet') }}
              th.py-2.px-3.text-left {{ t('human_design.code') }}
              th.py-2.px-3.text-left {{ t('human_design.gate') }}
              th.py-2.px-3.text-left {{ t('human_design.color') }}
              th.py-2.px-3.text-left {{ t('human_design.tone') }}
              th.py-2.pl-3.text-left {{ t('human_design.base') }}
          tbody.divide-y(class='divide-white/10')
            tr(v-for='activation in activationRows' :key='activation.planet')
              td.py-2.pr-3.text-slate-100 {{ activation.planet }}
              td.py-2.px-3.text-amber-200 {{ activationCode(activation) }}
              td.py-2.px-3.text-slate-400 {{ activation.gate }} · {{ gateLabel(t, activation.gate, activation.name) }}
              td.py-2.px-3.text-slate-400 {{ activation.color || '—' }}
              td.py-2.px-3.text-slate-400 {{ activation.tone || '—' }}
              td.py-2.pl-3.text-slate-400 {{ activation.base || '—' }}
    section
      h3.text-sm.font-semibold.text-slate-100.mb-3 {{ t('human_design.composite_effects') }}
      .grid.gap-3.text-sm
        .rounded.border.p-3(class='border-white/10 bg-white/5')
          .text-xs.uppercase.text-slate-500 {{ t('human_design.completed_channels') }}
          .mt-2.flex.flex-wrap.gap-2
            span.rounded-full.px-2.py-1.text-xs(
              v-for='channel in completedChannels'
              :key='channel'
              class='bg-amber-300/10 text-amber-100'
            ) {{ channel }}
            span.text-xs.text-slate-500(v-if='!completedChannels.length') —
        .rounded.border.p-3(class='border-white/10 bg-white/5')
          .text-xs.uppercase.text-slate-500 {{ t('human_design.activated_natal_gates') }}
          .mt-2.flex.flex-wrap.gap-2
            span.rounded-full.px-2.py-1.text-xs(
              v-for='gate in activatedNatalGates'
              :key='gate'
              class='bg-sky-300/10 text-sky-100'
            ) {{ gate }}
            span.text-xs.text-slate-500(v-if='!activatedNatalGates.length') —
      h3.text-sm.font-semibold.text-slate-100.mt-5.mb-3 {{ t('human_design.next_line_changes') }}
      .grid.gap-2
        .rounded.border.p-2.text-xs(
          v-for='change in connection?.nextChanges?.slice(0, 8)'
          :key='change.planet'
          class='border-white/10 bg-white/5'
        )
          .flex.items-center.justify-between.gap-2
            span.text-slate-200 {{ change.planet }}
            span.text-slate-500 {{ formatChange(change) }}
          .mt-1.text-slate-400
            | {{ change.fromCode || changeActivationCode(change.from) }} → {{ change.toCode || changeActivationCode(change.to) }}
  .mt-5(v-if='transitChart')
    DetailTables(:chart='transitChart' mode='gates')
</template>
