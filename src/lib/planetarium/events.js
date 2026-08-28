import {
  Body,
  NextGlobalSolarEclipse,
  NextLocalSolarEclipse,
  NextLunarApsis,
  NextLunarEclipse,
  NextMoonNode,
  NextMoonQuarter,
  NextPlanetApsis,
  NextTransit,
  SearchGlobalSolarEclipse,
  SearchLocalSolarEclipse,
  SearchLunarApsis,
  SearchLunarEclipse,
  SearchMaxElongation,
  SearchMoonNode,
  SearchMoonQuarter,
  SearchPeakMagnitude,
  SearchPlanetApsis,
  SearchRelativeLongitude,
  SearchTransit,
  Seasons,
} from 'astronomy-engine'
import { INNER_PLANETS, OUTER_PLANETS, RETROGRADE_BODIES } from './constants.js'
import { apparentRadiusDeg, astroTime, geoEcliptic, illuminationOf, lengthAu, librationOf, separationDeg } from './ephemeris3d.js'
import { findStations } from './retrograde.js'

const DAY_MS = 86400000

export const EVENT_TYPES = [
  'solar_eclipse',
  'lunar_eclipse',
  'moon_quarter',
  'supermoon',
  'moon_node',
  'season',
  'apsis',
  'elongation',
  'peak_magnitude',
  'opposition',
  'conjunction',
  'station',
  'transit',
  'pair_conjunction',
  'occultation',
]

const ms = value => (value?.date || value).getTime()

const record = (type, timeMs, bodies, details, view) => ({
  id: `${type}:${bodies.join('-')}:${Math.round(timeMs / 1000)}`,
  type,
  timeMs,
  bodies,
  details,
  view,
})

const guarded = (generator) => {
  try {
    return generator()
  } catch {
    return []
  }
}

const forward = (first, next, endMs, limit = 400) => {
  const results = []
  let current   = first
  while (current && ms(current.peak || current.time || current) <= endMs && results.length < limit) {
    results.push(current)
    current = next(current)
  }
  return results
}

export const solarEclipses = (startMs, endMs) => guarded(() =>
  forward(
    SearchGlobalSolarEclipse(new Date(startMs)),
    eclipse => NextGlobalSolarEclipse(eclipse.peak),
    endMs
  ).map(eclipse => record('solar_eclipse', ms(eclipse.peak), ['Sun', 'Moon', 'Earth'], {
    kind:        eclipse.kind,
    obscuration: eclipse.obscuration,
    latitude:    eclipse.latitude,
    longitude:   eclipse.longitude,
    distanceKm:  eclipse.distance,
  }, 'eclipses'))
)

export const lunarEclipses = (startMs, endMs) => guarded(() =>
  forward(
    SearchLunarEclipse(new Date(startMs)),
    eclipse => NextLunarEclipse(eclipse.peak),
    endMs
  ).map(eclipse => record('lunar_eclipse', ms(eclipse.peak), ['Sun', 'Earth', 'Moon'], {
    kind:            eclipse.kind,
    obscuration:     eclipse.obscuration,
    penumbraMinutes: eclipse.sd_penum,
    partialMinutes:  eclipse.sd_partial,
    totalMinutes:    eclipse.sd_total,
  }, 'eclipses'))
)

const QUARTER_NAMES = ['new_moon', 'first_quarter', 'full_moon', 'last_quarter']

const moonQuarters = (startMs, endMs) => guarded(() =>
  forward(
    SearchMoonQuarter(new Date(startMs)),
    quarter => NextMoonQuarter(quarter),
    endMs,
    600
  ).map(quarter => record('moon_quarter', ms(quarter.time), ['Moon'], {
    quarter: quarter.quarter,
    phase:   QUARTER_NAMES[quarter.quarter],
  }, 'moon'))
)

