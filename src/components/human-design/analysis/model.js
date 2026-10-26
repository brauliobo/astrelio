import { CENTER_BY_ID } from '../../../lib/human-design/centers.js'
import { CHANNEL_BY_KEY, CHANNEL_CIRCUITS, CHANNELS, GATE_CENTER } from '../../../lib/human-design/constants.js'

export const CENTER_CLASSES = ['pressure', 'awareness', 'motor', 'expression', 'identity']
export const GATE_NUMBERS   = Array.from({ length: 64 }, (_, index) => index + 1)

const BALANCE = [
  { id: 'individual', circuits: ['Individual'] },
  { id: 'tribal',     circuits: ['Tribal'] },
  { id: 'collective', circuits: ['Collective Logic', 'Collective Abstract'] },
]

const unique = values => [...new Set(values)]

export const normalizeText = text => String(text).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** The center states joined with the canon traits (classes, biology, gate list), grouped by primary function class. */
export const centersByClass = chart => {
  const cards = chart.centerStates.map(state => ({ ...CENTER_BY_ID[state.id], ...state, total: CENTER_BY_ID[state.id].gates.length }))
  return CENTER_CLASSES.map(id => ({ id, centers: cards.filter(card => card.classes[0] === id) }))
}

const heldGates = chart => new Map(chart.details.gates.map(row => [row.gate, row]))

export const layerOf = layers => (layers.length === 2 ? 'both' : layers[0] ?? null)

/** Activations (layer, planet, line, code) of one gate in the chart. */
export const activationsOf = (chart, gate) => heldGates(chart).get(gate)?.activations ?? []

/** All 64 gates with their state in the chart: layer ('design'|'personality'|'both'|null), defined/hanging and circuits. */
export const gateRows = (chart, labels) => {
  const held = heldGates(chart)

  return GATE_NUMBERS.map(gate => {
    const row = held.get(gate)

    return {
      gate,
      center:     GATE_CENTER[gate],
      name:       labels.gate(gate),
      centerName: labels.center(GATE_CENTER[gate]),
      layer:      row ? layerOf(row.layers) : null,
      active:     Boolean(row),
      defined:    Boolean(row) && !row.isHanging,
      hanging:    Boolean(row?.isHanging),
      circuits:   unique(CHANNELS.filter(channel => channel.gates.includes(gate)).map(channel => channel.circuit)),
    }
  })
}

const MODES = {
  all:     () => true,
  active:  row => row.active,
  defined: row => row.defined,
  hanging: row => row.hanging,
}

const matchesQuery = (row, query) => {
  if (!query) return true
  return String(row.gate).startsWith(query) || normalizeText(`${row.name} ${row.centerName}`).includes(query)
}

export const GATE_MODES = Object.keys(MODES)

export const filterGates = (rows, { query = '', mode = 'all', center = '', circuit = '' }) => {
  const needle = normalizeText(query.trim())

  return rows.filter(row =>
    MODES[mode](row) &&
    matchesQuery(row, needle) &&
    (!center || row.center === center) &&
    (!circuit || row.circuits.includes(circuit))
  )
}

/** Share of the defined channels in each circuit family (collective keeps its logic/abstract parts). */
export const circuitBalance = channels => BALANCE.map(({ id, circuits }) => {
  const parts = circuits.map(circuit => ({ circuit, count: channels.filter(key => CHANNEL_CIRCUITS[key] === circuit).length }))
  const count = parts.reduce((sum, part) => sum + part.count, 0)

  return { id, count, share: channels.length ? count / channels.length : 0, parts }
})

/** Defined streams (sub-circuits) with their channel counts. */
export const definedStreams = channels =>
  unique(channels.map(key => CHANNEL_BY_KEY[key].stream)).map(stream => ({
    stream,
    channels: channels.filter(key => CHANNEL_BY_KEY[key].stream === stream),
  }))

/** Gate bridges grouped by missing gate (with the gate of the channel the chart already holds) and whole-channel bridges. */
export const bridgeRows = chart => {
  const gates = new Map()

  for (const { gate, channel, areas } of chart.bridges.gates) {
    const row = gates.get(gate) ?? { gate, channels: [] }
    row.channels.push({ channel, areas, held: CHANNEL_BY_KEY[channel].gates.find(other => other !== gate) })
    gates.set(gate, row)
  }

  return { gates: [...gates.values()].sort((a, b) => a.gate - b.gate), channels: chart.bridges.channels }
}

export const areaNumbers = areas => unique(areas).map(index => index + 1).sort((a, b) => a - b)

export const hangingGates = chart => chart.details.gates.filter(row => row.isHanging)
