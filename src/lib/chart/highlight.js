export const CHART_HIGHLIGHT_EVENT = 'astrelio-chart-highlight'

export const normalizeHighlight = (payload) => ({
  bodies:    [...new Set(payload?.bodies || [])],
  aspectKey: payload?.aspectKey || '',
  aspect:    payload?.aspect || null,
  hd:        payload?.hd || null,
})

export const hasHighlight = (highlight) =>
  Boolean(highlight?.aspectKey || highlight?.bodies?.length || highlight?.hd)

export const sameHighlight = (a = {}, b = {}) => {
  const left  = normalizeHighlight(a)
  const right = normalizeHighlight(b)
  return left.aspectKey === right.aspectKey &&
    JSON.stringify(left.hd || null) === JSON.stringify(right.hd || null) &&
    left.bodies.length === right.bodies.length &&
    left.bodies.every(body => right.bodies.includes(body))
}

export const aspectKey = (aspect) =>
  aspect ? `${aspect.a}-${aspect.b}-${aspect.type}` : ''

export const broadcastChartHighlight = ({ highlight = null, pinned = false, chart = null } = {}) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CHART_HIGHLIGHT_EVENT, {
    detail: { highlight, pinned, chart },
  }))
}

export const humanDesignHighlight = (type, value, detail = {}) => ({
  bodies:    [],
  aspectKey: '',
  hd:        { type, value, ...detail },
})
