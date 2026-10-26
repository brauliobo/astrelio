import { CHANNEL_BY_KEY } from '../../../lib/human-design/constants.js'

export const SIDES = ['design', 'personality']

/** Layers (design, personality) that activate a gate. */
export const gateTones = (chart, gate) => SIDES.filter(side => chart[`${side}Gates`].includes(Number(gate)))

export const channelStatus = (chart, id) => {
  if (chart.channels.includes(id)) return 'defined'
  return CHANNEL_BY_KEY[id].gates.some(gate => chart.gates.includes(gate)) ? 'hanging' : 'open'
}

export const centerStateOf = (chart, id) => chart.centerStates.find(center => center.id === id)

/** Every activation (layer, planet, line...) sitting on a gate. */
export const activationsAt = (chart, gate) =>
  SIDES.flatMap(side => Object.entries(chart[side]).map(([planet, activation]) => ({ side, planet, ...activation })))
    .filter(activation => activation.gate === Number(gate))
