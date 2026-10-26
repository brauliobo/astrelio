export const HD_PLANETS = [
  'Sun',
  'Earth',
  'NorthNode',
  'SouthNode',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
]

export const GATE_ORDER = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
]

export const MANDALA_GATE_ORDER = [
  47, 64, 40, 59, 29, 4, 7, 33, 31, 56, 62, 53, 39, 52, 15, 12,
  45, 35, 16, 20, 8, 23, 2, 24, 27, 3, 42, 51, 21, 17, 25, 36,
  22, 63, 37, 55, 30, 49, 13, 19, 41, 60, 61, 54, 38, 58, 10, 11,
  26, 5, 9, 34, 14, 43, 1, 44, 28, 50, 32, 57, 48, 18, 46, 6,
]

export const CENTER_GATES = {
  Head:           [64, 61, 63],
  Ajna:           [47, 24, 4, 17, 43, 11],
  Throat:         [62, 23, 56, 16, 35, 20, 12, 45, 31, 8, 33],
  G:              [1, 7, 13, 10, 25, 15, 46, 2],
  Ego:            [21, 51, 26, 40],
  'Solar Plexus': [36, 22, 37, 6, 49, 55, 30],
  Spleen:         [48, 57, 44, 50, 32, 28, 18],
  Sacral:         [5, 14, 29, 34, 59, 27, 42, 3, 9],
  Root:           [53, 60, 52, 54, 19, 38, 39, 58, 41],
}

export const CENTERS       = Object.keys(CENTER_GATES)
export const MOTOR_CENTERS = ['Sacral', 'Solar Plexus', 'Ego', 'Root']

export const GATE_CENTER = Object.fromEntries(
  Object.entries(CENTER_GATES).flatMap(([center, gates]) => gates.map(gate => [gate, center]))
)

export const GATE_CENTERS = GATE_CENTER

export const CHANNEL_CIRCUIT_GROUPS = {
  Individual:            'Individual',
  'Collective Logic':    'Collective',
  'Collective Abstract': 'Collective',
  Tribal:                'Tribal',
}

// [channel, name, circuit, sub-circuit]; the sub-circuit is the stream a channel belongs to.
const CHANNEL_ROWS = [
  ['1-8',   'Inspiration',    'Individual',          'Knowing'],
  ['2-14',  'The Beat',       'Individual',          'Knowing'],
  ['3-60',  'Mutation',       'Individual',          'Knowing'],
  ['4-63',  'Logic',          'Collective Logic',    'Understanding'],
  ['5-15',  'Rhythm',         'Collective Logic',    'Understanding'],
  ['6-59',  'Mating',         'Tribal',              'Defense'],
  ['7-31',  'The Alpha',      'Collective Logic',    'Understanding'],
  ['9-52',  'Concentration',  'Collective Logic',    'Understanding'],
  ['10-20', 'Awakening',      'Individual',          'Integration'],
  ['10-34', 'Exploration',    'Individual',          'Centering'],
  ['10-57', 'Perfected Form', 'Individual',          'Integration'],
  ['11-56', 'Curiosity',      'Collective Abstract', 'Sensing'],
  ['12-22', 'Openness',       'Individual',          'Knowing'],
  ['13-33', 'The Prodigal',   'Collective Abstract', 'Sensing'],
  ['16-48', 'The Wavelength', 'Collective Logic',    'Understanding'],
  ['17-62', 'Acceptance',     'Collective Logic',    'Understanding'],
  ['18-58', 'Judgment',       'Collective Logic',    'Understanding'],
  ['19-49', 'Synthesis',      'Tribal',              'Ego'],
  ['20-34', 'Charisma',       'Individual',          'Integration'],
  ['20-57', 'The Brain Wave', 'Individual',          'Knowing'],
  ['21-45', 'Money',          'Tribal',              'Ego'],
  ['23-43', 'Structuring',    'Individual',          'Knowing'],
  ['24-61', 'Awareness',      'Individual',          'Knowing'],
  ['25-51', 'Initiation',     'Individual',          'Centering'],
  ['26-44', 'Surrender',      'Tribal',              'Ego'],
  ['27-50', 'Preservation',   'Tribal',              'Defense'],
  ['28-38', 'Struggle',       'Individual',          'Knowing'],
  ['29-46', 'Discovery',      'Collective Abstract', 'Sensing'],
  ['30-41', 'Recognition',    'Collective Abstract', 'Sensing'],
  ['32-54', 'Transformation', 'Tribal',              'Ego'],
  ['34-57', 'Power',          'Individual',          'Integration'],
  ['35-36', 'Transitoriness', 'Collective Abstract', 'Sensing'],
  ['37-40', 'Community',      'Tribal',              'Ego'],
  ['39-55', 'Emoting',        'Individual',          'Knowing'],
  ['42-53', 'Maturation',     'Collective Abstract', 'Sensing'],
  ['47-64', 'Abstraction',    'Collective Abstract', 'Sensing'],
]

