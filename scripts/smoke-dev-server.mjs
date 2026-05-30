import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const port = Number(process.env.SMOKE_DEV_PORT || 5173)
const baseUrl = `http://127.0.0.1:${port}`
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const isWindows = process.platform === 'win32'

const server = spawn(
  npmCommand,
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort', '--clearScreen', 'false'],
  {
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: !isWindows,
  },
)

let serverOutput = ''
server.stdout.on('data', chunk => {
  serverOutput += chunk.toString()
})
server.stderr.on('data', chunk => {
  serverOutput += chunk.toString()
})

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const fetchWithTimeout = async (url, timeoutMs = 2_000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function waitForServer() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 60_000) {
    if (server.exitCode !== null) {
      throw new Error(`Vite dev server exited before it was ready.\n${serverOutput}`)
    }

    try {
      const response = await fetchWithTimeout(baseUrl)
      if (response.ok) return
    } catch {
      await delay(500)
    }
  }

  throw new Error(`Timed out waiting for Vite dev server at ${baseUrl}.\n${serverOutput}`)
}

function signalServer(signal) {
  try {
    if (isWindows) {
      server.kill(signal)
    } else {
      process.kill(-server.pid, signal)
    }
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
  }
}

async function stopServer(signal = 'SIGTERM') {
  if (server.exitCode !== null) return

  signalServer(signal)
  const stopped = await Promise.race([
    new Promise(resolve => server.once('exit', resolve)),
    delay(5_000).then(() => false),
  ])

  if (stopped === false && server.exitCode === null) {
    signalServer('SIGKILL')
  }
}

async function runSmoke() {
  await waitForServer()

  const browser = await chromium.launch()
  const page = await browser.newPage()
  const failures = []

  await page.addInitScript(() => {
    const person = {
      id: 'smoke-person',
      name: 'Smoke Person',
      isoLocal: '1986-02-12T18:10',
      tzOffsetMinutes: -120,
      lat: -23.18,
      lon: -45.88,
      placeLabel: 'Sao Jose dos Campos, SP - Brasil',
      createdAt: 1234567890,
    }

    localStorage.setItem('astrelio_people', JSON.stringify({ list: [person] }))
    localStorage.setItem('session', JSON.stringify({ activePersonId: person.id, comparePersonId: null }))
    localStorage.setItem('astrelio_locale', 'pt-BR')
    localStorage.setItem('astrelio_settings', JSON.stringify({
      locale: 'pt-BR',
      houseSystem: 'placidus',
      zodiac: 'tropical',
      skyEnabled: false,
      theme: 'dark',
      aspectSet: 'all',
      orbScale: 1,
      applyingOnly: false,
      includeModernPlanets: true,
    }))
  })

  page.on('pageerror', error => {
    failures.push(`pageerror: ${error.message}`)
  })
  page.on('console', message => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`)
  })

  try {
    const response = await page.goto(`${baseUrl}/#/human-design`, { waitUntil: 'domcontentloaded' })
    if (!response?.ok()) failures.push(`navigation: ${response?.status() || 'no response'}`)

    await page.waitForSelector('[data-testid="human-design-page"]', { timeout: 30_000 })
    const overlay = page.locator('vite-error-overlay')
    if (await overlay.count()) {
      failures.push(`vite overlay: ${await overlay.first().textContent()}`)
    }

    await page.waitForTimeout(500)
  } finally {
    await browser.close()
  }

  if (failures.length) {
    throw new Error(`Dev server smoke check failed:\n${failures.join('\n')}\n\n${serverOutput}`)
  }
}

const hardTimeout = setTimeout(() => {
  console.error(`Dev server smoke check exceeded 120 seconds.\n${serverOutput}`)
  stopServer('SIGKILL').finally(() => process.exit(124))
}, 120_000)

try {
  await runSmoke()
} finally {
  clearTimeout(hardTimeout)
  await stopServer()
}
