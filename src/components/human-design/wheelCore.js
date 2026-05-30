import { MANDALA_GATE_ORDER } from '../../lib/human-design/constants.js'

export const wheelCenter = 520
export const gateStep = 360 / 64
export const zodiacSigns = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
export const referenceTopMandalaIndex = 47
export const wheelRingRadii = {
  zodiacInner: 366,
  zodiacOuter: 406,
  gateInner: 406,
  gateOuter: 446,
  ichingRadius: 466,
  outerBorder: 482,
}

const mandalaIndexForGateIndex = index => (40 - index + 64) % 64

export const angleForMandalaIndex = index => (index - referenceTopMandalaIndex) * gateStep

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

export const mandalaAngleForLongitude = (longitude) => {
  const degrees = ((longitude + 58) % 360 + 360) % 360
  const gateIndex = degrees / 360 * 64
  return angleForMandalaIndex(mandalaIndexForGateIndex(gateIndex))
}

export const angularDistance = (a, b) => {
  const diff = Math.abs(a - b) % 360
  return Math.min(diff, 360 - diff)
}