export const CHANNELS = CHANNEL_ROWS.map(([key, name, circuit, subCircuit]) => {
  const gates = key.split('-').map(Number)
  return {
    key,
    gates,
    centers:      gates.map(gate => GATE_CENTER[gate]),
    name,
    circuit,
    circuitGroup: CHANNEL_CIRCUIT_GROUPS[circuit],
    subCircuit,
    stream:       subCircuit,
  }
})

const channelMap = field => Object.fromEntries(CHANNELS.map(channel => [channel.key, channel[field]]))

export const CHANNEL_BY_KEY   = Object.fromEntries(CHANNELS.map(channel => [channel.key, channel]))
const partnerGates = gate =>
  CHANNELS.filter(channel => channel.gates.includes(gate)).flatMap(channel => channel.gates.filter(other => other !== gate))

export const HARMONIC_GATES = Object.fromEntries(Object.keys(GATE_CENTER).map(gate => [gate, partnerGates(Number(gate))]))

export const CHANNEL_CENTERS  = channelMap('centers')
export const CHANNEL_CIRCUITS = channelMap('circuit')
export const CHANNEL_NAMES    = channelMap('name')
export const CHANNEL_STREAMS  = channelMap('stream')

export const CIRCUIT_STREAM_THEMES = {
  Knowing:       'individual knowing, mutation, and personal expression',
  Centering:     'self-love, direction, and centered empowerment',
  Integration:   'self-preservation through present-time awareness',
  Understanding: 'logical pattern recognition, correction, and projection',
  Sensing:       'experiential memory, feeling, and storytelling',
  Ego:           'tribal bargains, resources, loyalty, and material promises',
  Defense:       'tribal sensitivity, bonding, care, and boundary setting',
}

export const TYPE_MECHANICS = {
  Generator: {
    strategy:  'Wait to respond',
    signature: 'Satisfaction',
    notSelf:   'Frustration',
    aura:      'Open and enveloping',
  },
  'Manifesting Generator': {
    strategy:  'Wait to respond, then inform',
    signature: 'Satisfaction',
    notSelf:   'Frustration',
    aura:      'Open, enveloping, and fast-moving',
  },
  Manifestor: {
    strategy:  'Inform before acting',
    signature: 'Peace',
    notSelf:   'Anger',
    aura:      'Closed and initiating',
  },
  Projector: {
    strategy:  'Wait for recognition and invitation',
    signature: 'Success',
    notSelf:   'Bitterness',
    aura:      'Focused and absorbing',
  },
  Reflector: {
    strategy:  'Wait through the lunar cycle',
    signature: 'Surprise',
    notSelf:   'Disappointment',
    aura:      'Sampling and reflective',
  },
}

export const HD_TYPES = Object.keys(TYPE_MECHANICS)

export const HD_AUTHORITIES = [
  'Emotional',
  'Sacral',
  'Splenic',
  'Ego Manifested',
  'Ego Projected',
  'Self Projected',
  'Sounding Board',
  'Lunar',
]

export const HD_DEFINITIONS = [
  'No Definition',
  'Single Definition',
  'Split Definition',
  'Triple Split Definition',
  'Quad Split Definition',
]

export const CENTER_THEMES = {
  Head:           'inspiration and mental pressure',
  Ajna:           'conceptual processing and opinions',
  Throat:         'expression, action, and manifestation',
  G:              'identity, direction, and love',
  Ego:            'will, value, and material promises',
  'Solar Plexus': 'emotional clarity and waves',
  Spleen:         'instinct, intuition, and survival awareness',
  Sacral:         'life-force response and sustainable energy',
  Root:           'pressure, stress, and momentum',
}

