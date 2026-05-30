import { describe, expect, it } from 'vitest'
import {
  hasPersonRouteQuery,
  personFromRouteQuery,
  personToRouteQuery,
  samePersonRouteData,
} from '../../src/lib/people/routeQuery.js'

describe('person route query', () => {
  it('serializes readable natal chart fields for sharing', () => {
    expect(personToRouteQuery({
      name:            'Ada',
      isoLocal:        '1986-02-12T18:10',
      placeLabel:      'São José dos Campos, SP - Brasil',
      lat:             -23.2237,
      lon:             -45.9009,
      ianaZone:        'America/Sao_Paulo',
      tzOffsetMinutes: -120,
    })).toEqual({
      name:  'Ada',
      place: 'São José dos Campos, SP - Brasil',
      date:  '1986-02-12',
      time:  '18:10',
      lat:   '-23.2237',
      lon:   '-45.9009',
      zone:  'America/Sao_Paulo',
      tz:    '-120',
    })
  })

  it('hydrates a shared chart from URL query parameters', () => {
    const person = personFromRouteQuery({
      name:  'Ada',
      place: 'São José dos Campos, SP - Brasil',
      date:  '1986-02-12',
      time:  '18:10',
      lat:   '-23.2237',
      lon:   '-45.9009',
      zone:  'America/Sao_Paulo',
      tz:    '-180',
    })

    expect(person).toMatchObject({
      id:              'route-chart',
      name:            'Ada',
      isoLocal:        '1986-02-12T18:10',
      placeLabel:      'São José dos Campos, SP - Brasil',
      lat:             -23.2237,
      lon:             -45.9009,
      ianaZone:        'America/Sao_Paulo',
      tzOffsetMinutes: -120,
      shared:          true,
    })
  })

  it('rejects incomplete or invalid shared chart coordinates', () => {
    expect(hasPersonRouteQuery({ name: 'Ada' })).toBe(true)
    expect(personFromRouteQuery({ name: 'Ada' })).toBeNull()
    expect(personFromRouteQuery({
      name:  'Ada',
      place: 'Somewhere',
      date:  '2024-01-01',
      time:  '09:00',
      lat:   '120',
      lon:   '10',
    })).toBeNull()
  })

  it('falls back to numeric timezone offset when a shared zone cannot be resolved', () => {
    expect(personFromRouteQuery({
      name:  'Ada',
      place: 'Somewhere',
      date:  '2024-01-01',
      time:  '09:00',
      lat:   '10',
      lon:   '20',
      zone:  'America/Not_A_Zone',
      tz:    '-180',
    })).toMatchObject({
      ianaZone:        null,
      tzOffsetMinutes: -180,
    })
  })

  it('matches stored records to shared query records without using ids', () => {
    const shared = personFromRouteQuery({
      name:  'Ada',
      place: 'São José dos Campos, SP - Brasil',
      date:  '1986-02-12',
      time:  '18:10',
      lat:   '-23.2237004',
      lon:   '-45.9009004',
      zone:  'America/Sao_Paulo',
      tz:    '-120',
    })

    expect(samePersonRouteData({
      id:              'saved-person',
      name:            'Ada',
      isoLocal:        '1986-02-12T18:10',
      placeLabel:      'São José dos Campos, SP - Brasil',
      lat:             -23.2237,
      lon:             -45.9009,
      ianaZone:        'America/Sao_Paulo',
      tzOffsetMinutes: -120,
    }, shared)).toBe(true)
  })
})
