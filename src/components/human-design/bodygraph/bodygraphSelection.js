import { computed, ref } from 'vue'
import {
  CENTER_GATES,
  CENTER_LAYOUT,
  CENTER_ORDER,
  CHANNEL_LAYOUT,
  CHANNELS_BY_CENTER,
  CHANNELS_BY_GATE,
  GATE_CENTER,
  GATE_LAYOUT,
} from '../../../lib/human-design/layout.js'

const related = (centers, channels, gates) => ({ centers: new Set(centers), channels: new Set(channels), gates: new Set(gates) })

const RELATORS = {
  center:  center => related([center], CHANNELS_BY_CENTER[center], CENTER_GATES[center]),
  channel: id => related(CHANNEL_LAYOUT[id].centers, [id], CHANNEL_LAYOUT[id].gates),
  gate:    (gate) => {
    const ids = CHANNELS_BY_GATE[gate]
    return related(
      [GATE_CENTER[gate], ...ids.flatMap(id => CHANNEL_LAYOUT[id].centers)],
      ids,
      [gate, ...ids.flatMap(id => CHANNEL_LAYOUT[id].gates)],
    )
  },
}

// Everything lit by selecting one item: a center lights its gates and channels, a channel its ends, a gate its channels and partners.
export const relatedTo = ({ type, value }) => RELATORS[type](type === 'gate' ? Number(value) : value)

export const relatedToHighlight = ({ centers = [], channels = [], gates = [] } = {}) => related(centers, channels, gates)

export const mergeRelated = (a, b) => related(
  [...a.centers, ...b.centers],
  [...a.channels, ...b.channels],
  [...a.gates, ...b.gates],
)

export const sameSelection = (a, b) => Boolean(a && b) && a.type === b.type && String(a.value) === String(b.value)

const DIRECTIONS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
const FORWARD    = new Set(['ArrowRight', 'ArrowDown'])
const BACKWARD   = new Set(['ArrowLeft', 'ArrowUp'])

export const neighbourCenter = (center, key) => {
  const [dx, dy] = DIRECTIONS[key]
  const [cx, cy] = CENTER_LAYOUT[center].centroid

  return CENTER_ORDER
    .filter(other => other !== center)
    .map((other) => {
      const [x, y] = CENTER_LAYOUT[other].centroid
      const along  = (x - cx) * dx + (y - cy) * dy
      return { other, along, score: along + 2 * Math.abs((x - cx) * dy - (y - cy) * dx) }
    })
    .filter(({ along }) => along > 0)
    .sort((a, b) => a.score - b.score)[0]?.other
}

const clockwise = (center) => {
  const [cx, cy] = CENTER_LAYOUT[center].centroid
  const angle    = (gate) => (Math.atan2(GATE_LAYOUT[gate].x - cx, cy - GATE_LAYOUT[gate].y) + 2 * Math.PI) % (2 * Math.PI)
  return [...CENTER_GATES[center]].sort((a, b) => angle(a) - angle(b))
}

const GATES_AROUND = Object.fromEntries(CENTER_ORDER.map(center => [center, clockwise(center)]))

const cycle = (list, item, step) => list[(list.indexOf(item) + step + list.length) % list.length]

const stepOf = key => FORWARD.has(key) ? 1 : BACKWARD.has(key) ? -1 : 0

const ORIGINS = {
  center:  center => center,
  channel: id => CHANNEL_LAYOUT[id].centers[0],
  gate:    gate => GATE_CENTER[gate],
}

const withOrigin = ({ type, value }) => ({ type, value, center: ORIGINS[type](value) })

const centerFocus  = center => ({ type: 'center', value: center, center })
const gateFocus    = (gate, center) => ({ type: 'gate', value: gate, center })
const channelFocus = (id, center) => ({ type: 'channel', value: id, center })
const firstChannel = center => channelFocus(CHANNELS_BY_CENTER[center][0], center)

const LEVELS = {
  center: {
    arrow:  (focus, key) => {
      const next = neighbourCenter(focus.value, key)
      return next ? { focus: centerFocus(next) } : null
    },
    enter:  focus => ({ pin: focus, focus: gateFocus(GATES_AROUND[focus.value][0], focus.value) }),
    cycle:  focus => ({ focus: firstChannel(focus.value) }),
  },
  gate: {
    arrow:  (focus, key) => ({ focus: gateFocus(cycle(GATES_AROUND[focus.center], focus.value, stepOf(key)), focus.center) }),
    enter:  focus => ({ pin: focus }),
    cycle:  focus => ({ focus: firstChannel(focus.center) }),
  },
  channel: {
    arrow:  (focus, key) => ({ focus: channelFocus(cycle(CHANNELS_BY_CENTER[focus.center], focus.value, stepOf(key)), focus.center) }),
    enter:  focus => ({ pin: focus }),
    cycle:  focus => ({ focus: channelFocus(cycle(CHANNELS_BY_CENTER[focus.center], focus.value, 1), focus.center) }),
  },
}

// Pure keyboard model: maps (focused item, key) to the next focus and/or the selection to pin.
export const keyTransition = (focus, key) => {
  const level = LEVELS[focus.type]
  if (key === 'Escape') return { clear: true, focus: centerFocus(focus.center) }
  if (key === 'Enter' || key === ' ') return level.enter(focus)
  if (key === 'c' || key === 'C') return level.cycle(focus)
  if (key in DIRECTIONS) return level.arrow(focus, key)
  return null
}

export const useBodygraphSelection = (pinnedSource) => {
  const hovered  = ref(null)
  const internal = ref(null)
  const focus    = ref(centerFocus(CENTER_ORDER[0]))
  const focused  = ref(false)

  // A defined source (even null) controls the pin; undefined leaves it to the component.
  const pinned  = computed(() => pinnedSource() === undefined ? internal.value : pinnedSource())
  const active  = computed(() => hovered.value ?? (focused.value ? focus.value : null) ?? pinned.value)
  const lit     = computed(() => active.value && relatedTo(active.value))

  const hover   = selection => { hovered.value = selection }
  const leave   = () => { hovered.value = null }
  const pin     = selection => { internal.value = selection }
  const clear   = () => { internal.value = null }
  const toggle  = selection => sameSelection(selection, pinned.value) ? clear() : pin(selection)
  const enter   = (selection) => {
    if (!sameSelection(selection, focus.value)) focus.value = withOrigin(selection)
    focused.value = true
  }
  const blur    = () => { focused.value = false }

  const press = (key) => {
    const transition = keyTransition(focus.value, key)
    if (!transition) return null
    if (transition.focus) focus.value = transition.focus
    return transition
  }

  return { hovered, pinned, focus, active, lit, hover, leave, pin, clear, toggle, enter, blur, press }
}
