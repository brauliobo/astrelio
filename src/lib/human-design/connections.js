import { channelKey } from './activations.js'
import { CENTER_THEMES, CENTERS, CHANNEL_CENTERS, CHANNEL_NAMES, GATE_NAMES, HARMONIC_GATES, LOVE_GATES, MATERIAL_CHANNELS } from './constants.js'

const intersection = (a, b) => a.filter(value => b.includes(value))
const difference   = (a, b) => a.filter(value => !b.includes(value))

const channelGates = (channel) => channel.split('-').map(Number)

const hasAnyGate = (gateSet, gates) => gates.some(gate => gateSet.has(gate))

const fullChannelsFor = (chart) => new Set(chart?.channels || [])
const gatesFor        = (chart) => new Set(chart?.gates || [])

const channelsForGates = (gateSet) =>
  [...gateSet].flatMap(gate =>
    (HARMONIC_GATES[gate] || [])
      .filter(harmonic => gateSet.has(harmonic))
      .map(harmonic => channelKey(gate, harmonic))
      .filter(channel => CHANNEL_CENTERS[channel])
  )

const channelDetail = channel => ({
  channel,
  name:       CHANNEL_NAMES[channel] || channel,
  centers:    CHANNEL_CENTERS[channel] || [],
  gates:      channelGates(channel),
  isLove:     channelGates(channel).some(gate => LOVE_GATES.includes(gate)),
  isMaterial: MATERIAL_CHANNELS.includes(channel),
})

const electromagneticChannels = (chartA, chartB) => {
  const gatesA   = gatesFor(chartA)
  const gatesB   = gatesFor(chartB)
  const channels = []

  for (const gate of gatesA) {
    for (const harmonic of HARMONIC_GATES[gate] || []) {
      const key = channelKey(gate, harmonic)
      if (CHANNEL_CENTERS[key] && gatesB.has(harmonic)) channels.push(key)
    }
  }

  return [...new Set(channels)].sort()
}

const compromiseChannels = (definedChart, partialChart) => {
  const partialGates = gatesFor(partialChart)
  return (definedChart?.channels || [])
    .filter(channel => {
      const gates = channelGates(channel)
      return hasAnyGate(partialGates, gates) && !gates.every(gate => partialGates.has(gate))
    })
    .sort()
}

const dominanceChannels = (definedChart, otherChart) => {
  const otherGates = gatesFor(otherChart)
  return (definedChart?.channels || [])
    .filter(channel => !hasAnyGate(otherGates, channelGates(channel)))
    .sort()
}

export const humanDesignConnection = (chartA, chartB) => {
  if (!chartA || !chartB) return null

  const channelsA         = fullChannelsFor(chartA)
  const channelsB         = fullChannelsFor(chartB)
  const compositeGates    = new Set([...gatesFor(chartA), ...gatesFor(chartB)])
  const compositeChannels = [...new Set(channelsForGates(compositeGates))].sort()
  const compositeCenters  = [...new Set(compositeChannels.flatMap(channel => CHANNEL_CENTERS[channel] || []))].sort()
  const companionship     = [...channelsA].filter(channel => channelsB.has(channel)).sort()
  const electromagnetic   = difference(electromagneticChannels(chartA, chartB), companionship)
  const compromise        = [
    ...compromiseChannels(chartA, chartB).map(channel => ({ channel, owner: chartA.personId })),
    ...compromiseChannels(chartB, chartA).map(channel => ({ channel, owner: chartB.personId })),
  ]
  const dominance = [
    ...dominanceChannels(chartA, chartB).map(channel => ({ channel, owner: chartA.personId })),
    ...dominanceChannels(chartB, chartA).map(channel => ({ channel, owner: chartB.personId })),
  ]

  const themes = [
    electromagnetic.length ? 'electromagnetic' : '',
    companionship.length ? 'companionship' : '',
    compromise.length ? 'compromise' : '',
    dominance.length ? 'dominance' : '',
  ].filter(Boolean)

  return {
    personAId:      chartA.personId,
    personBId:      chartB.personId,
    sharedCenters:  intersection(chartA.centers, chartB.centers),
    openCenters:    CENTERS.filter(center => !compositeCenters.includes(center)),
    centerDynamics: CENTERS.map(center => ({
      center,
      theme:              CENTER_THEMES[center],
      definedInComposite: compositeCenters.includes(center),
      definedByA:         chartA.centers.includes(center),
      definedByB:         chartB.centers.includes(center),
    })),
    connectionTheme:   `${compositeCenters.length}-${CENTERS.length - compositeCenters.length}`,
    compositeGates:    [...compositeGates].sort((a, b) => a - b).map(gate => ({ gate, name: GATE_NAMES[gate] || `Gate ${gate}` })),
    compositeChannels: compositeChannels.map(channelDetail),
    electromagnetic,
    electromagneticDetails: electromagnetic.map(channelDetail),
    compromise,
    compromiseDetails: compromise.map(item => ({ ...item, ...channelDetail(item.channel) })),
    dominance,
    dominanceDetails: dominance.map(item => ({ ...item, ...channelDetail(item.channel) })),
    companionship,
    companionshipDetails: companionship.map(channelDetail),
    themes,
  }
}
