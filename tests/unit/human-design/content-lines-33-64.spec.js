import { describe, expect, it } from 'vitest'
import en from '../../../src/lib/human-design/content/lines/en/gates-33-64.js'
import ptBR from '../../../src/lib/human-design/content/lines/pt-BR/gates-33-64.js'

const expectedKeys = Array.from({ length: 32 }, (_, g) => Array.from({ length: 6 }, (_, l) => `${g + 33}.${l + 1}`)).flat()

describe.each([['en', en], ['pt-BR', ptBR]])('gate line content 33-64 (%s)', (_locale, lines) => {
  it('has exactly the 192 gate.line keys', () => {
    expect(Object.keys(lines).sort()).toEqual([...expectedKeys].sort())
  })

  it('has well-formed keynotes and texts', () => {
    for (const [key, { keynote, text }] of Object.entries(lines)) {
      expect(keynote.trim(), key).not.toBe('')
      expect(keynote.length, key).toBeLessThanOrEqual(40)
      expect(text.length, key).toBeGreaterThanOrEqual(80)
      expect(text.length, key).toBeLessThanOrEqual(260)
    }
  })

  it('does not repeat a text within one gate', () => {
    for (let gate = 33; gate <= 64; gate++) {
      const texts = [1, 2, 3, 4, 5, 6].map((line) => lines[`${gate}.${line}`].text)
      expect(new Set(texts).size, `gate ${gate}`).toBe(6)
    }
  })
})
