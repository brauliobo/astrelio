<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '../../stores/session.js'
import { useHumanDesignTransitContext } from '../../composables/useHumanDesignTransitContext.js'
import { modalityChart } from '../../lib/modalities/index.js'
import CorrelationPanel from '../human-design/CorrelationPanel.vue'
import TransitPanel from '../human-design/TransitPanel.vue'

const props = defineProps({
  person: { type: Object, required: true },
})

const { t }   = useI18n()
const session = useSessionStore()

const chart        = computed(() => modalityChart('humanDesign', props.person))
const transitDateMs = ref(session.transitDateMs || Date.now())
const transitDateInput = computed({
  get: () => new Date(transitDateMs.value).toISOString().slice(0, 16),
  set: value => {
    const parsed = new Date(value).getTime()
    if (!Number.isFinite(parsed)) return
    transitDateMs.value = parsed
    session.setTransitDate(parsed)
  },
})

const transitContext = useHumanDesignTransitContext({
  enabled:    true,
  natalChart: chart,
  person:     computed(() => props.person),
  dateMs:     transitDateMs,
})
const transitStatus     = computed(() => transitContext.status.value)
const transitChart      = computed(() => transitContext.data.value?.transitChart || null)
const transitConnection = computed(() => transitContext.data.value?.connection || null)

const setTransitNow = () => {
  const now           = Date.now()
  transitDateMs.value = now
  session.setTransitDate(now)
}
</script>

<template lang="pug">
section.grid.gap-4(data-testid='human-design-timing-tools')
  .ui-panel
    h2.text-sm.font-semibold.text-slate-100.mb-4 {{ t('human_design.transits') }}
    p.text-xs.text-slate-400.mb-3(v-if='transitStatus === "loading"' data-testid='hd-transit-status') {{ t('human_design.loading_transits') }}
    p.text-xs.text-rose-200.mb-3(v-else-if='transitStatus === "error"' data-testid='hd-transit-status') {{ t('human_design.transit_error') }}
    TransitPanel(
      :transit-chart='transitChart'
      :connection='transitConnection'
      v-model:date-input='transitDateInput'
      @now='setTransitNow'
    )

  .ui-panel
    CorrelationPanel(
      :chart='chart'
      :transit-chart='transitChart'
      :transit-connection='transitConnection'
    )
</template>
