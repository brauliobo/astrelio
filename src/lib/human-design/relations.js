import { CENTER_GATES, CHANNEL_LAYOUT, CHANNELS_BY_CENTER } from './layout.js'

export const RELATIONS = ['electromagnetic', 'companionship', 'compromise', 'dominance']

/** Bodygraph `highlight` that lights one channel with its gates and centers. */
export const channelHighlight = (id) => {
  const { gates, centers } = CHANNEL_LAYOUT[id]
  return { centers, channels: [id], gates }
}

/** Bodygraph `highlight` that lights one center with its gates and channels. */
export const centerHighlight = center => ({
  centers:  [center],
  channels: CHANNELS_BY_CENTER[center],
  gates:    CENTER_GATES[center],
})

/** The channels of one relation as `{ channel, name, owner }` rows, owner being a person id for compromise and dominance. */
export const relationRows = (connection, relation) => connection[`${relation}Details`].map(({ channel, owner = null }) => ({ channel, owner }))
