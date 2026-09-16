import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TickRing from '../../../src/components/chart/wheel/TickRing.vue'

describe('tick ring', () => {
  it('is visual-only and does not capture pointer events', () => {
    const wrapper = mount(TickRing, { props: { wheelShift: 0 } })
    const ring    = wrapper.get('[data-testid="tick-ring"]')

    expect(ring.attributes('pointer-events')).toBe('none')
    expect(ring.attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('[role="button"]').exists()).toBe(false)
    expect(wrapper.find('[data-wheel-kind="tick"]').exists()).toBe(false)
    expect(wrapper.emitted('highlight')).toBeUndefined()
  })
})
