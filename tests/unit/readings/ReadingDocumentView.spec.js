import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import ReadingDocumentView from '../../../src/components/readings/ReadingDocumentView.vue'
import {
  humanDesignDocument,
  messages,
  tropicalDocument,
  vedicDocument,
} from './fixtures.js'

const RAW_TRANSLATION_KEY = /\b(?:analysis|human_design|planets|readings|vedic|zodiac)\.[a-z0-9_.-]+/i

const render = (document, locale) => mount(ReadingDocumentView, {
  props:  { document },
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
})
