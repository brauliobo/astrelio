import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import BodygraphCore from '../../../src/components/human-design/BodygraphCore.vue'
import BodygraphChannels from '../../../src/components/human-design/BodygraphChannels.vue'
import { CHANNEL_CENTERS } from '../../../src/lib/human-design/constants.js'
import { channelCurve, channelSegments, gateLaneStrokeCurve, gateSegmentCurve } from '../../../src/components/human-design/bodygraphChannelGeometry.js'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'

const i18n = () => createI18n({
  legacy:   false,
  locale:   'en',
  messages: { en, 'pt-BR': ptBR },
})

const chartFor = ({ channels, designGates = [], personalityGates = [], centers = [] }) => ({
  channels,
  centers,
  designGates,
  personalityGates,
})

const mountChannels = (chart, extraProps = {}) => mount(BodygraphChannels, {
  props: {
    chart,
    showOpen:     true,
    showBase:     true,
    showSegments: true,
    openOpacity:  0.26,
    ...extraProps,
  },
})

const basePaths       = wrapper => wrapper.findAll('[data-testid="bodygraph-open-channel"]')
const definedPaths    = wrapper => wrapper.findAll('[data-testid="bodygraph-defined-channel"]')
const definedGatePath = (wrapper, gate) =>
  definedPaths(wrapper).find(path => Number(path.attributes('data-gate')) === gate)
const definedGateParts = (wrapper, gate) =>
  definedPaths(wrapper).filter(path => Number(path.attributes('data-gate')) === gate)
const definedGates = wrapper =>
  definedPaths(wrapper).map(path => Number(path.attributes('data-gate'))).sort((a, b) => a - b)
const hdDesign           = 'var(--hd-design)'
const hdPersonality      = 'var(--hd-contrast)'
const hdLightPersonality = 'var(--hd-contrast)'
const hdInactiveChannel  = 'var(--hd-channel-inactive)'

