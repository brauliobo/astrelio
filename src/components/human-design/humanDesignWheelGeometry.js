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

const mandalaIndexForGateIndex = index => (40 - index + 64) % 64
const angleForMandalaIndex = index => (index - referenceTopMandalaIndex) * gateStep

export const polar = (radius, angle, center = wheelCenter) => {
  const radians = (angle - 90) * Math.PI / 180
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  }
}

export const mandalaIndexForGate = gate => MANDALA_GATE_ORDER.indexOf(Number(gate))

export const mandalaAngleForActivation = (activation = {}) => {
  const index = mandalaIndexForGate(activation.gate)
  if (index < 0) return Number.NaN
  const lineOffset = ((activation.line || 1) - 0.5) / 6
  return angleForMandalaIndex(index + lineOffset)
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
    return {
      gate,
      index,
      startAngle,
      endAngle,
      midAngle,
      path: arcPath(inner, outer, startAngle, endAngle),
      line: { a: polar(inner - 28, startAngle), b: polar(outer + 6, startAngle) },
      ray: { a: polar(170, midAngle), b: polar(inner - 48, midAngle) },
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
  ],
}

export const signForAngle = (angle) =>
  zodiacSegmentLayout().find((segment) => {
    const start = segment.startAngle
    const end = segment.endAngle < start ? segment.endAngle + 360 : segment.endAngle
    const target = angle < start ? angle + 360 : angle
    return target >= start && target < end
  })?.sign
