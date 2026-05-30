import { CHANNEL_CENTERS } from '../../lib/human-design/constants.js'

export const channelGates = (channel) => channel.split('-').map(Number)

export const channelCenters = (channel) => CHANNEL_CENTERS[channel] || []

export const hoverMatchesChannel = (hover, channel) => {
  if (!hover) return false
  const gates = channelGates(channel)
  const centers = channelCenters(channel)

  if (hover.type === 'channel') return hover.value === channel
  if (hover.type === 'center') return centers.includes(hover.value)
  if (hover.type === 'gate') return gates.includes(Number(hover.value))
  return false
}

export const hoverMatchesCenter = (hover, center, centerGates = []) => {
  if (!hover) return false
  if (hover.type === 'center') return hover.value === center
  if (hover.type === 'gate') return centerGates.includes(Number(hover.value))
  if (hover.type === 'channel') return channelCenters(hover.value).includes(center)
  return false
}

export const hoverMatchesGate = (hover, gate, center) => {
  if (!hover) return false
  if (hover.type === 'gate') return Number(hover.value) === Number(gate)
  if (hover.type === 'center') return hover.value === center
  if (hover.type === 'channel') return channelGates(hover.value).includes(Number(gate))
  return false
}
