<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NextChanges from './timing/NextChanges.vue'
import OpenCenterConditioning from './timing/OpenCenterConditioning.vue'
import TransitActivations from './timing/TransitActivations.vue'
import TransitBodygraph from './timing/TransitBodygraph.vue'
import TransitHits from './timing/TransitHits.vue'

const MAX_CHANGES = 8

const props = defineProps({
  chart:        { type: Object, default: null },
  transitChart: { type: Object, default: null },
  connection:   { type: Object, default: null },
  dateInput:    { type: String, required: true },
})

const emit  = defineEmits(['update:dateInput', 'now'])
const { t } = useI18n()

const focus      = ref(null)
const toggle     = highlight => { focus.value = JSON.stringify(focus.value) === JSON.stringify(highlight) ? null : highlight }
const only       = key => focus.value?.[key]?.length === 1 ? focus.value[key][0] : null
const natalGates = computed(() => props.connection?.activatedNatalGates || [])
const changes    = computed(() => [...(props.connection?.nextLineChanges || [])].sort((a, b) => a.dateMs - b.dateMs).slice(0, MAX_CHANGES))
const centerHit  = item => toggle({ centers: [item.id], gates: item.gates })
</script>

<template lang="pug">
.hd-transit-panel.grid.gap-5(data-testid='hd-transit-panel')
  .flex.flex-wrap.items-center.gap-2
    input.ui-control.ui-control-sm(
      type='datetime-local'
      :value='dateInput'
      data-testid='hd-transit-date'
      @input='emit("update:dateInput", $event.target.value)'
    )
    button.rounded.px-3.py-2.text-xs.text-slate-200(
      type='button'
      class='bg-white/10 hover:bg-white/15'
      data-testid='hd-transit-now'
      @click='emit("now")'
    ) {{ t('human_design.now') }}
  .grid.items-start.gap-5(v-if='chart && transitChart' class='lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]')
    .mx-auto.w-full(class='max-w-xs lg:sticky lg:top-4 lg:max-w-none')
      TransitBodygraph(:chart='chart' :transit-chart='transitChart' :highlight='focus')
    .grid.gap-5
      TransitActivations(
        :activations='connection?.activationWatch'
        :natal-gates='natalGates'
        :focus-gate='only("gates")'
        @focus='toggle({ gates: [$event] })'
      )
      TransitHits(
        :completed-channels='connection?.completedChannels'
        :natal-gates='natalGates'
        :focus-channel='only("channels")'
        @focus='toggle({ channels: [$event] })'
      )
      OpenCenterConditioning(
        :center-states='chart.centerStates'
        :transit-gates='transitChart.gates'
        :focus-center='only("centers")'
        @focus='centerHit'
      )
      NextChanges(:changes='changes')
</template>
