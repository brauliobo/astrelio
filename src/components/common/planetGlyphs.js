import chironSvg from '../../assets/glyphs/planetary/chiron.svg?raw'
import earthSvg from '../../assets/glyphs/planetary/earth.svg?raw'
import jupiterSvg from '../../assets/glyphs/planetary/jupiter.svg?raw'
import lilithSvg from '../../assets/glyphs/planetary/lilith.svg?raw'
import marsSvg from '../../assets/glyphs/planetary/mars.svg?raw'
import mercurySvg from '../../assets/glyphs/planetary/mercury.svg?raw'
import moonSvg from '../../assets/glyphs/planetary/moon.svg?raw'
import neptuneSvg from '../../assets/glyphs/planetary/neptune.svg?raw'
import northNodeSvg from '../../assets/glyphs/planetary/northNode.svg?raw'
import plutoSvg from '../../assets/glyphs/planetary/pluto.svg?raw'
import saturnSvg from '../../assets/glyphs/planetary/saturn.svg?raw'
import southNodeSvg from '../../assets/glyphs/planetary/southNode.svg?raw'
import sunSvg from '../../assets/glyphs/planetary/sun.svg?raw'
import uranusSvg from '../../assets/glyphs/planetary/uranus.svg?raw'
import venusSvg from '../../assets/glyphs/planetary/venus.svg?raw'

const RENDERERS = new Set(['svg', 'utf8'])

export const PLANET_GLYPH_VIEWBOX_SIZE = 12

export const PLANET_GLYPH_RENDERER = RENDERERS.has(import.meta.env.VITE_PLANET_GLYPH_RENDERER)
  ? import.meta.env.VITE_PLANET_GLYPH_RENDERER
  : 'svg'

const innerSvg = raw => raw
  .replace(/^[\s\S]*?<svg\b[^>]*>/i, '')
  .replace(/<\/svg>\s*$/i, '')
  .replace(/#000000|#000|black/gi, 'currentColor')

export const PLANET_GLYPH_SVGS = {
  Sun: innerSvg(sunSvg),
  Earth: innerSvg(earthSvg),
  Moon: innerSvg(moonSvg),
  Mercury: innerSvg(mercurySvg),
  Venus: innerSvg(venusSvg),
  Mars: innerSvg(marsSvg),
  Jupiter: innerSvg(jupiterSvg),
  Saturn: innerSvg(saturnSvg),
  Uranus: innerSvg(uranusSvg),
  Neptune: innerSvg(neptuneSvg),
  Pluto: innerSvg(plutoSvg),
  NorthNode: innerSvg(northNodeSvg),
  SouthNode: innerSvg(southNodeSvg),
  Lilith: innerSvg(lilithSvg),
  Chiron: innerSvg(chironSvg),
}

export const planetGlyphSvg = reference => PLANET_GLYPH_SVGS[reference] || null
