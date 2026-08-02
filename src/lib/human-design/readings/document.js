import { CENTERS, HD_PLANETS } from '../constants.js'
import { humanDesignValueKey } from '../labels.js'

export const HUMAN_DESIGN_READING_SCHEMA  = 'human-design.reading-document'
export const HUMAN_DESIGN_READING_VERSION = 1

const COVERAGE = [
  'mechanics',
  'profile',
  'definition',
  'centers',
  'channels',
  'circuitry',
  'streams',
  'gates',
  'lines',
  'activations',
  'incarnationCross',
  'variables',
  'psychologicalThemes',
  'guidance',
]

const EXACT_TIME_CAVEAT = Object.freeze({
  key:    'human_design.reading.caveats.exact_time',
  params: {},
})

const token = (key, params = {}) => ({ key, params })

const slug = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

const numericSort = (left, right) => Number(left) - Number(right)

const canonicalValue = (group, value) => humanDesignValueKey(group, value) || slug(value) || 'unknown'

const layerRank = layer => layer === 'personality' ? 0 : 1

const planetRank = planet => {
  const index = HD_PLANETS.indexOf(planet)
  return index < 0 ? HD_PLANETS.length : index
}

const activationRows = chart => ['personality', 'design'].flatMap(layer =>
  Object.entries(chart?.[layer] || {}).map(([planet, activation]) => ({
    ...activation,
    layer,
    planet: activation.planet || planet,
  }))
).sort((left, right) =>
  layerRank(left.layer) - layerRank(right.layer)
    || planetRank(left.planet) - planetRank(right.planet)
    || left.planet.localeCompare(right.planet)
)

const evidenceRecord = (id, kind, path, facts) => ({ id, kind, path, facts })

const chapter = (id, evidenceIds, params = {}) => ({
  id,
  title:    token(`human_design.reading.chapters.${id}.title`),
  overview: token(`human_design.reading.chapters.${id}.overview`, params),
  evidenceIds,
  strengths: [token(`human_design.reading.strengths.${id}`, params)],
  challenges: [token(`human_design.reading.challenges.${id}`, params)],
  practices:  [token(`human_design.reading.practices.${id}`, params)],
})

const mechanicsFacts = chart => {
  const type = canonicalValue('type', chart.type)
  return {
    type: {
      value: type,
      label: token(`human_design.types.${type}`),
    },
    strategy: {
      value: type,
      label: token(`human_design.reading.strategies.${type}`),
    },
    authority: {
      value: canonicalValue('authority', chart.authority),
      label: token(`human_design.authorities.${canonicalValue('authority', chart.authority)}`),
    },
    signature: {
      value: type,
      label: token(`human_design.reading.signatures.${type}`),
    },
    notSelf: {
      value: type,
      label: token(`human_design.reading.not_self.${type}`),
    },
  }
}

const profileFacts = chart => {
  const [personalityLine, designLine] = String(chart.profile || '')
    .split('/')
    .map(value => Number.parseInt(value.trim(), 10) || null)
  return {
    value: `${personalityLine || '-'} / ${designLine || '-'}`,
    personalityLine,
    designLine,
    label:   token('human_design.reading.profile.label', { personalityLine, designLine }),
    caveats: [EXACT_TIME_CAVEAT],
  }
}

const centerFacts = chart => {
  const details = new Map((chart.details?.centers || []).map(center => [center.center, center]))
  const defined = new Set(chart.centers || [])
  return CENTERS.map(center => {
    const key      = canonicalValue('center', center)
    const evidenceId = `center:${key}`
    return {
      id:          key,
      defined:     defined.has(center),
      activeGates: [...(details.get(center)?.activeGates || [])].sort(numericSort),
      label:       token(`human_design.centers.${key}`),
      theme:       token(`human_design.reading.center_themes.${key}`),
      evidenceIds: [evidenceId],
    }
  })
}

const activationFacts = chart => activationRows(chart).map(row => {
  const id = `activation:${row.layer}:${slug(row.planet)}`
  return {
    id,
    layer:    row.layer,
    planet:   slug(row.planet),
    gate:     Number(row.gate),
    line:     Number(row.line),
    color:    Number(row.color),
    tone:     Number(row.tone),
    base:     Number(row.base),
    code:     [row.gate, row.line, row.color, row.tone, row.base].join('.'),
    label:    token('human_design.reading.activations.label', {
      layer: row.layer,
      planet: slug(row.planet),
      gate: Number(row.gate),
      line: Number(row.line),
    }),
    caveats:    [EXACT_TIME_CAVEAT],
    evidenceIds: [id],
  }
})

