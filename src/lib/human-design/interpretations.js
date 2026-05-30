import { humanDesignListLabel, humanDesignValueKey, humanDesignValueLabel } from './labels.js'

const fallbackT = (key, params = {}) =>
  Object.entries(params).reduce((text, [name, value]) => text.replace(`{${name}}`, value), key)

const insightText = (t, path, params = {}) => t(`human_design.insight_text.${path}`, params)

export const humanDesignInterpretationSections = (chart, t = fallbackT) => {
  if (!chart) return []

  const typeKey = humanDesignValueKey('type', chart.type)
  const authorityKey = humanDesignValueKey('authority', chart.authority)
  const circuitTitle = chart.circuits.length
    ? humanDesignListLabel(t, 'circuit', chart.circuits)
    : t('human_design.open_circuitry')

  return [
    {
      key: 'essentials',
      title: t('human_design.insight_sections.essentials'),
      items: [
        {
          key: 'type',
          title: humanDesignValueLabel(t, 'type', chart.type),
          text: insightText(t, `types.${typeKey || 'fallback'}`),
        },
        {
          key: 'authority',
          title: t('human_design.authority_title', { authority: humanDesignValueLabel(t, 'authority', chart.authority) }),
          text: insightText(t, `authorities.${authorityKey || 'fallback'}`),
        },
        {
          key: 'profile',
          title: t('human_design.profile_title', { profile: chart.profile }),
          text: insightText(t, 'profile'),
        },
      ],
    },
    {
      key: 'definition',
      title: t('human_design.definition'),
      items: [
        {
          key: 'definition',
          title: humanDesignValueLabel(t, 'definition', chart.definition),
          text: insightText(t, 'definition_count', { centers: chart.centers.length, channels: chart.channels.length }),
        },
        {
          key: 'circuits',
          title: circuitTitle,
          text: insightText(t, 'circuits'),
        },
      ],
    },
    {
      key: 'gates',
      title: t('human_design.insight_sections.gates'),
      items: chart.gates.slice(0, 6).map(gate => ({
        key: `gate-${gate}`,
        title: t('human_design.gate_title', { gate }),
        text: chart.personalityGates.includes(gate) && chart.designGates.includes(gate)
          ? insightText(t, 'gate_both')
          : chart.personalityGates.includes(gate)
            ? insightText(t, 'gate_personality')
            : insightText(t, 'gate_design'),
      })),
    },
  ]
}

export const humanDesignConnectionInsights = (connection, t = fallbackT) => {
  if (!connection) return []

  return [
    {
      key: 'electromagnetic',
      title: t('human_design.connection_insights.electromagnetic_title'),
      text: connection.electromagnetic.length
        ? t('human_design.connection_insights.electromagnetic_text', { count: connection.electromagnetic.length })
        : t('human_design.connection_insights.electromagnetic_empty'),
    },
    {
      key: 'companionship',
      title: t('human_design.connection_insights.companionship_title'),
      text: connection.companionship.length
        ? t('human_design.connection_insights.companionship_text', { count: connection.companionship.length })
        : t('human_design.connection_insights.companionship_empty'),
    },
    {
      key: 'shared-centers',
      title: t('human_design.shared_centers'),
      text: connection.sharedCenters.length
        ? humanDesignListLabel(t, 'center', connection.sharedCenters)
        : t('human_design.connection_insights.shared_centers_empty'),
    },
  ]
}
