import { CENTER_GATES, CENTER_LAYOUT, CHANNEL_LAYOUT, GATE_CENTER, GATE_LAYOUT } from '../../../lib/human-design/layout.js'

const PAD      = 26
const MIN_SIZE = [230, 170]

const FOCUS_CENTERS = {
  center:  center => [center],
  gate:    gate => [GATE_CENTER[gate]],
  channel: id => CHANNEL_LAYOUT[id].centers,
}

const pointsOf = center => [CENTER_LAYOUT[center].centroid, ...CENTER_GATES[center].map(gate => [GATE_LAYOUT[gate].x, GATE_LAYOUT[gate].y])]
const span     = values => [Math.min(...values), Math.max(...values)]
const place    = (low, size, [min, max]) => Math.min(Math.max(low, min), max - size)

// The viewBox framing the centers a selection belongs to, kept inside the full figure.
export const zoomViewBox = (base, { type, value }) => {
  const points       = FOCUS_CENTERS[type](type === 'gate' ? Number(value) : value).flatMap(pointsOf)
  const [x0, x1]     = span(points.map(([x]) => x))
  const [y0, y1]     = span(points.map(([, y]) => y))
  const [w, h]       = [Math.min(base[2], Math.max(x1 - x0 + 2 * PAD, MIN_SIZE[0])), Math.min(base[3], Math.max(y1 - y0 + 2 * PAD, MIN_SIZE[1]))]

  return [
    place((x0 + x1 - w) / 2, w, [base[0], base[0] + base[2]]),
    place((y0 + y1 - h) / 2, h, [base[1], base[1] + base[3]]),
    w,
    h,
  ]
}
