<script setup>
import { computed } from 'vue'
import { humanDesignConnectionInsights, humanDesignInterpretationSections } from '../../lib/human-design/interpretations.js'

const props = defineProps({
  chart: { type: Object, default: null },
  connection: { type: Object, default: null },
})

const sections = computed(() =>
  props.connection
    ? [{ key: 'connection', title: 'Connection themes', items: humanDesignConnectionInsights(props.connection) }]
    : humanDesignInterpretationSections(props.chart)
)
</script>

<template lang="pug">
.human-design-insights.ui-panel(data-testid='human-design-insights')
  .mb-4
    h2.text-sm.font-semibold.text-slate-100 Human Design insights
    p.text-xs.text-slate-400(v-if='chart') {{ chart.type }} · {{ chart.authority }} · Profile {{ chart.profile }}
  .grid.gap-5(class='lg:grid-cols-2')
    section(v-for='section in sections' :key='section.key')
      h3.text-xs.font-semibold.text-slate-300.mb-3 {{ section.title }}
      .grid.gap-3
        article.rounded.p-3(
          v-for='item in section.items'
          :key='item.key'
          class='bg-white/5'
          data-testid='human-design-insight'
        )
          h4.text-sm.font-semibold.text-slate-100 {{ item.title }}
          p.mt-2.text-xs.leading-5.text-slate-400 {{ item.text }}
</template>
