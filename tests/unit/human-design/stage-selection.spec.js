import { describe, expect, it } from 'vitest'
import { isBodySelection, litBySelection, useStageSelection } from '../../../src/components/human-design/stage/selectionModel.js'
import { referenceChart } from './reference-chart.js'

describe('Human Design stage selection', () => {
  const chart = referenceChart()

  it('pins, toggles and clears one shared selection', () => {
    const stage = useStageSelection()

    stage.toggle({ type: 'gate', value: 34 })
    expect(stage.pinned.value).toEqual({ type: 'gate', value: 34 })
    stage.select({ type: 'gate', value: 34 })
    expect(stage.pinned.value).toEqual({ type: 'gate', value: 34 })
    stage.hover({ type: 'center', value: 'Sacral' })
    expect(stage.active.value).toEqual({ type: 'center', value: 'Sacral' })
    stage.toggle({ type: 'gate', value: 34 })
    expect(stage.pinned.value).toBeNull()
    stage.hover(null)
    expect(stage.active.value).toBeNull()
  })

  it('tells bodygraph selections from header selections', () => {
    expect(['center', 'channel', 'gate'].map(type => isBodySelection({ type }))).toEqual([true, true, true])
    expect(isBodySelection({ type: 'summary', value: 'type' })).toBe(false)
    expect(isBodySelection(null)).toBe(false)
  })

  it('lights the gates, channels and centers a selection relates to', () => {
    expect(litBySelection(chart, { type: 'center', value: 'Sacral' }).gates).toEqual(expect.arrayContaining([34, 5, 14]))
    expect(litBySelection(chart, { type: 'channel', value: '10-34' })).toMatchObject({ gates: [10, 34], centers: ['G', 'Sacral'] })
    expect(litBySelection(chart, { type: 'gate', value: 34 }).channels).toEqual(expect.arrayContaining(['10-34', '20-34']))
    expect(litBySelection(chart, null)).toBeNull()
  })

  it('lights what a header fact or a Variable arrow points at', () => {
    expect(litBySelection(chart, { type: 'summary', value: 'authority' }).centers).toEqual(['Solar Plexus'])
    expect(litBySelection(chart, { type: 'summary', value: 'definition' }).channels).toEqual(chart.channels)
    expect(litBySelection(chart, { type: 'summary', value: 'cross' }).gates).toEqual([49, 4, 14, 8])
    expect(litBySelection(chart, { type: 'summary', value: 'signature' })).toBeNull()
    expect(litBySelection(chart, { type: 'variable', value: 'motivation' }).gates).toEqual([49])
  })
})
