import { buildHumanDesignTransitContext } from './transit-context.js'

const canUseWorker = () =>
  typeof Worker === 'function' &&
  !import.meta.env.SSR &&
  import.meta.env.MODE !== 'test'

const serializeError = error => ({
  name:    error?.name || 'Error',
  message: error?.message || String(error || 'Unknown worker error'),
  stack:   error?.stack || '',
})

const reviveError = payload => {
  const error = new Error(payload?.message || 'Human Design transit worker failed')
  error.name  = payload?.name || 'Error'
  error.stack = payload?.stack || error.stack
  return error
}

export const createHumanDesignTransitWorkerClient = ({ fallback = buildHumanDesignTransitContext } = {}) => {
  let worker = null
  let nextId = 0
  const pending = new Map()

  const ensureWorker = () => {
    if (!canUseWorker()) return null
    if (worker) return worker

    worker = new Worker(new URL('../../workers/humanDesignTransit.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (event) => {
      const { id, data, error } = event.data || {}
      const request = pending.get(id)
      if (!request) return

      pending.delete(id)
      if (error) request.reject(reviveError(error))
      else request.resolve(data)
    }
    worker.onerror = (event) => {
      const error = reviveError(serializeError(event.error || event.message))
      for (const request of pending.values()) request.reject(error)
      pending.clear()
      worker?.terminate()
      worker = null
    }

    return worker
  }

  const build = (payload) => {
    try {
      const activeWorker = ensureWorker()
      if (!activeWorker) return Promise.resolve(fallback(payload))

      const id = ++nextId
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        activeWorker.postMessage({ id, payload })
      })
    } catch {
      return Promise.resolve(fallback(payload))
    }
  }

  const terminate = () => {
    for (const request of pending.values()) request.reject(new Error('Human Design transit worker terminated'))
    pending.clear()
    worker?.terminate()
    worker = null
  }

  return { build, terminate }
}