export const GATE_NAMES = {
  1:  'Self-Expression',
  2:  'Direction of the Self',
  3:  'Ordering',
  4:  'Formulization',
  5:  'Fixed Rhythms',
  6:  'Friction',
  7:  'Role of the Self',
  8:  'Contribution',
  9:  'Focus',
  10: 'Behavior of the Self',
  11: 'Ideas',
  12: 'Caution',
  13: 'The Listener',
  14: 'Power Skills',
  15: 'Extremes',
  16: 'Skills',
  17: 'Opinions',
  18: 'Correction',
  19: 'Wanting',
  20: 'The Now',
  21: 'The Hunter',
  22: 'Openness',
  23: 'Assimilation',
  24: 'Rationalizing',
  25: 'Spirit of the Self',
  26: 'The Egoist',
  27: 'Caring',
  28: 'The Game Player',
  29: 'Saying Yes',
  30: 'Recognition of Feelings',
  31: 'Leading',
  32: 'Continuity',
  33: 'Privacy',
  34: 'Power',
  35: 'Change',
  36: 'Crisis',
  37: 'Friendship',
  38: 'The Fighter',
  39: 'The Provocateur',
  40: 'Aloneness',
  41: 'Contraction',
  42: 'Growth',
  43: 'Insight',
  44: 'Alertness',
  45: 'The Gatherer',
  46: 'Determination of the Self',
  47: 'Realizing',
  48: 'Depth',
  49: 'Principles',
  50: 'Values',
  51: 'Shock',
  52: 'Inaction',
  53: 'Beginnings',
  54: 'Ambition',
  55: 'Spirit',
  56: 'Stimulation',
  57: 'Intuitive Insight',
  58: 'Aliveness',
  59: 'Sexuality',
  60: 'Acceptance',
  61: 'Mystery',
  62: 'Detail',
  63: 'Doubt',
  64: 'Confusion',
}

export const GATE_KEYNOTES = {
  1:  'Creative direction that becomes useful when it is expressed in its own timing.',
  2:  'Receptive direction that holds an inner compass without forcing the route.',
  3:  'Ordering pressure that turns early confusion into a new pattern.',
  4:  'Mental answers that test formulas before presenting certainty.',
  5:  'Reliable rhythm that protects natural timing and sustainable repetition.',
  6:  'Emotional friction that clarifies intimacy, boundaries, and repair.',
  7:  'Leadership direction that guides by aligning people around a shared role.',
  8:  'Contribution that gives individual creativity a social voice.',
  9:  'Focused energy that concentrates on one detail long enough to refine it.',
  10: 'Behavioral integrity that keeps self-respect at the center of action.',
  11: 'Ideas that stimulate perspective without needing every image to become action.',
  12: 'Selective expression that waits for the right mood and audience.',
  13: 'Listening that preserves stories, patterns, and hidden human memory.',
  14: 'Resource power that supports direction when energy is used responsively.',
  15: 'A wide rhythm that includes extremes and makes room for difference.',
  16: 'Skill enthusiasm that improves through practice, repetition, and feedback.',
  17: 'Opinions that organize patterns into a logical point of view.',
  18: 'Correction that improves what is inherited without becoming harsh.',
  19: 'Sensitivity to need, belonging, and the emotional terms of access.',
  20: 'Presence that speaks or acts from what is available now.',
  21: 'Control of resources, commitments, and practical boundaries.',
  22: 'Emotional grace that opens expression when the mood is correct.',
  23: 'Assimilation that makes unusual insight simple enough to share.',
  24: 'Return of thought that reviews inspiration until it becomes clear.',
  25: 'Innocence that meets experience through an open, unarmored heart.',
  26: 'Persuasion that packages value and tests the integrity of promises.',
  27: 'Care that nourishes what can grow without overextending itself.',
  28: 'Struggle for meaning that asks whether a risk is worth the life-force.',
  29: 'Commitment that discovers experience through an honest yes.',
  30: 'Feeling intensity that names desire without demanding a guaranteed outcome.',
  31: 'Influence that leads through language, timing, and recognized authority.',
  32: 'Continuity that senses what can endure through change.',
  33: 'Privacy that retreats, digests experience, and returns with memory.',
  34: 'Raw power that is healthiest when it responds instead of proving itself.',
  35: 'Experience that seeks change, completion, and a story worth telling.',
  36: 'Crisis initiation that matures through emotional experience.',
  37: 'Friendship and agreements that define the terms of community.',
  38: 'Opposition that fights for purpose rather than conflict itself.',
  39: 'Provocation that tests whether spirit and feeling are alive.',
  40: 'Aloneness that restores will after promises have been honored.',
  41: 'Imaginative contraction that begins a new experiential cycle.',
  42: 'Growth that brings a cycle to completion before beginning again.',
  43: 'Breakthrough insight that needs correct timing to be understood.',
  44: 'Alert pattern memory that recognizes what is returning.',
  45: 'Gathering authority that manages shared resources and belonging.',
  46: 'Embodied discovery that learns through being in the right place.',
  47: 'Realization that presses unclear memory into a usable meaning.',
  48: 'Depth that develops skill before offering solutions.',
  49: 'Principles that decide what is acceptable in bonds and community.',
  50: 'Values that protect responsibility, care, and continuity.',
  51: 'Shock that initiates courage and wakes the heart.',
  52: 'Stillness that concentrates pressure by holding steady.',
  53: 'Beginnings that start cycles requiring time to mature.',
  54: 'Ambition that transforms position through correct alliances.',
  55: 'Spirit that rides emotional weather without reducing life to certainty.',
  56: 'Stimulation that turns experience into stories and meaning.',
  57: 'Intuition that hears what is safe, healthy, and timely now.',
  58: 'Joyful pressure to improve life without losing vitality.',
  59: 'Openness that dissolves barriers and creates fertile contact.',
  60: 'Limitation that gives mutation a workable boundary.',
  61: 'Inner pressure to know the mystery without forcing an answer.',
  62: 'Detail that makes logic credible through exact naming.',
  63: 'Doubt that protects the future by testing weak assumptions.',
  64: 'Confusion that holds many images before clarity arrives.',
}

