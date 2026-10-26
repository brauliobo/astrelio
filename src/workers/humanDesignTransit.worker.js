// The ephemeris module awaits wasm at top level, so the handler is registered first and waits for it.
const transitContext = import('../lib/human-design/transit-context.js')

const serializeError = error => ({
  name:    error?.name || 'Error',
  message: error?.message || String(error || 'Unknown transit error'),
  stack:   error?.stack || '',
})

self.onmessage = async (event) => {
  const { id, payload } = event.data || {}

  try {
    const { buildHumanDesignTransitContext } = await transitContext
    self.postMessage({ id, data: buildHumanDesignTransitContext(payload) })
  } catch (error) {
    self.postMessage({ id, error: serializeError(error) })
  }
}
