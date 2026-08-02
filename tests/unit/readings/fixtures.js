const shared = {
  readings: {
    presentation: {
      distribution_categories: {
        element:    'Element',
        house_mode: 'House mode',
        modality:   'Modality',
      },
      evidence_kinds: {
        mechanics: 'mechanics',
        missing:   'missing evidence',
        placement: 'placement',
      },
      evidence_descriptions: {
        placement: '{body} in {signIndex}, house {house}',
      },
      evidence_reference: '{description}',
      evidence_toggle:    'Evidence ({count})',
      house_modes: {
        angular:   'Angular',
        cadent:    'Cadent',
        succedent: 'Succedent',
      },
      list_separator: ', ',
      prominence: {
        vedic: '#{rank} {body}',
      },
      sections: {
        caveats:   'Caveats',
        challenges: 'Challenges',
        practices:  'Practices',
        prominence: 'Prominence',
        strengths:  'Strengths',
        themes:     'Themes',
      },
      titles: {
        human_design: 'Human Design reading',
        tropical:     'Tropical reading',
        vedic:        'Vedic reading',
      },
      values: {
        direct:      'Direct',
        false:       'No',
        retrograde:  'Retrograde',
        true:        'Yes',
        unavailable: 'Unavailable',
      },
    },
    tropical: {
      chapters: { core_identity: { title: 'Core identity' } },
      challenges: { placement: '{body} challenge' },
      document: { title: 'Tropical psychological reading' },
      items: { placement: '{body} in {signIndex}' },
      practices: { placement: '{body} practice' },
      strengths: { placement: '{body} strength' },
      summary: { factor: '{factor} is prominent' },
    },
  },
  vedic: {
    dashas: {},
    dignities: {
      debilitated: 'debilitated',
      exalted:     'exalted',
      neutral:     'neutral',
      own_sign:    'own sign',
    },
    dasha_lords: {
      jupiter: 'Jupiter',
      sun:     'Sun',
    },
    nakshatras: { rohini: 'Rohini' },
    reading: {
      challenges: { placement: '{body} challenge in house {house}' },
      chapters: { identity: 'Identity' },
      evidence: { placement: '{body}, {signIndex}, {dignity}, {nakshatra}' },
      insights: { placement: '{body} in {signIndex}, {dignity}, {nakshatra}' },
      practices: { placement: '{body} practice' },
      strengths: { placement: '{body} strength' },
    },
  },
  human_design: {
    authorities: { emotional: 'Emotional' },
    centers:     { sacral: 'Sacral' },
    circuits:    { individual: 'Individual' },
    circuit_groups: { integration: 'Integration' },
    cross_geometries: { right_angle: 'Right Angle Cross' },
    definitions: { single: 'Single Definition' },
    layers:      { personality: 'Personality' },
    orientations: { left: 'Left' },
    quarters:    { Initiation: 'Initiation' },
    stream_names: { knowing: 'Knowing' },
    types:       { generator: 'Generator' },
    reading: {
      caveats: { exact_time: 'Exact birth time is required.' },
      chapters: {
        decision_making: {
          overview: '{type} decisions use {authority} authority.',
          title:    'Decision making',
        },
      },
      challenges: { decision_making: 'Pause for {authority} clarity.' },
      document:   { title: 'Human Design reading' },
      practices:  { decision_making: 'Practice the {type} strategy.' },
      prominence: { circuit: '{circuit} circuit ({count})' },
      strengths:  { decision_making: '{type} mechanics support decisions.' },
      themes:     { type: 'Type: {type}' },
    },
  },
  planets: {
    Jupiter: 'Jupiter',
    Moon:    'Moon',
    Sun:     'Sun',
  },
  zodiac: {
    signs: ['Aries', 'Taurus'],
  },
  analysis: {
    elements:   { fire: 'Fire' },
    modalities: { fixed: 'Fixed' },
  },
  test: {
    params: '{body};{bodies};{signIndex};{dignity};{nakshatra};{mahadasha};{type};{authority};{definition};{center};{circuit};{layer};{geometry};{quarter};{orientation}',
  },
}

