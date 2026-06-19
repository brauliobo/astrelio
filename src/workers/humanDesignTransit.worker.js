import { buildHumanDesignTransitContext } from '../lib/human-design/transit-context.js'

const serializeError = error => ({
  name:    error?.name || 'Error',
  message: error?.message || String(error || 'Unknown transit error'),
  stack:   error?.stack || '',
})

self.onmessage = (event) => {
  const { id, payload } = event.data || {}

  try {
    self.postMessage({
      id,
      data: buildHumanDesignTransitContext(payload),
    })
  } catch (error) {
    self.postMessage({
      id,
      error: serializeError(error),
    })
  }
}
