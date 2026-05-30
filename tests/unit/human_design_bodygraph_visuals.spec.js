import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BodygraphCore from '../../src/components/human-design/BodygraphCore.vue'
import BodygraphChannels from '../../src/components/human-design/BodygraphChannels.vue'
import { CHANNEL_CENTERS } from '../../src/lib/human-design/constants.js'
import { channelCurve, channelSegments, gateSegmentCurve } from '../../src/components/human-design/bodygraphChannelGeometry.js'

const chartFor = ({ channels, designGates = [], personalityGates = [] }) => ({
  channels,
  designGates,
  personalityGates,
})

const mountChannels = (chart, extraProps = {}) => mount(BodygraphChannels, {
  props: {
    chart,
    showOpen: true,
    showBase: true,
    showSegments: true,
    openOpacity: 0.26,
    ...extraProps,
  },
})

const basePaths = wrapper => wrapper.findAll('[data-testid="bodygraph-open-channel"]')
const definedPaths = wrapper => wrapper.findAll('[data-testid="bodygraph-defined-channel"]')
const definedGatePath = (wrapper, gate) =>
  definedPaths(wrapper).find(path => Number(path.attributes('data-gate')) === gate)
const definedGateParts = (wrapper, gate) =>
  definedPaths(wrapper).filter(path => Number(path.attributes('data-gate')) === gate)
const gateSplitClips = (wrapper, gate) =>
  wrapper.findAll(`[data-testid="bodygraph-split-clip"][data-gate="${gate}"]`)
const definedGates = wrapper =>
  definedPaths(wrapper).map(path => Number(path.attributes('data-gate'))).sort((a, b) => a - b)

