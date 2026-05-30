export const humanDesignPalette = (mode = 'dark') => {
  const light = mode === 'light'
  const contrast = light ? '#111111' : '#f8fafc'
  const contrastText = light ? '#f8fafc' : '#111827'

  return {
    mode: light ? 'light' : 'dark',
    contrast,
    contrastText,
    design: '#dd4f52',
    designText: '#fff7f7',
    inactiveChannel: light ? '#d1d5db' : '#1b1b1f',
    inactiveGate: 'transparent',
    muted: light ? '#6b7280' : '#55555a',
    highlight: light ? '#111111' : '#f8fafc',
    openCenter: light ? '#ffffff' : '#fbfaf4',
    openCenterStroke: light ? 'rgba(15,23,42,0.18)' : 'rgba(15,23,42,0.1)',
    centerStroke: light ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.22)',
    figure: light ? '#0f172a' : '#f8fafc',
    figureOpacity: light ? 0.10 : 0.25,
    gateInactiveFill: light ? 'rgba(15,23,42,0.52)' : 'rgba(15,23,42,0.42)',
    emptyText: light ? '#475569' : '#cbd5e1',
    mandalaBase: light ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.72)',
    mandalaCenter: light ? 'rgba(255,255,255,0.82)' : 'rgba(2,6,23,0.72)',
    mandalaStroke: light ? '#94a3b8' : '#64748b',
    mandalaText: light ? '#0f172a' : '#e2e8f0',
    mandalaMuted: light ? '#475569' : '#94a3b8',
  }
}

export const humanDesignWheelPalette = (mode = 'dark') => {
  const light = mode === 'light'
  return {
    ringStroke: light ? 'rgba(71,85,105,0.24)' : 'rgba(148,163,184,0.12)',
    signText: light ? 'rgba(15,23,42,0.54)' : 'rgba(226,232,240,0.46)',
    gateBoth: light ? 'rgba(95,78,70,0.20)' : 'rgba(95,78,70,0.42)',
    gateDesign: light ? 'rgba(216,79,81,0.22)' : 'rgba(216,79,81,0.48)',
    gatePersonality: light ? 'rgba(15,23,42,0.12)' : 'rgba(111,160,143,0.42)',
    gateHover: light ? 'rgba(15,23,42,0.84)' : 'rgba(248,250,252,0.88)',
    activeText: light ? 'rgba(15,23,42,0.74)' : 'rgba(248,250,252,0.76)',
    inactiveText: light ? 'rgba(71,85,105,0.42)' : 'rgba(226,232,240,0.28)',
    inactiveRay: light ? 'rgba(71,85,105,0.12)' : 'rgba(148,163,184,0.10)',
    inactiveLine: light ? 'rgba(71,85,105,0.18)' : 'rgba(148,163,184,0.13)',
    activeLine: light ? 'rgba(180,83,9,0.58)' : 'rgba(245,158,11,0.48)',
    sectorStroke: light ? 'rgba(15,23,42,0.08)' : 'rgba(248,250,252,0.075)',
    zodiacStroke: light ? 'rgba(15,23,42,0.06)' : 'rgba(248,250,252,0.07)',
    iching: light ? 'rgba(71,85,105,0.32)' : 'rgba(203,213,225,0.28)',
    ichingActive: light ? 'rgba(15,23,42,0.72)' : 'rgba(248,250,252,0.74)',
    zodiacFills: light
      ? ['rgba(250,204,21,0.10)', 'rgba(13,148,136,0.08)', 'rgba(2,132,199,0.08)', 'rgba(220,38,38,0.08)']
      : ['rgba(250,204,21,0.065)', 'rgba(45,212,191,0.055)', 'rgba(125,211,252,0.055)', 'rgba(248,113,113,0.055)'],
  }
}

export const activationTone = ({ design = false, personality = false, mode = 'dark' } = {}) => {
  const palette = humanDesignPalette(mode)
  if (design && !personality) {
    return {
      kind: 'design',
      fill: palette.design,
      stroke: palette.design,
      text: palette.designText,
      parts: [{ key: 'design', fill: palette.design, text: palette.designText }],
    }
  }
  if (design && personality) {
    return {
      kind: 'both',
      fill: palette.contrast,
      stroke: palette.contrast,
      text: palette.contrastText,
      parts: [
        { key: 'design', fill: palette.design, text: palette.designText },
        { key: 'personality', fill: palette.contrast, text: palette.contrastText },
      ],
    }
  }
  if (personality) {
    return {
      kind: 'personality',
      fill: palette.contrast,
      stroke: palette.contrast,
      text: palette.contrastText,
      parts: [{ key: 'personality', fill: palette.contrast, text: palette.contrastText }],
    }
  }
  return {
    kind: 'inactive',
    fill: palette.inactiveGate,
    stroke: 'transparent',
    text: palette.muted,
    parts: [],
  }
}
