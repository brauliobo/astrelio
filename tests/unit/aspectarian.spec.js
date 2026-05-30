import { describe, expect, it } from 'vitest'
import { aspectMatrix, chartAspectPoints, fortuneLongitude, spiritLongitude } from '../../src/lib/astro/aspectarian.js'

const position = (name, longitude, speed = 1) => ({
  name,
  longitude,
  latitude: 0,
  speed,
  retrograde: false,
})

const chart = {
  ascendant: 117 + (49 / 60),
  mc:        12,
  positions: [
    position('Sun', 300 + 23 + (49 / 60)),
    position('Moon', 9 + (52 / 60)),
    position('Mars', 23 + (49 / 60)),
    position('SouthNode', 210),
  ],
}

describe('aspectarian chart points', () => {
  it('adds Ascendant, Midheaven, and Fortune after tropical chart bodies', () => {
    const points = chartAspectPoints(chart)

    expect(points.map(point => point.name)).toEqual([
      'Sun',
      'Moon',
      'Mars',
      'Ascendant',
      'Midheaven',
      'Fortune',
      'Spirit',
    ])
    expect(fortuneLongitude(chart)).toBeCloseTo(163 + (52 / 60), 6)
    expect(spiritLongitude(chart)).toBeCloseTo(71 + (46 / 60), 6)
  })

  it('builds a compact natal matrix without duplicate self-chart cells', () => {
    const matrix    = aspectMatrix(chart, null, { aspectSet: 'major' })
    const marsRow   = matrix.rows.find(row => row.point.name === 'Mars')
    const sunIndex  = matrix.columns.findIndex(point => point.name === 'Sun')
    const marsIndex = matrix.columns.findIndex(point => point.name === 'Mars')

    expect(marsRow.cells[sunIndex]).toMatchObject({
      a:    'Sun',
      b:    'Mars',
      type: 'sextile',
    })
    expect(marsRow.cells[marsIndex]).toBeNull()
  })

  it('adds Vertex and East Point when chart point longitudes are available', () => {
    const points = chartAspectPoints({ ...chart, vertex: 42, eastPoint: 201 })

    expect(points.map(point => point.name)).toEqual([
      'Sun',
      'Moon',
      'Mars',
      'Ascendant',
      'Midheaven',
      'Fortune',
      'Spirit',
      'Vertex',
      'EastPoint',
    ])
    expect(points.find(point => point.name === 'Vertex').longitude).toBe(42)
    expect(points.find(point => point.name === 'EastPoint').longitude).toBe(201)
  })

  it('respects aspect set and applying filters for matrix cells', () => {
    const filterChart = {
      ascendant: 0,
      mc:        90,
      positions: [
        position('Sun', 0, 1),
        position('Moon', 150, 0.5),
        position('Mars', 62, 0.5),
      ],
    }

    const major           = aspectMatrix(filterChart, null, { aspectSet: 'major' })
    const all             = aspectMatrix(filterChart, null, { aspectSet: 'all' })
    const applying        = aspectMatrix(filterChart, null, { aspectSet: 'all', applyingOnly: true })
    const moonRowMajor    = major.rows.find(row => row.point.name === 'Moon')
    const moonRowAll      = all.rows.find(row => row.point.name === 'Moon')
    const marsRowApplying = applying.rows.find(row => row.point.name === 'Mars')
    const sunIndex        = all.columns.findIndex(point => point.name === 'Sun')

    expect(moonRowMajor.cells[sunIndex]).toBeNull()
    expect(moonRowAll.cells[sunIndex]).toMatchObject({
      a:     'Sun',
      b:     'Moon',
      type:  'quincunx',
      delta: 0,
    })
    expect(marsRowApplying.cells[sunIndex]).toMatchObject({
      a:        'Sun',
      b:        'Mars',
      type:     'sextile',
      applying: true,
    })
  })

  it('uses base chart columns and comparison chart rows for timing grids', () => {
    const comparison = {
      ...chart,
      positions: [
        position('Sun', 60),
        position('Moon', 83 + (49 / 60)),
      ],
    }
    const matrix   = aspectMatrix(chart, comparison, { aspectSet: 'major' })
    const moonRow  = matrix.rows.find(row => row.point.name === 'Moon')
    const sunIndex = matrix.columns.findIndex(point => point.name === 'Sun')

    expect(matrix.columns.map(point => point.name)).toContain('Ascendant')
    expect(matrix.columns.map(point => point.name)).toContain('Fortune')
    expect(matrix.rows.map(row => row.point.name)).not.toContain('Ascendant')
    expect(matrix.rows.map(row => row.point.name)).not.toContain('Fortune')
    expect(matrix.rows.map(row => row.point.name)).not.toContain('Spirit')
    expect(moonRow.cells[sunIndex]).toMatchObject({
      a:         'Sun',
      b:         'Moon',
      type:      'trine',
      sameChart: false,
    })
  })
})
