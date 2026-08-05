import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNatalChartState } from '../../src/composables/useChart.js'

const computeChart = vi.hoisted(() => vi.fn())

vi.mock('../../src/lib/astro/ephemeris.js', () => ({ computeChart }))

const person = {
  isoLocal:        '1986-02-12T18:10',
  tzOffsetMinutes: -120,
  lat:             -23.18,
  lon:             -45.88,
}

const settings = {
  chartOptions: { zodiac: 'tropical', houseSystem: 'placidus', nodeMode: 'mean' },
}

describe('useNatalChartState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('turns a fatal calculation into an explicit error state', () => {
    computeChart.mockImplementationOnce(() => {
      throw new Error('Swiss Ephemeris internals')
    })

    const state = useNatalChartState(ref(person), settings)

    expect(state.chart.value).toBeNull()
    expect(state.error.value).toBeInstanceOf(Error)
    expect(state.error.value.message).toBe('Swiss Ephemeris internals')
  })

  it('keeps successful charts and clears the error state', () => {
    const chart = { positions: [] }
    computeChart.mockReturnValueOnce(chart)

    const state = useNatalChartState(computed(() => person), settings)

    expect(state.chart.value).toBe(chart)
    expect(state.error.value).toBeNull()
  })
})
