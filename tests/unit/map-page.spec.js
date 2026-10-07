import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MapPage from '../../src/pages/MapPage.vue'
import MapToolbar from '../../src/components/map/MapToolbar.vue'

const route = { params: {} }

vi.mock('vue-router', () => ({ useRoute: () => route }))

const mountPage = (lens, view = 'chart') => {
  route.params = { lens, view }
  return shallowMount(MapPage)
}

describe('MapPage toolbar', () => {
  beforeEach(() => { route.params = {} })

  it.each([
    ['astrology', 'astrology'],
    ['sidereal', 'vedic'],
    ['hd', 'humanDesign'],
  ])('resolves the %s lens alias to %s', (alias, lens) => {
    expect(mountPage(alias).getComponent(MapToolbar).props('lens')).toBe(lens)
  })

  it('passes the active view and falls back to chart for unknown views', () => {
    expect(mountPage('vedic', 'reading').getComponent(MapToolbar).props('view')).toBe('reading')
    expect(mountPage('vedic', 'nope').getComponent(MapToolbar).props('view')).toBe('chart')
  })
})
