import { sensitivityForChart } from '../details.js'
import { humanDesignContentKey } from '../labels.js'

export const SENSITIVITY_MINUTES = 10

/** Fields whose change would alter what the reading says; tone and base move within minutes for every chart. */
const HEADLINE_FIELDS = ['gate', 'line', 'color', 'profile', 'cross']
const LEVELS          = ['gate', 'line', 'color', 'tone', 'base']
const FLAGS           = ['profile', 'cross']

const token = (...path) => ({ key: humanDesignContentKey(...path), params: {} })

const activationId = name => `activation:${name.split('.')[0]}:${name.split('.')[1].toLowerCase()}`

const reachedIds = (report, field) => (report.changes[field] || []).map(activationId)

const reachedFields = report => [...LEVELS.filter(level => report.changes[level].length), ...FLAGS.filter(flag => report[flag])]

const fieldFact = (report, field) => ({
  id:            field,
  label:         token('sensitivity', 'fields', field),
  activationIds: reachedIds(report, field),
})

/** Which outputs a +/- 10 minute error in the birth time could change (computed from the ephemeris, not eagerly on the chart). */
export const sensitivityFacts = (chart) => {
  const report = sensitivityForChart(chart, { windows: [SENSITIVITY_MINUTES] }).windows[SENSITIVITY_MINUTES]
  const fields = reachedFields(report).map(field => fieldFact(report, field))

  return {
    minutes: SENSITIVITY_MINUTES,
    title:   token('sensitivity', 'title'),
    note:    { key: humanDesignContentKey('sensitivity', 'note'), params: { minutes: SENSITIVITY_MINUTES } },
    fields,
    flagged: fields.some(field => HEADLINE_FIELDS.includes(field.id)),
  }
}