const portuguese = structuredClone(shared)
Object.assign(portuguese.readings.presentation, {
  evidence_reference: '{description}',
  evidence_toggle:    'Evidências ({count})',
  list_separator:     ' e ',
})
Object.assign(portuguese.readings.presentation.evidence_descriptions, {
  placement: '{body} em {signIndex}, casa {house}',
})
Object.assign(portuguese.readings.presentation.sections, {
  caveats:    'Ressalvas',
  challenges: 'Desafios',
  practices:  'Práticas',
  prominence: 'Destaques',
  strengths:  'Potenciais',
  themes:     'Temas',
})
Object.assign(portuguese.readings.presentation.titles, {
  human_design: 'Leitura de Design Humano',
  tropical:     'Leitura tropical',
  vedic:        'Leitura védica',
})
Object.assign(portuguese.readings.tropical, {
  chapters: { core_identity: { title: 'Identidade central' } },
  challenges: { placement: 'Desafio de {body}' },
  document: { title: 'Leitura psicológica tropical' },
  items: { placement: '{body} em {signIndex}' },
  practices: { placement: 'Prática de {body}' },
  strengths: { placement: 'Potencial de {body}' },
  summary: { factor: '{factor} está em destaque' },
})
Object.assign(portuguese.vedic.reading, {
  challenges: { placement: 'Desafio de {body} na casa {house}' },
  chapters: { identity: 'Identidade' },
  evidence: { placement: '{body}, {signIndex}, {dignity}, {nakshatra}' },
  insights: { placement: '{body} em {signIndex}, {dignity}, {nakshatra}' },
  practices: { placement: 'Prática de {body}' },
  strengths: { placement: 'Potencial de {body}' },
})
Object.assign(portuguese.vedic.dignities, {
  debilitated: 'debilitado',
  exalted:     'exaltado',
  neutral:     'neutro',
  own_sign:    'signo próprio',
})
portuguese.vedic.dasha_lords.jupiter = 'Júpiter'
Object.assign(portuguese.human_design.reading, {
  caveats: { exact_time: 'É necessário o horário exato de nascimento.' },
  chapters: {
    decision_making: {
      overview: 'Decisões de {type} usam autoridade {authority}.',
      title:    'Tomada de decisão',
    },
  },
  challenges: { decision_making: 'Espere clareza {authority}.' },
  document:   { title: 'Leitura de Design Humano' },
  practices:  { decision_making: 'Pratique a estratégia de {type}.' },
  prominence: { circuit: 'Circuito {circuit} ({count})' },
  strengths:  { decision_making: 'A mecânica de {type} apoia decisões.' },
  themes:     { type: 'Tipo: {type}' },
})
Object.assign(portuguese.human_design, {
  authorities: { emotional: 'Emocional' },
  centers:     { sacral: 'Sacral' },
  circuits:    { individual: 'Individual' },
  circuit_groups: { integration: 'Integração' },
  cross_geometries: { right_angle: 'Cruz de Ângulo Direito' },
  definitions: { single: 'Definição Simples' },
  layers:      { personality: 'Personalidade' },
  orientations: { left: 'Esquerda' },
  quarters:    { Initiation: 'Iniciação' },
  stream_names: { knowing: 'Conhecimento' },
  types:       { generator: 'Gerador' },
})
Object.assign(portuguese.planets, { Jupiter: 'Júpiter', Moon: 'Lua', Sun: 'Sol' })
portuguese.zodiac.signs = ['Áries', 'Touro']

export const messages = { en: shared, 'pt-BR': portuguese }

const placementEvidence = {
  id:    'placement:sun',
  kind:  'placement',
  facts: { body: 'Sun', signIndex: 0, house: 1 },
}

