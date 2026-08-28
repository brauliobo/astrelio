import { searchEvents } from '../lib/planetarium/events.js'
import { observerOf } from '../lib/planetarium/ephemeris3d.js'

const serializeError = error => ({
  name:    error?.name || 'Error',
  message: error?.message || String(error || 'Unknown planetarium event error'),
})

self.onmessage = (event) => {
  const { id, payload } = event.data || {}

  try {
    const observer = payload?.location ? observerOf(payload.location) : null
    self.postMessage({ id, data: searchEvents({ ...payload, observer }) })
  } catch (error) {
    self.postMessage({ id, error: serializeError(error) })
  }
}
