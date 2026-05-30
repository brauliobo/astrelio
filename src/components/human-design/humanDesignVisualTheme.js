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
