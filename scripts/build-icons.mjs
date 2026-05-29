import { chromium } from 'playwright'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT  = resolve(ROOT, 'public/icons')

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="62%">
      <stop offset="0%"   stop-color="#221a3d"/>
      <stop offset="60%"  stop-color="#0b0a1a"/>
      <stop offset="100%" stop-color="#050410"/>
    </radialGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#fcd34d"/>
      <stop offset="100%" stop-color="#d4a64f"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g transform="translate(256 256)">
    <circle r="170" fill="none" stroke="url(#ring)"  stroke-width="6" opacity="0.95"/>
    <circle r="120" fill="none" stroke="#cbd5e1"     stroke-width="2" opacity="0.55"/>
    <g stroke="#cbd5e1" stroke-width="2" opacity="0.45">
      ${Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180
        const x1 = Math.cos(a) * 120, y1 = Math.sin(a) * 120
        const x2 = Math.cos(a) * 170, y2 = Math.sin(a) * 170
        return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`
      }).join('')}
    </g>
    <g fill="#fcd34d">
      <circle cx="0" cy="-90" r="6"/>
      <circle cx="78" cy="45"  r="5"/>
      <circle cx="-78" cy="45" r="5"/>
    </g>
    <path d="M0,-58 L14,-18 L56,-18 L22,8 L34,50 L0,24 L-34,50 L-22,8 L-56,-18 L-14,-18 Z"
          fill="#fcd34d" opacity="0.95"/>
    <circle r="5" fill="#0b0a1a"/>
  </g>
</svg>`

const renderAt = async (page, size) => {
  const html = `<!doctype html><html><head><style>
    html,body { margin:0; padding:0; background:transparent; }
    body { width:${size}px; height:${size}px; }
    svg  { width:100%; height:100%; display:block; }
  </style></head><body>${SVG}</body></html>`
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(html, { waitUntil: 'load' })
  return page.screenshot({ type: 'png', omitBackground: false, clip: { x: 0, y: 0, width: size, height: size } })
}

const main = async () => {
  await mkdir(OUT, { recursive: true })
  // Remove placeholder files
  for (const f of ['icon-192.png.placeholder', 'icon-512.png.placeholder']) {
    try { await rm(resolve(OUT, f)) } catch { /* ignore missing placeholders */ }
  }
  const browser = await chromium.launch()
  const ctx     = await browser.newContext({ deviceScaleFactor: 1 })
  const page    = await ctx.newPage()
  for (const size of [192, 512]) {
    const png = await renderAt(page, size)
    await writeFile(resolve(OUT, `icon-${size}.png`), png)
    console.log(`✓ public/icons/icon-${size}.png (${png.length} bytes)`)
  }
  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
