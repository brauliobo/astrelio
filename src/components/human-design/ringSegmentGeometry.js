import { MANDALA_GATE_ORDER } from '../../lib/human-design/constants.js'
import {
  angleForMandalaIndex,
  mandalaAngleForLongitude,
  polar,
  wheelRingRadii,
  zodiacSigns,
} from './wheelCore.js'

const clockwiseArc = (inner, outer, startAngle, endAngle) => {
  const normalizedEnd = endAngle < startAngle ? endAngle + 360 : endAngle
  const large         = normalizedEnd - startAngle > 180 ? 1 : 0
  const a             = polar(outer, startAngle)
  const b             = polar(outer, normalizedEnd)
  const c             = polar(inner, normalizedEnd)
  const d             = polar(inner, startAngle)
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`
}

export const arcPath = (inner, outer, startAngle, endAngle) => clockwiseArc(inner, outer, startAngle, endAngle)

export const gateSegmentLayout = ({ inner = 390, outer = 438, labelRadius = 415 } = {}) =>
  MANDALA_GATE_ORDER.map((gate, index) => {
    const startAngle   = angleForMandalaIndex(index)
    const endAngle     = angleForMandalaIndex(index + 1)
    const midAngle     = angleForMandalaIndex(index + 0.5)
    const dividerInner = Math.min(inner, wheelRingRadii.zodiacInner)
    return {
      gate,
      index,
      startAngle,
      endAngle,
      midAngle,
      path:         arcPath(inner, outer, startAngle, endAngle),
      dividerAngle: startAngle,
      rayAngle:     startAngle,
      divider:      { a: polar(dividerInner, startAngle), b: polar(wheelRingRadii.outerBorder, startAngle) },
      ray:          { a: polar(178, startAngle), b: polar(dividerInner, startAngle) },
      label:        polar(labelRadius, midAngle),
    }
  })

export const zodiacSegmentLayout = ({ inner = 338, outer = 382, labelRadius = 360 } = {}) =>
  zodiacSigns.map((sign, index) => {
    const longitudeStart = index * 30
    const longitudeEnd   = longitudeStart + 30
    const startAngle     = mandalaAngleForLongitude(longitudeEnd)
    const endAngle       = mandalaAngleForLongitude(longitudeStart)
    const midAngle       = mandalaAngleForLongitude(longitudeStart + 15)
    return {
      sign,
      index,
      startAngle,
      endAngle,
      midAngle,
      path:  arcPath(inner, outer, startAngle, endAngle),
      label: polar(labelRadius, midAngle),
    }
  })

export const signForAngle = (angle) =>
  zodiacSegmentLayout().find((segment) => {
    const start  = segment.startAngle
    const end    = segment.endAngle < start ? segment.endAngle + 360 : segment.endAngle
    const target = angle < start ? angle + 360 : angle
    return target >= start && target < end
  })?.sign
