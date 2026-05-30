import { describe, expect, it } from 'vitest'
import { planetStarLinks } from '../../src/lib/sky/scene.js'

describe('sky scene asterism helpers', () => {
  it('connects planets to only nearby asterism stars', () => {
    const links = planetStarLinks(
      [
        { name: 'Venus', x: 10, y: 10 },
        { name: 'Mars', x: 300, y: 300 },
      ],
      [
        { x: 12, y: 14 },
        { x: 180, y: 180 },
      ],
      20
    )

    expect(links).toHaveLength(1)
    expect(links[0].planet.name).toBe('Venus')
    expect(links[0].distance).toBeCloseTo(4.47, 2)
  })

  it('caps planet-star guide links to the closest six', () => {
    const planets = Array.from({ length: 8 }, (_, index) => ({
      name: `P${index}`,
      x: index * 10,
      y: 0,
    }))
    const stars = planets.map(planet => ({ x: planet.x + 1, y: 0 }))

    const links = planetStarLinks(planets, stars, 5)

    expect(links).toHaveLength(6)
    expect(links.every(link => link.distance === 1)).toBe(true)
  })
})
