<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { activationCode } from '../../lib/human-design/activations.js'
import {
  humanDesignCrossTitleLabel,
  humanDesignListLabel,
  humanDesignStreamLabel,
  humanDesignValueLabel,
} from '../../lib/human-design/labels.js'

const props = defineProps({
  chart: { type: Object, required: true },
  transitChart: { type: Object, default: null },
  transitConnection: { type: Object, default: null },
})

const { t } = useI18n()
const variableLabel = variable => {
  const key = `human_design.variable_labels.${variable.id}.label`
  const translated = t(key)
  return translated === key ? variable.label : translated
}
const orientationLabel = orientation => {
  const key = `human_design.orientations.${orientation || 'unknown'}`
  const translated = t(key)
  return translated === key ? orientation || '-' : translated
}

const planetWeights = {
  Sun: 6,
  Earth: 6,
  NorthNode: 4,
  SouthNode: 4,
  Moon: 3,
  Mercury: 3,
  Venus: 3,
  Mars: 3,
  Jupiter: 3,
  Saturn: 3,
  Uranus: 2,
  Neptune: 2,
  Pluto: 2,
}

const sectionTestIds = {
  diary: 'hd-correlation-event-diary',
  transits: 'hd-correlation-transit-clusters',
  bridge: 'hd-correlation-astrology-bridge',
}

const external = computed(() => props.chart.correlationAnalysis || props.chart.correlations || {})
const gates = computed(() => props.chart.details?.gates || [])
const channels = computed(() => props.chart.details?.channels || [])
const centers = computed(() => props.chart.details?.centers || [])
const activations = computed(() => {
  if (props.chart.details?.activations?.length) return props.chart.details.activations
  return gates.value.flatMap(gate =>
    (gate.activations || []).map(activation => ({
      ...activation,
      gate: gate.gate,
      name: gate.name,
      center: gate.center,
      code: activation.code || activationCode({ ...activation, gate: gate.gate }),
    }))
  )
})

const listFromExternal = key => {
  const value = external.value[key]
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.rows)) return value.rows
  return null
}

const describeItem = item => {
  if (typeof item === 'string') return item
  if (!item) return ''
  return item.label || item.summary || item.title || item.name || item.text || item.description || String(item.gate || item.channel || '')
}

const topItems = (items, count = 5) => items.filter(Boolean).slice(0, count)

const linePatternItems = computed(() => {
  const supplied = listFromExternal('linePattern')
  if (supplied) return topItems(supplied, 6)

  const counts = new Map()
  for (const activation of activations.value) {
    if (!activation.line) continue
    const current = counts.get(activation.line) || { line: activation.line, count: 0, gates: [] }
    current.count += 1
    current.gates.push(activation.gate)
    counts.set(activation.line, current)
  }
  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.line - right.line)
    .map(row => t('human_design.correlations.line_pattern_item', {
      line: row.line,
      count: row.count,
      gates: [...new Set(row.gates)].slice(0, 6).join(', '),
    }))
})

const planetWeightItems = computed(() => {
  const supplied = listFromExternal('planetWeighting')
  if (supplied) return topItems(supplied)

  return activations.value
    .map(activation => ({
      ...activation,
      weight: planetWeights[activation.planet] || 1,
    }))
    .sort((left, right) => right.weight - left.weight || String(left.planet).localeCompare(String(right.planet)))
    .slice(0, 7)
    .map(activation => t('human_design.correlations.planet_weight_item', {
      planet: activation.planet,
      gate: activation.gate,
      line: activation.line || '-',
      weight: activation.weight,
    }))
})

const harmonicItems = computed(() => {
  const supplied = listFromExternal('harmonicCompletion')
  if (supplied) return topItems(supplied)

  const transitCompletions = (props.transitConnection?.completedChannels || [])
    .map(channel => t('human_design.correlations.transit_completion_item', { channel }))
  const hanging = gates.value
    .flatMap(gate => (gate.harmonicSuggestions || []).map(harmonic =>
      t('human_design.correlations.harmonic_item', {
        gate: gate.gate,
        harmonic: harmonic.gate,
        channel: harmonic.channel,
      })
    ))
  return topItems([...transitCompletions, ...hanging])
})

