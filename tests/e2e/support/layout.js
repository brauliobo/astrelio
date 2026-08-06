import { expect } from '@playwright/test'

export const expectWithinViewport = async (page, locator, inset = 0) => {
  const box      = await locator.boundingBox()
  const viewport = page.viewportSize()

  expect(box).not.toBeNull()
  expect(box.x).toBeGreaterThanOrEqual(inset - 1)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - inset + 1)
}

const layoutMetrics = (page) => page.evaluate(() => {
  const viewportWidth = document.documentElement.clientWidth
  const isVisible = (element) => {
    const style = getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
  }
  const horizontalScrollerFor = (element) => {
    let ancestor = element.parentElement
    while (ancestor) {
      const style = getComputedStyle(ancestor)
      if (['auto', 'scroll'].includes(style.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + 1) {
        return ancestor
      }
      ancestor = ancestor.parentElement
    }
    return null
  }

  const offenders = [...document.querySelectorAll('body *')]
    .filter(element => element instanceof HTMLElement && isVisible(element))
    .map((element) => {
      const rect = element.getBoundingClientRect()
      const scroller = horizontalScrollerFor(element)
      return {
        element,
        rect,
        scroller,
      }
    })
    .filter(({ element, rect, scroller }) => {
      if (scroller || rect.width <= 0 || rect.height <= 0) return false
      if (element === document.body || element === document.documentElement) return false
      return rect.left < -1 || rect.right > viewportWidth + 1
    })
    .slice(0, 40)
    .map(({ element, rect }) => ({
      testid: element.getAttribute('data-testid') || '',
      className: typeof element.className === 'string' ? element.className : '',
      tag: element.tagName.toLowerCase(),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
    }))

  return {
    viewportWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    offenders,
  }
})

export const expectNoUnexpectedHorizontalOverflow = async (page) => {
  const layout = await layoutMetrics(page)

  const details = JSON.stringify(layout, null, 2)
  expect(layout.documentWidth, details).toBeLessThanOrEqual(layout.viewportWidth + 1)
  expect(layout.bodyWidth, details).toBeLessThanOrEqual(layout.viewportWidth + 1)
  expect(layout.offenders, details).toEqual([])
}
