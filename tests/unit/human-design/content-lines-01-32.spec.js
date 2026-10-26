import { describe, expect, it } from 'vitest'
import en from '../../../src/lib/human-design/content/lines/en/gates-01-32.js'
import ptBR from '../../../src/lib/human-design/content/lines/pt-BR/gates-01-32.js'

const expectedKeys = Array.from({ length: 32 }, (_, g) => Array.from({ length: 6 }, (_, l) => `${g + 1}.${l + 1}`)).flat()

describe.each([['en', en], ['pt-BR', ptBR]])('gate line content %s (gates 1-32)', (_locale, lines) => {
  it('has exactly the 192 gate.line keys', () => {
    expect(Object.keys(lines).sort()).toEqual([...expectedKeys].sort())
  })

  it('has non-empty keynotes and texts within length limits', () => {
    for (const key of expectedKeys) {
      const { keynote, text } = lines[key]
      expect(keynote.trim().length, key).toBeGreaterThan(0)
      expect(keynote.length, key).toBeLessThanOrEqual(40)
      expect(text.length, key).toBeGreaterThanOrEqual(80)
      expect(text.length, key).toBeLessThanOrEqual(260)
    }
  })

  it('does not repeat a text or keynote within a gate', () => {
    for (let gate = 1; gate <= 32; gate++) {
      const entries = [1, 2, 3, 4, 5, 6].map(line => lines[`${gate}.${line}`])
      expect(new Set(entries.map(entry => entry.text)).size, `gate ${gate} texts`).toBe(6)
      expect(new Set(entries.map(entry => entry.keynote)).size, `gate ${gate} keynotes`).toBe(6)
    }
  })
})
