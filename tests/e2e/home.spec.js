import { test, expect } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

const MAP_URL = /\/map\/astrology\/chart$/

const manyPeople = (count) => Array.from({ length: count }, (_, index) => ({
  ...REF_PERSON,
  id:        `bulk-${index}`,
  name:      `Person ${index}`,
  createdAt: REF_PERSON.createdAt + index
}))

test.describe('Home', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page) })

  test('renders brand and nav links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('brand')).toBeVisible()
    await expect(page.getByTestId('nav-charts')).toBeVisible()
    await expect(page.getByTestId('nav-map')).toHaveAttribute('href', /\/map\/astrology\/chart$/)
    await expect(page.getByTestId('nav-timing')).toBeVisible()
    await expect(page.getByTestId('nav-relationships')).toBeVisible()
    expect(await page.locator('[data-testid^="nav-"]').evaluateAll(links => links.map(link => link.dataset.testid))).toEqual([
      'nav-charts',
      'nav-map',
      'nav-timing',
      'nav-relationships',
      'nav-planetarium',
    ])
    await expect(page.getByTestId('command-palette-trigger')).toBeVisible()
    await expect(page.getByTestId('person-switcher')).toBeVisible()
    await expect(page.getByTestId('utility-settings')).toHaveCount(0)
    await page.getByTestId('utility-menu-summary').click()
    await expect(page.getByTestId('utility-settings')).toBeVisible()
    await expect(page.getByTestId('chart-context-bar')).toHaveCount(0)
  })

  test('shows the active chart birth data in the person switcher and the system chip in the map toolbar', async ({ page }) => {
    await seedPeople(page, [REF_PERSON])
    await page.goto('/astrelio/map/astrology/chart')

    await expect(page.getByTestId('chart-context-bar')).toHaveCount(0)
    await expect(page.getByTestId('context-preset')).toHaveCount(0)
    await expect(page.getByTestId('context-person')).toHaveText(REF_PERSON.name)
    await expect(page.getByTestId('context-birth')).toContainText('1986-02-12 18:10')
    await expect(page.getByTestId('context-birth')).toContainText(REF_PERSON.placeLabel)
    await expect(page.getByTestId('map-toolbar').getByTestId('context-system')).toBeVisible()
  })

  test('shows empty state when no person saved', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('home-empty')).toBeVisible()
    await expect(page.getByTestId('home-form-panel')).toBeVisible()
    await expect(page.getByTestId('input-time')).toHaveValue('12:00')
  })

  test('keeps the first-chart form ready from the empty state', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('natal-form')).toBeVisible()
    await page.getByTestId('btn-new').click()
    await expect(page.getByTestId('natal-form')).toBeVisible()
  })

  test('opens the new chart form from the ?new=1 deep link and clears the flag', async ({ page }) => {
    await seedPeople(page, [REF_PERSON])
    await page.goto('/astrelio/?new=1')

    await expect(page.getByTestId('home-form-panel')).toBeVisible()
    await expect(page.getByTestId('natal-form')).toBeVisible()
    await expect(page).not.toHaveURL(/new=1/)
  })

  test('supports city search guidance, keyboard selection, and validation', async ({ page }) => {
    await page.goto('/')

    const city = page.getByTestId('city-input')
    await city.click()
    await city.fill('S')
    await expect(page.getByTestId('city-min-query')).toBeVisible()

    await city.fill('São Paulo')
    await expect(page.getByTestId('city-São Paulo, SP - Brasil')).toBeVisible({ timeout: 15000 })
    await city.press('ArrowDown')
    await city.press('ArrowUp')
    await city.press('Enter')
    await expect(page.getByTestId('city-selected')).toContainText('São Paulo')

    await city.fill('Xy')
    await page.getByTestId('input-name').click()
    await expect(page.getByTestId('city-validation')).toBeVisible()
  })

  test('opens the map of a chart from its library card in one click', async ({ page }) => {
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, SECOND_PERSON.id)
    await page.goto('/')

    await page.getByTestId(`open-${REF_PERSON.id}`).click()

    await expect(page).toHaveURL(MAP_URL)
    await expect(page.getByTestId('map-page')).toBeVisible()
    await expect(page.getByTestId('context-person')).toHaveText(REF_PERSON.name)
  })

  test('reaches the person page through the secondary details action', async ({ page }) => {
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await page.goto('/')

    await page.getByTestId(`details-${REF_PERSON.id}`).click()
    await expect(page).toHaveURL(new RegExp(`/person/${REF_PERSON.id}`))
    await expect(page.getByTestId('person-page')).toBeVisible()
  })

  test('shows library search only with more than six charts', async ({ page }) => {
    await seedPeople(page, manyPeople(6))
    await page.goto('/')
    await expect(page.getByTestId('person-bulk-0')).toBeVisible()
    await expect(page.getByTestId('home-search')).toHaveCount(0)

    await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('astrelio_people'))
      store.list.push({ ...store.list[0], id: 'bulk-6', name: 'Findable Seven', createdAt: 9999999999 })
      localStorage.setItem('astrelio_people', JSON.stringify(store))
    })
    await page.reload()

    await expect(page.getByTestId('home-search')).toBeVisible()
    await page.getByTestId('home-search').fill('Findable')
    await expect(page.getByTestId('person-bulk-6')).toBeVisible()
    await expect(page.getByTestId('person-bulk-0')).toHaveCount(0)
    await page.getByTestId('home-search').fill('no-such-chart')
    await expect(page.getByTestId('home-no-results')).toBeVisible()
  })

  test('marks active chart and supports edit, duplicate, and delete undo', async ({ page }) => {
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await page.goto('/')

    await expect(page.getByTestId(`active-${SECOND_PERSON.id}`)).toBeVisible()

    await page.getByTestId(`edit-${REF_PERSON.id}`).click()
    await expect(page.getByTestId('home-form-title')).toBeVisible()
    await page.getByTestId('input-name').fill('Edited chart')
    await page.getByTestId('btn-submit').click()
    await expect(page.getByTestId(`person-name-${REF_PERSON.id}`)).toHaveText('Edited chart')
    await expect(page.getByTestId(`active-${REF_PERSON.id}`)).toBeVisible()

    await page.getByTestId(`duplicate-${REF_PERSON.id}`).click()
    await expect(page.getByTestId('btn-submit')).toBeEnabled()
    await page.getByTestId('btn-submit').click()
    await expect(page).toHaveURL(MAP_URL)
    await page.goto('/')
    await expect(page.locator('[data-testid^="person-name-"]').filter({ hasText: /Cópia de Edited chart|Copy of Edited chart/ })).toBeVisible()

    await page.getByTestId(`delete-${SECOND_PERSON.id}`).click()
    await page.getByTestId(`delete-${SECOND_PERSON.id}`).click()
    await expect(page.getByTestId(`person-${SECOND_PERSON.id}`)).not.toBeVisible()
    await expect(page.getByTestId('delete-undo')).toBeVisible()
    await page.getByTestId('undo-delete').click()
    await expect(page.getByTestId(`person-${SECOND_PERSON.id}`)).toBeVisible()
  })
})
