import { computed, ref } from 'vue'
import { GATE_CENTER } from '../../../lib/human-design/layout.js'
import { mergeRelated, relatedTo, sameSelection } from '../bodygraph/bodygraphSelection.js'

/**
 * Shared selection of the Human Design stage: `{ type, value }` with
 *  - type `center` | `channel` | `gate`: drawn by the bodygraph and the mandala (value: center id, '10-34', gate number);
 *  - type `summary`: a chip of the header (value: type, strategy, authority, profile, definition, cross, signature, notSelf);
 *  - type `variable`: one Variable arrow (value: digestion, environment, motivation, perspective).
 */
export const BODY_TYPES = ['center', 'channel', 'gate']

export const isBodySelection = selection => BODY_TYPES.includes(selection?.type)

export const AUTHORITY_CENTER = {
  Emotional:        'Solar Plexus',
  Sacral:           'Sacral',
  Splenic:          'Spleen',
  'Ego Manifested': 'Ego',
  'Ego Projected':  'Ego',
  'Self Projected': 'G',
}

const lit = ({ centers = [], channels = [], gates = [] }) => ({ centers, channels, gates })

const arrayed = related => lit(Object.fromEntries(Object.entries(related).map(([group, set]) => [group, [...set]])))
const ofCenters = centers => centers.length ? arrayed(centers.map(center => relatedTo({ type: 'center', value: center })).reduce(mergeRelated)) : null

const ofGates   = gates => lit({ gates, centers: gates.map(gate => GATE_CENTER[gate]) })

const SUMMARY_LIT = {
  authority:  chart => ofCenters([AUTHORITY_CENTER[chart.authority]].filter(Boolean)),
  definition: chart => lit({ centers: chart.centers, channels: chart.channels, gates: chart.channels.flatMap(id => id.split('-').map(Number)) }),
  cross:      chart => ofGates(chart.incarnationCross.gates),
  profile:    chart => ofGates([chart.personality.Sun.gate, chart.design.Sun.gate]),
}

/** What a selection lights on the bodygraph, the mandala and the activation lists: `{ centers, channels, gates }` or null. */
export const litBySelection = (chart, selection) => {
  if (isBodySelection(selection)) return arrayed(relatedTo(selection))
  if (selection?.type === 'variable') return ofGates([chart.variableDetails.arrows[selection.value].gate])
  return selection?.type === 'summary' ? SUMMARY_LIT[selection.value]?.(chart) ?? null : null
}

/** Pin and hover state shared by every view of the stage: `select` pins, `toggle` also releases the pinned item. */
export const useStageSelection = () => {
  const pinned  = ref(null)
  const hovered = ref(null)

  const select = item => { pinned.value = item }
  const toggle = item => select(sameSelection(item, pinned.value) ? null : item)
  const hover  = item => { hovered.value = item }
  const active = computed(() => hovered.value ?? pinned.value)

  return { pinned, hovered, active, select, toggle, hover, clear: () => select(null) }
}
