<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { msToJd } from '../../../lib/astro/timezones.js'
import { lifeCyclesForChart } from '../../../lib/human-design/bodygraph.js'
import CycleTimeline from './CycleTimeline.vue'
import LunarCycle from './LunarCycle.vue'

const props = defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
  now:    { type: Number, required: true },
})

defineEmits(['select'])

const { t }     = useI18n()
const cycles    = computed(() => lifeCyclesForChart(props.chart))
const age       = computed(() => (msToJd(props.now) - props.chart.birthJd) / 365.25)
const reflector = computed(() => props.chart.type === 'Reflector')
</script>

<template lang="pug">
.hda-panel(data-testid='analysis-cycles-view')
  p.hda-intro {{ t('human_design.ui.analysis.cycles_intro') }}
  LunarCycle(v-if='reflector' :chart='chart' :now='now' prominent @select='$emit("select", $event)')
  CycleTimeline(:cycles='cycles' :age='age')
  LunarCycle(v-if='!reflector' :chart='chart' :now='now' @select='$emit("select", $event)')
</template>
