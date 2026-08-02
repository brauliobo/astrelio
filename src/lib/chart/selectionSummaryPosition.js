const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum)

const candidateFor = (side, anchor, tooltip, gap) => {
  if (side === 'right') return {
    left: anchor.right + gap,
    top:  anchor.top + ((anchor.height - tooltip.height) / 2),
  }
  if (side === 'left') return {
    left: anchor.left - tooltip.width - gap,
    top:  anchor.top + ((anchor.height - tooltip.height) / 2),
  }
  if (side === 'below') return {
    left: anchor.left + ((anchor.width - tooltip.width) / 2),
    top:  anchor.bottom + gap,
  }
  return {
    left: anchor.left + ((anchor.width - tooltip.width) / 2),
    top:  anchor.top - tooltip.height - gap,
  }
}

export const positionSelectionSummary = ({
  anchor,
  tooltip,
  viewport,
  avoid = null,
  padding = 10,
  gap = 10,
}) => {
  const mobile = viewport.width <= 480
  const sides  = mobile ? ['below', 'above', 'right', 'left'] : ['right', 'left', 'below', 'above']
  const overlapsAvoid = ({ left, top }) => avoid &&
    left < avoid.right && left + tooltip.width > avoid.left &&
    top < avoid.bottom && top + tooltip.height > avoid.top
  const fits = candidate =>
    candidate.left >= padding && candidate.top >= padding &&
    candidate.left + tooltip.width <= viewport.width - padding &&
    candidate.top + tooltip.height <= viewport.height - padding &&
    !overlapsAvoid(candidate)

  const candidates = sides.map(side => ({ side, ...candidateFor(side, anchor, tooltip, gap) }))
  const selected   = candidates.find(fits) || candidates[0]
  const maxLeft    = Math.max(padding, viewport.width - tooltip.width - padding)
  const maxTop     = Math.max(padding, viewport.height - tooltip.height - padding)

  return {
    side: selected.side,
    left: clamp(selected.left, padding, maxLeft),
    top:  clamp(selected.top, padding, maxTop),
  }
}