export const INCARNATION_CROSS_GEOMETRY_BY_PROFILE = {
  '1/3': 'Right Angle',
  '1/4': 'Right Angle',
  '2/4': 'Right Angle',
  '2/5': 'Right Angle',
  '3/5': 'Right Angle',
  '3/6': 'Right Angle',
  '4/6': 'Right Angle',
  '4/1': 'Juxtaposition',
  '5/1': 'Left Angle',
  '5/2': 'Left Angle',
  '6/2': 'Left Angle',
  '6/3': 'Left Angle',
}

export const INCARNATION_CROSS_NAMES_BY_GATE = {
  1:  { 'Right Angle': 'The Sphinx', Juxtaposition: 'Self-Expression', 'Left Angle': 'Defiance' },
  2:  { 'Right Angle': 'The Sphinx', Juxtaposition: 'The Driver', 'Left Angle': 'Defiance' },
  3:  { 'Right Angle': 'Laws', Juxtaposition: 'Mutation', 'Left Angle': 'Wishes' },
  4:  { 'Right Angle': 'Explanation', Juxtaposition: 'Formulization', 'Left Angle': 'Revolution' },
  5:  { 'Right Angle': 'Consciousness', Juxtaposition: 'Habits', 'Left Angle': 'Separation' },
  6:  { 'Right Angle': 'Eden', Juxtaposition: 'Conflict', 'Left Angle': 'The Plane' },
  7:  { 'Right Angle': 'The Sphinx', Juxtaposition: 'Interaction', 'Left Angle': 'Masks' },
  8:  { 'Right Angle': 'Contagion', Juxtaposition: 'Contribution', 'Left Angle': 'Uncertainty' },
  9:  { 'Right Angle': 'Planning', Juxtaposition: 'Focus', 'Left Angle': 'Identification' },
  10: { 'Right Angle': 'The Vessel of Love', Juxtaposition: 'Behavior', 'Left Angle': 'Prevention' },
  11: { 'Right Angle': 'Eden', Juxtaposition: 'Ideas', 'Left Angle': 'Education' },
  12: { 'Right Angle': 'Eden', Juxtaposition: 'Articulation', 'Left Angle': 'Education' },
  13: { 'Right Angle': 'The Sphinx', Juxtaposition: 'Listening', 'Left Angle': 'Masks' },
  14: { 'Right Angle': 'Contagion', Juxtaposition: 'Empowering', 'Left Angle': 'Uncertainty' },
  15: { 'Right Angle': 'The Vessel of Love', Juxtaposition: 'Extremes', 'Left Angle': 'Prevention' },
  16: { 'Right Angle': 'Planning', Juxtaposition: 'Experimentation', 'Left Angle': 'Identification' },
  17: { 'Right Angle': 'Service', Juxtaposition: 'Opinions', 'Left Angle': 'Upheaval' },
  18: { 'Right Angle': 'Service', Juxtaposition: 'Correction', 'Left Angle': 'Upheaval' },
  19: { 'Right Angle': 'The Four Ways', Juxtaposition: 'Need', 'Left Angle': 'Refinement' },
  20: { 'Right Angle': 'The Sleeping Phoenix', Juxtaposition: 'The Now', 'Left Angle': 'Duality' },
  21: { 'Right Angle': 'Tension', Juxtaposition: 'Control', 'Left Angle': 'Endeavor' },
  22: { 'Right Angle': 'Rulership', Juxtaposition: 'Grace', 'Left Angle': 'Informing' },
  23: { 'Right Angle': 'Explanation', Juxtaposition: 'Assimilation', 'Left Angle': 'Dedication' },
  24: { 'Right Angle': 'The Four Ways', Juxtaposition: 'Rationalization', 'Left Angle': 'Incarnation' },
  25: { 'Right Angle': 'The Vessel of Love', Juxtaposition: 'Innocence', 'Left Angle': 'Healing' },
  26: { 'Right Angle': 'Rulership', Juxtaposition: 'The Trickster', 'Left Angle': 'Confrontation' },
  27: { 'Right Angle': 'The Unexpected', Juxtaposition: 'Caring', 'Left Angle': 'Alignment' },
  28: { 'Right Angle': 'The Unexpected', Juxtaposition: 'Risks', 'Left Angle': 'Alignment' },
  29: { 'Right Angle': 'Contagion', Juxtaposition: 'Commitment', 'Left Angle': 'Industry' },
  30: { 'Right Angle': 'Contagion', Juxtaposition: 'Fates', 'Left Angle': 'Industry' },
  31: { 'Right Angle': 'The Unexpected', Juxtaposition: 'Influence', 'Left Angle': 'The Alpha' },
  32: { 'Right Angle': 'Maya', Juxtaposition: 'Conservation', 'Left Angle': 'Limitation' },
  33: { 'Right Angle': 'The Four Ways', Juxtaposition: 'Retreat', 'Left Angle': 'Refinement' },
  34: { 'Right Angle': 'The Sleeping Phoenix', Juxtaposition: 'Power', 'Left Angle': 'Duality' },
  35: { 'Right Angle': 'Consciousness', Juxtaposition: 'Experience', 'Left Angle': 'Separation' },
  36: { 'Right Angle': 'Eden', Juxtaposition: 'Crisis', 'Left Angle': 'The Plane' },
  37: { 'Right Angle': 'Planning', Juxtaposition: 'Bargains', 'Left Angle': 'Migration' },
  38: { 'Right Angle': 'Tension', Juxtaposition: 'Opposition', 'Left Angle': 'Individualism' },
  39: { 'Right Angle': 'Tension', Juxtaposition: 'Provocation', 'Left Angle': 'Individualism' },
  40: { 'Right Angle': 'Planning', Juxtaposition: 'Denial', 'Left Angle': 'Migration' },
  41: { 'Right Angle': 'The Unexpected', Juxtaposition: 'Fantasy', 'Left Angle': 'The Alpha' },
  42: { 'Right Angle': 'Maya', Juxtaposition: 'Completion', 'Left Angle': 'Limitation' },
  43: { 'Right Angle': 'Explanation', Juxtaposition: 'Insight', 'Left Angle': 'Dedication' },
  44: { 'Right Angle': 'The Four Ways', Juxtaposition: 'Alertness', 'Left Angle': 'Incarnation' },
  45: { 'Right Angle': 'Rulership', Juxtaposition: 'Possession', 'Left Angle': 'Confrontation' },
  46: { 'Right Angle': 'The Vessel of Love', Juxtaposition: 'Serendipity', 'Left Angle': 'Healing' },
  47: { 'Right Angle': 'Rulership', Juxtaposition: 'Oppression', 'Left Angle': 'Informing' },
  48: { 'Right Angle': 'Tension', Juxtaposition: 'Depth', 'Left Angle': 'Endeavor' },
  49: { 'Right Angle': 'Explanation', Juxtaposition: 'Principles', 'Left Angle': 'Revolution' },
  50: { 'Right Angle': 'Laws', Juxtaposition: 'Values', 'Left Angle': 'Wishes' },
  51: { 'Right Angle': 'Penetration', Juxtaposition: 'Shock', 'Left Angle': 'The Clarion' },
  52: { 'Right Angle': 'Service', Juxtaposition: 'Stillness', 'Left Angle': 'Demands' },
  53: { 'Right Angle': 'Penetration', Juxtaposition: 'Beginnings', 'Left Angle': 'Cycles' },
  54: { 'Right Angle': 'Penetration', Juxtaposition: 'Ambition', 'Left Angle': 'Cycles' },
  55: { 'Right Angle': 'The Sleeping Phoenix', Juxtaposition: 'Moods', 'Left Angle': 'Spirit' },
  56: { 'Right Angle': 'Laws', Juxtaposition: 'Stimulation', 'Left Angle': 'Distraction' },
  57: { 'Right Angle': 'Penetration', Juxtaposition: 'Intuition', 'Left Angle': 'The Clarion' },
  58: { 'Right Angle': 'Service', Juxtaposition: 'Vitality', 'Left Angle': 'Demands' },
  59: { 'Right Angle': 'The Sleeping Phoenix', Juxtaposition: 'Strategy', 'Left Angle': 'Spirit' },
  60: { 'Right Angle': 'Laws', Juxtaposition: 'Limitation', 'Left Angle': 'Distraction' },
  61: { 'Right Angle': 'Maya', Juxtaposition: 'Thinking', 'Left Angle': 'Obscuration' },
  62: { 'Right Angle': 'Maya', Juxtaposition: 'Detail', 'Left Angle': 'Obscuration' },
  63: { 'Right Angle': 'Consciousness', Juxtaposition: 'Doubts', 'Left Angle': 'Dominion' },
  64: { 'Right Angle': 'Consciousness', Juxtaposition: 'Confusion', 'Left Angle': 'Dominion' },
}

