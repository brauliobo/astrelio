import { CENTERS, CHANNEL_BY_KEY, CHANNELS, HD_DEFINITIONS, MOTOR_CENTERS } from './constants.js'

const sortedUnique       = values => [...new Set(values)].sort()
export const sortedGates = values => [...new Set(values)].sort((a, b) => a - b)

export const channelsForGates = (gateSet) =>
  CHANNELS.filter(channel => channel.gates.every(gate => gateSet.has(gate))).map(channel => channel.key)

const adjacencyFor = (channels) => {
  const graph = new Map()
  for (const [a, b] of channels.map(channel => CHANNEL_BY_KEY[channel].centers)) {
    graph.set(a, [...(graph.get(a) || []), b])
    graph.set(b, [...(graph.get(b) || []), a])
  }
  return graph
}

const reachableFrom = (graph, start) => {
  const seen = new Set([start])
  for (const center of seen) {
    for (const next of graph.get(center) || []) seen.add(next)
  }
  return seen
}

const componentsFor = (graph) => {
  const components = []
  for (const center of graph.keys()) {
    if (!components.some(component => component.has(center))) components.push(reachableFrom(graph, center))
  }
  return components.map(component => CENTERS.filter(center => component.has(center)))
}

const motorsConnectedToThroat = (graph) => {
  const throatGroup = reachableFrom(graph, 'Throat')
  return MOTOR_CENTERS.filter(motor => throatGroup.has(motor))
}

const typeFor = (graph, motors) => {
  if (!graph.size) return 'Reflector'
  if (graph.has('Sacral')) return motors.length ? 'Manifesting Generator' : 'Generator'
  return motors.length ? 'Manifestor' : 'Projector'
}

const authorityFor = (graph) => {
  if (!graph.size) return 'Lunar'
  if (graph.has('Solar Plexus')) return 'Emotional'
  if (graph.has('Sacral')) return 'Sacral'
  if (graph.has('Spleen')) return 'Splenic'
  if (graph.has('Ego')) return reachableFrom(graph, 'Ego').has('Throat') ? 'Ego Manifested' : 'Ego Projected'
  if (graph.has('G')) return 'Self Projected'
  return 'Sounding Board'
}

const definitionFor = (components) => HD_DEFINITIONS[Math.min(components.length, HD_DEFINITIONS.length - 1)]

// Undefined channels that would join two different definition areas: one missing gate when
// the other is already held (gate bridge), or both gates when neither is (channel bridge).
const bridgesFor = (gateSet, channels, components) => {
  const areaOf  = center => components.findIndex(component => component.includes(center))
  const bridges = { gates: [], channels: [] }

  for (const channel of CHANNELS.filter(item => !channels.includes(item.key))) {
    const areas = channel.centers.map(areaOf)
    if (areas.includes(-1) || areas[0] === areas[1]) continue

    const missing = channel.gates.filter(gate => !gateSet.has(gate))
    if (missing.length === 1) bridges.gates.push({ gate: missing[0], channel: channel.key, areas })
    else bridges.channels.push({ channel: channel.key, gates: channel.gates, areas })
  }

  return bridges
}

const bridgeConnects = (components, gateBridges) => {
  const joined = components.map((_, index) => new Set([index]))
  for (const { areas: [a, b] } of gateBridges) {
    const merged = new Set([...joined[a], ...joined[b]])
    for (const area of merged) joined[area] = merged
  }
  return joined.every(group => group.size === components.length)
}

// A split is small when single gates alone can join every area, large when some gap needs a whole channel.
const splitSizeFor = (components, bridges) => {
  if (components.length < 2) return null
  return bridgeConnects(components, bridges.gates) ? 'small' : 'large'
}

export const humanDesignStateForGates = (gates) => {
  const gateList   = sortedGates(gates)
  const gateSet    = new Set(gateList)
  const channels   = channelsForGates(gateSet)
  const graph      = adjacencyFor(channels)
  const components = componentsFor(graph)
  const motors     = motorsConnectedToThroat(graph)
  const bridges    = bridgesFor(gateSet, channels, components)

  return {
    gates:          gateList,
    channels,
    centers:        sortedUnique(graph.keys()),
    type:           typeFor(graph, motors),
    authority:      authorityFor(graph),
    definition:     definitionFor(components),
    components,
    splitSize:      splitSizeFor(components, bridges),
    bridges,
    motorsToThroat: motors,
  }
}

// Type, authority and definition of a chart combined with extra gates (transit, partner, penta).
export const definitionWith = (chart, extraGates = []) =>
  humanDesignStateForGates([...(chart?.gates || []), ...extraGates])
