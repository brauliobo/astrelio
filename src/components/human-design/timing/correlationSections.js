import { computed } from 'vue'
import { activationCode } from '../../../lib/human-design/activations.js'
import {
  humanDesignChannelLabel,
  humanDesignCrossTitleLabel,
  humanDesignListLabel,
  humanDesignStreamLabel,
  humanDesignValueLabel,
} from '../../../lib/human-design/labels.js'

const planetWeights = {
  Sun:       6,
  Earth:     6,
  NorthNode: 4,
  SouthNode: 4,
  Moon:      3,
  Mercury:   3,
  Venus:     3,
  Mars:      3,
  Jupiter:   3,
  Saturn:    3,
  Uranus:    2,
  Neptune:   2,
  Pluto:     2,
}

/** Correlation sections `{ key, title, items }` of a chart (and optional transit) as translated rows. */
export const useCorrelationSections = (props, t) => {
  const variableLabel    = variable => t(`human_design.variable_labels.${variable.id}.label`)
  const orientationLabel = orientation => t(`human_design.orientations.${orientation || 'unknown'}`)
  const planetLabel      = planet => t(`planets.${planet}`)
  const channelLabel     = channel => `${channel} · ${humanDesignChannelLabel(t, channel)}`

  const external    = computed(() => props.chart.correlationAnalysis || props.chart.correlations || {})
  const gates       = computed(() => props.chart.details?.gates || [])
  const channels    = computed(() => props.chart.details?.channels || [])
  const centers     = computed(() => props.chart.details?.centers || [])
  const activations = computed(() => {
    if (props.chart.details?.activations?.length) return props.chart.details.activations
    return gates.value.flatMap(gate =>
      (gate.activations || []).map(activation => ({
        ...activation,
        gate:   gate.gate,
        name:   gate.name,
        center: gate.center,
        code:   activation.code || activationCode({ ...activation, gate: gate.gate }),
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

  const messageToken = item => {
    if (!item || typeof item !== 'object') return null
    if (item.message?.key) return item.message
    if (item.messageKey) return { key: item.messageKey, params: item.messageParams || item.params || {} }
    if (item.i18nKey) return { key: item.i18nKey, params: item.params || {} }
    if (String(item.key || '').startsWith('human_design.')) return item
    return null
  }

  const translatedExternalItems = key => (listFromExternal(key) || [])
    .map(messageToken)
    .filter(Boolean)
    .map(token => t(token.key, token.params || {}))

  const topItems = (items, count = 5) => items.filter(Boolean).slice(0, count)

  const linePatternItems = computed(() => {
    const supplied = translatedExternalItems('linePattern')
    if (supplied.length) return topItems(supplied, 6)

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
        line:  row.line,
        count: row.count,
        gates: [...new Set(row.gates)].slice(0, 6).join(', '),
      }))
  })

  const planetWeightItems = computed(() => {
    const supplied = translatedExternalItems('planetWeighting')
    if (supplied.length) return topItems(supplied)

    return activations.value
      .map(activation => ({
        ...activation,
        weight: planetWeights[activation.planet] || 1,
      }))
      .sort((left, right) => right.weight - left.weight || String(left.planet).localeCompare(String(right.planet)))
      .slice(0, 7)
      .map(activation => t('human_design.correlations.planet_weight_item', {
        planet: planetLabel(activation.planet),
        gate:   activation.gate,
        line:   activation.line || '-',
        weight: activation.weight,
      }))
  })

  const harmonicItems = computed(() => {
    const supplied = translatedExternalItems('harmonicCompletion')
    if (supplied.length) return topItems(supplied)

    const transitCompletions = (props.transitConnection?.completedChannels || [])
      .map(channel => t('human_design.correlations.transit_completion_item', { channel: channelLabel(channel) }))
    const hanging = gates.value
      .flatMap(gate => (gate.harmonicSuggestions || []).map(harmonic =>
        t('human_design.correlations.harmonic_item', {
          gate:     gate.gate,
          harmonic: harmonic.gate,
          channel:  channelLabel(harmonic.channel),
        })
      ))
    return topItems([...transitCompletions, ...hanging])
  })

  const circuitItems = computed(() => {
    const supplied = translatedExternalItems('circuitBalance')
    if (supplied.length) return topItems(supplied)

    const groups = new Map()
    for (const channel of channels.value) {
      const key     = channel.circuitGroup || channel.circuit || t('human_design.open_circuitry')
      const current = groups.get(key) || { key, channels: [], streams: [] }
      current.channels.push(channel.channel)
      if (channel.stream) current.streams.push(channel.stream)
      groups.set(key, current)
    }
    return [...groups.values()]
      .sort((left, right) => right.channels.length - left.channels.length || left.key.localeCompare(right.key))
      .map(group => t('human_design.correlations.circuit_item', {
        circuit: humanDesignValueLabel(t, 'circuitGroup', group.key) || humanDesignValueLabel(t, 'circuit', group.key) || group.key,
        count:   group.channels.length,
        streams: [...new Set(group.streams)].slice(0, 3).map(stream => humanDesignStreamLabel(t, stream)).join(', ') || '-',
      }))
  })

  const crossItems = computed(() => {
    const supplied = translatedExternalItems('crossResonance')
    if (supplied.length) return topItems(supplied)

    const crossGates      = props.chart.incarnationCross?.gates || []
    const transitGates    = new Set(props.transitChart?.gates || [])
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
    const supplied = translatedExternalItems('variableConsistency')
    if (supplied.length) return topItems(supplied)

    const variables = props.chart.variables || []
    const left      = variables.filter(variable => variable.orientation === 'left').length
    const right     = variables.filter(variable => variable.orientation === 'right').length
    return [
      t('human_design.correlations.variable_orientation_item', { left, right }),
      ...variables.map(variable => t('human_design.correlations.variable_item', {
        label:       variableLabel(variable),
        orientation: orientationLabel(variable.orientation),
        color:       variable.color || '-',
        tone:        variable.tone || '-',
        base:        variable.base || '-',
      })),
    ]
  })

  const relationshipItems = computed(() => {
    const supplied = translatedExternalItems('relationshipOverlays')
    if (supplied.length) return topItems(supplied)

    const openCenters = centers.value.filter(center => !center.defined).map(center => center.center)
    const hanging     = gates.value.filter(gate => gate.isHanging).map(gate => gate.gate)
    return [
      openCenters.length ? t('human_design.correlations.relationship_open_item', { centers: humanDesignListLabel(t, 'center', openCenters) }) : '',
      hanging.length ? t('human_design.correlations.relationship_hanging_item', { gates: hanging.slice(0, 10).join(', ') }) : '',
      t('human_design.correlations.relationship_note_item'),
    ].filter(Boolean)
  })

  const transitClusterItems = computed(() => {
    const supplied = translatedExternalItems('transitThemeClustering')
    if (supplied.length) return topItems(supplied)

    const rows     = props.transitConnection?.activationWatch || props.transitChart?.details?.activations || []
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
    const supplied = translatedExternalItems('astrologyBridge')
    if (supplied.length) return topItems(supplied)

    const rows = props.transitConnection?.activationWatch?.length
      ? props.transitConnection.activationWatch
      : activations.value
    return rows.slice(0, 7).map(row => t('human_design.correlations.astrology_bridge_item', {
      planet: planetLabel(row.planet),
      code:   row.code || activationCode(row),
      gate:   row.gate,
    }))
  })

  const diaryItems = computed(() => {
    const supplied = translatedExternalItems('diaryCorrelations')
    if (supplied.length) return topItems(supplied)

    const centerGroups = new Map()
    for (const gate of gates.value) {
      const key     = gate.center || t('human_design.center')
      const current = centerGroups.get(key) || []
      current.push(gate.gate)
      centerGroups.set(key, current)
    }
    return [...centerGroups.entries()]
      .sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0]))
      .slice(0, 5)
      .map(([center, centerGates]) => t('human_design.correlations.diary_item', {
        center: humanDesignValueLabel(t, 'center', center) || center,
        gates:  centerGates.slice(0, 8).join(', '),
      }))
  })

  return computed(() => [
    { key: 'diary', title: t('human_design.correlations.diary'), items: diaryItems.value },
    { key: 'lines', title: t('human_design.correlations.line_pattern'), items: linePatternItems.value },
    { key: 'planets', title: t('human_design.correlations.planet_weighting'), items: planetWeightItems.value },
    { key: 'harmonics', title: t('human_design.correlations.harmonic_completion'), items: harmonicItems.value },
    { key: 'circuits', title: t('human_design.correlations.circuit_balance'), items: circuitItems.value },
    { key: 'cross', title: t('human_design.correlations.cross_resonance'), items: crossItems.value },
    { key: 'variables', title: t('human_design.correlations.variable_consistency'), items: variableItems.value },
    { key: 'relationships', title: t('human_design.correlations.relationship_overlays'), items: relationshipItems.value },
    { key: 'transits', title: t('human_design.correlations.transit_theme_clustering'), items: transitClusterItems.value },
    { key: 'bridge', title: t('human_design.correlations.astrology_bridge'), items: astrologyBridgeItems.value },
  ])
}
