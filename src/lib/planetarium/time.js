const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS    = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS
const MONTH_MS = 30 * DAY_MS
export const YEAR_MS   = 365.25 * DAY_MS

/** Simulated milliseconds advanced per wall-clock second. */
const RATE_PRESETS = [
  { key: 'realtime', msPerSecond: SECOND_MS },
  { key: 'minute',   msPerSecond: MINUTE_MS },
  { key: 'hour',     msPerSecond: HOUR_MS },
  { key: 'day',      msPerSecond: DAY_MS },
  { key: 'week',     msPerSecond: WEEK_MS },
  { key: 'month',    msPerSecond: MONTH_MS },
  { key: 'year',     msPerSecond: YEAR_MS },
]

export const RATE_KEYS = RATE_PRESETS.map(preset => preset.key)

export const rateMsPerSecond = key =>
  RATE_PRESETS.find(preset => preset.key === key)?.msPerSecond || DAY_MS






export const fractionInRange = (timeMs, startMs, endMs) =>
  endMs === startMs ? 0 : (timeMs - startMs) / (endMs - startMs)

export const timeAtFraction = (fraction, startMs, endMs) =>
  startMs + Math.min(1, Math.max(0, fraction)) * (endMs - startMs)
