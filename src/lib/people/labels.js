import { timezoneLabelForPerson } from '../astro/timezones.js'

export const birthHeaderForPerson = (person) =>
  person ? `${person.isoLocal} · ${timezoneLabelForPerson(person)} · ${person.placeLabel}` : ''
