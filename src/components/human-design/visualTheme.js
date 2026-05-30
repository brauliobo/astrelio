export const humanDesignPalette = (mode = 'dark') => {
  const light        = mode === 'light'
  const contrast     = 'var(--hd-contrast)'
  const contrastText = 'var(--hd-contrast-text)'

  return {
    mode: light ? 'light' : 'dark',
    contrast,
    contrastText,
    design:           'var(--hd-design)',
    designText:       'var(--hd-design-text)',
    inactiveChannel:  'var(--hd-channel-inactive)',
    inactiveGate:     'transparent',
    muted:            'var(--hd-muted)',
    highlight:        'var(--hd-highlight)',
    openCenter:       'var(--hd-center-open)',
    openCenterStroke: 'var(--hd-center-open-stroke)',
    centerStroke:     'var(--hd-center-stroke)',
    figure:           'var(--hd-figure)',
    figureOpacity:    light ? 0.10 : 0.25,
    gateInactiveFill: 'var(--hd-gate-inactive-fill)',
    emptyText:        'var(--hd-empty-text)',
    mandalaBase:      'var(--hd-mandala-base)',
    mandalaCenter:    'var(--hd-mandala-center)',
    mandalaStroke:    'var(--hd-mandala-stroke)',
    mandalaText:      'var(--hd-mandala-text)',
    mandalaMuted:     'var(--hd-mandala-muted)',
  }
}

export const humanDesignWheelPalette = (mode = 'dark') => {
  const light = mode === 'light'
  return {
    ringStroke:      'var(--hd-wheel-ring-stroke)',
    signText:        'var(--hd-wheel-sign-text)',
    gateBoth:        'var(--hd-wheel-gate-both)',
    gateDesign:      'var(--hd-wheel-gate-design)',
    gatePersonality: 'var(--hd-wheel-gate-personality)',
    gateHover:       'var(--hd-wheel-gate-hover)',
    gateDesignHover: 'var(--hd-wheel-gate-design-hover)',
    activeText:      'var(--hd-wheel-active-text)',
    inactiveText:    'var(--hd-wheel-inactive-text)',
    inactiveRay:     'var(--hd-wheel-inactive-ray)',
    inactiveLine:    'var(--hd-wheel-inactive-line)',
    activeLine:      'var(--hd-wheel-active-line)',
    sectorStroke:    'var(--hd-wheel-sector-stroke)',
    zodiacStroke:    'var(--hd-wheel-zodiac-stroke)',
    iching:          'var(--hd-wheel-iching)',
    ichingActive:    'var(--hd-wheel-iching-active)',
    zodiacFills:     light
      ? ['var(--hd-wheel-zodiac-a)', 'var(--hd-wheel-zodiac-b)', 'var(--hd-wheel-zodiac-c)', 'var(--hd-wheel-zodiac-d)']
      : ['var(--hd-wheel-zodiac-a)', 'var(--hd-wheel-zodiac-b)', 'var(--hd-wheel-zodiac-c)', 'var(--hd-wheel-zodiac-d)'],
  }
}

export const activationTone = ({ design = false, personality = false, mode = 'dark' } = {}) => {
  const palette = humanDesignPalette(mode)
  if (design && !personality) {
    return {
      kind:   'design',
      fill:   palette.design,
      stroke: palette.design,
      text:   palette.designText,
      parts:  [{ key: 'design', fill: palette.design, text: palette.designText }],
    }
  }
  if (design && personality) {
    return {
      kind:   'both',
      fill:   palette.contrast,
      stroke: palette.contrast,
      text:   palette.contrastText,
      parts:  [
        { key: 'design', fill: palette.design, text: palette.designText },
        { key: 'personality', fill: palette.contrast, text: palette.contrastText },
      ],
    }
  }
  if (personality) {
    return {
      kind:   'personality',
      fill:   palette.contrast,
      stroke: palette.contrast,
      text:   palette.contrastText,
      parts:  [{ key: 'personality', fill: palette.contrast, text: palette.contrastText }],
    }
  }
  return {
    kind:   'inactive',
    fill:   palette.inactiveGate,
    stroke: 'transparent',
    text:   palette.muted,
    parts:  [],
  }
}
