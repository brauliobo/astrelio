import { activationCode, channelKey } from './activations.js'
import { norm360 } from '../astro/zodiac.js'
import {
  CENTER_THEMES,
  CHANNEL_CENTERS,
  CHANNEL_CIRCUITS,
  CHANNEL_CIRCUIT_GROUPS,
  CHANNEL_NAMES,
  CHANNEL_STREAMS,
  CIRCUIT_STREAM_THEMES,
  GATE_CENTERS,
  GATE_KEYNOTES,
  GATE_NAMES,
  GATE_ORDER,
  HARMONIC_GATES,
  MANDALA_GATE_ORDER,
} from './constants.js'

const GATE_ANCHOR_OFFSET = 58
const GATE_DEGREES       = 360 / 64
const LINE_DEGREES       = GATE_DEGREES / 6
const COLOR_DEGREES      = LINE_DEGREES / 6
const TONE_DEGREES       = COLOR_DEGREES / 6
const BASE_DEGREES       = TONE_DEGREES / 5

export const LINE_ARCHETYPES = {
  1: {
    role:            'Foundation',
    keynote:         'investigation',
    exaltationTheme: 'Grounding the gate through patient study and direct evidence.',
    detrimentTheme:  'Over-questioning the impulse until useful timing is missed.',
  },
  2: {
    role:            'Natural',
    keynote:         'availability',
    exaltationTheme: 'Letting the gift emerge simply when the correct call arrives.',
    detrimentTheme:  'Withdrawing so completely that recognition cannot reach the gift.',
  },
  3: {
    role:            'Adaptation',
    keynote:         'trial and error',
    exaltationTheme: 'Learning the mechanics by testing what actually works.',
    detrimentTheme:  'Repeating friction without extracting a practical lesson.',
  },
  4: {
    role:            'Externalization',
    keynote:         'networking',
    exaltationTheme: 'Sharing the gate through steady relationships and clear influence.',
    detrimentTheme:  'Offering answers before the relationship can receive them.',
  },
  5: {
    role:            'Projection',
    keynote:         'universalizing',
    exaltationTheme: 'Making the gate useful to others through mature, practical framing.',
    detrimentTheme:  'Selling the pattern too strongly and inviting resistance.',
  },
  6: {
    role:            'Transition',
    keynote:         'perspective',
    exaltationTheme: 'Seeing the gate from distance and modeling its cleaner expression.',
    detrimentTheme:  'Standing apart so far that the wisdom becomes inaccessible.',
  },
}

export const PLANET_ACTIVATION_MEANINGS = {
  Sun:       'core vitality and visible life theme',
  Earth:     'grounding, balance, and embodied support',
  NorthNode: 'future-facing environment and directional emphasis',
  SouthNode: 'familiar environment and inherited emphasis',
  Moon:      'movement, need, and recurring pull',
  Mercury:   'communication, naming, and mental exchange',
  Venus:     'values, relating, and aesthetic preference',
  Mars:      'raw growth edge and immature energy under pressure',
  Jupiter:   'principles, protection, and lawful expansion',
  Saturn:    'discipline, limits, and consequences',
  Uranus:    'difference, disruption, and unusual expression',
  Neptune:   'sensitivity, veiling, and spiritualized longing',
  Pluto:     'depth, compulsion, and transformational pressure',
}

export const STREAM_BY_CHANNEL = {
  '1-8':   'Creative Contribution',
  '2-14':  'Direction and Resources',
  '3-60':  'Mutation',
  '4-63':  'Logic',
  '5-15':  'Rhythm',
  '6-59':  'Intimacy and Bonding',
  '7-31':  'Leadership',
  '9-52':  'Concentration',
  '10-20': 'Awakening',
  '10-34': 'Integration',
  '10-57': 'Survival Form',
  '11-56': 'Sensing and Story',
  '12-22': 'Emotional Expression',
  '13-33': 'Memory',
  '16-48': 'Talent',
  '17-62': 'Organization',
  '18-58': 'Correction',
  '19-49': 'Sensitivity and Principles',
  '20-34': 'Sacral Manifestation',
  '20-57': 'Intuitive Awareness',
  '21-45': 'Material Stewardship',
  '23-43': 'Knowing',
  '24-61': 'Inner Knowing',
  '25-51': 'Initiation',
  '26-44': 'Transmission and Sales',
  '27-50': 'Care and Values',
  '28-38': 'Purpose Struggle',
  '29-46': 'Experience',
  '30-41': 'Desire and Feeling',
  '32-54': 'Transformation',
  '34-57': 'Power and Survival',
  '35-36': 'Experience and Change',
  '37-40': 'Community Bargain',
  '39-55': 'Emotional Spirit',
  '42-53': 'Cycles',
  '47-64': 'Abstract Realization',
}

