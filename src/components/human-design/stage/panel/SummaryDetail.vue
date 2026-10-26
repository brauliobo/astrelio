<script setup>
import { computed } from 'vue'
import { AUTHORITY_CENTER } from '../selectionModel.js'
import { useSummary } from '../useSummary.js'
import { useHdText } from '../useHdText.js'
import PanelBlock from './PanelBlock.vue'
import PanelHead from './PanelHead.vue'
import RelatedChips from './RelatedChips.vue'

const props = defineProps({
  chart:  { type: Object, required: true },
  value:  { type: String, required: true },
  pinned: { type: Object, default: null },
})

const emit = defineEmits(['select'])

const { t, ui, prose, label, key } = useHdText()
const facts = useSummary(computed(() => props.chart))

const fact      = computed(() => facts.value.find(item => item.key === props.value))
const typeKey   = computed(() => key('type', props.chart.type))
const info      = computed(() => props.chart.profileInfo)
const cross     = computed(() => props.chart.incarnationCross)
const angleKey  = computed(() => key('crossGeometry', cross.value.geometry))
const quarter   = computed(() => cross.value.quarter?.name.toLowerCase())
const authority = computed(() => key('authority', props.chart.authority))
const definition = computed(() => key('definition', props.chart.definition))

const centerItem  = center => ({ type: 'center', value: center, label: label('center', center) })
const areas       = computed(() => props.chart.definitionAreas.map(area => area.map(centerItem)))
const lineCards   = computed(() => info.value && [info.value.conscious, info.value.unconscious].map((line, index) => ({
  title: ui(index ? 'unconscious_line' : 'conscious_line', { line }),
  name:  prose('line_archetypes', line, 'name'),
  body:  prose('line_archetypes', line, 'summary'),
})))
const crossGates  = computed(() => ['personalitySun', 'personalityEarth', 'designSun', 'designEarth'].map((role, index) => ({
  type:  'gate',
  value: cross.value.gates[index],
  label: `${ui(role)} ${cross.value.gates[index]}`,
  tones: [role.startsWith('design') ? 'design' : 'personality'],
})))
const bridges     = computed(() => props.chart.bridges)
const authorityArea = computed(() => [AUTHORITY_CENTER[props.chart.authority]].filter(Boolean).map(centerItem))
</script>

<template lang="pug">
.hd-detail(:data-testid='`hd-detail-${value}`')
  PanelHead(:kicker='fact.label' :title='fact.value')
    span.hd-chip(v-if='fact.sub' data-tone='muted') {{ fact.sub }}

  template(v-if='value === "type"')
    p.hd-lead {{ prose('types', typeKey, 'summary') }}
    PanelBlock(:title='ui("guidance")')
      p.hd-body {{ prose('types', typeKey, 'guidance') }}
    dl.hd-facts
      div(v-for='row in ["aura", "strategy", "signature", "not_self"]' :key='row')
        dt.hd-kicker {{ ui(row) }}
        dd {{ prose('types', typeKey, row) }}

  template(v-else-if='value === "strategy"')
    p.hd-lead {{ prose('types', typeKey, 'strategy') }}
    PanelBlock(:title='ui("guidance")')
      p.hd-body {{ prose('types', typeKey, 'guidance') }}

  template(v-else-if='value === "authority"')
    p.hd-lead {{ prose('authorities', authority, 'how') }}
    PanelBlock(:title='ui("practice")')
      p.hd-body {{ prose('authorities', authority, 'practice') }}
    PanelBlock(v-if='authorityArea.length' :title='t("human_design.center")')
      RelatedChips(:items='authorityArea' :pinned='pinned' @select='emit("select", $event)')

  template(v-else-if='value === "profile" && info')
    p.hd-lead {{ prose('profiles', info.id, 'summary') }}
    PanelBlock(v-for='card in lineCards' :key='card.title' :title='card.title')
      strong {{ card.name }}
      p.hd-body {{ card.body }}
    PanelBlock(:title='info.angleName')
      p.hd-body {{ prose('crosses', key('crossGeometry', info.angleName), 'summary') }}

  template(v-else-if='value === "definition"')
    p.hd-lead {{ prose('definitions', definition, 'summary') }}
    PanelBlock(v-for='(area, index) in areas' :key='index' :title='ui("area", { n: index + 1 })')
      RelatedChips(:items='area' :pinned='pinned' @select='emit("select", $event)')
    PanelBlock(v-if='chart.splitSize' :title='ui("split")')
      p.hd-body {{ prose('split_size', chart.splitSize) }}
    PanelBlock(v-if='bridges.gates.length || bridges.channels.length' :title='ui("bridges")')
      p.hd-body {{ prose('bridge', 'summary') }}
      p.hd-body {{ ui('bridge_counts', { gates: bridges.gates.length, channels: bridges.channels.length }) }}

  template(v-else-if='value === "cross"')
    p.hd-lead {{ prose('crosses', angleKey, 'summary') }}
    PanelBlock(v-if='quarter' :title='t(`human_design.quarters.${cross.quarter.id}`)')
      p.hd-body {{ prose('quarters', quarter, 'summary') }}
    PanelBlock(:title='t("human_design.gates")')
      RelatedChips(:items='crossGates' :pinned='pinned' @select='emit("select", $event)')

  template(v-else)
    p.hd-lead {{ ui(`${value}_text`, { value: fact.value }) }}
    PanelBlock(:title='ui("strategy")')
      p.hd-body {{ prose('types', typeKey, 'strategy') }}
</template>

<style scoped>
.hd-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin: 0; }
.hd-facts div { padding: 10px 12px; border: 1px solid var(--hd-line); border-radius: 12px; background: var(--hd-soft); }
.hd-facts dd { margin: 2px 0 0; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
</style>
