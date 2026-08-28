#!/usr/bin/env node
// Downloads public equirectangular body maps from Wikimedia Commons and writes the 2k/1k texture
// set used by the planetarium. Requires ImageMagick (`magick`) on PATH. Run manually when the
// texture set changes; the generated files are committed under public/planets/maps.
import { execFile } from 'node:child_process'
import { Buffer } from 'node:buffer'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run  = promisify(execFile)
const args = process.argv.slice(2)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MAPS = resolve(ROOT, 'public/planets/maps')
const SKY  = resolve(ROOT, 'public/sky')
const TMP  = resolve(ROOT, 'tmp/planet-maps')

const API  = 'https://commons.wikimedia.org/w/api.php'
const USGS = 'https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic'

// name: output basename. commons: Commons File: title. sizes: emitted widths. mode: colour handling.
const SOURCES = [
  { name: 'mercury',      commons: 'Solarsystemscope texture 2k mercury.jpg' },
  { name: 'venus',        commons: 'Solarsystemscope texture 2k venus surface.jpg' },
  { name: 'earth',        commons: 'Solarsystemscope texture 2k earth daymap.jpg' },
  { name: 'earth-night',  commons: 'Solarsystemscope texture 2k earth nightmap.jpg' },
  { name: 'moon',         commons: 'Solarsystemscope texture 2k moon.jpg' },
  { name: 'mars',         commons: 'Solarsystemscope texture 2k mars.jpg' },
  { name: 'jupiter',      commons: 'Solarsystemscope texture 2k jupiter.jpg' },
  { name: 'saturn',       commons: 'Solarsystemscope texture 2k saturn.jpg' },
  { name: 'uranus',       commons: 'Solarsystemscope texture 2k uranus.jpg' },
  { name: 'neptune',      commons: 'Solarsystemscope texture 2k neptune.jpg' },
  { name: 'sun',          commons: 'Solarsystemscope texture 2k sun.jpg' },
  { name: 'pluto',        commons: 'Pluto color mapmosaic.jpg' },
  { name: 'earth-clouds', commons: 'Solarsystemscope texture 2k earth clouds.jpg', mode: 'luma' },
  { name: 'saturn-rings', commons: 'Solarsystemscope texture 2k saturn ring alpha.png', mode: 'copy-png' },
  { name: 'starmap',      commons: 'Solarsystemscope texture 8k stars milky way.jpg', out: SKY, sizes: [4096], quality: 78 },
]

// Moon surfaces come from USGS Astrogeology global simple-cylindrical mosaics (public domain).
// They are large source TIFFs but only 1k is ever rendered, and greyscale plates get their colour
// from the material tint rather than from a repainted texture.
const MOON_SOURCES = [
  { name: 'io',        file: 'Io_GalileoSSI-Voyager_Global_Mosaic_ClrMerge_1km.tif', credit: 'USGS/NASA Galileo SSI + Voyager colour merge' },
  { name: 'europa',    file: 'Europa_Voyager_GalileoSSI_global_mosaic_500m.tif',     credit: 'USGS/NASA Voyager + Galileo SSI' },
  { name: 'ganymede',  file: 'Ganymede_Voyager_GalileoSSI_global_mosaic_1km.tif',    credit: 'USGS/NASA Voyager + Galileo SSI' },
  { name: 'callisto',  file: 'Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif',    credit: 'USGS/NASA Voyager + Galileo SSI' },
  { name: 'titan',     file: 'Titan_ISS_P19658_Mosaic_Global_4km.tif',               credit: 'USGS/NASA Cassini ISS' },
  { name: 'enceladus', file: 'Enceladus_Cassini_mosaic_global_110m.tif',             credit: 'USGS/NASA Cassini ISS' },
  { name: 'rhea',      file: 'Rhea_Cassini_Voyager_mosaic_global_417m.tif',          credit: 'USGS/NASA Cassini + Voyager' },
  { name: 'dione',     file: 'Dione_Cassini_Voyager_mosaic_global_154m.tif',         credit: 'USGS/NASA Cassini + Voyager' },
  { name: 'tethys',    file: 'Tethys_Cassini_mosaic_global_293m.tif',                credit: 'USGS/NASA Cassini ISS' },
  { name: 'iapetus',   file: 'Iapetus_Cassini_Voyager_mosaic_global_783m.tif',       credit: 'USGS/NASA Cassini + Voyager' },
  // Voyager 2 only imaged Triton's south and New Horizons only Charon's north, so the unimaged cap
  // is filled by extending the outermost imaged row rather than left as a black polar disc.
  { name: 'triton',    file: 'Triton_Voyager2_ClrMosaic_GlobalFill_600m.tif',        credit: 'USGS/NASA Voyager 2 colour mosaic' },
  { name: 'charon',    file: 'Charon_NewHorizons_Global_Mosaic_300m_Jul2017_8bit.tif', credit: 'USGS/NASA New Horizons' },
  { name: 'phobos',    file: 'Phobos_ME_SRC_Mosaic_Global_16ppd.tif',                credit: 'USGS/ESA Mars Express SRC' },
]

const imageInfo = async (titles) => {
  const params = new URLSearchParams({
    action: 'query',
    titles: titles.join('|'),
    prop:   'imageinfo',
    iiprop: 'url|size|extmetadata',
    format: 'json',
  })
  const response = await fetch(`${API}?${params}`)
  if (!response.ok) throw new Error(`Commons query failed: ${response.status}`)

  const pages = (await response.json()).query.pages
  return new Map(Object.values(pages).map(page => [page.title.replace(/^File:/, ''), page.imageinfo?.[0] || null]))
}