const gateFacts = (chart, activations) => {
  const details = new Map((chart.details?.gates || []).map(gate => [Number(gate.gate), gate]))
  return [...new Set((chart.gates || activations.map(row => row.gate)).map(Number))]
    .sort(numericSort)
    .map(gate => {
      const detail        = details.get(gate)
      const gateEvidence  = `gate:${gate}`
      const gateActivations = activations.filter(row => row.gate === gate)
      return {
        id:               String(gate),
        gate,
        center:           canonicalValue('center', detail?.center),
        lines:            [...new Set(gateActivations.map(row => row.line))].sort(numericSort),
        layers:           [...new Set(gateActivations.map(row => row.layer))],
        planets:          [...new Set(gateActivations.map(row => row.planet))],
        harmonicGates:    [...(detail?.harmonicGates || [])].map(Number).sort(numericSort),
        definedChannels:  [...(detail?.definedChannels || [])].sort(),
        hangingHarmonics: [...(detail?.hangingHarmonics || [])].map(Number).sort(numericSort),
        label:            token(`human_design.gate_names.${gate}`),
        evidenceIds:      [gateEvidence, ...gateActivations.map(row => row.id)],
        activationIds:    gateActivations.map(row => row.id),
      }
    })
}

const channelFacts = chart => {
  const details = new Map((chart.details?.channels || []).map(channel => [channel.channel, channel]))
  return [...(chart.channels || [])].sort().map(id => {
    const detail = details.get(id) || {}
    return {
      id,
      gates:        id.split('-').map(Number),
      centers:      (detail.centers || []).map(center => canonicalValue('center', center)),
      circuit:      canonicalValue('circuit', detail.circuit),
      circuitGroup: canonicalValue('circuitGroup', detail.circuitGroup),
      stream:       slug(detail.stream),
      source:       detail.source || 'unknown',
      label:        token(`human_design.channel_names.${id.replace('-', '_')}`),
      evidenceIds:  [`channel:${id}`],
    }
  })
}

const circuitryFacts = chart => (chart.details?.circuits || []).map(circuit => ({
  id:          canonicalValue('circuit', circuit.circuit),
  group:       canonicalValue('circuitGroup', circuit.group),
  channels:    [...(circuit.channels || [])].sort(),
  streams:     [...(circuit.streams || [])].map(slug).sort(),
  label:       token(`human_design.circuits.${canonicalValue('circuit', circuit.circuit)}`),
  evidenceIds: (circuit.channels || []).map(channel => `channel:${channel}`),
})).sort((left, right) => left.id.localeCompare(right.id))

const streamFacts = chart => (chart.details?.streamSummary || []).map(stream => ({
  id:          slug(stream.key || stream.stream),
  gates:       [...(stream.gates || [])].map(Number).sort(numericSort),
  channels:    [...(stream.channels || [])].sort(),
  label:       token(`human_design.stream_names.${slug(stream.key || stream.stream)}`),
  evidenceIds: (stream.channels || []).map(channel => `channel:${channel}`),
})).sort((left, right) => left.id.localeCompare(right.id))

const crossFacts = chart => {
  const cross = chart.incarnationCross
  if (!cross) return null
  return {
    geometry: canonicalValue('crossGeometry', cross.geometry),
    quarter:  cross.quarter?.id || null,
    gates:    [...(cross.gates || [])].map(Number),
    roles:    (cross.roles || cross.gateDetails || []).map(role => ({
      id:    role.role || role.key,
      gate:  Number(role.gate),
      line:  Number(role.line),
      layer: String(role.role || role.key).startsWith('personality') ? 'personality' : 'design',
    })),
    label:    token('human_design.reading.incarnation_cross.label', {
      geometry: canonicalValue('crossGeometry', cross.geometry),
      quarter:  cross.quarter?.id || null,
      gates:    (cross.gates || []).join('/'),
    }),
    caveats:    [EXACT_TIME_CAVEAT],
    evidenceIds: ['incarnation-cross'],
  }
}

const variableFacts = chart => (chart.variables || []).map(variable => ({
  id:          variable.id,
  layer:       variable.layer,
  planet:      slug(variable.planet),
  orientation: variable.orientation,
  color:       variable.color,
  tone:        variable.tone,
  base:        variable.base,
  transference: variable.transference
    ? token(`human_design.reading.variables.${variable.id}.transference`, { color: variable.color })
    : null,
  label:       token(`human_design.reading.variables.${variable.id}.label`),
  caveats:     [EXACT_TIME_CAVEAT],
  evidenceIds: [`variable:${variable.id}`],
}))

