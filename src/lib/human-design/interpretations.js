import {
  humanDesignChannelLabel,
  humanDesignCrossTitleLabel,
  humanDesignGateLabel,
  humanDesignListLabel,
  humanDesignStreamLabel,
  humanDesignValueKey,
  humanDesignValueLabel,
} from './labels.js'

export {
  buildHumanDesignReadingDocument,
  HUMAN_DESIGN_READING_SCHEMA,
  HUMAN_DESIGN_READING_VERSION,
  humanDesignReadingDocument,
} from './readings/index.js'

const fallbackT = (key, params = {}) =>
  Object.entries(params).reduce((text, [name, value]) => text.replace(`{${name}}`, value), key)

const insightText = (t, path, params = {}) => t(`human_design.insight_text.${path}`, params)

const strategyKeys = {
  'Wait to respond':                       'wait_to_respond',
  'Wait to respond, then inform':          'wait_to_respond_inform',
  'Inform before acting':                  'inform_before_acting',
  'Wait for recognition and invitation': 'wait_for_invitation',
  'Wait through the lunar cycle':          'wait_lunar_cycle',
}

const strategyLabel = (t, strategy) => t(`human_design.strategies.${strategyKeys[strategy] || strategy}`)
const variableLabel = (t, variable) => t(`human_design.variable_labels.${variable.id}.label`)
const orientationLabel = (t, orientation) => t(`human_design.orientations.${orientation || 'unknown'}`)
const variableColorLabel = (t, variable) =>
  variable.color ? t(`human_design.variable_colors.${variable.id}.${variable.color}`) : '-'

export const humanDesignInterpretationSections = (chart, t = fallbackT) => {
  if (!chart) return []

  const typeKey      = humanDesignValueKey('type', chart.type)
  const authorityKey = humanDesignValueKey('authority', chart.authority)
  const openCenters  = chart.undefinedCenters || []
  const circuits     = chart.circuits || []
  const circuitTitle = circuits.length
    ? humanDesignListLabel(t, 'circuit', circuits)
    : t('human_design.open_circuitry')

  const coreSections = [
    {
      key:   'essentials',
      title: t('human_design.insight_sections.essentials'),
      items: [
        {
          key:   'type',
          title: humanDesignValueLabel(t, 'type', chart.type),
          text:  insightText(t, `types.${typeKey || 'fallback'}`),
        },
        {
          key:   'authority',
          title: t('human_design.authority_title', { authority: humanDesignValueLabel(t, 'authority', chart.authority) }),
          text:  insightText(t, `authorities.${authorityKey || 'fallback'}`),
        },
        {
          key:   'profile',
          title: t('human_design.profile_title', { profile: chart.profile }),
          text:  insightText(t, 'profile'),
        },
        {
          key:   'strategy',
          title: t('human_design.strategy'),
          text:  chart.strategy
            ? `${strategyLabel(t, chart.strategy)}. ${t('human_design.insight_text.strategy')}`
            : t('human_design.insight_text.strategy'),
        },
      ],
    },
    {
      key:   'definition',
      title: t('human_design.definition'),
      items: [
        {
          key:   'definition',
          title: humanDesignValueLabel(t, 'definition', chart.definition),
          text:  insightText(t, 'definition_count', { centers: chart.centers.length, channels: chart.channels.length }),
        },
        {
          key:   'circuits',
          title: circuitTitle,
          text:  chart.details?.circuits?.length
            ? chart.details.circuits.map(circuit =>
              `${humanDesignValueLabel(t, 'circuit', circuit.circuit)}: ${
                circuit.streams?.length
                  ? circuit.streams.map(stream => humanDesignStreamLabel(t, stream)).join(', ')
                  : circuit.channels
                    .map(channel => `${channel} · ${humanDesignChannelLabel(t, channel)}`)
                    .join(', ')
              }`
            ).join(' · ')
            : insightText(t, 'circuits'),
        },
        {
          key:   'centers',
          title: t('human_design.centers_title'),
          text:  t('human_design.insight_text.centers', {
            defined: chart.centers?.length || 0,
            open:    openCenters.length,
          }),
        },
      ],
    },
  ]

  const incarnationSection = chart.incarnationCross ? [{
    key:   'incarnation-cross',
    title: t('human_design.incarnation_cross'),
    items: [{
      key:   'incarnation-cross',
      title: humanDesignCrossTitleLabel(t, chart.incarnationCross),
      text:  t('human_design.insight_text.incarnation_cross', {
        quarter: chart.incarnationCross.quarter?.name
          ? t(`human_design.quarters.${chart.incarnationCross.quarter.name}`)
          : '-',
        gates:   chart.incarnationCross.gates.join(' / '),
      }),
    }],
  }] : []

  const variableSection = chart.variables?.length ? [{
    key:   'variables',
    title: t('human_design.variables'),
    items: chart.variables.map(variable => ({
      key:   `variable-${variable.id}`,
      title: `${variableLabel(t, variable)}: ${variableColorLabel(t, variable)}`,
      text:  t('human_design.insight_text.variable', {
        orientation: orientationLabel(t, variable.orientation),
        color:       variableColorLabel(t, variable),
        tone:        variable.tone || '-',
        base:        variable.base || '-',
      }),
    })),
  }] : []

  const gateItems = (chart.details?.gates || []).slice(0, 8).map(gate => ({
    key:   `gate-${gate.gate}`,
    title: `${t('human_design.gate_title', { gate: gate.gate })} · ${humanDesignGateLabel(t, gate.gate, gate.name)}`,
    text:  gate.activations.length > 1
      ? t('human_design.insight_text.gate_multiple', {
        count:  gate.activations.length,
        center: humanDesignValueLabel(t, 'center', gate.center),
      })
      : chart.personalityGates.includes(gate.gate) && chart.designGates.includes(gate.gate)
        ? insightText(t, 'gate_both')
        : chart.personalityGates.includes(gate.gate)
          ? insightText(t, 'gate_personality')
          : insightText(t, 'gate_design'),
  }))

  return [
    ...coreSections,
    ...incarnationSection,
    ...variableSection,
    {
      key:   'gates',
      title: t('human_design.insight_sections.gates'),
      items: gateItems,
    },
  ]
}

export const humanDesignConnectionInsights = (connection, t = fallbackT) => {
  if (!connection) return []

  return [
    {
      key:   'electromagnetic',
      title: t('human_design.connection_insights.electromagnetic_title'),
      text:  connection.electromagnetic.length
        ? t('human_design.connection_insights.electromagnetic_text', { count: connection.electromagnetic.length })
        : t('human_design.connection_insights.electromagnetic_empty'),
    },
    {
      key:   'companionship',
      title: t('human_design.connection_insights.companionship_title'),
      text:  connection.companionship.length
        ? t('human_design.connection_insights.companionship_text', { count: connection.companionship.length })
        : t('human_design.connection_insights.companionship_empty'),
    },
    {
      key:   'shared-centers',
      title: t('human_design.shared_centers'),
      text:  connection.sharedCenters.length
        ? humanDesignListLabel(t, 'center', connection.sharedCenters)
        : t('human_design.connection_insights.shared_centers_empty'),
    },
    {
      key:   'connection-theme',
      title: t('human_design.connection_theme'),
      text:  t('human_design.connection_insights.connection_theme_text', { theme: connection.connectionTheme || '0-9' }),
    },
  ]
}
