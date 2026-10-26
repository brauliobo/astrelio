/**
 * The four Variable arrows (PHS). Each arrow reads color, tone and base of one activation:
 * Determination/Digestion = Design Sun, Environment = Design North Node,
 * Motivation = Personality Sun, Perspective/View = Personality North Node.
 * The Earth opposes the Sun by exactly 32 gates, so it carries the same line/color/tone/base and is never read separately.
 */
export const ARROWS = [
  { id: 'digestion',   alias: 'determination', layer: 'design',      body: 'Sun',       side: 'design',      row: 'top' },
  { id: 'environment', alias: null,            layer: 'design',      body: 'NorthNode', side: 'design',      row: 'bottom' },
  { id: 'motivation',  alias: 'awareness',     layer: 'personality', body: 'Sun',       side: 'personality', row: 'top' },
  { id: 'perspective', alias: 'view',          layer: 'personality', body: 'NorthNode', side: 'personality', row: 'bottom' },
]

const slug = name => name.toLowerCase().replace(/[-\s]+/g, '_')

const entry = name => ({ key: slug(name), name })

const colorRows = (names, left, right) =>
  names.map((name, index) => ({ ...entry(name), left: entry(left[index]), right: entry(right[index]) }))

const sameBoth = (names, left, right) => colorRows(names, names.map(() => left), names.map(() => right))

/** Six colors per arrow with the left (tone 1-3) and right (tone 4-6) sub-variant of each. */
export const ARROW_COLORS = {
  digestion: colorRows(
    ['Appetite', 'Taste', 'Thirst', 'Touch', 'Sound', 'Light'],
    ['Consecutive', 'Open', 'Hot', 'Calm', 'High', 'Direct'],
    ['Alternating', 'Closed', 'Cold', 'Nervous', 'Low', 'Indirect'],
  ),
  environment: colorRows(
    ['Caves', 'Markets', 'Kitchens', 'Mountains', 'Valleys', 'Shores'],
    ['Selective', 'Internal', 'Wet', 'Active', 'Narrow', 'Natural'],
    ['Blending', 'External', 'Dry', 'Passive', 'Wide', 'Artificial'],
  ),
  motivation: colorRows(
    ['Fear', 'Hope', 'Desire', 'Need', 'Guilt', 'Innocence'],
    ['Communalist', 'Theist', 'Leader', 'Master', 'Conditioner', 'Observer'],
    ['Separatist', 'Anti-Theist', 'Follower', 'Novice', 'Conditioned', 'Observed'],
  ),
  perspective: sameBoth(['Survival', 'Possibility', 'Power', 'Wanting', 'Probability', 'Personal'], 'Focused', 'Peripheral'),
}

/** Body-side tones are the senses (Cognition on the Design Sun); mind-side tones are the Awareness tones. */
export const TONE_NAMES = {
  design:      ['Smell', 'Taste', 'Outer Vision', 'Inner Vision', 'Feeling', 'Touch'].map(entry),
  personality: ['Security', 'Uncertainty', 'Action', 'Meditation', 'Judgment', 'Acceptance'].map(entry),
}

export const orientationForTone = tone => (tone <= 3 ? 'left' : 'right')

const LETTER = { left: 'L', right: 'R' }

/** Color pairing 1-4, 2-5, 3-6: Motivation transference and View distraction (not defined for Digestion/Environment). */
export const pairedColor = color => ((color + 2) % 6) + 1

const arrowOf = (arrow, activation) => {
  const colors      = ARROW_COLORS[arrow.id]
  const color       = colors[activation.color - 1]
  const orientation = orientationForTone(activation.tone)
  const tone        = TONE_NAMES[arrow.layer][activation.tone - 1]

  return {
    id:          arrow.id,
    alias:       arrow.alias,
    layer:       arrow.layer,
    body:        arrow.body,
    gate:        activation.gate,
    line:        activation.line,
    color:       activation.color,
    colorKey:    color.key,
    colorName:   color.name,
    tone:        activation.tone,
    toneKey:     tone.key,
    toneName:    tone.name,
    base:        activation.base,
    orientation,
    variantKey:  `${arrow.id}.${color.key}.${color[orientation].key}`,
    variantName: color[orientation].name,
  }
}

/** Shorthand 'P<motivation><perspective> D<digestion><environment>' with L/R letters, e.g. 'PRL DLR'. */
export const variableShorthand = (orientations) => {
  const letters = ids => ids.map(id => LETTER[orientations[id]]).join('')
  return `P${letters(['motivation', 'perspective'])} D${letters(['digestion', 'environment'])}`
}

export const parseVariableShorthand = (shorthand) => {
  const [personality, design] = shorthand.split(' ').map(part => [...part.slice(1)])
  const side = letter => (letter === 'L' ? 'left' : 'right')

  return {
    motivation:  side(personality[0]),
    perspective: side(personality[1]),
    digestion:   side(design[0]),
    environment: side(design[1]),
  }
}

const pole = letters => (letters === 'LL' ? 'active' : letters === 'RR' ? 'passive' : 'mixed')

const combinationKey = shorthand => shorthand.toLowerCase().replace(' ', '_')

const combinationFor = (shorthand) => {
  const [personality, design] = shorthand.split(' ').map(part => part.slice(1))

  return {
    key:         combinationKey(shorthand),
    shorthand,
    leftCount:   [...personality, ...design].filter(letter => letter === 'L').length,
    personality: pole(personality),
    design:      pole(design),
  }
}

const PAIRS = ['LL', 'LR', 'RL', 'RR']

/** The 16 left/right combinations in shorthand order (P pair first, D pair second), keyed e.g. 'prl_dlr'. */
export const VARIABLE_COMBINATIONS = Object.fromEntries(
  PAIRS.flatMap(p => PAIRS.map(d => combinationFor(`P${p} D${d}`))).map(combination => [combination.key, combination])
)

const pairedOf = (arrow) => {
  const color = pairedColor(arrow.color)
  const { key, name } = ARROW_COLORS[arrow.id][color - 1]

  return { color, colorKey: key, colorName: name }
}

/** Variables of a chart's personality/design activations: four arrows, shorthand, combination, cognition and pairings. */
export const variablesForChart = (chart) => {
  const arrows       = Object.fromEntries(ARROWS.map(arrow => [arrow.id, arrowOf(arrow, chart[arrow.layer][arrow.body])]))
  const orientations = Object.fromEntries(Object.values(arrows).map(arrow => [arrow.id, arrow.orientation]))
  const shorthand    = variableShorthand(orientations)

  return {
    arrows,
    shorthand,
    combination:  VARIABLE_COMBINATIONS[combinationKey(shorthand)],
    cognition:    { tone: arrows.digestion.tone, key: arrows.digestion.toneKey, name: arrows.digestion.toneName },
    transference: pairedOf(arrows.motivation),
    distraction:  pairedOf(arrows.perspective),
  }
}
