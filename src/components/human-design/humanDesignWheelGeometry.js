import { MANDALA_GATE_ORDER } from '../../lib/human-design/constants.js'

export const wheelCenter = 520
export const gateStep = 360 / 64
export const zodiacSigns = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
export const referenceTopMandalaIndex = 47
export const wheelRingRadii = {
  zodiacInner: 346,
  zodiacOuter: 386,
  gateInner: 386,
  gateOuter: 426,
  ichingRadius: 446,
  outerBorder: 462,
}

export const planetGlyphRadii = [326, 304, 282, 260, 238, 216]
export const planetGlyphMinAngleGap = 5.8

const trigramLinesTopToBottom = {
  heaven: [false, false, false],
  earth: [true, true, true],
  thunder: [true, true, false],
  water: [true, false, true],
  mountain: [false, true, true],
  wind: [false, false, true],
  fire: [false, true, false],
  lake: [true, false, false],
}

const kingWenHexagramTrigrams = {
  1: ['heaven', 'heaven'],
  2: ['earth', 'earth'],
  3: ['water', 'thunder'],
  4: ['mountain', 'water'],
  5: ['water', 'heaven'],
  6: ['heaven', 'water'],
  7: ['earth', 'water'],
  8: ['water', 'earth'],
  9: ['wind', 'heaven'],
  10: ['heaven', 'lake'],
  11: ['earth', 'heaven'],
  12: ['heaven', 'earth'],
  13: ['heaven', 'fire'],
  14: ['fire', 'heaven'],
  15: ['earth', 'mountain'],
  16: ['thunder', 'earth'],
  17: ['lake', 'thunder'],
  18: ['mountain', 'wind'],
  19: ['earth', 'lake'],
  20: ['wind', 'earth'],
  21: ['fire', 'thunder'],
  22: ['mountain', 'fire'],
  23: ['mountain', 'earth'],
  24: ['earth', 'thunder'],
  25: ['heaven', 'thunder'],
  26: ['mountain', 'heaven'],
  27: ['mountain', 'thunder'],
  28: ['lake', 'wind'],
  29: ['water', 'water'],
  30: ['fire', 'fire'],
  31: ['lake', 'mountain'],
  32: ['thunder', 'wind'],
  33: ['heaven', 'mountain'],
  34: ['thunder', 'heaven'],
  35: ['fire', 'earth'],
  36: ['earth', 'fire'],
  37: ['wind', 'fire'],
  38: ['fire', 'lake'],
  39: ['water', 'mountain'],
  40: ['thunder', 'water'],
  41: ['mountain', 'lake'],
  42: ['wind', 'thunder'],
  43: ['lake', 'heaven'],
  44: ['heaven', 'wind'],
  45: ['lake', 'earth'],
  46: ['earth', 'wind'],
  47: ['lake', 'water'],
  48: ['water', 'wind'],
  49: ['lake', 'fire'],
  50: ['fire', 'wind'],
  51: ['thunder', 'thunder'],
  52: ['mountain', 'mountain'],
  53: ['wind', 'mountain'],
  54: ['thunder', 'lake'],
  55: ['thunder', 'fire'],
  56: ['fire', 'mountain'],
  57: ['wind', 'wind'],
  58: ['lake', 'lake'],
  59: ['wind', 'water'],
  60: ['water', 'lake'],
  61: ['wind', 'lake'],
  62: ['thunder', 'mountain'],
  63: ['water', 'fire'],
  64: ['fire', 'water'],
}

const mandalaIndexForGateIndex = index => (40 - index + 64) % 64
const angleForMandalaIndex = index => (index - referenceTopMandalaIndex) * gateStep

export const ichingLinesForGate = (gate) => {
  const trigrams = kingWenHexagramTrigrams[Number(gate)] || kingWenHexagramTrigrams[2]
  const [upper, lower] = trigrams
  return [...trigramLinesTopToBottom[upper], ...trigramLinesTopToBottom[lower]]
}

export const polar = (radius, angle, center = wheelCenter) => {
  const radians = (angle - 90) * Math.PI / 180
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
    radius,
    angle,
  }
}

export const mandalaIndexForGate = gate => MANDALA_GATE_ORDER.indexOf(Number(gate))

export const mandalaAngleForActivation = (activation = {}) => {
  const index = mandalaIndexForGate(activation.gate)
  if (index < 0) return Number.NaN
  const lineOffset = ((activation.line || 1) - 0.5) / 6
  return angleForMandalaIndex(index + lineOffset)
}

export const mandalaAngleForGate = (gate) => {
  const index = mandalaIndexForGate(gate)
  if (index < 0) return Number.NaN
  return angleForMandalaIndex(index + 0.5)
}

export const angularDistance = (a, b) => {
  const diff = Math.abs(a - b) % 360
  return Math.min(diff, 360 - diff)
}

const normalizedAngle = angle => ((angle % 360) + 360) % 360

export const planetGlyphLayout = (activations = []) => {
  const sorted = activations
    .map((item, sourceIndex) => ({
      ...item,
      sourceIndex,
      angle: mandalaAngleForGate(item.gate),
    }))
    .filter(item => Number.isFinite(item.angle))
    .sort((a, b) => normalizedAngle(a.angle) - normalizedAngle(b.angle) || a.sourceIndex - b.sourceIndex)

  const placed = []
  const gateCounts = new Map()
  for (const item of sorted) {
    const count = gateCounts.get(item.gate) || 0
    const lane = Math.min(count, planetGlyphRadii.length - 1)
    gateCounts.set(item.gate, count + 1)
    placed.push({
      ...item,
      lane,
      radius: planetGlyphRadii[lane],
      point: polar(planetGlyphRadii[lane], item.angle),
    })
  }

  return placed.sort((a, b) => a.sourceIndex - b.sourceIndex)
}