const lunarApsides = (startMs, endMs) => guarded(() =>
  forward(
    SearchLunarApsis(new Date(startMs)),
    apsis => NextLunarApsis(apsis),
    endMs,
    600
  ).map(apsis => record('apsis', ms(apsis.time), ['Moon'], {
    apsis:      apsis.kind === 0 ? 'perigee' : 'apogee',
    distanceKm: apsis.dist_km,
  }, 'moon'))
)

/**
 * Nolle's threshold: a full or new moon closer than 361,885 km is a supermoon, beyond 405,000 km a
 * micromoon. Distance is read straight from the lunar ephemeris at the syzygy instant.
 */
const SUPERMOON_KM = 361885
const MICROMOON_KM = 405000

export const superMoons = (startMs, endMs) =>
  moonQuarters(startMs, endMs)
    .filter(event => event.details.quarter === 0 || event.details.quarter === 2)
    .flatMap((syzygy) => {
      const distanceKm = librationOf(new Date(syzygy.timeMs)).distanceKm
      const near       = distanceKm <= SUPERMOON_KM
      const far        = distanceKm >= MICROMOON_KM
      if (!near && !far) return []
      return [record('supermoon', syzygy.timeMs, ['Moon'], {
        phase:      syzygy.details.phase,
        distanceKm,
        size:       near ? 'super' : 'micro',
      }, 'moon')]
    })

const moonNodes = (startMs, endMs) => guarded(() =>
  forward(
    SearchMoonNode(new Date(startMs)),
    node => NextMoonNode(node),
    endMs,
    600
  ).map(node => record('moon_node', ms(node.time), ['Moon'], {
    node: node.kind > 0 ? 'ascending' : 'descending',
  }, 'moon'))
)

const seasons = (startMs, endMs) => {
  const events = []
  for (let year = new Date(startMs).getUTCFullYear(); year <= new Date(endMs).getUTCFullYear(); year += 1) {
    const info = Seasons(year)
    const entries = [
      ['march_equinox', info.mar_equinox],
      ['june_solstice', info.jun_solstice],
      ['september_equinox', info.sep_equinox],
      ['december_solstice', info.dec_solstice],
    ]
    for (const [season, time] of entries) {
      const timeMs = ms(time)
      if (timeMs >= startMs && timeMs <= endMs) events.push(record('season', timeMs, ['Earth', 'Sun'], { season }, 'moon'))
    }
  }
  return events
}

const planetApsides = (startMs, endMs, bodies = ['Earth', ...INNER_PLANETS, ...OUTER_PLANETS]) =>
  bodies.flatMap(name => guarded(() =>
    forward(
      SearchPlanetApsis(Body[name], astroTime(new Date(startMs))),
      apsis => NextPlanetApsis(Body[name], apsis),
      endMs,
      80
    ).map(apsis => record('apsis', ms(apsis.time), [name], {
      apsis:      apsis.kind === 0 ? 'perihelion' : 'aphelion',
      distanceAu: apsis.dist_au,
    }, 'orrery'))
  ))

const maxElongations = (startMs, endMs) =>
  INNER_PLANETS.flatMap(name => guarded(() => {
    const events = []
    let current  = SearchMaxElongation(Body[name], new Date(startMs))
    while (current && ms(current.time) <= endMs && events.length < 120) {
      events.push(record('elongation', ms(current.time), [name], {
        elongation: current.elongation,
        visibility: current.visibility,
      }, 'retrograde'))
      current = SearchMaxElongation(Body[name], new Date(ms(current.time) + DAY_MS))
    }
    return events
  }))

const peakMagnitudes = (startMs, endMs) =>
  INNER_PLANETS.flatMap(name => guarded(() => {
    const events = []
    let current  = SearchPeakMagnitude(Body[name], new Date(startMs))
    while (current && ms(current.time) <= endMs && events.length < 120) {
      events.push(record('peak_magnitude', ms(current.time), [name], {
        magnitude: current.mag,
        phase:     current.phase_fraction,
      }, 'retrograde'))
      current = SearchPeakMagnitude(Body[name], new Date(ms(current.time) + 30 * DAY_MS))
    }
    return events
  }))