describe('Human Design bodygraph visual painting', () => {
  it('keeps the flat cone figure behind channels and centers', () => {
    const wrapper = mount(BodygraphCore, {
      props: {
        chart: chartFor({
          channels: ['10-34'],
          designGates: [10, 34],
        }),
      },
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
      channels: ['5-15'],
      designGates: [5],
      personalityGates: [15],
    }))

    expect(definedGatePath(wrapper, 5).attributes('fill')).toBe('#dd4f52')
    expect(definedGatePath(wrapper, 15).attributes('fill')).toBe('#f8fafc')
    expect(definedPaths(wrapper)).toHaveLength(2)
    expect(basePaths(wrapper).filter(path => path.attributes('data-defined') === 'true')).toHaveLength(0)
    expect(basePaths(wrapper)).toHaveLength(Object.keys(CHANNEL_CENTERS).length - 1)
  })

  it('paints hanging active gate partials even when harmonic gates are open', () => {
    const wrapper = mountChannels(chartFor({
      channels: [],
      designGates: [5, 14, 30, 55],
      personalityGates: [21, 39, 41],
    }))

    expect(definedGates(wrapper)).toEqual([5, 14, 21, 30, 39, 41, 55])
    expect(definedGatePath(wrapper, 5).attributes('fill')).toBe('#dd4f52')
    expect(definedGatePath(wrapper, 14).attributes('fill')).toBe('#dd4f52')
    expect(definedGatePath(wrapper, 21).attributes('fill')).toBe('#f8fafc')
    expect(definedGatePath(wrapper, 39).attributes('fill')).toBe('#f8fafc')
    expect(definedGatePath(wrapper, 41).attributes('fill')).toBe('#f8fafc')
    expect(basePaths(wrapper).filter(path => path.attributes('data-defined') === 'true')).toHaveLength(0)
  })

  it('paints both halves red when both gates are design activations', () => {
    const wrapper = mountChannels(chartFor({
      channels: ['2-14'],
      designGates: [2, 14],
    }))

    expect(definedGatePath(wrapper, 2).attributes('fill')).toBe('#dd4f52')
    expect(definedGatePath(wrapper, 14).attributes('fill')).toBe('#dd4f52')
    expect(definedGates(wrapper)).toEqual([2, 14])
  })

  it('paints the personality half white on 21-45 instead of dropping the segment', () => {
    const wrapper = mountChannels(chartFor({
      channels: ['21-45'],
      designGates: [45],
      personalityGates: [21],
    }))

    expect(definedGatePath(wrapper, 21).attributes('fill')).toBe('#f8fafc')
    expect(definedGatePath(wrapper, 45).attributes('fill')).toBe('#dd4f52')
    expect(definedGates(wrapper)).toEqual([21, 45])
  })

  it('uses theme contrast for gates activated by both design and personality', () => {
    const wrapper = mountChannels(chartFor({
      channels: ['10-34'],
      designGates: [10, 34],
      personalityGates: [10],
    }))

    const gate10 = definedGatePath(wrapper, 10)
    expect(gate10.attributes('fill')).toBe('#dd4f52')
    expect(definedGateParts(wrapper, 10).map(path => path.attributes('fill'))).toEqual(['#dd4f52', '#f8fafc'])
    expect(definedGatePath(wrapper, 34).attributes('fill')).toBe('#dd4f52')
    expect(basePaths(wrapper).filter(path => path.attributes('fill') === '#111111')).toHaveLength(0)
  })

  it('uses black contrast for both activations in light theme', () => {
    const wrapper = mountChannels(chartFor({
      channels: ['28-38'],
      designGates: [28, 38],
      personalityGates: [28],
    }), { visualTheme: 'light' })

    const gate28 = definedGatePath(wrapper, 28)
    expect(gate28.attributes('fill')).toBe('#dd4f52')
    expect(definedGateParts(wrapper, 28).map(path => path.attributes('fill'))).toEqual(['#dd4f52', '#111111'])
    expect(definedGatePath(wrapper, 38).attributes('fill')).toBe('#dd4f52')
  })

  it('splits gate 28 channel paint into red and personality contrast halves like the marker', () => {
    const wrapper = mountChannels(chartFor({
      channels: ['28-38'],
      designGates: [28, 38],
      personalityGates: [28],
    }))
    const paths = definedGateParts(wrapper, 28)
    const clips = gateSplitClips(wrapper, 28)
    const rects = clips.map(clip => clip.get('rect'))

    expect(paths).toHaveLength(2)
    expect(paths.map(path => path.attributes('fill'))).toEqual(['#dd4f52', '#f8fafc'])
    expect(paths.map(path => path.attributes('data-part'))).toEqual(['design', 'personality'])
    expect(paths.every(path => path.attributes('clip-path')?.startsWith('url(#clip-'))).toBe(true)
    expect(clips).toHaveLength(2)
    expect(clips.every(clip => clip.attributes('data-axis') === 'y')).toBe(true)
    expect(rects[0].attributes('x')).toBe(rects[1].attributes('x'))
    expect(rects[0].attributes('width')).toBe(rects[1].attributes('width'))
    expect(Number(rects[0].attributes('y'))).toBeLessThan(Number(rects[1].attributes('y')))
  })

  it('paints lower right 55-39 as independent gate-side partials', () => {
    const wrapper = mountChannels(chartFor({
      channels: ['39-55'],
      designGates: [55],
      personalityGates: [39],
    }))

    expect(definedGatePath(wrapper, 55).attributes('fill')).toBe('#dd4f52')
    expect(definedGatePath(wrapper, 39).attributes('fill')).toBe('#f8fafc')
    expect(definedGates(wrapper)).toEqual([39, 55])
  })

  it('paints lower right 30-41 as independent gate-side partials', () => {
    const wrapper = mountChannels(chartFor({
      channels: ['30-41'],
      designGates: [30],
      personalityGates: [41],
    }))

    expect(definedGatePath(wrapper, 30).attributes('fill')).toBe('#dd4f52')
    expect(definedGatePath(wrapper, 41).attributes('fill')).toBe('#f8fafc')
    expect(definedGates(wrapper)).toEqual([30, 41])
  })
})
