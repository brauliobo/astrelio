import { test } from '@playwright/test'
import { LONG_PERSON, REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'
import { expectUsability, installUsabilityProbes, measureTask } from './support/usability.js'

// ISO 9241-11 task scenarios: each counts user actions (click/fill/select/key) from a realistic start screen.
const BASE_MS = { 'chromium-desktop': 3000, 'mobile-pixel': 4500 }
const LIBRARY = '/astrelio/'
const CHART   = '/astrelio/map/astrology/chart'

const start = async (page, path, { people = [REF_PERSON, SECOND_PERSON, LONG_PERSON], compare = null } = {}) => {
  await seedSettings(page)
  await seedPeople(page, people)
  await seedSession(page, REF_PERSON.id, compare)
  await installUsabilityProbes(page)
  await page.goto(path)
  await page.locator('main').waitFor()
}

const run = async (page, testInfo, task) => expectUsability(await measureTask(page, testInfo, {
  user:   'returning',
  ...task,
  budget: { actions: task.optimalActions, ms: BASE_MS[testInfo.project.name], ...task.budget },
}))

const click    = (page, id) => () => page.getByTestId(id).click()
const pathIs   = (page, re) => re.test(new URL(page.url()).pathname)
const selected = (page, id, attribute = 'aria-current') => page.locator(`[data-testid="${id}"][${attribute}]`)
const activeIs = async (page, person) => (await page.getByTestId('context-person').textContent()) === person.name
const switcherFor = (page, person) => page.getByTestId('person-switcher').filter({ hasText: person.name })

test.describe('Usability (ISO 9241-11)', () => {
  test('T1 returning user switches person from a map page', async ({ page }, testInfo) => {
    await start(page, CHART)
    await page.getByTestId('chart-wheel').waitFor()
    await run(page, testInfo, {
      id: 'T1', goal: 'Switch the active person while staying on the map', optimalActions: 2,
      steps:  [click(page, 'person-switcher'), click(page, `person-switcher-option-${SECOND_PERSON.id}`)],
      verify: async () => pathIs(page, /\/map\/astrology\/chart$/) && await activeIs(page, SECOND_PERSON),
      target: switcherFor(page, SECOND_PERSON),
    })
  })

  test('T2 open a person map from the library', async ({ page }, testInfo) => {
    await start(page, LIBRARY)
    await run(page, testInfo, {
      id: 'T2', goal: "Open a person's map from the library", optimalActions: 1,
      steps:  [click(page, `open-${SECOND_PERSON.id}`)],
      verify: async () => pathIs(page, /\/map\/astrology\/chart$/) && await activeIs(page, SECOND_PERSON) && await page.getByTestId('chart-wheel').isVisible(),
      target: page.getByTestId('chart-wheel'),
    })
  })

  test('T3 open the Vedic map from the library', async ({ page }, testInfo) => {
    await start(page, LIBRARY)
    await run(page, testInfo, {
      id: 'T3', goal: 'Open the Vedic map', optimalActions: 2,
      steps:  [click(page, 'nav-map'), click(page, 'modality-vedic')],
      verify: async () => pathIs(page, /\/map\/vedic\/chart$/),
      target: selected(page, 'modality-vedic'),
    })
  })

  test('T4 open the Reading view', async ({ page }, testInfo) => {
    await start(page, LIBRARY)
    await run(page, testInfo, {
      id: 'T4', goal: 'Open the Reading view', optimalActions: 2,
      steps:  [click(page, 'nav-map'), click(page, 'workspace-view-reading')],
      verify: async () => pathIs(page, /\/map\/astrology\/reading$/),
      target: selected(page, 'workspace-view-reading'),
    })
  })

  test('T5 open Progressions', async ({ page }, testInfo) => {
    await start(page, LIBRARY)
    await run(page, testInfo, {
      id: 'T5', goal: 'Open Progressions', optimalActions: 2,
      steps:  [click(page, 'nav-timing'), click(page, 'timing-technique-progressions')],
      verify: async () => pathIs(page, /\/timing\/progressions$/),
      target: selected(page, 'timing-technique-progressions', 'aria-selected="true"'),
    })
  })

  test('T6 compare two people in synastry', async ({ page }, testInfo) => {
    await start(page, LIBRARY, { compare: SECOND_PERSON.id })
    await run(page, testInfo, {
      id: 'T6', goal: 'Compare the active person with a chosen second person', optimalActions: 2,
      steps:  [click(page, 'nav-relationships'), () => page.getByTestId('compare-select').selectOption(LONG_PERSON.id)],
      verify: async () => pathIs(page, /\/synastry$/) && await page.getByTestId('compare-select').inputValue() === LONG_PERSON.id,
      target: page.getByTestId('relationship-summary').filter({ hasText: LONG_PERSON.name }),
    })
  })

  test('T7 change language', async ({ page }, testInfo) => {
    await start(page, LIBRARY)
    await run(page, testInfo, {
      id: 'T7', goal: 'Switch the interface language to English', optimalActions: 2,
      steps:  [click(page, 'utility-menu-summary'), () => page.getByTestId('locale-select').selectOption('en')],
      verify: async () => (await page.getByTestId('nav-map').textContent()) === 'Map',
      target: page.getByTestId('nav-map').filter({ hasText: /^Map$/ }),
    })
  })

  test('T8 find a chart via the command palette', async ({ page }, testInfo) => {
    await start(page, LIBRARY)
    await run(page, testInfo, {
      id: 'T8', goal: 'Switch to a person through the command palette', optimalActions: 3,
      steps:  [click(page, 'command-palette-trigger'), () => page.getByTestId('command-palette-input').fill(SECOND_PERSON.name), () => page.keyboard.press('Enter')],
      verify: async () => await activeIs(page, SECOND_PERSON),
      target: switcherFor(page, SECOND_PERSON),
    })
  })

  test('T9 new user creates the first chart and reaches the map', async ({ page }, testInfo) => {
    await seedSettings(page)
    await installUsabilityProbes(page)
    await page.goto(LIBRARY)
    const form = page.getByTestId('natal-form')
    await form.waitFor()

    // Optimal = one action per form input (name, date, time, city search) + picking the city + submit.
    const optimalActions = await form.locator('input').count() + 2
    const city           = page.getByTestId('city-input')
    await run(page, testInfo, {
      id: 'T9', user: 'new', goal: 'Create the first chart from the empty state and reach the map', optimalActions,
      // Typing the city debounces 250ms and loads the city index, on top of the lazy form chunk.
      budget: { ms: BASE_MS[testInfo.project.name] * 2 },
      steps:  [
        () => page.getByTestId('input-name').fill(REF_PERSON.name),
        () => page.getByTestId('input-date').fill(REF_PERSON.isoLocal.slice(0, 10)),
        () => page.getByTestId('input-time').fill(REF_PERSON.isoLocal.slice(11)),
        () => city.fill('São José dos Campos'),
        () => page.getByTestId('city-São José dos Campos, SP - Brasil').click(),
        click(page, 'btn-submit'),
      ],
      verify: async () => pathIs(page, /\/map\/astrology\/chart$/) && await page.getByTestId('chart-wheel').isVisible(),
      target: page.getByTestId('chart-wheel'),
    })
  })

  test('T10 return to the library from deep in the map', async ({ page }, testInfo) => {
    await start(page, '/astrelio/map/vedic/reading')
    await run(page, testInfo, {
      id: 'T10', goal: 'Return to the chart library', optimalActions: 1,
      steps:  [click(page, 'nav-charts')],
      verify: async () => pathIs(page, /\/astrelio\/$/) && await page.getByTestId('home-page').isVisible(),
      target: page.getByTestId('home-page'),
    })
  })
})