describe('Human Design bodygraph visual painting', () => {
  it('keeps the flat cone figure behind channels and centers', () => {
    const wrapper = mount(BodygraphCore, {
      props: {
        chart: chartFor({
          channels:    ['10-34'],
          designGates: [10, 34],
        }),
      },
      global: { plugins: [i18n()] },
    })
    const paths = wrapper.findAll('path')

    const d = paths[0].attributes('d')

    expect(d).toMatch(/^M260 -58 /)
    expect(d).toContain('C542 514 566 606 530 662')
    expect(d).toContain('Q260 829 -10 662')
    expect(d).toContain('C-46 606 -22 514 14 426')
    expect(d).not.toContain('C274 14')
  })

  it('has source gate-side segment paths for every channel gate', () => {
    for (const channel of Object.keys(CHANNEL_CENTERS)) {
      expect(channelCurve[channel], channel).toBeTruthy()
      expect(channelSegments[channel].map(segment => segment.gate), channel)
        .toEqual(channel.split('-').map(Number))

      for (const gate of channel.split('-').map(Number)) {
        expect(gateSegmentCurve[gate], `gate ${gate}`).toBeTruthy()
      }
    }
  })

  it('paints mixed channels as red and white gate halves without a duplicate full defined path', () => {
    const wrapper = mountChannels(chartFor({
      channels:         ['5-15'],
      designGates:      [5],
      personalityGates: [15],
    }))

    expect(definedGatePath(wrapper, 5).attributes('fill')).toBe(hdDesign)
    expect(definedGatePath(wrapper, 15).attributes('fill')).toBe(hdPersonality)
    expect(definedPaths(wrapper)).toHaveLength(2)
    expect(basePaths(wrapper).filter(path => path.attributes('data-defined') === 'true')).toHaveLength(0)
    expect(basePaths(wrapper)).toHaveLength(Object.keys(CHANNEL_CENTERS).length - 1)
  })

  it('paints hanging active gate partials even when harmonic gates are open', () => {
    const wrapper = mountChannels(chartFor({
      channels:         [],
      designGates:      [5, 14, 30, 55],
      personalityGates: [21, 39, 41],
    }))

    expect(definedGates(wrapper)).toEqual([5, 14, 21, 30, 39, 41, 55])
    expect(definedGatePath(wrapper, 5).attributes('fill')).toBe(hdDesign)
    expect(definedGatePath(wrapper, 14).attributes('fill')).toBe(hdDesign)
    expect(definedGatePath(wrapper, 21).attributes('fill')).toBe(hdPersonality)
    expect(definedGatePath(wrapper, 39).attributes('fill')).toBe(hdPersonality)
    expect(definedGatePath(wrapper, 41).attributes('fill')).toBe(hdPersonality)
    expect(basePaths(wrapper).filter(path => path.attributes('data-defined') === 'true')).toHaveLength(0)
  })

  it('paints both halves red when both gates are design activations', () => {
    const wrapper = mountChannels(chartFor({
      channels:    ['2-14'],
      designGates: [2, 14],
    }))

    expect(definedGatePath(wrapper, 2).attributes('fill')).toBe(hdDesign)
    expect(definedGatePath(wrapper, 14).attributes('fill')).toBe(hdDesign)
    expect(definedGates(wrapper)).toEqual([2, 14])
  })

  it('paints the personality half white on 21-45 instead of dropping the segment', () => {
    const wrapper = mountChannels(chartFor({
      channels:         ['21-45'],
      designGates:      [45],
      personalityGates: [21],
    }))

    expect(definedGatePath(wrapper, 21).attributes('fill')).toBe(hdPersonality)
    expect(definedGatePath(wrapper, 45).attributes('fill')).toBe(hdDesign)
    expect(definedGates(wrapper)).toEqual([21, 45])
  })

  it('uses theme contrast for gates activated by both design and personality', () => {
    const wrapper = mountChannels(chartFor({
      channels:         ['10-34'],
      designGates:      [10, 34],
      personalityGates: [10],
    }))

    const gate10 = definedGatePath(wrapper, 10)
    expect(gate10.attributes('fill')).toBe(hdDesign)
    expect(definedGateParts(wrapper, 10).map(path => path.attributes('fill'))).toEqual([hdDesign, hdPersonality])
    expect(definedGatePath(wrapper, 34).attributes('fill')).toBe(hdDesign)
    expect(basePaths(wrapper).filter(path => path.attributes('fill') === hdLightPersonality)).toHaveLength(0)
  })

  it('uses black contrast for both activations in light theme', () => {
    const wrapper = mountChannels(chartFor({
      channels:         ['28-38'],
      designGates:      [28, 38],
      personalityGates: [28],
    }), { visualTheme: 'light' })

    const gate28 = definedGatePath(wrapper, 28)
    expect(gate28.attributes('stroke')).toBe(hdDesign)
    expect(definedGateParts(wrapper, 28).map(path => path.attributes('stroke'))).toEqual([hdDesign, hdLightPersonality])
    expect(definedGatePath(wrapper, 38).attributes('fill')).toBe(hdDesign)
  })

  it('paints gate 28 both activations as two full parallel lanes', () => {
    const wrapper = mountChannels(chartFor({
      channels:         ['28-38'],
      designGates:      [28, 38],
      personalityGates: [28],
    }))
    const paths = definedGateParts(wrapper, 28)

    expect(paths).toHaveLength(2)
    expect(paths.map(path => path.attributes('stroke'))).toEqual([hdDesign, hdPersonality])
    expect(paths.map(path => path.attributes('data-part'))).toEqual(['design', 'personality'])
    expect(paths.map(path => path.attributes('d'))).toEqual([gateLaneStrokeCurve[28], gateLaneStrokeCurve[28]])
    expect(paths.map(path => path.attributes('data-axis'))).toEqual(['x', 'x'])
    expect(paths.map(path => path.attributes('fill'))).toEqual(['none', 'none'])
    expect(paths.every(path => path.attributes('stroke-linecap') === 'butt')).toBe(true)
    expect(paths.every(path => path.attributes('clip-path'))).toBe(false)
    expect(paths[0].attributes('transform')).toMatch(/^translate\(-/)
    expect(paths[1].attributes('transform')).toMatch(/^translate\(/)
    expect(paths[0].attributes('transform')).not.toBe(paths[1].attributes('transform'))
  })

  it('paints open channels with one opaque inactive color so overlapping paths do not darken', () => {
    const wrapper = mountChannels(chartFor({
      channels:         [],
      designGates:      [],
      personalityGates: [],
    }))

    expect(basePaths(wrapper).every(path => path.attributes('fill') === hdInactiveChannel)).toBe(true)
    expect(basePaths(wrapper).every(path => path.attributes('fill-opacity') === '1')).toBe(true)
  })

  it('uses the reference brown Solar Plexus center and muted center number colors', () => {
    const wrapper = mount(BodygraphCore, {
      props: {
        chart: chartFor({
          channels:    ['19-49'],
          centers:     ['Solar Plexus'],
          designGates: [49, 19],
        }),
      },
      global: { plugins: [i18n()] },
    })
    const solarPlexus      = wrapper.find('[data-center="Solar Plexus"] path')
    const solarPlexusLabel = wrapper.find('[data-center-group="Solar Plexus"] [data-gate="36"] text')

    expect(solarPlexus.attributes('fill')).toBe('#5f4339')
    expect(solarPlexusLabel.attributes('fill')).toBe('rgba(15,23,42,0.58)')
  })

  it('paints lower right 55-39 as independent gate-side partials', () => {
    const wrapper = mountChannels(chartFor({
      channels:         ['39-55'],
      designGates:      [55],
      personalityGates: [39],
    }))

    expect(definedGatePath(wrapper, 55).attributes('fill')).toBe(hdDesign)
    expect(definedGatePath(wrapper, 39).attributes('fill')).toBe(hdPersonality)
    expect(definedGates(wrapper)).toEqual([39, 55])
  })

  it('paints lower right 30-41 as independent gate-side partials', () => {
    const wrapper = mountChannels(chartFor({
      channels:         ['30-41'],
      designGates:      [30],
      personalityGates: [41],
    }))

    expect(definedGatePath(wrapper, 30).attributes('fill')).toBe(hdDesign)
    expect(definedGatePath(wrapper, 41).attributes('fill')).toBe(hdPersonality)
    expect(definedGates(wrapper)).toEqual([30, 41])
  })
})
