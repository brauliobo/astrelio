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
  circuitGroup: {
    Individual: 'individual',
    Collective: 'collective',
    Tribal: 'tribal',
    Integration: 'integration',
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
  layer: {
    personality: 'personality',
    design: 'design',
    Personality: 'personality',
    Design: 'design',
  },
  crossGeometry: {
    'Right Angle': 'right_angle',
    Juxtaposition: 'juxtaposition',
    'Left Angle': 'left_angle',
  },
}

const localeGroups = {
  type: 'types',
  authority: 'authorities',
  definition: 'definitions',
  circuit: 'circuits',
  circuitGroup: 'circuit_groups',
  center: 'centers',
  layer: 'layers',
  crossGeometry: 'cross_geometries',
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
  (values || []).map(value => humanDesignValueLabel(t, group, value)).join(', ')

export const humanDesignGateLabel = (t, gate, fallback = '') =>
  label(t, `human_design.gate_names.${Number(gate)}`, fallback || `Gate ${gate}`)

export const humanDesignChannelLabel = (t, channel, fallback = '') =>
  label(t, `human_design.channel_names.${String(channel).replace('-', '_')}`, fallback || channel)

const slug = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

export const humanDesignStreamLabel = (t, stream, fallback = '') =>
  label(t, `human_design.stream_names.${slug(stream)}`, fallback || stream || '—')

export const humanDesignCenterThemeLabel = (t, theme, fallback = '') =>
  label(t, `human_design.center_themes.${slug(theme)}`, fallback || theme || '—')

export const humanDesignLineRoleLabel = (t, role, fallback = '') =>
  label(t, `human_design.line_roles.${slug(role)}`, fallback || role || '—')

export const humanDesignLineKeynoteLabel = (t, keynote, fallback = '') =>
  label(t, `human_design.line_keynotes.${slug(keynote)}`, fallback || keynote || '—')

export const humanDesignCrossNameLabel = (t, name, fallback = '') => {
  if (!name) return fallback || '—'
  const direct = label(t, `human_design.cross_names.${slug(name)}`, '')
  if (direct) return direct
  return fallback || name
}

export const humanDesignCrossTitleLabel = (t, cross = {}) => {
  const geometry = humanDesignValueLabel(t, 'crossGeometry', cross.geometry)
  const rawName = String(cross.name || '').replace(`${cross.geometry} Cross of `, '')
  const name = humanDesignCrossNameLabel(t, rawName)
  if (!geometry || !name) return cross.name || '—'
  return t('human_design.cross_name_format', { geometry, name })
}
