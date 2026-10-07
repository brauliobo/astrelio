import { expect } from '@playwright/test'

// ISO 9241-11 measurement helpers. Effectiveness and efficiency are measured directly; satisfaction is only
// approximated by objective proxies on the final screen. Real satisfaction needs user questionnaires (e.g. SUS).

const LIMITS = { headerShare: 0.1, touchTargetPx: 24, bottomNavPx: 44, cls: 0.1, targetVisibleMs: 2000, verifyTimeoutMs: 5000 }
const TOUCH_TARGETS = [
  'a[data-testid^="nav-"]',
  '[data-testid="person-switcher"]',
  '[data-testid^="modality-"]:not([data-testid$="-switch"])',
  '[data-testid^="workspace-view-"]:not([data-testid$="-switch"])',
  '[data-testid="command-palette-trigger"]',
  '[data-testid="utility-menu-summary"]',
].join(',')

const sessions = new WeakMap()
const round    = (value, digits = 0) => Number(value.toFixed(digits))

export const installUsabilityProbes = async (page) => {
  const issues = []
  const issue  = (kind, text) => issues.push({ kind, text: String(text).slice(0, 200) })

  page.on('console', message => message.type() === 'error' && issue('console', message.text()))
  page.on('pageerror', error => issue('pageerror', error.message))
  page.on('requestfailed', request => !request.failure()?.errorText.includes('ERR_ABORTED') && issue('requestfailed', request.url()))
  page.on('response', response => response.status() >= 400 && issue('http', `${response.status()} ${response.url()}`))
  sessions.set(page, issues)

  await page.addInitScript(() => {
    window.__usabilityCls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__usabilityCls += entry.value
    }).observe({ type: 'layout-shift', buffered: true })
  })
}

const probeScreen = (page, selector) => page.evaluate((targets) => {
  const box      = el => el.getBoundingClientRect()
  const visible  = el => box(el).width > 0 && box(el).height > 0 && getComputedStyle(el).visibility !== 'hidden'
  const navLinks = [...document.querySelectorAll('a[data-testid^="nav-"]')].filter(visible)
  const smallest = [...document.querySelectorAll(targets)].filter(visible)
    .map(el => ({ id: el.dataset.testid, size: Math.round(Math.min(box(el).width, box(el).height)) }))
    .sort((a, b) => a.size - b.size)[0]
  const bottomNav = navLinks.length > 0 && getComputedStyle(navLinks[0].closest('nav')).position === 'fixed'

  return {
    headerShare:   box(document.querySelector('header')).height / innerHeight,
    smallest,
    bottomNav,
    bottomNavMin:  bottomNav ? Math.round(Math.min(...navLinks.map(el => box(el).height))) : null,
    cls:           window.__usabilityCls,
    overflowPx:    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }
}, selector)

const proxy = (id, label, value, pass, applicable = true) => ({ id, label, value, applicable, pass: applicable ? pass : null })

const buildProxies = ({ probe, errors, targetMs }) => [
  proxy('no-errors',       'no console/page/request errors',                    errors.length,            errors.length === 0),
  proxy('header-share',    `header <= ${LIMITS.headerShare * 100}% of viewport`, round(probe.headerShare, 3), probe.headerShare <= LIMITS.headerShare, !probe.bottomNav),
  proxy('touch-targets',   `nav/switcher targets >= ${LIMITS.touchTargetPx}px (WCAG 2.2)`, probe.smallest ? `${probe.smallest.id}:${probe.smallest.size}px` : null, (probe.smallest?.size ?? 0) >= LIMITS.touchTargetPx),
  proxy('bottom-nav',      `bottom nav >= ${LIMITS.bottomNavPx}px tall`,        probe.bottomNavMin,       probe.bottomNavMin >= LIMITS.bottomNavPx, probe.bottomNav),
  proxy('layout-shift',    `cumulative layout shift < ${LIMITS.cls}`,           round(probe.cls, 4),      probe.cls < LIMITS.cls),
  proxy('no-overflow',     'no horizontal overflow',                            probe.overflowPx,         probe.overflowPx <= 1),
  proxy('target-visible',  `destination visible <= ${LIMITS.targetVisibleMs}ms`, targetMs,                targetMs <= LIMITS.targetVisibleMs, targetMs !== null),
]

const timed = async (fn) => {
  const start = performance.now()
  await fn()
  return round(performance.now() - start)
}

const untilTrue = async (page, check) => {
  const deadline = performance.now() + LIMITS.verifyTimeoutMs
  while (!(await check())) {
    if (performance.now() > deadline) return false
    await page.waitForTimeout(25)
  }
  return true
}

const runSteps = async (steps) => {
  const stepMs = []
  try {
    for (const step of steps) stepMs.push(await timed(step))
    return { stepMs }
  } catch (error) {
    return { stepMs, failure: error.message.split('\n')[0] }
  }
}

export const measureTask = async (page, testInfo, task) => {
  const { id, goal, user, budget, optimalActions, steps, verify, target } = task
  const issues = sessions.get(page)
  const start  = performance.now()

  const { stepMs, failure } = await runSteps(steps)
  let targetMs = null
  if (!failure && target) targetMs = await timed(() => target.waitFor({ state: 'visible', timeout: LIMITS.verifyTimeoutMs })).catch(() => LIMITS.verifyTimeoutMs)
  const completed = !failure && await untilTrue(page, verify)
  const totalMs   = round(performance.now() - start)

  const actions = stepMs.length
  const proxies = buildProxies({ probe: await probeScreen(page, TOUCH_TARGETS), errors: issues, targetMs })
  const applicable = proxies.filter(item => item.applicable)
  const result = {
    id, goal, user,
    context:       { project: testInfo.project.name, viewport: page.viewportSize(), user },
    effectiveness: { completed, failure: failure || null, errors: issues.length, issues: issues.slice(0, 5) },
    efficiency:    {
      actions, optimalActions, stepMs, totalMs,
      relativeEfficiency:    round(Math.min(1, optimalActions / Math.max(actions, 1)), 2),
      completionsPerMinute:  completed ? round(60000 / totalMs, 1) : 0,
    },
    budget:        { ...budget, withinActions: actions <= budget.actions, withinMs: totalMs <= budget.ms },
    satisfactionProxies: {
      note:  'objective proxies, not user-reported satisfaction (use SUS or similar)',
      score: round(100 * applicable.filter(item => item.pass).length / applicable.length),
      checks: proxies,
    },
  }

  await testInfo.attach('usability', { body: JSON.stringify(result, null, 2), contentType: 'application/json' })
  testInfo.annotations.push({ type: 'usability', description: `${id} ${completed ? 'done' : 'FAILED'} ${actions}/${optimalActions} actions ${totalMs}ms proxies ${result.satisfactionProxies.score}` })
  return result
}

// Effectiveness, action budget and errors fail hard; time budget and satisfaction proxies are soft so reports stay complete.
export const expectUsability = (result) => {
  const { effectiveness, efficiency, budget, satisfactionProxies } = result

  expect(effectiveness.completed, `goal not reached: ${result.goal} ${effectiveness.failure || ''}`).toBe(true)
  expect(effectiveness.errors, JSON.stringify(effectiveness.issues)).toBe(0)
  expect(efficiency.actions, `${efficiency.actions} actions, optimal ${efficiency.optimalActions}`).toBeLessThanOrEqual(budget.actions)
  expect.soft(efficiency.totalMs, 'time on task').toBeLessThanOrEqual(budget.ms)
  for (const check of satisfactionProxies.checks.filter(item => item.applicable)) {
    expect.soft(check.pass, `${check.label}: ${check.value}`).toBe(true)
  }
}