const relativeLongitudeSeries = (name, targetDeg, startMs, endMs, type, extra = {}) => guarded(() => {
  const events = []
  let cursor   = new Date(startMs)
  while (events.length < 120) {
    const time = SearchRelativeLongitude(Body[name], targetDeg, cursor)
    const at   = ms(time)
    if (!Number.isFinite(at) || at > endMs) break
    events.push(record(type, at, [name, 'Earth'], {
      ...extra,
      distanceAu: lengthAu(geoEcliptic(name, new Date(at))),
      magnitude:  illuminationOf(name, new Date(at)).magnitude,
    }, 'retrograde'))
    cursor = new Date(at + 30 * DAY_MS)
  }
  return events
})

const oppositions = (startMs, endMs) =>
  OUTER_PLANETS.flatMap(name => relativeLongitudeSeries(name, 180, startMs, endMs, 'opposition', { aspect: 'opposition' }))

const conjunctions = (startMs, endMs) => [
  ...OUTER_PLANETS.flatMap(name => relativeLongitudeSeries(name, 0, startMs, endMs, 'conjunction', { aspect: 'superior_conjunction' })),
  ...INNER_PLANETS.flatMap(name => relativeLongitudeSeries(name, 0, startMs, endMs, 'conjunction', { aspect: 'inferior_conjunction' })),
  ...INNER_PLANETS.flatMap(name => relativeLongitudeSeries(name, 180, startMs, endMs, 'conjunction', { aspect: 'superior_conjunction' })),
]

const retrogradeStations = (startMs, endMs, bodies = RETROGRADE_BODIES) =>
  bodies.flatMap(name => findStations(name, new Date(startMs), new Date(endMs)).map(station =>
    record('station', station.time.getTime(), [name], {
      direction: station.direction,
      longitude: station.longitude,
    }, 'retrograde')
  ))

export const transits = (startMs, endMs) =>
  INNER_PLANETS.flatMap(name => guarded(() => {
    const events = []
    let current  = SearchTransit(Body[name], new Date(startMs))
    while (current && ms(current.peak) <= endMs && events.length < 20) {
      events.push(record('transit', ms(current.peak), [name, 'Sun'], {
        startMs:      ms(current.start),
        finishMs:     ms(current.finish),
        separationArcmin: current.separation,
      }, 'retrograde'))
      current = NextTransit(Body[name], current.finish)
    }
    return events
  }))

const PAIR_BODIES = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']

const refineMinimum = (a, b, lowMs, highMs) => {
  let low  = lowMs
  let high = highMs
  for (let step = 0; step < 48 && high - low > 60000; step += 1) {
    const third  = low + (high - low) / 3
    const twoThird = high - (high - low) / 3
    if (separationDeg(a, b, new Date(third)) < separationDeg(a, b, new Date(twoThird))) high = twoThird
    else low = third
  }
  const timeMs = (low + high) / 2
  return { timeMs, separation: separationDeg(a, b, new Date(timeMs)) }
}

const closeApproaches = (a, b, startMs, endMs, stepDays, thresholdDeg) => {
  const step   = stepDays * DAY_MS
  const events = []
  let previous  = separationDeg(a, b, new Date(startMs))
  let current   = separationDeg(a, b, new Date(startMs + step))

  for (let ms0 = startMs + step; ms0 + step <= endMs; ms0 += step) {
    const next = separationDeg(a, b, new Date(ms0 + step))
    if (current < previous && current <= next && current < thresholdDeg * 3) {
      const minimum = refineMinimum(a, b, ms0 - step, ms0 + step)
      if (minimum.separation <= thresholdDeg) events.push(minimum)
    }
    previous = current
    current  = next
  }
  return events
}

