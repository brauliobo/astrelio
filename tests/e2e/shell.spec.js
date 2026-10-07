import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

const MAX_BAR_HEIGHT = 56
const DESKTOP        = { width: 1280, height: 800 }
const MOBILE         = { width: 390, height: 844 }
const MAP_DATA_URL   = /\/map\/astrology\/data$/

const topBarHeight = async (page) => (await page.locator('header.app-header').boundingBox()).height

test.describe('Navigation shell', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('switches person from a map page in two clicks and stays on the map', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/data')
    await expect(page.getByTestId('context-person')).toHaveText(REF_PERSON.name)
    await expect(page.getByTestId('planet-Sun')).toBeVisible()

    await page.getByTestId('person-switcher').click()
    await page.getByTestId(`person-switcher-option-${SECOND_PERSON.id}`).click()

    await expect(page).toHaveURL(MAP_DATA_URL)
    await expect(page.getByTestId('map-page')).toBeVisible()
    await expect(page.getByTestId('context-person')).toHaveText(SECOND_PERSON.name)
    await expect(page.getByTestId('person-switcher-panel')).toHaveCount(0)
    await expect(page.getByTestId('planet-Sun')).toBeVisible()
  })

  test('keeps the timing workspace when switching person', async ({ page }) => {
    await page.goto('/astrelio/timing/transits')
    await expect(page.getByTestId('transits-page')).toBeVisible()

    await page.getByTestId('person-switcher').click()
    await page.getByTestId(`person-switcher-option-${SECOND_PERSON.id}`).click()

    await expect(page).toHaveURL(/\/timing\/transits/)
    await expect(page.getByTestId('context-person')).toHaveText(SECOND_PERSON.name)
  })

  test('opens, navigates, selects and closes the person switcher with the keyboard', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/chart')
    const trigger = page.getByTestId('person-switcher')

    await trigger.focus()
    await trigger.press('ArrowDown')
    await expect(page.getByTestId('person-switcher-panel')).toBeVisible()
    await expect(page.getByTestId(`person-switcher-option-${REF_PERSON.id}`)).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId(`person-switcher-option-${SECOND_PERSON.id}`)).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId(`person-switcher-option-${REF_PERSON.id}`)).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('person-switcher-panel')).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await trigger.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('person-switcher-panel')).toHaveCount(0)
    await expect(page.getByTestId('context-person')).toHaveText(SECOND_PERSON.name)
    await expect(page).toHaveURL(/\/map\/astrology\/chart$/)
  })

  test('closes the person switcher on outside click', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/chart')
    await page.getByTestId('person-switcher').click()
    await expect(page.getByTestId('person-switcher-panel')).toBeVisible()

    await page.mouse.click(2, 400)
    await expect(page.getByTestId('person-switcher-panel')).toHaveCount(0)
    await expect(page.getByTestId('context-person')).toHaveText(REF_PERSON.name)
  })

  test('links the person switcher to new chart and library management', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/chart')

    await page.getByTestId('person-switcher').click()
    await page.getByTestId('person-switcher-manage').click()
    await expect(page.getByTestId('home-page')).toBeVisible()
    await expect(page.getByTestId('person-switcher-panel')).toHaveCount(0)

    await page.getByTestId('person-switcher').click()
    await page.getByTestId('person-switcher-new').click()
    await expect(page.getByTestId('home-form-panel')).toBeVisible()
  })

  test('shows the switcher search only with more than six charts', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/chart')
    await page.getByTestId('person-switcher').click()
    await expect(page.getByTestId('person-switcher-search')).toHaveCount(0)

    await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('astrelio_people'))
      for (let index = 0; index < 5; index++) store.list.push({ ...store.list[0], id: `extra-${index}`, name: `Extra ${index}` })
      localStorage.setItem('astrelio_people', JSON.stringify(store))
    })
    await page.reload()
    await page.getByTestId('person-switcher').click()

    const search = page.getByTestId('person-switcher-search')
    await expect(search).toBeFocused()
    await search.fill('Extra 3')
    await expect(page.getByTestId('person-switcher-option-extra-3')).toBeVisible()
    await expect(page.getByTestId(`person-switcher-option-${SECOND_PERSON.id}`)).toHaveCount(0)
  })

  test('closes the preferences popover with Escape and returns focus to its trigger', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/chart')
    const trigger = page.getByTestId('utility-menu-summary')

    await trigger.click()
    await expect(page.getByTestId('utility-menu-panel')).toBeVisible()
    await expect(page.getByTestId('theme-toggle')).toBeVisible()
    await expect(page.getByTestId('locale-select')).toBeVisible()
    await expect(page.getByTestId('sky-view-sky')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('utility-menu-panel')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('closes the preferences popover on outside click and keeps one popover open at a time', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/chart')

    await page.getByTestId('utility-menu-summary').click()
    await expect(page.getByTestId('utility-menu-panel')).toBeVisible()
    await page.mouse.click(2, 400)
    await expect(page.getByTestId('utility-menu-panel')).toHaveCount(0)

    await page.getByTestId('utility-menu-summary').click()
    await page.getByTestId('person-switcher').click()
    await expect(page.getByTestId('person-switcher-panel')).toBeVisible()
    await expect(page.getByTestId('utility-menu-panel')).toHaveCount(0)
  })

  test('keeps a single top bar of at most 56px on desktop with workspace tabs inline', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/astrelio/map/astrology/chart')

    expect(await topBarHeight(page)).toBeLessThanOrEqual(MAX_BAR_HEIGHT)
    await expect(page.getByTestId('chart-context-bar')).toHaveCount(0)
    for (const id of ['nav-charts', 'nav-map', 'nav-timing', 'nav-relationships', 'nav-planetarium', 'person-switcher', 'command-palette-trigger']) {
      const box = await page.getByTestId(id).boundingBox()
      expect(box.y + box.height, id).toBeLessThanOrEqual(MAX_BAR_HEIGHT)
    }
    const chartTop = (await page.getByTestId('map-toolbar').boundingBox()).y
    expect(chartTop).toBeLessThanOrEqual(130)
  })

  test('uses a slim top bar and a fixed bottom tab bar on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await page.goto('/astrelio/map/astrology/chart')

    expect(await topBarHeight(page)).toBeLessThanOrEqual(MAX_BAR_HEIGHT)
    for (const id of ['nav-charts', 'nav-map', 'nav-timing', 'nav-relationships', 'nav-planetarium']) {
      const box = await page.getByTestId(id).boundingBox()
      expect(box.y, id).toBeGreaterThan(MOBILE.height - MAX_BAR_HEIGHT - 8)
      expect(box.y + box.height, id).toBeLessThanOrEqual(MOBILE.height)
    }
    await expect(page.getByTestId('nav-map')).toHaveAttribute('aria-current', 'page')

    await page.getByTestId('nav-timing').click()
    await expect(page).toHaveURL(/\/timing\/transits/)
    await expect(page.getByTestId('nav-timing')).toHaveAttribute('aria-current', 'page')
  })

  test('keeps the bottom tab bar pinned while the page scrolls', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await page.goto('/astrelio/map/astrology/data')
    await expect(page.getByTestId('planet-list')).toBeVisible()

    await page.mouse.wheel(0, 600)
    const box = await page.getByTestId('nav-map').boundingBox()
    expect(box.y + box.height).toBeLessThanOrEqual(MOBILE.height)
    expect(box.y).toBeGreaterThan(MOBILE.height - MAX_BAR_HEIGHT - 8)
  })
})
