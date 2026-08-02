import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import AngleMarkers from '../../../src/components/chart/wheel/AngleMarkers.vue'
import Frame from '../../../src/components/chart/wheel/Frame.vue'
import HouseCusps from '../../../src/components/chart/wheel/HouseCusps.vue'
import HouseNumbers from '../../../src/components/chart/wheel/HouseNumbers.vue'
import NakshatraRing from '../../../src/components/chart/wheel/NakshatraRing.vue'
import TickRing from '../../../src/components/chart/wheel/TickRing.vue'
import ZodiacRing from '../../../src/components/chart/wheel/ZodiacRing.vue'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'

const i18n = () => createI18n({
  legacy:   false,
  locale:   'pt-BR',
  messages: { en, 'pt-BR': ptBR },
})

const payloadFrom = async (component, props, selector) => {
  const wrapper = mount(component, {
    props,
    global: { plugins: [i18n()] },
  })
  await wrapper.get(selector).trigger('mouseenter')
  return wrapper.emitted('highlight')[0][0]
}

describe('wheel selection translations', () => {
  it('localizes every interactive wheel-layer payload in Brazilian Portuguese', async () => {
    const cusps = Array.from({ length: 12 }, (_, index) => index * 30)
    const payloads = [
      await payloadFrom(ZodiacRing, { wheelShift: 0 }, '[data-wheel-id="sign-8"]'),
      await payloadFrom(NakshatraRing, { wheelShift: 0 }, '[data-wheel-id="nakshatra-0"]'),
      await payloadFrom(Frame, {}, '[data-wheel-id="zodiac-ring-bg"]'),
      await payloadFrom(HouseCusps, { cusps, wheelShift: 0 }, '[data-wheel-id="cusp-1"]'),
      await payloadFrom(HouseCusps, { cusps, wheelShift: 0 }, '[data-wheel-id="house-1"]'),
      await payloadFrom(AngleMarkers, {
        chart:      { ascendant: 240, mc: 90, cusps },
        wheelShift: 0,
      }, '[data-wheel-id="asc"]'),
      await payloadFrom(TickRing, { wheelShift: 0 }, '[data-wheel-id="tick-245"]'),
      await payloadFrom(HouseNumbers, { cusps, wheelShift: 0 }, '[data-wheel-id="house-1"]'),
    ]
    const output = JSON.stringify(payloads)

    expect(output).toContain('Sagitário')
    expect(output).toContain('Intervalo')
    expect(output).toContain('Modo')
    expect(output).toContain('Camada')
    expect(output).toContain('Cúspide')
    expect(output).toContain('Ponto médio')
    expect(output).toContain('Ascendente')
    expect(output).toContain('Marca de cinco graus')
    expect(output).not.toMatch(/\b(?:Span|Mode|Layer|Boundary|Next cusp|Midpoint|Axis|Scale|Action)\b/)
    expect(output).not.toMatch(/\b(?:Sagittarius|Zodiac sign sector|Vedic lunar mansion|Starts house)\b/)
  })
})
