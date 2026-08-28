import { searchEvents } from './events.js'
import { observerOf } from './ephemeris3d.js'

const canUseWorker = () =>
  typeof Worker === 'function' &&
  !import.meta.env.SSR &&
  import.meta.env.MODE !== 'test'

const runLocally = (payload) =>
  searchEvents({ ...payload, observer: payload?.location ? observerOf(payload.location) : null })

const reviveError = (payload) => {
  const error = new Error(payload?.message || 'Planetarium event search failed')
  error.name  = payload?.name || 'Error'
  return error
}

export const createEventWorkerClient = () => {
  let worker  = null
  let nextId  = 0
  const pending = new Map()

  const ensureWorker = () => {
    if (!canUseWorker()) return null
    if (worker) return worker

    worker = new Worker(new URL('../../workers/planetariumEvents.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (event) => {
      const { id, data, error } = event.data || {}
      const request = pending.get(id)
      if (!request) return
      pending.delete(id)
      if (error) request.reject(reviveError(error))
      else request.resolve(data)
    }
    worker.onerror = () => {
      for (const request of pending.values()) request.reject(new Error('Planetarium event worker crashed'))
      pending.clear()
      worker?.terminate()
      worker = null
    }
    return worker
  }

  const search = (payload) => {
    const activeWorker = ensureWorker()
    if (!activeWorker) return Promise.resolve(runLocally(payload))

    const id = ++nextId
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      activeWorker.postMessage({ id, payload })
    })
  }

  const terminate = () => {
    pending.clear()
    worker?.terminate()
    worker = null
  }

  return { search, terminate }
}