export const mandalaAngleForLongitude = (longitude) => {
  const degrees = ((longitude + 58) % 360 + 360) % 360
  const gateIndex = degrees / 360 * 64
  return angleForMandalaIndex(mandalaIndexForGateIndex(gateIndex))
}

const clockwiseArc = (inner, outer, startAngle, endAngle) => {
  const normalizedEnd = endAngle < startAngle ? endAngle + 360 : endAngle
  const large = normalizedEnd - startAngle > 180 ? 1 : 0
  const a = polar(outer, startAngle)
  const b = polar(outer, normalizedEnd)
  const c = polar(inner, normalizedEnd)
  const d = polar(inner, startAngle)
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`
}

export const arcPath = (inner, outer, startAngle, endAngle) => clockwiseArc(inner, outer, startAngle, endAngle)

export const gateSegmentLayout = ({ inner = 390, outer = 438, labelRadius = 415 } = {}) =>
  MANDALA_GATE_ORDER.map((gate, index) => {
    const startAngle = angleForMandalaIndex(index)
    const endAngle = angleForMandalaIndex(index + 1)
    const midAngle = angleForMandalaIndex(index + 0.5)
    const dividerInner = Math.min(inner, wheelRingRadii.zodiacInner)
    return {
      gate,
      index,
      startAngle,
      endAngle,
      midAngle,
      path: arcPath(inner, outer, startAngle, endAngle),
      dividerAngle: startAngle,
      rayAngle: startAngle,
      divider: { a: polar(dividerInner, startAngle), b: polar(wheelRingRadii.outerBorder, startAngle) },
      ray: { a: polar(178, startAngle), b: polar(dividerInner, startAngle) },
      label: polar(labelRadius, midAngle),
    }
  })

export const zodiacSegmentLayout = ({ inner = 338, outer = 382, labelRadius = 360 } = {}) =>
  zodiacSigns.map((sign, index) => {
    const longitudeStart = index * 30
    const longitudeEnd = longitudeStart + 30
    const startAngle = mandalaAngleForLongitude(longitudeEnd)
    const endAngle = mandalaAngleForLongitude(longitudeStart)
    const midAngle = mandalaAngleForLongitude(longitudeStart + 15)
    return {
      sign,
      index,
      startAngle,
      endAngle,
      midAngle,
      path: arcPath(inner, outer, startAngle, endAngle),
      label: polar(labelRadius, midAngle),
    }
  })

export const ichingSymbolForGate = gate => String.fromCodePoint(0x4DC0 + Number(gate) - 1)

export const ichingRingLayout = ({ gates = MANDALA_GATE_ORDER, radius = 484 } = {}) =>
  gates.map((gate, index) => ({
    gate,
    symbol: ichingSymbolForGate(gate),
    angle: index * gateStep + gateStep / 2,
    point: polar(radius, angleForMandalaIndex(index + 0.5)),
  }))

export const referenceBrauliWheelPositions = {
  person: {
    isoLocal: '1986-02-12T18:10',
    tzOffsetMinutes: -120,
    placeLabel: 'São José dos Campos, SP — Brasil',
  },
  placements: [
    { layer: 'personality', planet: 'Sun', gate: 49, sign: '♒' },
    { layer: 'design', planet: 'Sun', gate: 14, sign: '♐' },
    { layer: 'personality', planet: 'Earth', gate: 4, sign: '♌' },
    { layer: 'design', planet: 'Earth', gate: 8, sign: '♉' },
    { layer: 'personality', planet: 'NorthNode', gate: 27, sign: '♉' },
    { layer: 'design', planet: 'NorthNode', gate: 24, sign: '♉' },
    { layer: 'personality', planet: 'SouthNode', gate: 28, sign: '♏' },
    { layer: 'design', planet: 'SouthNode', gate: 44, sign: '♏' },
    { layer: 'personality', planet: 'Moon', gate: 21, sign: '♈' },
    { layer: 'design', planet: 'Moon', gate: 19, sign: '♒' },
    { layer: 'personality', planet: 'Mercury', gate: 55, sign: '♒' },
    { layer: 'design', planet: 'Mercury', gate: 5, sign: '♐' },
    { layer: 'personality', planet: 'Venus', gate: 30, sign: '♒' },
    { layer: 'design', planet: 'Venus', gate: 44, sign: '♏' },
    { layer: 'personality', planet: 'Mars', gate: 9, sign: '♐' },
    { layer: 'design', planet: 'Mars', gate: 48, sign: '♎' },
    { layer: 'personality', planet: 'Jupiter', gate: 30, sign: '♒' },
    { layer: 'design', planet: 'Jupiter', gate: 19, sign: '♒' },
    { layer: 'personality', planet: 'Saturn', gate: 9, sign: '♐' },
    { layer: 'design', planet: 'Saturn', gate: 34, sign: '♏' },
    { layer: 'personality', planet: 'Uranus', gate: 26, sign: '♐' },
    { layer: 'design', planet: 'Uranus', gate: 5, sign: '♐' },
    { layer: 'personality', planet: 'Neptune', gate: 58, sign: '♑' },
    { layer: 'design', planet: 'Neptune', gate: 10, sign: '♐' },
    { layer: 'personality', planet: 'Pluto', gate: 28, sign: '♎' },
    { layer: 'design', planet: 'Pluto', gate: 28, sign: '♎' },
  ],
}

export const signForAngle = (angle) =>
  zodiacSegmentLayout().find((segment) => {
    const start = segment.startAngle
    const end = segment.endAngle < start ? segment.endAngle + 360 : segment.endAngle
    const target = angle < start ? angle + 360 : angle
    return target >= start && target < end
  })?.sign
