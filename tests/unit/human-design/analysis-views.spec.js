import { afterEach, describe, expect, it } from 'vitest'
import CentersView from '../../../src/components/human-design/analysis/CentersView.vue'
import ChannelsView from '../../../src/components/human-design/analysis/ChannelsView.vue'
import CyclesView from '../../../src/components/human-design/analysis/CyclesView.vue'
import GatesView from '../../../src/components/human-design/analysis/GatesView.vue'
import ProfileCrossVariablesView from '../../../src/components/human-design/analysis/ProfileCrossVariablesView.vue'
import SensitivityView from '../../../src/components/human-design/analysis/SensitivityView.vue'
import { chart, mountView, reflector } from './analysis-support.js'

let wrapper

const mountIt = (component, props, locale) => (wrapper = mountView(component, props, locale))

afterEach(() => wrapper?.unmount())

describe('CentersView', () => {
  it('shows nine cards grouped by class with an explicit state label', () => {
    mountIt(CentersView)
    expect(wrapper.findAll('.hda-center-card')).toHaveLength(9)
    expect(wrapper.findAll('section[data-class]').map(section => section.attributes('data-class'))).toEqual(['pressure', 'awareness', 'motor', 'expression', 'identity'])
    const head = wrapper.get('[data-center="Head"]')
    expect(head.attributes('data-state')).toBe('open')
    expect(head.text()).toContain('Open')
    expect(head.text()).toContain('Am I trying to answer questions that are not mine?')
    expect(wrapper.get('[data-center="Sacral"]').text()).toContain('Defined')
  })

  it('lists hanging gates as conditioning carriers', () => {
    mountIt(CentersView)
    const ajna = wrapper.get('[data-center="Ajna"]')
    expect(ajna.attributes('data-state')).toBe('undefined')
    expect(ajna.get('[data-testid="analysis-center-hanging"]').text()).toMatch(/4 · .*24 · /)
  })

  it('expands and highlights the pinned center and selects gates', async () => {
    mountIt(CentersView, { pinned: { type: 'center', value: 'Spleen' } })
    await wrapper.vm.$nextTick()
    const spleen = wrapper.get('[data-center="Spleen"]')
    expect(spleen.attributes('data-pinned')).toBe('true')
    expect(spleen.get('button[aria-expanded]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[data-center="Head"] button[aria-expanded]').attributes('aria-expanded')).toBe('false')
    await spleen.get('button.hda-chip').trigger('click')
    expect(wrapper.emitted('select')[0][0].type).toBe('gate')
  })

  it('renders center prose in pt-BR', () => {
    mountIt(CentersView, {}, 'pt-BR')
    expect(wrapper.get('[data-center="Head"]').text()).toContain('Estou tentando responder a perguntas que não são minhas?')
    expect(wrapper.text()).toContain('Pressão')
  })
})

describe('ChannelsView', () => {
  it('shows one card per defined channel with gates, circuit and stream', () => {
    mountIt(ChannelsView)
    const cards = wrapper.findAll('[data-testid="analysis-channel"]')
    expect(cards.map(card => card.attributes('data-channel'))).toEqual(['10-34', '19-49', '26-44'])
    expect(cards[0].text()).toContain('Exploration')
    expect(cards[0].text()).toContain('Individual')
    expect(cards[0].text()).toContain('Centering')
    expect(cards[0].text()).toContain('Love theme')
    expect(cards[2].text()).toContain('Material theme')
    expect(cards[1].findAll('[data-testid="analysis-activation-tag"]')).toHaveLength(3)
  })

  it('balances circuits, summarises the definition and lists bridges and hanging gates', () => {
    mountIt(ChannelsView)
    expect(wrapper.get('[data-circuit="tribal"]').text()).toContain('67%')
    expect(wrapper.findAll('[data-testid="analysis-area"]')).toHaveLength(3)
    expect(wrapper.get('[data-testid="analysis-split-size"]').text()).toContain('Small split')
    expect(wrapper.findAll('[data-testid="analysis-gate-bridge"]').length).toBeGreaterThan(0)
    expect(wrapper.findAll('[data-testid="analysis-channel-bridge"]').length).toBeGreaterThan(0)
    expect(wrapper.get('[data-testid="analysis-hanging"]').text()).toContain('58 · ')
    expect(wrapper.findAll('[data-theme]').map(theme => theme.attributes('data-theme'))).toEqual(['love', 'material', 'penta'])
  })

  it('highlights the pinned channel', () => {
    mountIt(ChannelsView, { pinned: { type: 'channel', value: '19-49' } })
    expect(wrapper.get('[data-channel="19-49"]').attributes('data-pinned')).toBe('true')
    expect(wrapper.get('[data-channel="10-34"]').attributes('data-pinned')).toBe('false')
  })

  it('renders in pt-BR', () => {
    mountIt(ChannelsView, {}, 'pt-BR')
    expect(wrapper.text()).toContain('Canais definidos (3)')
    expect(wrapper.text()).toContain('Divisão pequena')
  })
})

