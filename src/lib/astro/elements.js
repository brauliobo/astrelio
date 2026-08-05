export const ELEMENT_KEYS = Object.freeze(['fire', 'earth', 'air', 'water'])

// Tropical zodiac order: Aries through Pisces.
export const SIGN_ELEMENTS = Object.freeze([
  'fire',
  'earth',
  'air',
  'water',
  'fire',
  'earth',
  'air',
  'water',
  'fire',
  'earth',
  'air',
  'water',
])

export const ELEMENT_SIGN_INDICES = Object.freeze(Object.fromEntries(
  ELEMENT_KEYS.map(element => [
    element,
    Object.freeze(SIGN_ELEMENTS
      .map((signElement, index) => signElement === element ? index : null)
      .filter(index => index !== null)),
  ])
))

// Complementary element pairs used by the tropical zodiac axes.
export const RELATED_ELEMENTS = Object.freeze({
  fire:  Object.freeze(['air']),
  earth: Object.freeze(['water']),
  air:   Object.freeze(['fire']),
  water: Object.freeze(['earth']),
})

// Each sign index resolves to the complete group of signs sharing its element.
export const SAME_ELEMENT_SIGN_INDICES = Object.freeze(
  SIGN_ELEMENTS.map(element => ELEMENT_SIGN_INDICES[element])
)

export const normalizeSignIndex = index => {
  const integer = Math.trunc(index)
  return ((integer % SIGN_ELEMENTS.length) + SIGN_ELEMENTS.length) % SIGN_ELEMENTS.length
}

export const elementForSign = index => {
  const normalized = normalizeSignIndex(index)
  return Number.isInteger(normalized) ? SIGN_ELEMENTS[normalized] : undefined
}

const normalizedElement = element =>
  typeof element === 'string' ? element.toLowerCase() : null

export const relatedElementsFor = element => {
  const related = RELATED_ELEMENTS[normalizedElement(element)]
  return related ? [...related] : []
}

export const signIndicesForElement = element => {
  const indices = ELEMENT_SIGN_INDICES[normalizedElement(element)]
  return indices ? [...indices] : []
}
