import { CENTER_GATES, CHANNELS, GATE_CENTER } from './constants.js'

/**
 * Canon center model; gates come from constants.js (CENTER_GATES). `classes` are the functional roles
 * (pressure, awareness, motor, expression, identity). Ids match the center names used across the engine
 * ('Ego' is the Heart/Will center).
 */
const CENTER_TRAITS = [
  { id: 'Head',         key: 'head',         shape: 'triangle_up',    classes: ['pressure'],             biology: ['pineal'] },
  { id: 'Ajna',         key: 'ajna',         shape: 'triangle_down',  classes: ['awareness'],            biology: ['hypothalamus', 'pituitary'] },
  { id: 'Throat',       key: 'throat',       shape: 'square',         classes: ['expression'],           biology: ['thyroid', 'parathyroid'] },
  { id: 'G',            key: 'g',            shape: 'diamond',        classes: ['identity'],             biology: ['liver', 'blood'] },
  { id: 'Ego',          key: 'ego',          shape: 'triangle',       classes: ['motor'],                biology: ['heart', 'stomach', 'gallbladder', 'thymus'] },
  { id: 'Solar Plexus', key: 'solar_plexus', shape: 'triangle_left',  classes: ['awareness', 'motor'],   biology: ['kidneys', 'pancreas', 'prostate', 'nervous_system', 'lungs'] },
  { id: 'Spleen',       key: 'spleen',       shape: 'triangle_right', classes: ['awareness'],            biology: ['spleen', 'lymph', 't_cells'] },
  { id: 'Sacral',       key: 'sacral',       shape: 'square',         classes: ['motor'],                biology: ['ovaries', 'testes'] },
  { id: 'Root',         key: 'root',         shape: 'square',         classes: ['pressure', 'motor'],    biology: ['adrenals'] },
]

export const CENTER_MODEL = CENTER_TRAITS.map(center => ({ ...center, gates: CENTER_GATES[center.id] }))

export const CENTER_BY_ID = Object.fromEntries(CENTER_MODEL.map(center => [center.id, center]))

const activatedGates = (chart) =>
  new Set([chart.personality, chart.design].flatMap(layer => Object.values(layer || {}).map(activation => activation.gate)))

/** Channels (records from constants.js) whose two gates are both activated. */
export const definedChannelsForGates = (gates) => CHANNELS.filter(channel => channel.gates.every(gate => gates.has(gate)))

const byNumber = (a, b) => a - b

/**
 * Per center state from a chart's personality/design activations.
 * `defined`: touched by a complete channel. `undefined`: white with hanging gates (the conditioning carriers).
 * `open`: white with no activated gate at all (Jovian Archive: "completely open"). `white` covers both.
 */
export const centerStates = (chart) => {
  const gates   = activatedGates(chart)
  const defined = definedChannelsForGates(gates)

  return CENTER_MODEL.map((center) => {
    const touching  = defined.filter(channel => channel.centers.includes(center.id))
    const inChannel = touching.flatMap(channel => channel.gates).filter(gate => GATE_CENTER[gate] === center.id)
    const active    = center.gates.filter(gate => gates.has(gate)).sort(byNumber)
    const hanging   = active.filter(gate => !inChannel.includes(gate))
    const isDefined = touching.length > 0

    return {
      id:                      center.id,
      key:                     center.key,
      state:                   isDefined ? 'defined' : active.length ? 'undefined' : 'open',
      white:                   !isDefined,
      activatedGates:          active,
      definedGates:            inChannel.sort(byNumber),
      hangingGates:            hanging,
      undefinedActivatedGates: isDefined ? [] : hanging,
      channels:                touching.map(channel => channel.key),
    }
  })
}