const unique    = values => [...new Set(values.filter(Boolean))]
const round     = (value, places = 4) => Number(value.toFixed(places))
const gateIndex = gate => GATE_ORDER.indexOf(Number(gate))

const zodiacSpan = (start, size) => ({
  start: round(norm360(start - GATE_ANCHOR_OFFSET)),
  end:   round(norm360(start + size - GATE_ANCHOR_OFFSET)),
  size:  round(size),
})

const formatDegree = (degree) => {
  const normalized   = norm360(degree)
  const whole        = Math.floor(normalized)
  const minutesFloat = (normalized - whole) * 60
  const minutes      = Math.floor(minutesFloat)
  const seconds      = Math.round((minutesFloat - minutes) * 60)
  return `${whole} deg ${String(minutes).padStart(2, '0')}' ${String(seconds).padStart(2, '0')}"`
}

const gateStart = (gate) => {
  const index = gateIndex(gate)
  return index >= 0 ? index * GATE_DEGREES : null
}

export const mandalaDegreeSpanForGate = (gate) => {
  const start = gateStart(gate)
  if (start === null) return null
  return {
    gate:         Number(gate),
    orderIndex:   gateIndex(gate),
    mandalaIndex: MANDALA_GATE_ORDER.indexOf(Number(gate)),
    span:         zodiacSpan(start, GATE_DEGREES),
    formatted:    `${formatDegree(start - GATE_ANCHOR_OFFSET)} - ${formatDegree(start + GATE_DEGREES - GATE_ANCHOR_OFFSET)}`,
  }
}

export const mandalaDegreeDetailForActivation = (activation = {}) => {
  const start = gateStart(activation.gate)
  if (start === null) return null

  const line     = activation.line || 1
  const color    = activation.color || 1
  const tone     = activation.tone || 1
  const base     = activation.base || 1
  const adjusted = typeof activation.longitude === 'number'
    ? norm360(activation.longitude + GATE_ANCHOR_OFFSET)
    : null
  const withinGate = adjusted === null ? null : round(norm360(adjusted - start))
  const lineStart  = start + (line - 1) * LINE_DEGREES
  const colorStart = lineStart + (color - 1) * COLOR_DEGREES
  const toneStart  = colorStart + (tone - 1) * TONE_DEGREES
  const baseStart  = toneStart + (base - 1) * BASE_DEGREES

  return {
    gate:            mandalaDegreeSpanForGate(activation.gate),
    gateDegrees:     GATE_DEGREES,
    lineDegrees:     LINE_DEGREES,
    colorDegrees:    COLOR_DEGREES,
    toneDegrees:     TONE_DEGREES,
    baseDegrees:     BASE_DEGREES,
    gateArcDegrees:  GATE_DEGREES,
    lineArcDegrees:  LINE_DEGREES,
    colorArcDegrees: COLOR_DEGREES,
    toneArcDegrees:  TONE_DEGREES,
    baseArcDegrees:  BASE_DEGREES,
    withinGate,
    percentWithinGate: withinGate === null ? null : round((withinGate / GATE_DEGREES) * 100, 2),
    line:              {
      line,
      span:      zodiacSpan(lineStart, LINE_DEGREES),
      formatted: `${formatDegree(lineStart - GATE_ANCHOR_OFFSET)} - ${formatDegree(lineStart + LINE_DEGREES - GATE_ANCHOR_OFFSET)}`,
    },
    color: { color, span: zodiacSpan(colorStart, COLOR_DEGREES) },
    tone:  { tone, span: zodiacSpan(toneStart, TONE_DEGREES) },
    base:  { base, span: zodiacSpan(baseStart, BASE_DEGREES) },
  }
}

export const planetLibraryEntry = planet => ({
  planet,
  meaning: PLANET_ACTIVATION_MEANINGS[planet] || 'activation emphasis',
})

export const libraryChannelsForGate = gate =>
  (HARMONIC_GATES[gate] || [])
    .map(harmonic => channelKey(gate, harmonic))
    .filter(channel => CHANNEL_CENTERS[channel])

export const channelLibraryEntry = channel => {
  const gates   = channel.split('-').map(Number)
  const circuit = CHANNEL_CIRCUITS[channel] || ''
  const stream  = STREAM_BY_CHANNEL[channel] || CHANNEL_STREAMS[channel] || circuit
  return {
    channel,
    name: CHANNEL_NAMES[channel] || channel,
    gates,
    centers: CHANNEL_CENTERS[channel] || [],
    circuit,
    circuitGroup: CHANNEL_CIRCUIT_GROUPS[circuit] || circuit,
    stream,
    streamTheme: CIRCUIT_STREAM_THEMES[CHANNEL_STREAMS[channel]] || CIRCUIT_STREAM_THEMES[stream] || '',
    summary:     `${CHANNEL_NAMES[channel] || channel} connects gates ${gates.join(' and ')} through ${stream || circuit || 'a defined'} circuitry.`,
  }
}