const circuitItems = computed(() => {
  const supplied = listFromExternal('circuitBalance')
  if (supplied) return topItems(supplied)

  const groups = new Map()
  for (const channel of channels.value) {
    const key = channel.circuitGroup || channel.circuit || t('human_design.open_circuitry')
    const current = groups.get(key) || { key, channels: [], streams: [] }
    current.channels.push(channel.channel)
    if (channel.stream) current.streams.push(channel.stream)
    groups.set(key, current)
  }
  return [...groups.values()]
    .sort((left, right) => right.channels.length - left.channels.length || left.key.localeCompare(right.key))
    .map(group => t('human_design.correlations.circuit_item', {
      circuit: humanDesignValueLabel(t, 'circuitGroup', group.key) || humanDesignValueLabel(t, 'circuit', group.key) || group.key,
      count: group.channels.length,
      streams: [...new Set(group.streams)].slice(0, 3).map(stream => humanDesignStreamLabel(t, stream)).join(', ') || '-',
    }))
})

const crossItems = computed(() => {
  const supplied = listFromExternal('crossResonance')
  if (supplied) return topItems(supplied)

  const crossGates = props.chart.incarnationCross?.gates || []
  const transitGates = new Set(props.transitChart?.gates || [])
  const definedChannels = channels.value.filter(channel =>
    (channel.gates || []).some(gate => crossGates.includes(gate))
  )
  const transitHits = crossGates.filter(gate => transitGates.has(gate))
  return [
    props.chart.incarnationCross?.name ? t('human_design.correlations.cross_name_item', { name: humanDesignCrossTitleLabel(t, props.chart.incarnationCross) }) : '',
    crossGates.length ? t('human_design.correlations.cross_gate_item', { gates: crossGates.join(', ') }) : '',
    definedChannels.length ? t('human_design.correlations.cross_channel_item', { count: definedChannels.length }) : '',
    transitHits.length ? t('human_design.correlations.cross_transit_item', { gates: transitHits.join(', ') }) : '',
  ].filter(Boolean)
})

const variableItems = computed(() => {
  const supplied = listFromExternal('variableConsistency')
  if (supplied) return topItems(supplied)

  const variables = props.chart.variables || []
  const left = variables.filter(variable => variable.orientation === 'left').length
  const right = variables.filter(variable => variable.orientation === 'right').length
  return [
    t('human_design.correlations.variable_orientation_item', { left, right }),
    ...variables.map(variable => t('human_design.correlations.variable_item', {
      label: variableLabel(variable),
      orientation: orientationLabel(variable.orientation),
      color: variable.color || '-',
      tone: variable.tone || '-',
      base: variable.base || '-',
    })),
  ]
})

const relationshipItems = computed(() => {
  const supplied = listFromExternal('relationshipOverlays')
  if (supplied) return topItems(supplied)

  const openCenters = centers.value.filter(center => !center.defined).map(center => center.center)
  const hanging = gates.value.filter(gate => gate.isHanging).map(gate => gate.gate)
  return [
    openCenters.length ? t('human_design.correlations.relationship_open_item', { centers: humanDesignListLabel(t, 'center', openCenters) }) : '',
    hanging.length ? t('human_design.correlations.relationship_hanging_item', { gates: hanging.slice(0, 10).join(', ') }) : '',
    t('human_design.correlations.relationship_note_item'),
  ].filter(Boolean)
})

const transitClusterItems = computed(() => {
  const supplied = listFromExternal('transitThemeClustering')
  if (supplied) return topItems(supplied)

  const rows = props.transitConnection?.activationWatch || props.transitChart?.details?.activations || []
  const byCenter = new Map()
  for (const row of rows) {
    const key = row.center || t('human_design.open_state')
    byCenter.set(key, (byCenter.get(key) || 0) + 1)
  }
  return [...byCenter.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([center, count]) => t('human_design.correlations.transit_cluster_item', {
      center: humanDesignValueLabel(t, 'center', center) || center,
      count,
    }))
})

const astrologyBridgeItems = computed(() => {
  const supplied = listFromExternal('astrologyBridge')
  if (supplied) return topItems(supplied)

  const rows = props.transitConnection?.activationWatch?.length
    ? props.transitConnection.activationWatch
    : activations.value
  return rows.slice(0, 7).map(row => t('human_design.correlations.astrology_bridge_item', {
    planet: row.planet,
    code: row.code || activationCode(row),
    gate: row.gate,
  }))
})

const diaryItems = computed(() => {
  const supplied = listFromExternal('diaryCorrelations')
  if (supplied) return topItems(supplied)

  const centerGroups = new Map()
  for (const gate of gates.value) {
    const key = gate.center || t('human_design.center')
    const current = centerGroups.get(key) || []
    current.push(gate.gate)
    centerGroups.set(key, current)
  }
  return [...centerGroups.entries()]
    .sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([center, centerGates]) => t('human_design.correlations.diary_item', {
      center: humanDesignValueLabel(t, 'center', center) || center,
      gates: centerGates.slice(0, 8).join(', '),
    }))
})

