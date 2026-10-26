<script setup>
import { computed } from 'vue'
import { useHdText } from '../useHdText.js'
import PanelBlock from './PanelBlock.vue'
import PanelHead from './PanelHead.vue'

const props = defineProps({ chart: { type: Object, required: true } })

const { ui, prose, label, key } = useHdText()

const typeKey = computed(() => key('type', props.chart.type))
</script>

<template lang="pug">
.hd-detail(data-testid='hd-detail-overview')
  PanelHead(:kicker='chart.personName' :title='ui("overview_title", { type: label("type", chart.type), profile: chart.profile })')
  p.hd-lead {{ prose('types', typeKey, 'summary') }}
  PanelBlock(:title='ui("guidance")')
    p.hd-body {{ prose('types', typeKey, 'guidance') }}
  dl.hd-facts
    div(v-for='row in ["aura", "signature", "not_self"]' :key='row')
      dt.hd-kicker {{ ui(row) }}
      dd {{ prose('types', typeKey, row) }}
  p.hd-hint {{ ui('empty_hint') }}
</template>

<style scoped>
.hd-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin: 0; }
.hd-facts div { padding: 10px 12px; border: 1px solid var(--hd-line); border-radius: 12px; background: var(--hd-soft); }
.hd-facts dd { margin: 2px 0 0; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.hd-hint { margin: 0; padding: 10px 12px; border-radius: 12px; background: var(--hd-faint); color: var(--hd-text-2); font-size: 13px; line-height: 1.5; }
</style>
