import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MapPage from '../../src/pages/MapPage.vue'

const route = { params: {} }

vi.mock('vue-router', async () => {
  const { defineComponent } = await vi.importActual('vue')
  return {
    RouterLink: defineComponent({
      name:  'RouterLink',
      props: { to: { type: [String, Object], required: true } },
      template: '<a><slot /></a>',
    }),
    useRoute: () => route,
  }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: key => key }),
}))

const mountPage = lens => {
  route.params = { lens, view: 'chart' }
  return shallowMount(MapPage, {
    global: {
      stubs: {
        ModalityRouteSwitch: true,
        WorkspaceViewSwitch: true,
      },
    },
  })
}

describe('MapPage report routing', () => {
  beforeEach(() => { route.params = {} })

  it.each([
    ['astrology', 'astrology'],
    ['sidereal', 'vedic'],
    ['hd', 'human-design'],
  ])('routes the %s lens to its canonical report modality', (lens, modality) => {
    const wrapper = mountPage(lens)
    const report  = wrapper.getComponent({ name: 'RouterLink' })

    expect(report.props('to')).toEqual({ name: 'report', query: { modality } })
  })
})