export const tropicalDocument = {
  schemaVersion: 1,
  title:         { key: 'readings.tropical.document.title', params: {} },
  summary: {
    themes: [{
      id:          'theme:sun',
      token:       { key: 'readings.tropical.summary.factor', params: { factor: 'Sun' } },
      evidenceIds: ['placement:sun'],
    }],
  },
  chapters: [{
    id:    'core_identity',
    title: { key: 'readings.tropical.chapters.core_identity.title', params: {} },
    items: [{
      id:          'item:sun',
      token:       { key: 'readings.tropical.items.placement', params: { body: 'Sun', signIndex: 0 } },
      evidenceIds: ['placement:sun'],
    }],
  }, { id: 'empty', title: { key: 'readings.tropical.chapters.core_identity.title', params: {} }, items: [] }],
  strengths: [{ id: 'strength:sun', token: { key: 'readings.tropical.strengths.placement', params: { body: 'Sun' } }, evidenceIds: ['placement:sun'] }],
  challenges: [{ id: 'challenge:sun', token: { key: 'readings.tropical.challenges.placement', params: { body: 'Sun' } }, evidenceIds: ['placement:sun'] }],
  practices:  [{ id: 'practice:sun', token: { key: 'readings.tropical.practices.placement', params: { body: 'Sun' } }, evidenceIds: ['placement:sun'] }],
  evidence:   [placementEvidence],
}

export const vedicDocument = {
  schemaVersion: 'vedic-reading-document.v1',
  prominence: [{ body: 'Sun', score: 8, evidenceIds: ['placement:sun'] }],
  chapters: [{
    id:       'identity',
    title:    { key: 'vedic.reading.chapters.identity', params: {} },
    insights: [{
      id:   'insight:sun',
      text: { key: 'vedic.reading.insights.placement', params: { body: 'Sun', signIndex: 0, dignity: 'exalted', nakshatra: 'rohini' } },
      evidenceIds: ['placement:sun'],
    }],
  }],
  strengths: [],
  challenges: [{ id: 'challenge:sun', text: { key: 'vedic.reading.challenges.placement', params: { body: 'Sun', house: 1 } }, evidenceIds: ['placement:sun'] }],
  practices: [{ id: 'practice:sun', text: { key: 'vedic.reading.practices.placement', params: { body: 'Sun' } }, evidenceIds: ['placement:sun'] }],
  evidence: [{
    ...placementEvidence,
    type:  'placement',
    label: { key: 'vedic.reading.evidence.placement', params: { body: 'Sun', signIndex: 0, dignity: 'exalted', nakshatra: 'rohini' } },
  }],
}

export const humanDesignDocument = {
  schema:        'human-design.reading-document',
  schemaVersion: 1,
  title:         { key: 'human_design.reading.document.title', params: {} },
  summary: {
    themes: [{ content: { key: 'human_design.reading.themes.type', params: { type: 'generator' } }, evidenceIds: ['mechanics:type'] }],
    prominence: [{ id: 'circuit:individual', content: { key: 'human_design.reading.prominence.circuit', params: { circuit: 'individual', count: 1 } }, evidenceIds: ['mechanics:type'] }],
  },
  chapters: [{
    id:          'decision_making',
    title:       { key: 'human_design.reading.chapters.decision_making.title', params: {} },
    overview:    { key: 'human_design.reading.chapters.decision_making.overview', params: { type: 'generator', authority: 'emotional' } },
    evidenceIds: ['mechanics:type'],
    strengths:   [{ key: 'human_design.reading.strengths.decision_making', params: { type: 'generator' } }],
    challenges:  [{ key: 'human_design.reading.challenges.decision_making', params: { authority: 'emotional' } }],
    practices:   [{ key: 'human_design.reading.practices.decision_making', params: { type: 'generator' } }],
  }],
  caveats: [{ key: 'human_design.reading.caveats.exact_time', params: {} }],
  evidence: [{ id: 'mechanics:type', kind: 'mechanics', path: 'type', facts: { value: 'generator' } }],
}