export const INCARNATION_QUARTERS = [
  { id: 1, name: 'Initiation', theme: 'Mind', gates: [13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24] },
  { id: 2, name: 'Civilization', theme: 'Form', gates: [2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33] },
  { id: 3, name: 'Duality', theme: 'Bonding', gates: [7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44] },
  { id: 4, name: 'Mutation', theme: 'Transformation', gates: [1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60, 41, 19] },
]

export const VARIABLE_KEYS = [
  { id: 'digestion', label: 'Digestion', subtitle: 'Determination', layer: 'design', planet: 'Sun' },
  { id: 'environment', label: 'Environment', subtitle: 'Environment', layer: 'design', planet: 'NorthNode' },
  { id: 'motivation', label: 'Motivation', subtitle: 'Awareness', layer: 'personality', planet: 'Sun' },
  { id: 'perspective', label: 'Perspective', subtitle: 'View', layer: 'personality', planet: 'NorthNode' },
]

export const VARIABLE_COLOR_LABELS = {
  digestion:   ['Appetite', 'Taste', 'Thirst', 'Touch', 'Sound', 'Light'],
  environment: ['Caves', 'Markets', 'Kitchens', 'Mountains', 'Valleys', 'Shores'],
  motivation:  ['Fear', 'Hope', 'Desire', 'Need', 'Guilt', 'Innocence'],
  perspective: ['Survival', 'Possibility', 'Power', 'Wanting', 'Probability', 'Personal'],
}

export const PENTA_GATES       = [31, 8, 33, 7, 1, 13, 15, 2, 46, 5, 14, 29]
export const LOVE_GATES        = [10, 15, 25, 46]
export const MATERIAL_CHANNELS = ['21-45', '26-44', '32-54', '37-40']
