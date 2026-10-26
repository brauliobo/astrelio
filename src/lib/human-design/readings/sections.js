import { humanDesignContentKey } from '../labels.js'
import { hasLine6, LINE_6_STAGES } from '../profiles.js'
import { ARROWS } from '../variables.js'

const TOP_GATES      = 6
const CROSS_PLANETS  = ['sun', 'earth']
const TYPE_FIELDS    = ['summary', 'aura', 'strategy', 'signature', 'not_self', 'guidance']
const DEFINED_CENTER  = ['biology', 'role', 'defined']
const WHITE_CENTER   = ['biology', 'role', 'undefined', 'not_self_question', 'healthy']

const unique = values => [...new Set(values)].filter(Boolean).sort()

const row  = (id, path, evidenceIds, params = {}) => ({ id, content: { key: humanDesignContentKey(...path), params }, evidenceIds })
const rows = (id, path, fields, evidenceIds) => fields.map(field => row(`${id}:${field}`, [...path, field], evidenceIds))

const typeRows      = ({ type }) => rows('type', ['types', type.value], TYPE_FIELDS, ['mechanics:type'])
const authorityRows = ({ authority }) => rows('authority', ['authorities', authority.value], ['how', 'practice'], ['mechanics:authority'])

const profileRows = (info) => info ? [
  ...rows('profile', ['profiles', info.id], ['name', 'summary'], ['profile']),
  ...[info.conscious, info.unconscious].map(line => row(`profile:line:${line}`, ['line_archetypes', line, 'summary'], ['profile'])),
  ...(hasLine6(info) ? LINE_6_STAGES.map(stage => row(`profile:line6:${stage.id}`, ['line6_stages', stage.id, 'summary'], ['profile'])) : []),
] : []

const bridgeParams = ({ gates, channels }) => ({
  gates:    gates.map(item => item.gate).join('/'),
  channels: channels.map(item => item.channel).join('/'),
})

const definitionRows = (chart, definition) => [
  row('definition', ['definitions', definition.value, 'summary'], ['definition']),
  ...(chart.splitSize ? [row('definition:split_size', ['split_size', chart.splitSize], ['definition'])] : []),
  ...(chart.bridges?.gates.length || chart.bridges?.channels.length
    ? [row('definition:bridge', ['bridge', 'summary'], ['definition'], bridgeParams(chart.bridges))]
    : []),
]

const stateEvidence = state => [`center:${state.key}`, ...state.hangingGates.map(gate => `gate:${gate}`)]

const definedCenterRows = states => states.filter(state => !state.white)
  .flatMap(state => rows(`center:${state.key}`, ['centers', state.key], DEFINED_CENTER, [`center:${state.key}`]))

const whiteCenterRows = states => states.filter(state => state.white).flatMap(state => [
  row(`center:${state.key}:state`, ['center_states', state.state, 'summary'], stateEvidence(state), {
    center: state.key,
    gates:  state.hangingGates.join('/'),
  }),
  ...rows(`center:${state.key}`, ['centers', state.key], WHITE_CENTER, [`center:${state.key}`]),
])

const circuitRows = channels => ['circuit', 'stream'].flatMap(field =>
  unique(channels.map(channel => channel[field])).map(id => row(
    `circuit:${id}`,
    ['circuits_info', id, 'summary'],
    channels.filter(channel => channel[field] === id).flatMap(channel => channel.evidenceIds)
  ))
)

const crossRows = cross => [
  row('cross:angle', ['crosses', cross.geometry, 'summary'], ['incarnation-cross']),
  ...(cross.quarterKey ? [row('cross:quarter', ['quarters', cross.quarterKey, 'summary'], ['incarnation-cross'])] : []),
]

const arrowRows = ({ arrows }) => ARROWS.flatMap(({ id }) => {
  const arrow    = arrows[id]
  const evidence = [`variable:${id}`]
  return [
    row(`variable:${id}:area`, ['variables', 'areas', id, 'summary'], evidence),
    row(`variable:${id}:color`, ['variables', 'colors', id, arrow.color, 'summary'], evidence),
    row(`variable:${id}:arrow`, ['variables', 'arrows', arrow.orientation, id, 'summary'], evidence),
  ]
})

const variableRows = (details) => details ? [
  ...arrowRows(details),
  row('variable:cognition', ['variables', 'cognition', details.cognition.key, 'summary'], ['variable:digestion']),
  row('variable:transference', ['variables', 'colors', 'motivation', details.transference.color, 'summary'], ['variable:motivation'], { kind: 'transference' }),
  row('variable:distraction', ['variables', 'colors', 'perspective', details.distraction.color, 'summary'], ['variable:perspective'], { kind: 'distraction' }),
  row('variable:shorthand', ['variables', 'shorthand', 'note'], ARROWS.map(({ id }) => `variable:${id}`), { shorthand: details.shorthand }),
] : []

/** Line texts live in the content module (prose per locale), so the document carries `{ gate, line }` for the UI to resolve with `lineContent`. */
const lineTextFact = (role, activation) => ({
  id:          `line-text:${activation.id}`,
  role,
  layer:       activation.layer,
  planet:      activation.planet,
  gate:        activation.gate,
  line:        activation.line,
  lineText:    { gate: activation.gate, line: activation.line },
  label:       { key: `human_design.gate_names.${activation.gate}`, params: {} },
  evidenceIds: [activation.id],
})

const isCrossActivation = activation => CROSS_PLANETS.includes(activation.planet)

/** Gates ranked by how many activations they hold, ties broken by the first (personality-first) body activating them. */
const topGateActivations = (gates, activations) => {
  const firstIndex = gate => activations.findIndex(activation => activation.gate === gate.gate)
  const ranked     = gates.filter(gate => activations.some(activation => activation.gate === gate.gate && !isCrossActivation(activation)))
    .toSorted((a, b) => b.activationIds.length - a.activationIds.length || firstIndex(a) - firstIndex(b))
    .slice(0, TOP_GATES)

  return activations.filter(activation => !isCrossActivation(activation) && ranked.some(gate => gate.gate === activation.gate))
}

export const lineTextFacts = (gates, activations) => [
  ...activations.filter(isCrossActivation).map(activation => lineTextFact('cross', activation)),
  ...topGateActivations(gates, activations).map(activation => lineTextFact('gate', activation)),
]

const idsFor = (lineTexts, role) => lineTexts.filter(item => item.role === role).map(item => item.id)

/** Extra rows (`items`) and line text references (`lineTextIds`) per chapter id, from the chart's canon content keys. */
export const chapterSections = ({ chart, mechanics, definition, channels, cross, lineTexts }) => ({
  decision_making:             { items: [...typeRows(mechanics), ...authorityRows(mechanics)] },
  energy_and_expression:       { items: definedCenterRows(chart.centerStates) },
  identity_and_role:           { items: profileRows(chart.profileInfo) },
  conditioning_and_openness:   { items: whiteCenterRows(chart.centerStates) },
  relationships_and_circuitry: { items: circuitRows(channels) },
  life_theme:                  { items: cross ? crossRows(cross) : [], lineTextIds: idsFor(lineTexts, 'cross') },
  variables_and_transference:  { items: variableRows(chart.variableDetails) },
  gates_and_lines:             { items: [], lineTextIds: idsFor(lineTexts, 'gate') },
  integration:                 { items: definitionRows(chart, definition) },
})
