export const CHART_HIGHLIGHT_EVENT = 'astrelio-chart-highlight'

export const normalizeHighlight = (payload) => ({
  bodies:    [...new Set(payload?.bodies || [])],
  aspectKey: payload?.aspectKey || '',
  aspect:    payload?.aspect || null,
  hd:        payload?.hd || null,
  wheel:     payload?.wheel || null,
})

export const hasHighlight = (highlight) =>
  Boolean(highlight?.aspectKey || highlight?.bodies?.length || highlight?.hd || highlight?.wheel)

export const sameHighlight = (a = {}, b = {}) => {
  const left  = normalizeHighlight(a)
  const right = normalizeHighlight(b)
  return left.aspectKey === right.aspectKey &&
    JSON.stringify(left.hd || null) === JSON.stringify(right.hd || null) &&
    (left.wheel?.kind || '') === (right.wheel?.kind || '') &&
    (left.wheel?.id || '') === (right.wheel?.id || '') &&
    left.bodies.length === right.bodies.length &&
    left.bodies.every(body => right.bodies.includes(body))
}

export const aspectKey = (aspect) =>
  aspect ? `${aspect.a}-${aspect.b}-${aspect.type}` : ''

export const viewportRect = (rect) => rect ? {
  left:   Number(rect.left),
  top:    Number(rect.top),
  right:  Number(rect.right),
  bottom: Number(rect.bottom),
  width:  Number(rect.width),
  height: Number(rect.height),
} : null

export const broadcastChartHighlight = ({ highlight = null, pinned = false, chart = null, anchor } = {}) => {
  if (typeof window === 'undefined') return
  const detail = { highlight, pinned, chart }
  if (anchor) detail.anchor = viewportRect(anchor)
  window.dispatchEvent(new CustomEvent(CHART_HIGHLIGHT_EVENT, {
    detail,
  }))
}

export const humanDesignHighlight = (type, value, detail = {}) => ({
  bodies:    [],
  aspectKey: '',
  hd:        { type, value, ...detail },
})

export const wheelHighlight = (kind, id, detail = {}) => ({
  bodies:    [],
  aspectKey: '',
  wheel:     { kind, id, ...detail },
})