export const harmonicGateDetails = (gate, activeChannels = []) => {
  const active = new Set(activeChannels)
  return (HARMONIC_GATES[gate] || []).map(harmonic => {
    const channel = channelKey(gate, harmonic)
    return {
      gate:   harmonic,
      name:   GATE_NAMES[harmonic] || `Gate ${harmonic}`,
      center: GATE_CENTERS[harmonic] || '',
      channel,
      defined:       active.has(channel),
      channelDetail: CHANNEL_CENTERS[channel] ? channelLibraryEntry(channel) : null,
    }
  })
}

export const gateLibraryEntry = gate => {
  const channels     = libraryChannelsForGate(gate)
  const circuits     = unique(channels.map(channel => CHANNEL_CIRCUITS[channel]))
  const streams      = unique(channels.map(channel => STREAM_BY_CHANNEL[channel]))
  const center       = GATE_CENTERS[gate] || ''
  const theme        = center ? CENTER_THEMES[center] : 'chart emphasis'
  const channelNames = channels.map(channel => CHANNEL_NAMES[channel] || channel)

  return {
    gate,
    name: GATE_NAMES[gate] || `Gate ${gate}`,
    center,
    theme,
    centerTheme:   CENTER_THEMES[center] || '',
    keynote:       GATE_KEYNOTES[gate] || '',
    mandala:       mandalaDegreeSpanForGate(gate),
    harmonicGates: HARMONIC_GATES[gate] || [],
    harmonics:     harmonicGateDetails(gate),
    channels,
    channelDetails: channels.map(channel => channelLibraryEntry(channel)),
    channelNames,
    circuits,
    circuitGroups: unique(circuits.map(circuit => CHANNEL_CIRCUIT_GROUPS[circuit] || circuit)),
    streams,
    lines:   [1, 2, 3, 4, 5, 6].map(line => lineLibraryEntry(gate, line)),
    summary: GATE_KEYNOTES[gate] || `Gate ${gate} expresses ${GATE_NAMES[gate] || 'this theme'} through ${theme}. It is best read as a practical emphasis, not a fixed trait.`,
  }
}

export const lineLibraryEntry = (gate, line = 1) => {
  const archetype   = LINE_ARCHETYPES[line] || LINE_ARCHETYPES[1]
  const gateName    = GATE_NAMES[gate] || `Gate ${gate}`
  const gateKeynote = GATE_KEYNOTES[gate] || `${gateName} expresses through its center and harmonic gate.`
  return {
    gate,
    line,
    title:    `${archetype.role} Line`,
    role:     archetype.role,
    keynote:  archetype.keynote,
    polarity: {
      exaltation: archetype.exaltationTheme,
      detriment:  archetype.detrimentTheme,
    },
    exaltation: {
      planet:  'Supportive polarity',
      summary: archetype.exaltationTheme,
    },
    detriment: {
      planet:  'Reactive polarity',
      summary: archetype.detrimentTheme,
    },
    exaltationTheme: archetype.exaltationTheme,
    detrimentTheme:  archetype.detrimentTheme,
    mandala:         mandalaDegreeDetailForActivation({ gate, line }),
    summary:         `Line ${line} brings ${archetype.keynote} to ${gateName}: ${gateKeynote} Work with the gate through ${archetype.role.toLowerCase()} before making conclusions.`,
  }
}

export const activationLibraryEntry = activation => {
  if (!activation) return null
  const gate   = gateLibraryEntry(activation.gate)
  const line   = lineLibraryEntry(activation.gate, activation.line)
  const planet = planetLibraryEntry(activation.planet)
  return {
    ...gate,
    line,
    planet,
    planetMeaning:  planet.meaning,
    mandala:        mandalaDegreeDetailForActivation(activation),
    code:           activationCode(activation),
    interpretation: `${planet.meaning} carries ${gate.name} through line ${activation.line}: ${line.keynote}.`,
  }
}

export const gateExplorerEntry = gate => gateLibraryEntry(gate)

export const circuitLibrarySummary = (channels = []) => {
  const channelEntries = channels.map(channel => typeof channel === 'string' ? channelLibraryEntry(channel) : channel)
  const streams        = new Map()

  for (const channel of channelEntries) {
    if (!channel?.stream) continue
    const current = streams.get(channel.stream) || {
      stream:   channel.stream,
      theme:    channel.streamTheme || '',
      channels: [],
    }
    current.channels.push(channel.channel)
    streams.set(channel.stream, current)
  }

  return [...streams.values()].map(stream => ({
    ...stream,
    channels: unique(stream.channels).sort(),
  }))
}
