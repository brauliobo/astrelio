import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolvePath(process.cwd(), 'src/styles/main.css'), 'utf8')

const block   = selector => css.match(new RegExp(`^${selector.replace(/[[\]"]/g, '\\$&')} \\{\\n([\\s\\S]*?)^\\}`, 'm'))[1]
const tokens  = text => Object.fromEntries([...text.matchAll(/--hd-([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]))
const resolve = (map, value) => value.startsWith('var(') ? resolve(map, map[value.slice(9, -1)]) : value

const dark   = tokens(block(':root'))
const light  = { ...dark, ...tokens(block('html[data-theme="light"]')) }
const themes = { dark, light }

const rgb       = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
const linear    = c => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const luminance = hex => rgb(hex).map(linear).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
const ratio     = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }
const mix       = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')

const CENTER_FAMILIES = ['head', 'g', 'ajna', 'brown', 'red']
const CIRCUITS        = ['individual', 'logic', 'abstract', 'tribal']

const pairs = (token) => {
  const c = name => resolve(token, token[name])
  const list = [
    ['text on page',                    c('text'),        c('page'),         4.5],
    ['text on surface',                 c('text'),        c('surface'),      4.5],
    ['secondary on surface',            c('text-2'),      c('surface'),      4.5],
    ['muted on surface',                c('text-muted'),  c('surface'),      4.5],
    ['muted on surface-2',              c('text-muted'),  c('surface-2'),    4.5],
    ['muted on open center',            c('text-muted'),  c('open-fill'),    4.5],
    ['design channel vs page',          c('design'),      c('page'),         3],
    ['personality channel vs page',     c('personality'), c('page'),         3],
    ['design vs personality',           c('design'),      c('personality'),  3],
    ['design marker text',              c('design-on'),   c('design'),       4.5],
    ['personality marker text',         c('pers-on'),     c('personality'),  4.5],
    ['open center stroke vs page',      c('open-stroke'), c('page'),         3],
    ['dimmed number vs page',           mix(c('page'), c('text-muted'), +c('dim')), c('page'), 3],
    ['dimmed list text vs surface',     mix(c('surface'), c('text'), +c('dim')),    c('surface'), 3],
    ['open track vs page',              c('track'),       c('page'),         3],
    ['focus ring vs page',              c('focus'),       c('page'),         3],
    ['wheel active text vs page',       c('wheel-active-text'),   c('page'), 4.5],
    ['wheel sign text vs page',         c('wheel-sign-text'),     c('page'), 4.5],
    ['wheel inactive text vs page',     c('wheel-inactive-text'), c('page'), 4.5],
    ['wheel iching vs page',            c('wheel-iching'),        c('page'), 3],
    ...CIRCUITS.map(name => [`circuit ${name} vs page`, c(`circuit-${name}`), c('page'), 3]),
  ]

  CENTER_FAMILIES.forEach((family) => {
    const [fill, stroke, ink] = ['', '-stroke', '-ink'].map(suffix => c(family + suffix))
    list.push(
      [`${family} ink on fill top`,      ink,                  mix(fill, '#ffffff', 0.08), 4.5],
      [`${family} ink on fill bottom`,   ink,                  mix(fill, '#000000', 0.08), 4.5],
      [`${family} dimmed ink on fill`,   mix(c('page'), ink, +c('dim')), mix(c('page'), fill, +c('dim')), 3],
      [`${family} stroke vs page`,       stroke,               c('page'),                  3],
    )
  })
  return list
}

describe.each(Object.entries(themes))('Human Design tokens (%s)', (theme, token) => {
  it.each(pairs(token))('%s meets WCAG', (name, foreground, background, minimum) => {
    expect(ratio(foreground, background), `${theme}: ${name}`).toBeGreaterThanOrEqual(minimum)
  })
})
