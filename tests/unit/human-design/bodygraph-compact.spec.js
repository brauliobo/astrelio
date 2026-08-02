import { shallowMount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import BodygraphChart from '../../../src/components/human-design/BodygraphChart.vue'
import BodygraphCore from '../../../src/components/human-design/BodygraphCore.vue'
import en from '../../../src/i18n/en.json'

const i18n = createI18n({
  legacy:   false,
  locale:   'en',
  messages: { en },
})

describe('Compact Human Design bodygraph', () => {
  it('omits activation columns and channel chips from a compact bodygraph', () => {
    const chart = { channels: ['1-8'] }
    const wrapper = shallowMount(BodygraphChart, {
      props:  { chart, compact: true },
      global: { plugins: [i18n] },
    })

    expect(wrapper.get('[data-testid="bodygraph-chart"]').attributes('data-compact')).toBe('true')
    expect(wrapper.findAll('activation-columns-stub')).toHaveLength(0)
    expect(wrapper.find('[data-testid="bodygraph-channel-chips"]').exists()).toBe(false)
    expect(wrapper.getComponent(BodygraphCore).props('chart')).toEqual(chart)
  })
})
