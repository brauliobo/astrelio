import { effectScope, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHumanDesignTransitContext } from '../../../src/composables/useHumanDesignTransitContext.js'
import { buildHumanDesignTransitChart, humanDesignTransitConnection } from '../../../src/lib/human-design/bodygraph.js'

vi.mock('../../../src/lib/human-design/bodygraph.js', () => ({
  buildHumanDesignTransitChart: vi.fn(() => ({ id: 'transit' })),
  humanDesignTransitConnection: vi.fn(() => ({ id: 'connection' })),
}))

describe('useHumanDesignTransitContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exposes idle, loading, and ready states for deferred transit context', async () => {
    const enabled    = ref(false)
    const natalChart = ref({ id: 'natal' })
    const person     = ref({ id: 'ada', lat: 1, lon: 2 })
    const dateMs     = ref(1000)
    const scope      = effectScope()
    let context

    scope.run(() => {
      context = useHumanDesignTransitContext({ enabled, natalChart, person, dateMs, debounceMs: 20 })
    })

    expect(context.status.value).toBe('idle')

    enabled.value = true
    await nextTick()

    expect(context.status.value).toBe('loading')
    expect(context.data.value).toBeNull()

    vi.advanceTimersByTime(20)

    expect(context.status.value).toBe('ready')
    expect(context.data.value.transitChart).toEqual({ id: 'transit' })
    expect(context.data.value.connection).toEqual({ id: 'connection' })
    expect(buildHumanDesignTransitChart).toHaveBeenCalledWith(1000, 1, 2)
    expect(humanDesignTransitConnection).toHaveBeenCalledWith({ id: 'natal' }, { id: 'transit' }, { lat: 1, lon: 2 })

    scope.stop()
  })

  it('ignores stale queued refreshes when inputs change quickly', async () => {
    const enabled    = ref(true)
    const natalChart = ref({ id: 'natal' })
    const person     = ref({ id: 'ada', lat: 1, lon: 2 })
    const dateMs     = ref(1000)
    const scope      = effectScope()

    scope.run(() => {
      useHumanDesignTransitContext({ enabled, natalChart, person, dateMs, debounceMs: 20 })
    })
    await nextTick()

    dateMs.value = 2000
    await nextTick()
    vi.advanceTimersByTime(20)

    expect(buildHumanDesignTransitChart).toHaveBeenCalledTimes(1)
    expect(buildHumanDesignTransitChart).toHaveBeenCalledWith(2000, 1, 2)

    scope.stop()
  })
})
