import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { Buffer } from 'node:buffer'

const SKY_CULTURE_URL       = 'https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/master/western/index.json'
const HIPPARCOS_URL         = 'https://raw.githubusercontent.com/gmiller123456/hip2000/master/hipparcos_6.5_concise.js'
const ILLUSTRATION_BASE_URL = 'https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/master/western/'

const OUT_DATA   = path.resolve('public/data/sky-asterisms.generated.json')
const OUT_IMAGES = path.resolve('public/sky/illustrations')

const SELECTED_ASTERISMS = [
  { id: 'AST western BDr', imageIau: 'UMa' },
  { id: 'AST western WAs', imageIau: 'Cas' },
  { id: 'AST western NCr', imageIau: 'Cyg' },
  { id: 'AST western GSP', imageIau: 'Peg' },
  { id: 'AST western VTa', imageIau: 'Tau' },
  { id: 'AST western Sic', imageIau: 'Leo' },
  { id: 'AST western Tea', imageIau: 'Sgr' },
  { id: 'AST western OrB', imageIau: 'Ori' },
  { id: 'AST western OrS', imageIau: 'Ori' },
  { id: 'AST western STr', imageIau: 'Cyg' },
  { id: 'AST western WTr', imageIau: 'Ori' },
  { id: 'AST western Cir', imageIau: 'Psc' },
]

const toRadians = degrees => degrees * Math.PI / 180
const toDegrees = radians => radians * 180 / Math.PI
const norm360   = degrees => ((degrees % 360) + 360) % 360

const fetchText = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  return response.text()
}

const fetchBuffer = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  return Buffer.from(await response.arrayBuffer())
}

const parseHipparcos = (source) => {
  const context = {}
  vm.runInNewContext(`${source}; hipparcos_catalog`, context, { timeout: 1000 })
  const rows = context.hipparcos_catalog
  if (!Array.isArray(rows)) throw new Error('Could not parse Hipparcos concise catalog')
  return new Map(rows.map(([hip, mag, ra, dec, bv]) => [hip, { hip, mag, ra, dec, bv }]))
}

const eclipticFromEquatorial = ({ ra, dec }) => {
  const obliquity = toRadians(23.4392911)
  const alpha     = toRadians(ra)
  const delta     = toRadians(dec)
  const x         = Math.cos(delta) * Math.cos(alpha)
  const y         = Math.cos(delta) * Math.sin(alpha) * Math.cos(obliquity) + Math.sin(delta) * Math.sin(obliquity)
  const z         = -Math.cos(delta) * Math.sin(alpha) * Math.sin(obliquity) + Math.sin(delta) * Math.cos(obliquity)

  return {
    lon: Number(norm360(toDegrees(Math.atan2(y, x))).toFixed(3)),
    lat: Number(toDegrees(Math.asin(z)).toFixed(3)),
  }
}

const numericLine = line => line.filter(value => Number.isFinite(value))

const imageName = file => path.basename(file)

const skyStar = (hipparcos, hip) => {
  const star = hipparcos.get(hip)
  if (!star) return null
  return {
    hip,
    mag: Number(star.mag.toFixed(2)),
    bv:  Number.isFinite(star.bv) ? Number(star.bv.toFixed(3)) : null,
    ...eclipticFromEquatorial(star),
  }
}

const imageMeta = (hipparcos, constellation) => {
  const source = constellation?.image
  if (!source?.file) return null
  const anchors = (source.anchors || [])
    .map(anchor => ({
      pos: anchor.pos,
      ...skyStar(hipparcos, anchor.hip),
    }))
    .filter(anchor => anchor.hip && Array.isArray(anchor.pos) && anchor.pos.length === 2)

  if (anchors.length < 3) return null
  return {
    src:     `/sky/illustrations/${imageName(source.file)}`,
    size:    source.size,
    anchors: anchors.slice(0, 3),
  }
}

const main = async () => {
  const [skyCulture, hipparcosSource] = await Promise.all([
    fetchText(SKY_CULTURE_URL).then(JSON.parse),
    fetchText(HIPPARCOS_URL),
  ])

  const hipparcos          = parseHipparcos(hipparcosSource)
  const constellationByIau = new Map(skyCulture.constellations.map(item => [item.iau, item]))
  const asterismById       = new Map(skyCulture.asterisms.map(item => [item.id, item]))

  await fs.mkdir(path.dirname(OUT_DATA), { recursive: true })
  await fs.mkdir(OUT_IMAGES, { recursive: true })

  const downloadedImages = new Map()
  const asterisms        = []

  for (const selection of SELECTED_ASTERISMS) {
    const source = asterismById.get(selection.id)
    if (!source) throw new Error(`Missing asterism ${selection.id}`)

    const lines   = source.lines.map(numericLine).filter(line => line.length > 1)
    const starIds = [...new Set(lines.flat())]
    const missing = starIds.filter(hip => !hipparcos.has(hip))
    if (missing.length) throw new Error(`${selection.id} has stars outside the compact Hipparcos catalog: ${missing.join(', ')}`)

    const stars = starIds.map(hip => skyStar(hipparcos, hip))

    const imageConstellation = constellationByIau.get(selection.imageIau)
    const imageFile          = imageConstellation?.image?.file || null
    const image              = imageMeta(hipparcos, imageConstellation)

    if (imageFile && !downloadedImages.has(imageFile)) {
      const target = path.join(OUT_IMAGES, imageName(imageFile))
      await fs.writeFile(target, await fetchBuffer(`${ILLUSTRATION_BASE_URL}${imageFile}`))
      downloadedImages.set(imageFile, image)
    }

    asterisms.push({
      id:    selection.id.replace('AST western ', ''),
      label: source.common_name?.english || selection.id,
      image,
      lines,
      stars,
    })
  }

  const data = {
    sources: {
      linesAndIllustrations: 'Stellarium western sky culture, text/data CC BY-SA; illustrations Free Art License',
      stars:                 'Hipparcos J2000 concise catalog from gmiller123456/hip2000',
    },
    asterisms,
  }

  await fs.writeFile(OUT_DATA, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`Wrote ${OUT_DATA}`)
  console.log(`Downloaded ${downloadedImages.size} illustration files to ${OUT_IMAGES}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
