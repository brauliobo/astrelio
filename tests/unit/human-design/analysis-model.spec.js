import { describe, expect, it } from 'vitest'
import {
  bridgeRows,
  centersByClass,
  circuitBalance,
  definedStreams,
  filterGates,
  gateRows,
  hangingGates,
  normalizeText,
} from '../../../src/components/human-design/analysis/model.js'
import { chart } from './analysis-support.js'

const labels = { gate: gate => `Gate ${gate}`, center: id => id }
const rows   = gateRows(chart, labels)

describe('analysis model', () => {
  it('groups the nine centers by primary class', () => {
    const groups = centersByClass(chart)
    expect(groups.map(group => group.id)).toEqual(['pressure', 'awareness', 'motor', 'expression', 'identity'])
    expect(groups.flatMap(group => group.centers)).toHaveLength(9)
    expect(groups.find(group => group.id === 'awareness').centers.map(center => center.id)).toEqual(['Ajna', 'Solar Plexus', 'Spleen'])
  })

  it('describes all 64 gates with their layer and channel state', () => {
    expect(rows).toHaveLength(64)
    expect(rows.find(row => row.gate === 34)).toMatchObject({ layer: 'design', defined: true, hanging: false })
    expect(rows.find(row => row.gate === 28).layer).toBe('both')
    expect(rows.find(row => row.gate === 58)).toMatchObject({ layer: 'personality', hanging: true })
    expect(rows.find(row => row.gate === 1)).toMatchObject({ layer: null, active: false })
  })

  it('filters gates by mode, query, center and circuit', () => {
    expect(filterGates(rows, { mode: 'active' })).toHaveLength(chart.gates.length)
    expect(filterGates(rows, { mode: 'defined' }).map(row => row.gate)).toEqual(expect.arrayContaining([10, 34, 19, 49, 26, 44]))
    expect(filterGates(rows, { mode: 'hanging' }).every(row => row.hanging)).toBe(true)
    expect(filterGates(rows, { query: '34' }).map(row => row.gate)).toEqual([34])
    expect(filterGates(rows, { center: 'Head' }).map(row => row.gate)).toEqual([61, 63, 64])
    expect(filterGates(rows, { circuit: 'Tribal' }).every(row => row.circuits.includes('Tribal'))).toBe(true)
  })

  it('ignores accents when searching', () => {
    expect(normalizeText('Atenção')).toBe('atencao')
    const accented = rows.map(row => ({ ...row, name: 'Ação' }))
    expect(filterGates(accented, { query: 'acao' })).toHaveLength(64)
  })

  it('balances the defined channels between circuit families', () => {
    const balance = circuitBalance(chart.channels)
    expect(balance.map(row => [row.id, row.count])).toEqual([['individual', 1], ['tribal', 2], ['collective', 0]])
    expect(balance.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1)
    expect(definedStreams(chart.channels).map(item => item.stream)).toEqual(['Centering', 'Ego'])
  })

  it('merges gate bridges by missing gate and keeps whole-channel bridges apart', () => {
    const bridges = bridgeRows(chart)
    const gate57  = bridges.gates.find(row => row.gate === 57)
    expect(gate57.channels.map(item => [item.channel, item.held])).toEqual([['10-57', 10], ['34-57', 34]])
    expect(bridges.channels.map(row => row.channel)).toContain('3-60')
  })

  it('lists hanging gates from the details', () => {
    expect(hangingGates(chart).map(row => row.gate)).toEqual(expect.arrayContaining([58, 4, 24]))
  })
})
