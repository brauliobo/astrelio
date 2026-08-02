import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import ReadingDocumentView from '../../../src/components/readings/ReadingDocumentView.vue'
import { CHART_HIGHLIGHT_EVENT } from '../../../src/lib/chart/highlight.js'
import {
  humanDesignDocument,
  messages,
  tropicalDocument,
  vedicDocument,
} from './fixtures.js'

const RAW_TRANSLATION_KEY = /\b(?:analysis|human_design|planets|readings|vedic|zodiac)\.[a-z0-9_.-]+/i

const render = (document, locale, chart = null, slots = {}) => mount(ReadingDocumentView, {
  props:  { document, chart },
  slots,
  global: {
    plugins: [createI18n({ legacy: false, locale, messages })],
  },
})

describe('ReadingDocumentView', () => {
  it.each([
    ['en', tropicalDocument, 'Tropical psychological reading', 'Sun in Aries'],
    ['pt-BR', tropicalDocument, 'Leitura psicológica tropical', 'Sol em Áries'],
    ['en', vedicDocument, 'Vedic reading', 'Sun in Aries, exalted, Rohini'],
    ['pt-BR', vedicDocument, 'Leitura védica', 'Sol em Áries, exaltado, Rohini'],
    ['en', humanDesignDocument, 'Human Design reading', 'Generator decisions use Emotional authority.'],
    ['pt-BR', humanDesignDocument, 'Leitura de Design Humano', 'Decisões de Gerador usam autoridade Emocional.'],
  ])('renders a translated traceable document in %s', (locale, document, title, chapterText) => {
    const wrapper = render(document, locale)

    expect(wrapper.get('[data-testid="reading-document-view"]').text()).toContain(title)
    expect(wrapper.get('[data-testid="reading-chapters"]').text()).toContain(chapterText)
    expect(wrapper.findAll('details')).toHaveLength(0)
    expect(wrapper.text()).not.toContain(document.evidence[0].id)
    expect(wrapper.text()).not.toMatch(/\[(?:placement|angle|aspect|configuration):/)
    expect(wrapper.text()).not.toMatch(RAW_TRANSLATION_KEY)
  })

  it('omits empty sections and renders caveats only when present', () => {
    const tropical = render(tropicalDocument, 'en')
    const design   = render(humanDesignDocument, 'pt-BR')

    expect(tropical.find('[data-testid="reading-prominence"]').exists()).toBe(false)
    expect(tropical.find('[data-testid="reading-caveats"]').exists()).toBe(false)
    expect(design.get('[data-testid="reading-caveats"]').text()).toContain('É necessário o horário exato')
    expect(design.get('[data-testid="reading-strengths"]').text()).toContain('Gerador')
    expect(design.text()).not.toMatch(RAW_TRANSLATION_KEY)
  })

  it('renders the reference beside the symmetric themes grid', () => {
    const wrapper   = render(tropicalDocument, 'en', null, { reference: '<button data-testid="reference-content">Chart</button>' })
    const themes    = wrapper.get('[data-testid="reading-themes"]')
    const items     = wrapper.get('[data-testid="reading-theme-items"]')
    const reference = wrapper.get('[data-testid="reading-reference-chart"]')
    const layout    = wrapper.get('[data-reading-reference-layout="themes"]')

    expect(themes.element.contains(reference.element)).toBe(true)
    expect(layout.element.contains(items.element)).toBe(true)
    expect(reference.element.parentElement).toBe(layout.element)
    expect(items.element.contains(reference.element)).toBe(false)
    expect(items.classes()).toContain('md:grid-cols-2')
    expect(layout.classes()).toContain('reading-reference-layout--split')
    expect(reference.get('[data-testid="reference-content"]').element.tagName).toBe('BUTTON')
    expect(wrapper.findAll('[data-testid="reading-reference-chart"]')).toHaveLength(1)
    expect(reference.find('details').exists()).toBe(false)
  })

  it('renders a no-theme Vedic reference beside prominence content', () => {
    const wrapper    = render(vedicDocument, 'en', null, { reference: '<div data-testid="reference-content" />' })
    const prominence = wrapper.get('[data-testid="reading-prominence"]')
    const items      = wrapper.get('[data-testid="reading-prominence-items"]')
    const reference  = wrapper.get('[data-testid="reading-reference-chart"]')
    const layout     = wrapper.get('[data-reading-reference-layout="prominence"]')

    expect(prominence.element.contains(reference.element)).toBe(true)
    expect(reference.element.parentElement).toBe(layout.element)
    expect(items.element.contains(reference.element)).toBe(false)
    expect(layout.classes()).toContain('reading-reference-layout--split')
    expect(wrapper.findAll('[data-testid="reading-reference-chart"]')).toHaveLength(1)
  })

  it('falls back beside the first chapter grid when themes and prominence are absent', () => {
    const document  = { ...humanDesignDocument, summary: {} }
    const wrapper   = render(document, 'en', null, { reference: '<div data-testid="reference-content" />' })
    const chapter   = wrapper.get('[data-testid="reading-chapter-decision_making"]')
    const items     = chapter.get('[data-testid="reading-chapter-items"]')
    const reference = wrapper.get('[data-testid="reading-reference-chart"]')
    const layout    = wrapper.get('[data-reading-reference-layout="chapter"]')

    expect(chapter.element.contains(reference.element)).toBe(true)
    expect(reference.element.parentElement).toBe(layout.element)
    expect(items.element.contains(reference.element)).toBe(false)
    expect(layout.classes()).toContain('reading-reference-layout--split')
    expect(wrapper.findAll('[data-testid="reading-reference-chart"]')).toHaveLength(1)
  })

  it('does not render a reference card without reference slot content', () => {
    const wrapper = render(tropicalDocument, 'en')

    expect(wrapper.find('[data-testid="reading-reference-chart"]').exists()).toBe(false)
  })

  it.each([
    ['en', 'Mercury and Mercuryish; Mercury.', 'Mercury'],
    ['pt-BR', 'Mercúrio e Mercúriozinho; Mercúrio.', 'Mercúrio'],
  ])('renders every exact semantic occurrence inline without metadata chips in %s', (locale, text, label) => {
    const document = {
      title:   { key: 'readings.presentation.titles.tropical', params: {} },
      summary: {
        themes: [{
          token:       { key: 'test.segment_boundary', params: {} },
          evidenceIds: ['placement:mercury'],
        }],
      },
      evidence: [{
        id:    'placement:mercury',
        kind:  'placement',
        facts: { body: 'Mercury', signIndex: 0, house: 1 },
      }],
    }
    const wrapper = render(document, locale)
    const prose   = wrapper.get('[data-testid="reading-theme-items"] .reading-text')
    const terms   = prose.findAll('[data-reading-keyword-id="body:Mercury"]')

    expect(prose.text()).toBe(text)
    expect(terms).toHaveLength(2)
    expect(terms.map(term => term.text())).toEqual([label, label])
    expect(prose.find('[data-reading-keyword-id="sign:0"]').exists()).toBe(false)
    expect(prose.find('[data-reading-keyword-id="house:1"]').exists()).toBe(false)
    expect(wrapper.find('.reading-keywords').exists()).toBe(false)
  })

  it('broadcasts hover, focus, and pinned keyword highlights and follows shared events', async () => {
    const chart    = { id: 'reading-chart' }
    const wrapper  = render(tropicalDocument, 'en', chart)
    const listener = vi.fn()
    window.addEventListener(CHART_HIGHLIGHT_EVENT, listener)

    try {
      const body = wrapper.get('[data-reading-keyword-id="body:Sun"]')
      const sign = wrapper.get('[data-reading-keyword-id="sign:0"]')
      const anchor = { left: 80, top: 120, right: 120, bottom: 140, width: 40, height: 20 }
      body.element.getBoundingClientRect = () => anchor

      expect(body.attributes('data-reading-keyword-kind')).toBe('body')
      expect(body.element.closest('p')).not.toBeNull()
      expect(body.attributes('data-reading-keyword-highlight')).toBe('idle')
      expect(body.text()).toBe('Sun')

      await body.trigger('mouseenter')
      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({
        detail: { highlight: bodyHighlight(), pinned: false, chart, anchor },
      }))
      expect(body.attributes('data-reading-keyword-highlight')).toBe('active')
      expect(sign.attributes('data-reading-keyword-highlight')).toBe('dimmed')

      await body.trigger('mouseleave')
      expect(listener.mock.calls.at(-1)[0].detail).toEqual({ highlight: null, pinned: false, chart })

      await body.trigger('focus')
      expect(listener.mock.calls.at(-1)[0].detail.highlight).toEqual(bodyHighlight())
      await body.trigger('blur')
      expect(listener.mock.calls.at(-1)[0].detail.highlight).toBeNull()

      await body.trigger('click')
      expect(listener.mock.calls.at(-1)[0].detail).toEqual({ highlight: bodyHighlight(), pinned: true, chart, anchor })
      expect(body.attributes('data-reading-keyword-pinned')).toBe('true')
      expect(body.attributes('aria-pressed')).toBe('true')

      await body.trigger('click')
      expect(listener.mock.calls.at(-1)[0].detail).toEqual({ highlight: null, pinned: true, chart })
      expect(body.attributes('data-reading-keyword-pinned')).toBe('false')

      await sign.trigger('keydown', { key: 'Enter' })
      expect(listener.mock.calls.at(-1)[0].detail.pinned).toBe(true)
      expect(listener.mock.calls.at(-1)[0].detail.highlight.wheel).toMatchObject({ kind: 'sign', id: 'sign-0' })
      await sign.trigger('keydown', { key: ' ' })
      expect(listener.mock.calls.at(-1)[0].detail).toEqual({ highlight: null, pinned: true, chart })

      const callsBeforeSharedEvent = listener.mock.calls.length
      window.dispatchEvent(new CustomEvent(CHART_HIGHLIGHT_EVENT, {
        detail: { highlight: bodyHighlight(), pinned: false, chart },
      }))
      await wrapper.vm.$nextTick()
      expect(listener).toHaveBeenCalledTimes(callsBeforeSharedEvent + 1)
      expect(body.attributes('data-reading-keyword-highlight')).toBe('active')
      expect(sign.attributes('data-reading-keyword-highlight')).toBe('dimmed')

      window.dispatchEvent(new CustomEvent(CHART_HIGHLIGHT_EVENT, {
        detail: { highlight: null, pinned: false, chart },
      }))
      window.dispatchEvent(new CustomEvent(CHART_HIGHLIGHT_EVENT, {
        detail: { highlight: bodyHighlight(), pinned: true, chart },
      }))
      await wrapper.vm.$nextTick()
      expect(body.attributes('data-reading-keyword-pinned')).toBe('true')
    } finally {
      window.removeEventListener(CHART_HIGHLIGHT_EVENT, listener)
    }
  })
})

const bodyHighlight = () => ({
  bodies:    ['Sun'],
  aspectKey: '',
  aspect:    null,
  hd:        null,
  wheel:     null,
})
