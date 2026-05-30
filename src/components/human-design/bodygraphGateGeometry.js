const SOURCE_GATE_CENTER_OFFSET = 24 * 0.42

const gateOriginLayout = [
  ['Head', [[64, 236, 19], [61, 260, 19], [63, 283, 19]]],
  ['Ajna', [[47, 236, 65], [24, 260, 65], [4, 283, 65], [17, 238, 110], [43, 259, 138], [11, 282, 110]]],
  ['Throat', [[62, 236, 192], [23, 260, 192], [56, 283, 192], [16, 220, 220], [35, 299, 220], [20, 220, 244], [45, 299, 266], [31, 236, 279], [8, 260, 279], [33, 283, 279], [12, 299, 244]]],
  ['G', [[1, 257, 326], [7, 236, 344], [13, 282, 344], [10, 208, 376], [25, 308, 378], [15, 236, 408], [46, 282, 406], [2, 257, 426]]],
  ['Ego', [[21, 382, 416], [51, 367, 431], [26, 341, 460], [40, 407, 472]]],
  ['Solar Plexus', [[36, 488, 506], [22, 466, 518], [37, 444, 533], [6, 415, 555], [49, 440, 576], [55, 462, 590], [30, 484, 604]]],
  ['Spleen', [[48, 29, 506], [57, 52, 519], [44, 78, 535], [50, 101, 555], [32, 78, 576], [28, 57, 590], [18, 34, 604]]],
  ['Sacral', [[5, 236, 524], [14, 260, 524], [29, 283, 524], [34, 220, 545], [59, 299, 583], [27, 220, 583], [42, 236, 604], [3, 260, 604], [9, 283, 604]]],
  ['Root', [[53, 236, 657], [60, 260, 657], [52, 283, 657], [54, 220, 677], [19, 299, 677], [38, 220, 702], [39, 299, 702], [58, 220, 726], [41, 299, 726]]],
]

export const gateLayout = gateOriginLayout.map(([center, gates]) => [
  center,
  gates.map(([gate, x, y]) => [gate, x + SOURCE_GATE_CENTER_OFFSET, y + SOURCE_GATE_CENTER_OFFSET]),
])

export const gatePointByGate = Object.fromEntries(
  gateLayout.flatMap(([, gates]) => gates.map(([gate, x, y]) => [gate, { x, y }]))
)

export const centerByGate = Object.fromEntries(
  gateLayout.flatMap(([center, gates]) => gates.map(([gate]) => [gate, center]))
)

export const gatesByCenter = Object.fromEntries(
  gateLayout.map(([center, gates]) => [center, gates.map(([gate]) => gate)])
)
