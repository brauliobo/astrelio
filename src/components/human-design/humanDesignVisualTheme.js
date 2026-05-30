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
