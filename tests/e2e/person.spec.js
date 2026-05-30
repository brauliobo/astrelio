import { test, expect } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSettings } from './support/fixtures.js'

test.describe('Person detail', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
  })

  test('opens from home and audits birth data', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId(`open-${REF_PERSON.id}`).click()

    await expect(page).toHaveURL(new RegExp(`/person/${REF_PERSON.id}`))
    await expect(page.getByTestId('person-page')).toBeVisible()
    await expect(page.getByTestId('person-name')).toHaveText(REF_PERSON.name)
    await expect(page.getByTestId('person-local-time')).toHaveText('1986-02-12 18:10')
    await expect(page.getByTestId('person-utc-time')).toHaveText('1986-02-12 20:10 UTC')
    await expect(page.getByTestId('person-timezone')).toContainText('UTC-02:00')
    await expect(page.getByTestId('person-coordinates')).toHaveText('-23.1800, -45.8800')
    await expect(page.getByTestId('person-source-city')).toHaveText(REF_PERSON.placeLabel)
  })

  test('edits, duplicates, deletes, and opens natal/report', async ({ page }) => {
    await page.goto(`/#/person/${REF_PERSON.id}`)

    await page.getByTestId('person-edit-toggle').click()
    await page.getByTestId('input-name').fill('Edited detail')
    await page.getByTestId('btn-submit').click()
    await expect(page.getByTestId('person-name')).toHaveText('Edited detail')
    await expect(page.getByTestId('person-audit')).toBeVisible()

    await page.getByTestId('person-duplicate').click()
    await expect(page).toHaveURL(/\/person\//)
    await expect(page.getByTestId('person-name')).toHaveText(/Cópia de Edited detail|Copy of Edited detail/)

    await page.getByTestId('person-open-natal').click()
    await expect(page).toHaveURL(/\/natal/)
    await expect(page.getByTestId('natal-page')).toBeVisible()

    await page.goto(`/#/person/${SECOND_PERSON.id}`)
    await page.getByTestId('person-open-report').click()
    await expect(page).toHaveURL(/\/report/)
    await expect(page.getByTestId('report-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: new RegExp(SECOND_PERSON.name) })).toBeVisible()

    await page.goto(`/#/person/${SECOND_PERSON.id}`)
    await page.getByTestId('person-delete').click()
    await page.getByTestId('person-delete').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId(`person-${SECOND_PERSON.id}`)).not.toBeVisible()
  })
})
