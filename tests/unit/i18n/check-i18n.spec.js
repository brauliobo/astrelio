import { describe, expect, it } from 'vitest'
import {
  compareLocales,
  scanPugTemplates,
  scanTranslationCalls,
} from '../../../scripts/check-i18n.mjs'

describe('i18n checker', () => {
  it('checks recursive keys, types, arrays, and placeholders', () => {
    const findings = compareLocales(
      {
        common: { greeting: 'Hello {name}', labels: ['One', 'Two'], mode: 'simple' },
        extra:  true,
      },
      {
        common: { greeting: 'Olá {person}', labels: ['Um'], mode: {} },
        added:  true,
      },
    )

    expect(findings.map(finding => [finding.rule, finding.path])).toEqual([
      ['locale-key', 'added'],
      ['locale-placeholder', 'common.greeting'],
      ['locale-array', 'common.labels'],
      ['locale-type', 'common.mode'],
      ['locale-key', 'extra'],
    ])
  })

  it('validates only static literal calls from useI18n', () => {
    const source = `
      const { t, te, tm } = useI18n()
      t('common.ok')
      te('common.missing')
      tm('common.ok')
      t(\`dynamic.\${key}\`)
      helper.t('not.an.i18n.call')
    `
    const findings = scanTranslationCalls(source, { common: { ok: 'OK' } })

    expect(findings.map(finding => finding.rule)).toEqual(['translation-key', 'translation-type'])
    expect(findings.map(finding => finding.path)).toEqual(['common.missing', 'common.ok'])
  })

  it('flags high-confidence Pug copy while allowing brands, locales, and dynamic content', () => {
    const source = `<template lang="pug">
      nav(aria-label='Primary navigation')
        AppLogo(aria-label='Astrelio')
        option(value='en') EN
        span {{ translatedLabel }}
        button Save chart
        input(placeholder='Search charts')
        button(:title='"Open chart"')
        img(alt='')
    </template>`
    const findings = scanPugTemplates(source)

    expect(findings.map(finding => finding.rule)).toEqual([
      'pug-literal-attribute',
      'pug-literal-text',
      'pug-literal-attribute',
      'pug-literal-attribute',
    ])
    expect(findings.map(finding => finding.line)).toEqual([2, 6, 7, 8])
  })

  it('does not scan script identifiers, classes, or bound attributes as copy', () => {
    const source = `<script setup>
      const title = 'Domain identifier'
    </script>
    <template lang="pug">
      .chart-wheel.text-slate-400(:title='title') {{ value }}
      button(:aria-label='\`\${name} chart\`')
    </template>`

    expect(scanPugTemplates(source)).toEqual([])
  })
})
