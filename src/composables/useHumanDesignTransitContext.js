import { computed, onScopeDispose, ref, unref, watch } from 'vue'
import { buildHumanDesignTransitChart, humanDesignTransitConnection } from '../lib/human-design/bodygraph.js'

export const buildHumanDesignTransitContext = ({ natalChart, dateMs, lat, lon }) => {
  const transitChart = buildHumanDesignTransitChart(dateMs, lat, lon)

  return {
    transitChart,
    connection: transitChart
      ? humanDesignTransitConnection(natalChart, transitChart, { lat, lon })
      : null,
  }
}

export const useHumanDesignTransitContext = ({ enabled, natalChart, person, dateMs, debounceMs = 450 }) => {
  const data    = ref(null)
  const error   = ref(null)
  const status  = ref('idle')
  let timer     = null
  let requestId = 0

  const cancelTimer = () => {
    if (!timer) return
    globalThis.clearTimeout(timer)
    timer = null
  }

  const refresh = () => {
    cancelTimer()

    const currentEnabled = unref(enabled)
    const currentChart   = unref(natalChart)
    const currentPerson  = unref(person)
    const currentDateMs  = unref(dateMs)

    if (!currentEnabled || !currentChart || !currentPerson || !Number.isFinite(Number(currentDateMs))) {
      requestId += 1
      data.value   = null
      error.value  = null
      status.value = 'idle'
      return
    }

    const currentRequest = requestId + 1
    requestId            = currentRequest
    data.value           = null
    error.value          = null
    status.value         = 'loading'

    timer = globalThis.setTimeout(() => {
      timer = null
      if (currentRequest !== requestId) return

      try {
        const nextData = buildHumanDesignTransitContext({
          natalChart: currentChart,
          dateMs:     Number(currentDateMs),
          lat:        currentPerson.lat,
          lon:        currentPerson.lon,
        })

        if (currentRequest !== requestId) return
        data.value   = nextData
        status.value = 'ready'
      } catch (caughtError) {
        if (currentRequest !== requestId) return
        data.value   = null
        error.value  = caughtError
        status.value = 'error'
      }
    }, debounceMs)
  }

  watch(
    () => [unref(enabled), unref(natalChart), unref(person)?.id, unref(dateMs)],
    refresh,
    { immediate: true }
  )

  onScopeDispose(() => {
    requestId += 1
    cancelTimer()
  })

  return {
    data,
    error,
    status,
    loading: computed(() => status.value === 'loading'),
    refresh,
  }
}