/** Visually close pairings of naked-eye planets. */
export const pairConjunctions = (startMs, endMs, { thresholdDeg = 1.5 } = {}) => {
  const events = []
  for (let i = 0; i < PAIR_BODIES.length; i += 1) {
    for (let j = i + 1; j < PAIR_BODIES.length; j += 1) {
      const [a, b] = [PAIR_BODIES[i], PAIR_BODIES[j]]
      for (const approach of closeApproaches(a, b, startMs, endMs, 1, thresholdDeg)) {
        events.push(record('pair_conjunction', approach.timeMs, [a, b], {
          separation: approach.separation,
        }, 'retrograde'))
      }
    }
  }
  return events
}

/** Moon passing in front of, or close beside, a planet. Memoized: both event types share the sweep. */
let moonApproachCache = { key: '', events: [] }

const moonApproaches = (startMs, endMs, { thresholdDeg = 2 } = {}) => {
  const key = `${startMs}:${endMs}:${thresholdDeg}`
  if (moonApproachCache.key === key) return moonApproachCache.events

  const events = PAIR_BODIES.flatMap(name =>
    closeApproaches('Moon', name, startMs, endMs, 0.125, thresholdDeg).map((approach) => {
      const when          = new Date(approach.timeMs)
      const lunarRadius   = apparentRadiusDeg('Moon', 1737.4, when)
      const isOccultation = approach.separation <= lunarRadius
      return record(isOccultation ? 'occultation' : 'pair_conjunction', approach.timeMs, ['Moon', name], {
        separation: approach.separation,
        lunarRadius,
      }, 'retrograde')
    })
  )
  moonApproachCache = { key, events }
  return events
}

const moonApproachesOfType = type => (startMs, endMs) =>
  moonApproaches(startMs, endMs).filter(event => event.type === type)

const GENERATORS = {
  solar_eclipse:    solarEclipses,
  lunar_eclipse:    lunarEclipses,
  moon_quarter:     moonQuarters,
  supermoon:        superMoons,
  moon_node:        moonNodes,
  season:           seasons,
  apsis:            (startMs, endMs) => [...lunarApsides(startMs, endMs), ...planetApsides(startMs, endMs)],
  elongation:       maxElongations,
  peak_magnitude:   peakMagnitudes,
  opposition:       oppositions,
  conjunction:      conjunctions,
  station:          retrogradeStations,
  transit:          transits,
  pair_conjunction: (startMs, endMs) => [...pairConjunctions(startMs, endMs), ...moonApproachesOfType('pair_conjunction')(startMs, endMs)],
  occultation:      moonApproachesOfType('occultation'),
}

/** Local circumstances of solar eclipses for a given observer, added on top of the global list. */
const localSolarEclipses = (startMs, endMs, observer) => guarded(() => {
  const events = []
  let current  = SearchLocalSolarEclipse(new Date(startMs), observer)
  while (current && ms(current.peak.time) <= endMs && events.length < 60) {
    events.push(record('solar_eclipse', ms(current.peak.time), ['Sun', 'Moon', 'Earth'], {
      kind:        current.kind,
      obscuration: current.obscuration,
      local:       true,
      altitude:    current.peak.altitude,
      partialBeginMs: current.partial_begin ? ms(current.partial_begin.time) : null,
      partialEndMs:   current.partial_end ? ms(current.partial_end.time) : null,
    }, 'eclipses'))
    current = NextLocalSolarEclipse(current.peak.time, observer)
  }
  return events
})

export const searchEvents = ({ startMs, endMs, types = EVENT_TYPES, observer = null }) => {
  const events = types
    .filter(type => GENERATORS[type])
    .flatMap(type => GENERATORS[type](startMs, endMs))

  if (observer) events.push(...localSolarEclipses(startMs, endMs, observer))

  const unique = new Map(events.map(event => [event.id, event]))
  return [...unique.values()].sort((a, b) => a.timeMs - b.timeMs)
}