describe('GatesView', () => {
  it('shows the 64 gates and filters them', async () => {
    mountIt(GatesView)
    expect(wrapper.findAll('button.hda-gate')).toHaveLength(64)
    await wrapper.get('[data-mode="active"]').trigger('click')
    expect(wrapper.findAll('button.hda-gate')).toHaveLength(chart.gates.length)
    await wrapper.get('[data-mode="all"]').trigger('click')
    await wrapper.get('[data-testid="analysis-gate-search"]').setValue('power')
    expect(wrapper.findAll('button.hda-gate').map(button => button.text())).toContain('34')
    await wrapper.get('[data-testid="analysis-gate-search"]').setValue('zzz')
    expect(wrapper.text()).toContain('No gates match this search.')
  })

  it('shows the six lines of the picked gate and marks the active ones', async () => {
    mountIt(GatesView)
    await wrapper.get('button.hda-gate[data-gate="34"]').trigger('click')
    const detail = wrapper.get('[data-testid="analysis-gate-detail"]')
    expect(detail.text()).toContain('Power')
    expect(detail.text()).toContain('Sacral')
    expect(detail.findAll('[data-line]')).toHaveLength(6)
    expect(detail.findAll('[data-active="true"]').map(line => line.attributes('data-line'))).toEqual(['1'])
    expect(detail.get('[data-testid="analysis-gate-partners"]').text()).toContain('10-34')
    expect(detail.get('[data-testid="analysis-gate-partners"]').text()).toContain('Channel defined')
  })

  it('follows a pinned gate and emits the selection', async () => {
    mountIt(GatesView, { pinned: { type: 'gate', value: 49 } })
    expect(wrapper.get('[data-testid="analysis-gate-detail"]').attributes('data-gate')).toBe('49')
    await wrapper.setProps({ pinned: { type: 'gate', value: 5 } })
    expect(wrapper.get('[data-testid="analysis-gate-detail"]').attributes('data-gate')).toBe('5')
    await wrapper.get('[data-testid="analysis-gate-detail"] .hda-btn').trigger('click')
    expect(wrapper.emitted('select')[0][0]).toEqual({ type: 'gate', value: 5 })
  })

  it('uses pt-BR gate names and line texts', async () => {
    mountIt(GatesView, {}, 'pt-BR')
    await wrapper.get('button.hda-gate[data-gate="1"]').trigger('click')
    const detail = wrapper.get('[data-testid="analysis-gate-detail"]')
    expect(detail.text()).toContain('Autoexpressão')
    expect(detail.text()).not.toContain('Creativity on solid ground')
  })
})

