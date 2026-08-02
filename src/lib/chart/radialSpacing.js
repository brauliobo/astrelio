const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const RADIAL_ALIGNMENT = Object.freeze({
  CENTERED: 'centered',
  OUTER:    'outer',
})

export const isRadialAlignment = value => Object.values(RADIAL_ALIGNMENT).includes(value)

export const evenlySpacedRadii = (count, {
  inner,
  outer,
  single = outer,
  itemSize = 0,
  itemGap = 0,
  alignment = RADIAL_ALIGNMENT.CENTERED,
  outerFirst = false,
} = {}) => {
  if (count <= 0) return []

  const min = Math.min(inner, outer)
  const max = Math.max(inner, outer)
  if (count === 1) return [clamp(single, min, max)]

  const width = max - min
  const size  = Math.min(Math.max(itemSize, 0), width / count)
  if (alignment === RADIAL_ALIGNMENT.OUTER) {
    const step = Math.min(size + Math.max(itemGap, 0), width / (count - 1))
    return Array.from({ length: count }, (_, index) => max - (step * index))
  }

  const gap   = (width - (size * count)) / (count + 1)
  const radii = Array.from({ length: count }, (_, index) =>
    min + gap + (size / 2) + (index * (size + gap))
  )
  return outerFirst ? radii.reverse() : radii
}