const buildEvidence = ({ chart, mechanics, profile, centers, channels, gates, activations, cross, variables }) => [
  evidenceRecord('mechanics:type', 'mechanics', 'type', { value: mechanics.type.value }),
  evidenceRecord('mechanics:authority', 'mechanics', 'authority', { value: mechanics.authority.value }),
  evidenceRecord('profile', 'profile', 'profile', {
    personalityLine: profile.personalityLine,
    designLine:      profile.designLine,
  }),
  evidenceRecord('definition', 'definition', 'definition', {
    value: canonicalValue('definition', chart.definition),
  }),
  ...centers.map(center => evidenceRecord(`center:${center.id}`, 'center', `centers.${center.id}`, {
    defined:     center.defined,
    activeGates: center.activeGates,
  })),
  ...channels.map(channel => evidenceRecord(`channel:${channel.id}`, 'channel', `channels.${channel.id}`, {
    gates:   channel.gates,
    centers: channel.centers,
  })),
  ...gates.map(gate => evidenceRecord(`gate:${gate.gate}`, 'gate', `gates.${gate.gate}`, {
    gate:  gate.gate,
    lines: gate.lines,
  })),
  ...activations.map(activation => evidenceRecord(activation.id, 'activation', `${activation.layer}.${activation.planet}`, {
    gate:  activation.gate,
    line:  activation.line,
    color: activation.color,
    tone:  activation.tone,
    base:  activation.base,
  })),
  ...(cross ? [evidenceRecord('incarnation-cross', 'incarnationCross', 'incarnationCross', {
    geometry: cross.geometry,
    quarter:  cross.quarter,
    gates:    cross.gates,
  })] : []),
  ...variables.map(variable => evidenceRecord(`variable:${variable.id}`, 'variable', `variables.${variable.id}`, {
    orientation: variable.orientation,
    color:       variable.color,
    tone:        variable.tone,
    base:        variable.base,
  })),
]

const prominenceFacts = (gates, activations, channels) => {
  const repeatedGates = gates
    .map(gate => ({ gate: gate.gate, count: gate.activationIds.length, evidenceIds: gate.activationIds }))
    .filter(item => item.count > 1)
    .sort((left, right) => right.count - left.count || left.gate - right.gate)
    .map(item => ({
      id:      `gate:${item.gate}`,
      score:   item.count,
      content: token('human_design.reading.prominence.repeated_gate', {
        gate:  item.gate,
        count: item.count,
        total: activations.length,
      }),
      evidenceIds: item.evidenceIds,
    }))

  const lineCounts = new Map()
  for (const activation of activations) lineCounts.set(activation.line, (lineCounts.get(activation.line) || 0) + 1)
  const prominentLines = [...lineCounts.entries()]
    .sort(([leftLine, leftCount], [rightLine, rightCount]) => rightCount - leftCount || leftLine - rightLine)
    .slice(0, 2)
    .map(([line, count]) => ({
      id:      `line:${line}`,
      score:   count,
      content: token('human_design.reading.prominence.line', { line, count, total: activations.length }),
      evidenceIds: activations.filter(activation => activation.line === line).map(activation => activation.id),
    }))

  const circuitCounts = new Map()
  for (const channel of channels) circuitCounts.set(channel.circuit, (circuitCounts.get(channel.circuit) || 0) + 1)
  const prominentCircuits = [...circuitCounts.entries()]
    .filter(([circuit]) => circuit !== 'unknown')
    .sort(([leftCircuit, leftCount], [rightCircuit, rightCount]) =>
      rightCount - leftCount || leftCircuit.localeCompare(rightCircuit)
    )
    .map(([circuit, count]) => ({
      id:      `circuit:${circuit}`,
      score:   count,
      content: token('human_design.reading.prominence.circuit', { circuit, count, total: channels.length }),
      evidenceIds: channels.filter(channel => channel.circuit === circuit).flatMap(channel => channel.evidenceIds),
    }))

  return [...repeatedGates, ...prominentLines, ...prominentCircuits].slice(0, 4)
}

