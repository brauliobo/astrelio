const typeText = {
  Generator: 'Consistent sacral energy is central; satisfaction grows through clear response.',
  'Manifesting Generator': 'Sacral response and fast movement combine; clarity improves when action follows response.',
  Manifestor: 'Initiating energy is central; informing others reduces resistance around independent action.',
  Projector: 'Focused guidance is central; recognition and timing shape where energy lands well.',
  Reflector: 'Openness is central; time and environment reveal what is reliable.',
}

const authorityText = {
  Emotional: 'Emotional authority favors waiting for the wave to settle before deciding.',
  Sacral: 'Sacral authority favors body-level yes/no response in the moment.',
  Splenic: 'Splenic authority favors quiet, immediate instinct.',
  'Ego Projected': 'Ego authority tracks promises, will, and what can honestly be sustained.',
  'Self Projected': 'Self-projected authority clarifies through speaking from identity and direction.',
  'Sounding Board': 'Mental authority clarifies through trusted environments and reflection.',
  Lunar: 'Lunar authority needs time and repeated conditions before clarity forms.',
}

export const humanDesignInterpretationSections = (chart) => {
  if (!chart) return []

  return [
    {
      key: 'essentials',
      title: 'Essentials',
      items: [
        { key: 'type', title: chart.type, text: typeText[chart.type] || 'This type describes how energy meets the world.' },
        { key: 'authority', title: `${chart.authority} authority`, text: authorityText[chart.authority] || 'Authority describes the decision signal to privilege.' },
        { key: 'profile', title: `Profile ${chart.profile}`, text: 'Profile blends conscious and design lines into a recurring life role.' },
      ],
    },
    {
      key: 'definition',
      title: 'Definition',
      items: [
        { key: 'definition', title: chart.definition, text: `${chart.centers.length} centers and ${chart.channels.length} channels are defined.` },
        { key: 'circuits', title: chart.circuits.join(', ') || 'Open circuitry', text: 'Circuitry shows whether definition tends toward individual, collective, or tribal themes.' },
      ],
    },
    {
      key: 'gates',
      title: 'Gates',
      items: chart.gates.slice(0, 6).map(gate => ({
        key: `gate-${gate}`,
        title: `Gate ${gate}`,
        text: chart.personalityGates.includes(gate) && chart.designGates.includes(gate)
          ? 'Active in both personality and design.'
          : chart.personalityGates.includes(gate)
            ? 'Conscious/personality activation.'
            : 'Design/body activation.',
      })),
    },
  ]
}

export const humanDesignConnectionInsights = (connection) => {
  if (!connection) return []

  return [
    {
      key: 'electromagnetic',
      title: 'Electromagnetic pull',
      text: connection.electromagnetic.length
        ? `${connection.electromagnetic.length} channel potentials are completed between both charts.`
        : 'No electromagnetic channels are completed by the pair.',
    },
    {
      key: 'companionship',
      title: 'Familiar definition',
      text: connection.companionship.length
        ? `${connection.companionship.length} channels are shared.`
        : 'Shared channels are not the main bond pattern here.',
    },
    {
      key: 'shared-centers',
      title: 'Shared centers',
      text: connection.sharedCenters.length
        ? connection.sharedCenters.join(', ')
        : 'The charts emphasize different centers.',
    },
  ]
}
