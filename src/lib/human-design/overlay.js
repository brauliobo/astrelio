const activationsOf = chart => ({
  ...chart.personality,
  ...Object.fromEntries(Object.entries(chart.design || {}).map(([planet, activation]) => [`design:${planet}`, activation])),
})

/** Chart for the Bodygraph that paints `base` in the personality ink and `over` in the design ink; shared gates paint split. */
export const overlayChart = (base, over, { channels, centers }) => ({
  personality: activationsOf(base),
  design:      activationsOf(over),
  channels,
  centers,
})