const sleep = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000))

const download = async (url, target, attempt = 1) => {
  const response = await fetch(url.split('?')[0], {
    headers: { 'User-Agent': 'astrelio-texture-builder/1.0 (https://github.com/brauliobo/astrelio)' },
  })
  if (response.status === 429 && attempt <= 5) {
    await sleep(attempt * 4)
    return download(url, target, attempt + 1)
  }
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`)
  await writeFile(target, Buffer.from(await response.arrayBuffer()))
}

const emit = async (source, input) => {
  const outDir  = source.out || MAPS
  const sizes   = source.sizes || [2048, 1024]
  const quality = source.quality || 82

  for (const width of sizes) {
    const label  = `${Math.round(width / 1024)}k`
    if (source.mode === 'copy-png') {
      await run('magick', [input, '-resize', `${width}x`, '-define', 'png:compression-level=9', resolve(outDir, `${source.name}-${label}.png`)])
      continue
    }
    if (source.mode === 'luma') {
      // Cloud cover ships as a greyscale JPEG; the shader reads luminance as opacity.
      await run('magick', [input, '-colorspace', 'gray', '-resize', `${width}x${width / 2}!`, '-quality', String(quality), '-strip', resolve(outDir, `${source.name}-${label}.jpg`)])
      continue
    }
    await run('magick', [input, '-resize', `${width}x${width / 2}!`, '-quality', String(quality), '-strip', resolve(outDir, `${source.name}-${label}.jpg`)])
  }
}

const provenance = (source, info) => {
  const license = info.extmetadata?.LicenseShortName?.value || 'see Commons'
  return `- ${source.name}: ${source.commons} (${license}) — ${info.descriptionurl}`
}

/**
 * Extend the outermost imaged row across an unimaged polar cap. Voyager 2 only saw Triton's south
 * and New Horizons only Charon's north; a hard black cap reads as a rendering fault. The cap is
 * found with a trim, which keys on the margin being uniform rather than on any brightness guess.
 */
const fillPolarGap = async (target, height = 512, width = 1024) => {
  const { stdout } = await run('magick', [target, '-fuzz', '6%', '-format', '%@', 'info:'])
  const match = stdout.trim().match(/^\d+x(\d+)\+\d+\+(\d+)$/)
  if (!match) return

  const north = Number(match[2])
  const south = height - north - Number(match[1])
  if (north <= 0 && south <= 0) return

  const strip = `${target}.strip.png`
  for (const [gap, edge, top] of [[north, north, 0], [south, height - south - 1, height - south]]) {
    if (gap <= 0) continue
    await run('magick', [target, '-crop', `${width}x1+0+${edge}`, '+repage', '-resize', `${width}x${gap}!`, strip])
    await run('magick', [target, strip, '-geometry', `+0+${top}`, '-composite', '-quality', '82', '-strip', target])
  }
  await rm(strip, { force: true })
  process.stdout.write(`   polar gap filled: ${north} north, ${south} south rows\n`)
}

// Moons are never rendered larger than a few hundred pixels, so 1k plates are plenty.
const buildMoons = async () => {
  const only  = args.find(arg => arg.startsWith('--moons='))?.split('=')[1]?.split(',')
  const lines = []
  for (const source of MOON_SOURCES) {
    if (only && !only.includes(source.name)) continue
    const input = resolve(TMP, source.file)
    process.stdout.write(`${source.name} <- USGS ${source.file}\n`)
    await download(`${USGS}/${source.file}`, input)
    const target = resolve(MAPS, `${source.name}-1k.jpg`)
    // No frame selector here: it collapses these RGB mosaics to greyscale.
    await run('magick', [input, '-type', 'TrueColor', '-colorspace', 'sRGB', '-resize', '1024x512!', '-quality', '82', '-strip', target])
    await fillPolarGap(target)
    await rm(input, { force: true })
    lines.push(`- ${source.name}: ${source.file} (public domain) — ${source.credit}`)
  }
  return lines
}

const main = async () => {
  await mkdir(MAPS, { recursive: true })
  await mkdir(SKY, { recursive: true })
  await mkdir(TMP, { recursive: true })

  const info  = await imageInfo(SOURCES.map(source => `File:${source.commons}`))
  const lines = []

  for (const source of SOURCES) {
    const entry = info.get(source.commons)
    if (!entry) throw new Error(`Commons file not found: ${source.commons}`)

    lines.push(provenance(source, entry))
    if (args.includes('--only-moons')) continue

    const input = resolve(TMP, source.commons.replace(/[^\w.-]/g, '_'))
    process.stdout.write(`${source.name} <- ${source.commons}\n`)
    await download(entry.url, input)
    await sleep(1)
    await emit(source, input)
  }

  const moonLines = args.includes('--skip-moons') ? [] : await buildMoons()

  await writeFile(resolve(MAPS, 'README.md'), [
    '# Planet surface maps',
    '',
    'Equirectangular body maps used by the 3D planetarium. Generated by `npm run build:planet-maps`.',
    'Solar System Scope textures are CC BY 4.0 (https://www.solarsystemscope.com/textures/);',
    'NASA/New Horizons imagery is public domain.',
    '',
    ...lines,
    '',
    '## Moons',
    '',
    'Global simple-cylindrical mosaics from USGS Astrogeology (public domain). Greyscale plates are',
    'tinted by the renderer rather than recoloured here.',
    '',
    ...moonLines,
    '',
  ].join('\n'))

  await rm(TMP, { recursive: true, force: true })
  process.stdout.write(`done: ${SOURCES.length} sources\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