describe('ProfileCrossVariablesView', () => {
  it('describes the profile, line 6 stage, cross and four variable arrows', () => {
    mountIt(ProfileCrossVariablesView)
    const profile = wrapper.get('[data-testid="analysis-profile"]')
    expect(profile.text()).toContain('Role Model / Hermit')
    expect(profile.get('[data-side="conscious"]').text()).toContain('6 · Role Model')
    expect(profile.get('[data-side="unconscious"]').text()).toContain('2 · Hermit')
    expect(profile.get('[data-current="true"]').text()).toContain('The roof')
    const cross = wrapper.get('[data-testid="analysis-cross"]')
    expect(cross.text()).toContain('Left Angle Cross of Revolution')
    expect(cross.text()).toContain('Initiation')
    expect(cross.findAll('[data-role]').map(row => row.attributes('data-role'))).toEqual(['personalitySun', 'personalityEarth', 'designSun', 'designEarth'])
    const variables = wrapper.get('[data-testid="analysis-variables"]')
    expect(variables.get('[data-testid="analysis-variable-code"]').text()).toBe('PRR DLL')
    expect(variables.findAll('[data-arrow]').map(arrow => [arrow.attributes('data-arrow'), arrow.attributes('data-orientation')])).toEqual([
      ['digestion', 'left'], ['environment', 'left'], ['motivation', 'right'], ['perspective', 'right'],
    ])
    expect(variables.get('[data-testid="analysis-cognition"]').text()).toContain('Outer Vision')
  })

  it('renders in pt-BR', () => {
    mountIt(ProfileCrossVariablesView, {}, 'pt-BR')
    expect(wrapper.get('[data-testid="analysis-profile"]').text()).toContain('Modelo / Eremita')
    expect(wrapper.get('[data-testid="analysis-cross"]').text()).toContain('Cruz')
  })
})

describe('CyclesView', () => {
  it('draws the life cycles as a timeline with a you-are-here marker', () => {
    mountIt(CyclesView)
    const cycles = wrapper.findAll('[data-testid="analysis-cycle"]')
    expect(cycles.map(cycle => cycle.attributes('data-cycle'))).toEqual(['saturn_return-1', 'uranus_opposition-1', 'chiron_return-1', 'saturn_return-2', 'uranus_return-1'])
    expect(cycles.map(cycle => cycle.attributes('data-status'))).toEqual(['past', 'next', 'future', 'future', 'future'])
    expect(cycles[0].text()).toContain('Saturn Return')
    expect(cycles[0].text()).toMatch(/December \d+, 2015/)
    expect(wrapper.text()).toContain('You are here')
    expect(wrapper.get('[data-testid="analysis-lunar"]').attributes('data-prominent')).toBe('false')
  })

  it('makes the Moon gate prominent for a Reflector with a 28 day map', () => {
    mountIt(CyclesView, { chart: reflector })
    const lunar = wrapper.get('[data-testid="analysis-lunar"]')
    expect(lunar.attributes('data-prominent')).toBe('true')
    expect(lunar.text()).toContain('Moon in gate')
    expect(wrapper.find('[data-testid="analysis-lunar-map"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="analysis-cycles"]')).toHaveLength(1)
  })

  it('formats dates in pt-BR', () => {
    mountIt(CyclesView, {}, 'pt-BR')
    expect(wrapper.get('[data-cycle="saturn_return-1"]').text()).toMatch(/dezembro de 2015/)
  })
})

describe('SensitivityView', () => {
  it('summarises headline results for the ±10 and ±60 minute windows', async () => {
    mountIt(SensitivityView)
    expect(wrapper.findAll('[data-result]').map(row => row.attributes('data-result'))).toEqual(['profile', 'cross', 'variables', 'gates', 'type'])
    expect(wrapper.get('[data-result="profile"]').text()).toContain('Stable')
    expect(wrapper.get('[data-result="variables"]').attributes('data-changed')).toBe('true')
    expect(wrapper.get('[data-testid="analysis-verdict"]').text()).toContain('±10 minutes')
    await wrapper.get('[data-window="60"]').trigger('click')
    expect(wrapper.get('[data-testid="analysis-verdict"]').text()).toContain('±60 minutes')
    expect(wrapper.get('[data-result="gates"]').attributes('data-changed')).toBe('true')
    expect(wrapper.get('[data-result="type"]').attributes('data-changed')).toBe('true')
  })

  it('lists the closest boundaries and fine details', () => {
    mountIt(SensitivityView)
    expect(wrapper.findAll('[data-testid="analysis-closest"] li')).toHaveLength(5)
    expect(wrapper.findAll('[data-level]').map(row => row.attributes('data-level'))).toEqual(['gate', 'line', 'color', 'tone', 'base'])
  })

  it('renders in pt-BR', () => {
    mountIt(SensitivityView, {}, 'pt-BR')
    expect(wrapper.text()).toContain('Sensibilidade ao horário de nascimento')
    expect(wrapper.get('[data-testid="analysis-verdict"]').text()).toMatch(/resultado/)
  })
})
