import { CENTER_TOKEN, CHANNEL_LAYOUT } from '../../../lib/human-design/layout.js'

const LAYER_SOURCES = {
  both:        ['design', 'personality'],
  design:      ['design'],
  personality: ['personality'],
}

const gatesOf = activations => new Set(Object.values(activations || {}).map(({ gate }) => gate))

// Which layer paints a gate: 'design', 'personality', 'both' or null when it is not activated.
const gateStateFor = (gate, sets) => {
  const layers = Object.keys(sets).filter(layer => sets[layer].has(gate))
  return layers.length === 2 ? 'both' : layers[0] || null
}

const channelStatusFor = (halves, whole) => {
  if (whole) return 'defined'
  return halves.some(Boolean) ? 'hanging' : 'open'
}

export const bodygraphState = (chart, layers = 'both') => {
  const sets    = Object.fromEntries(LAYER_SOURCES[layers].map(layer => [layer, gatesOf(chart[layer])]))
  const gates   = Object.fromEntries(Array.from({ length: 64 }, (_, i) => [i + 1, gateStateFor(i + 1, sets)]))
  const charted = new Set(chart.channels || [])

  const channels = Object.fromEntries(Object.values(CHANNEL_LAYOUT).map(({ id, gates: ends }) => {
    const halves = ends.map(gate => gates[gate])
    const whole  = layers === 'both' ? charted.has(id) : halves.every(Boolean)
    return [id, { id, status: channelStatusFor(halves, whole), halves }]
  }))

  const centers = new Set(layers === 'both'
    ? chart.centers
    : Object.values(channels).filter(({ status }) => status === 'defined').flatMap(({ id }) => CHANNEL_LAYOUT[id].centers))

  return { gates, channels, centers }
}

export const centerToneStyle = (center) => {
  const token = CENTER_TOKEN[center]
  return { '--c-fill': `var(--hd-${token})`, '--c-stroke': `var(--hd-${token}-stroke)`, '--c-ink': `var(--hd-${token}-ink)` }
}
