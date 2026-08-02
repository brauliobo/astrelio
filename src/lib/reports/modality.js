const REPORT_MODALITY_ALIASES = {
  astrology:      'astrology',
  tropical:       'astrology',
  vedic:          'vedic',
  sidereal:       'vedic',
  'human-design': 'humanDesign',
  human_design:   'humanDesign',
  humandesign:    'humanDesign',
}

export const normalizeReportModality = value => {
  const candidate = Array.isArray(value) ? value[0] : value
  const key       = String(candidate || '').trim().toLowerCase()
  return REPORT_MODALITY_ALIASES[key] || 'astrology'
}

export const reportModalitySlug = modality => ({
  astrology:   'tropical',
  vedic:       'vedic',
  humanDesign: 'human-design',
})[modality] || 'tropical'