const sections = computed(() => [
  { key: 'diary', title: t('human_design.correlations.diary'), tone: 'amber', items: diaryItems.value },
  { key: 'lines', title: t('human_design.correlations.line_pattern'), tone: 'sky', items: linePatternItems.value },
  { key: 'planets', title: t('human_design.correlations.planet_weighting'), tone: 'violet', items: planetWeightItems.value },
  { key: 'harmonics', title: t('human_design.correlations.harmonic_completion'), tone: 'emerald', items: harmonicItems.value },
  { key: 'circuits', title: t('human_design.correlations.circuit_balance'), tone: 'slate', items: circuitItems.value },
  { key: 'cross', title: t('human_design.correlations.cross_resonance'), tone: 'amber', items: crossItems.value },
  { key: 'variables', title: t('human_design.correlations.variable_consistency'), tone: 'sky', items: variableItems.value },
  { key: 'relationships', title: t('human_design.correlations.relationship_overlays'), tone: 'violet', items: relationshipItems.value },
  { key: 'transits', title: t('human_design.correlations.transit_theme_clustering'), tone: 'emerald', items: transitClusterItems.value },
  { key: 'bridge', title: t('human_design.correlations.astrology_bridge'), tone: 'slate', items: astrologyBridgeItems.value },
])

const scoreCards = computed(() => [
  { label: t('human_design.correlations.active_gates'), value: props.chart.gates?.length || gates.value.length || 0 },
  { label: t('human_design.correlations.defined_channels'), value: props.chart.channels?.length || channels.value.length || 0 },
  { label: t('human_design.correlations.transit_hits'), value: props.transitConnection?.activatedNatalGates?.length || 0 },
  { label: t('human_design.correlations.completed_channels'), value: props.transitConnection?.completedChannels?.length || 0 },
])

const sectionTestId = key => sectionTestIds[key] || `hd-correlation-${key}`
</script>

<template lang="pug">
.hd-correlation-panel(data-testid='hd-correlations-panel')
  .flex.flex-wrap.items-start.justify-between.gap-3.mb-4
    div
      h2.text-sm.font-semibold.text-slate-100 {{ t('human_design.correlations.title') }}
      p.text-xs.text-slate-500.mt-1 {{ t('human_design.correlations.note') }}
    .grid.grid-cols-2.gap-2(class='sm:grid-cols-4')
      .rounded.border.px-3.py-2.text-right(
        v-for='card in scoreCards'
        :key='card.label'
        class='border-white/10 bg-white/5'
      )
        .uppercase.text-slate-500(class='text-[11px]') {{ card.label }}
        .text-lg.font-semibold.text-slate-100 {{ card.value }}

  .rounded.border.p-3.mb-4(class='border-amber-300/20 bg-amber-300/10')
    p.text-xs.leading-5.text-amber-100 {{ t('human_design.correlations.clean_room_notice') }}

  .grid.gap-3(class='xl:grid-cols-2')
    section.rounded.border.p-3(
      v-for='section in sections'
      :key='section.key'
      class='border-white/10 bg-white/5'
      :data-correlation='section.key'
      :data-testid='sectionTestId(section.key)'
    )
      .flex.items-center.justify-between.gap-2
        h3.text-sm.font-semibold.text-slate-100 {{ section.title }}
        span.rounded-full.uppercase(
          :class='`hd-correlation-panel__pill--${section.tone}`'
          class='px-2 py-0.5 text-[11px]'
        ) {{ section.items.length }}
      .mt-3.grid.gap-2(v-if='section.items.length')
        .rounded.p-2.text-xs.leading-5.text-slate-300(
          v-for='(item, index) in section.items'
          :key='`${section.key}-${index}`'
          class='bg-slate-950/25'
        ) {{ describeItem(item) }}
      p.mt-3.text-xs.text-slate-500(v-else) {{ t('human_design.correlations.no_data') }}
</template>

<style scoped>
.hd-correlation-panel__pill--amber {
  background: rgba(251, 191, 36, 0.12);
  color: #fde68a;
}

.hd-correlation-panel__pill--sky {
  background: rgba(56, 189, 248, 0.12);
  color: #bae6fd;
}

.hd-correlation-panel__pill--violet {
  background: rgba(167, 139, 250, 0.12);
  color: #ddd6fe;
}

.hd-correlation-panel__pill--emerald {
  background: rgba(52, 211, 153, 0.12);
  color: #a7f3d0;
}

.hd-correlation-panel__pill--slate {
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
}
</style>
