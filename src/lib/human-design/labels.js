const valueMaps = {
  type: {
    Generator: 'generator',
    'Manifesting Generator': 'manifesting_generator',
    Manifestor: 'manifestor',
    Projector: 'projector',
    Reflector: 'reflector',
  },
  authority: {
    Emotional: 'emotional',
    Sacral: 'sacral',
    Splenic: 'splenic',
    'Ego Projected': 'ego_projected',
    'Self Projected': 'self_projected',
    'Sounding Board': 'sounding_board',
    Lunar: 'lunar',
  },
  definition: {
    'No Definition': 'none',
    'Single Definition': 'single',
    'Split Definition': 'split',
    'Triple Split Definition': 'triple_split',
    'Quad Split Definition': 'quad_split',
  },
  circuit: {
    Individual: 'individual',
    'Collective Logic': 'collective_logic',
    'Collective Abstract': 'collective_abstract',
    Tribal: 'tribal',
  },
  center: {
    Head: 'head',
    Ajna: 'ajna',
    Throat: 'throat',
    G: 'g',
    Ego: 'ego',
    'Solar Plexus': 'solar_plexus',
    Spleen: 'spleen',
    Sacral: 'sacral',
    Root: 'root',
  },
}

const localeGroups = {
  type: 'types',
  authority: 'authorities',
  definition: 'definitions',
  circuit: 'circuits',
  center: 'centers',
}

const label = (t, path, fallback) => {
  const translated = t(path)
  return translated === path ? fallback : translated
}

export const humanDesignValueKey = (group, value) => valueMaps[group]?.[value] || ''

export const humanDesignValueLabel = (t, group, value) => {
  const key = humanDesignValueKey(group, value)
  return key ? label(t, `human_design.${localeGroups[group]}.${key}`, value) : value
}

export const humanDesignListLabel = (t, group, values) =>
  values.map(value => humanDesignValueLabel(t, group, value)).join(', ')