const readingChapters = ({ mechanics, profile, definition, centers, channels, gates, activations, cross, variables }) => {
  const definedCenterIds = centers.filter(center => center.defined).map(center => `center:${center.id}`)
  const openCenterIds    = centers.filter(center => !center.defined).map(center => `center:${center.id}`)
  const channelIds       = channels.map(channel => `channel:${channel.id}`)
  const activationIds    = activations.map(activation => activation.id)
  return [
    chapter('decision_making', ['mechanics:type', 'mechanics:authority'], {
      type:      mechanics.type.value,
      strategy:  mechanics.strategy.value,
      authority: mechanics.authority.value,
      signature: mechanics.signature.value,
      notSelf:   mechanics.notSelf.value,
    }),
    chapter('energy_and_expression', [...definedCenterIds, ...channelIds], {
      definedCenters:    definedCenterIds.length,
      definedCenterNames: centers.filter(center => center.defined).map(center => center.id),
      channels:          channels.length,
      channelNames:      channels.map(channel => channel.id),
    }),
    chapter('identity_and_role', ['profile', ...(cross ? ['incarnation-cross'] : [])], {
      personalityLine: profile.personalityLine,
      designLine:      profile.designLine,
    }),
    chapter('conditioning_and_openness', openCenterIds, {
      openCenters:    openCenterIds.length,
      openCenterNames: centers.filter(center => !center.defined).map(center => center.id),
    }),
    chapter('relationships_and_circuitry', channelIds, {
      channels:     channels.length,
      channelNames: channels.map(channel => channel.id),
    }),
    chapter('life_theme', cross ? ['incarnation-cross'] : [], { available: Boolean(cross) }),
    chapter('variables_and_transference', variables.map(variable => `variable:${variable.id}`), {
      variables:     variables.length,
      variableNames: variables.map(variable => variable.id),
    }),
    chapter('gates_and_lines', activationIds, {
      gates:       gates.length,
      gateNames:   gates.map(gate => gate.gate),
      activations: activations.length,
    }),
    chapter('integration', ['definition', ...definedCenterIds], { definition: definition.value }),
  ].filter(item => {
    if (item.id === 'life_theme') return Boolean(cross)
    if (item.id === 'variables_and_transference') return variables.length > 0
    if (item.id === 'relationships_and_circuitry') return channels.length > 0
    return true
  })
}

export const buildHumanDesignReadingDocument = chart => {
  if (!chart) return null

  const mechanics   = mechanicsFacts(chart)
  const profile     = profileFacts(chart)
  const definition  = {
    value: canonicalValue('definition', chart.definition),
    label: token(`human_design.definitions.${canonicalValue('definition', chart.definition)}`),
  }
  const centers     = centerFacts(chart)
  const activations = activationFacts(chart)
  const gates       = gateFacts(chart, activations)
  const channels    = channelFacts(chart)
  const circuitry   = circuitryFacts(chart)
  const streams     = streamFacts(chart)
  const cross       = crossFacts(chart)
  const variables   = variableFacts(chart)
  const evidence    = buildEvidence({ chart, mechanics, profile, centers, channels, gates, activations, cross, variables })
  const chapters    = readingChapters({ mechanics, profile, definition, centers, channels, gates, activations, cross, variables })
  const expectedActivationCount = activationRows(chart).length

  return {
    schema:          HUMAN_DESIGN_READING_SCHEMA,
    schemaVersion:   HUMAN_DESIGN_READING_VERSION,
    languageNeutral: true,
    id:              `human-design-reading:${chart.personId || 'anonymous'}`,
    title:           token('human_design.reading.document.title'),
    subject: {
      id: chart.personId || null,
    },
    coverage: {
      declared: COVERAGE,
      represented: Object.fromEntries(COVERAGE.map(area => [area, {
        incarnationCross: Boolean(cross),
        variables:        variables.length > 0,
      }[area] ?? true])),
      counts: {
        centers:     centers.length,
        channels:    channels.length,
        circuits:    circuitry.length,
        streams:     streams.length,
        gates:       gates.length,
        activations: activations.length,
        variables:   variables.length,
      },
      complete: {
        activeGates: gates.length === new Set((chart.gates || []).map(Number)).size,
        activations: activations.length === expectedActivationCount,
        activeLines: activations.every(activation => Number.isInteger(activation.line)),
      },
    },
    facts: {
      mechanics,
      profile,
      definition,
      centers: {
        defined: centers.filter(center => center.defined),
        open:    centers.filter(center => !center.defined),
      },
      channels,
      circuitry,
      streams,
      gates,
      activations,
      incarnationCross: cross,
      variables,
    },
    summary: {
      themes: [
        { content: token('human_design.reading.themes.type', { type: mechanics.type.value }), evidenceIds: ['mechanics:type'] },
        { content: token('human_design.reading.themes.authority', { authority: mechanics.authority.value }), evidenceIds: ['mechanics:authority'] },
        { content: token('human_design.reading.themes.profile', { personalityLine: profile.personalityLine, designLine: profile.designLine }), evidenceIds: ['profile'] },
        { content: token('human_design.reading.themes.definition', { definition: definition.value }), evidenceIds: ['definition'] },
      ],
      prominence: prominenceFacts(gates, activations, channels),
    },
    chapters,
    guidance: {
      strengths: chapters.flatMap(item => item.strengths),
      challenges: chapters.flatMap(item => item.challenges),
      practices:  chapters.flatMap(item => item.practices),
    },
    caveats: [EXACT_TIME_CAVEAT],
    evidence,
  }
}

export const humanDesignReadingDocument = buildHumanDesignReadingDocument
