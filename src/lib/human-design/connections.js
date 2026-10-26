import { CENTER_THEMES, CENTERS, CHANNEL_BY_KEY, CHANNELS, GATE_NAMES, LOVE_GATES, MATERIAL_CHANNELS } from './constants.js'
import { channelsForGates, humanDesignStateForGates } from './definition.js'

const intersection = (a, b) => a.filter(value => b.includes(value))

const gatesFor = (chart) => new Set(chart?.gates || [])

const heldGates = (channel, gateSet) => channel.gates.filter(gate => gateSet.has(gate))

const channelDetail = channel => ({
  channel,
  name:       CHANNEL_BY_KEY[channel].name,
  centers:    CHANNEL_BY_KEY[channel].centers,
  gates:      CHANNEL_BY_KEY[channel].gates,
  isLove:     CHANNEL_BY_KEY[channel].gates.some(gate => LOVE_GATES.includes(gate)),
  isMaterial: MATERIAL_CHANNELS.includes(channel),
})

// Each channel falls in at most one relation; `side` is the person holding the whole channel.
const relationFor = (channel, gatesA, gatesB) => {
  const heldA = heldGates(channel, gatesA)
  const heldB = heldGates(channel, gatesB)
  const fullA = heldA.length === 2
  const fullB = heldB.length === 2

  if (fullA && fullB) return { relation: 'companionship' }
  if (fullA || fullB) {
    const other = fullA ? heldB : heldA
    return { relation: other.length ? 'compromise' : 'dominance', side: fullA ? 'A' : 'B' }
  }
  if (heldA.length === 1 && heldB.length === 1 && heldA[0] !== heldB[0]) return { relation: 'electromagnetic' }
  return null
}

const centerStatus = (definedByA, definedByB) => {
  if (definedByA && definedByB) return 'both'
  if (definedByA) return 'onlyA'
  return definedByB ? 'onlyB' : 'open'
}

export const humanDesignConnection = (chartA, chartB) => {
  if (!chartA || !chartB) return null

  const gatesA            = gatesFor(chartA)
  const gatesB            = gatesFor(chartB)
  const compositeGates    = new Set([...gatesA, ...gatesB])
  const composite         = humanDesignStateForGates(compositeGates)
  const compositeChannels = channelsForGates(compositeGates)
  const compositeCenters  = composite.centers
  const ownerOf           = side => side === 'A' ? chartA.personId : chartB.personId
  const relations         = CHANNELS
    .map(channel => ({ channel: channel.key, ...relationFor(channel, gatesA, gatesB) }))
    .filter(item => item.relation)
  const channelsOf = relation => relations.filter(item => item.relation === relation)
  const ownedBy    = relation => ['A', 'B'].flatMap(side =>
    channelsOf(relation).filter(item => item.side === side).map(item => ({ channel: item.channel, owner: ownerOf(side) }))
  )

  const electromagnetic = channelsOf('electromagnetic').map(item => item.channel)
  const companionship   = channelsOf('companionship').map(item => item.channel)
  const compromise      = ownedBy('compromise')
  const dominance       = ownedBy('dominance')

  const themes = [
    electromagnetic.length ? 'electromagnetic' : '',
    companionship.length ? 'companionship' : '',
    compromise.length ? 'compromise' : '',
    dominance.length ? 'dominance' : '',
  ].filter(Boolean)

  const centerDynamics = CENTERS.map((center) => {
    const definedByA = chartA.centers.includes(center)
    const definedByB = chartB.centers.includes(center)
    return {
      center,
      theme:              CENTER_THEMES[center],
      definedInComposite: compositeCenters.includes(center),
      definedByA,
      definedByB,
      status:             centerStatus(definedByA, definedByB),
    }
  })
  const centersWithStatus = status => centerDynamics.filter(item => item.status === status).map(item => item.center)

  return {
    personAId:     chartA.personId,
    personBId:     chartB.personId,
    sharedCenters: intersection(chartA.centers, chartB.centers),
    openCenters:   CENTERS.filter(center => !compositeCenters.includes(center)),
    centerDynamics,
    centerClassification: {
      both:  centersWithStatus('both'),
      onlyA: centersWithStatus('onlyA'),
      onlyB: centersWithStatus('onlyB'),
      open:  centersWithStatus('open'),
    },
    connectionTheme: `${compositeCenters.length}-${CENTERS.length - compositeCenters.length}`,
    composite:       {
      type:       composite.type,
      authority:  composite.authority,
      definition: composite.definition,
      areas:      composite.components,
      splitSize:  composite.splitSize,
      bridges:    composite.bridges,
      centers:    compositeCenters,
      channels:   compositeChannels,
    },
    compositeGates:    [...compositeGates].sort((a, b) => a - b).map(gate => ({ gate, name: GATE_NAMES[gate] || `Gate ${gate}` })),
    compositeChannels: compositeChannels.map(channelDetail),
    channelRelations:  relations.map(({ channel, relation, side }) => ({ channel, relation, owner: side ? ownerOf(side) : null })),
    electromagnetic,
    electromagneticDetails: electromagnetic.map(channelDetail),
    compromise,
    compromiseDetails: compromise.map(item => ({ ...item, ...channelDetail(item.channel) })),
    dominance,
    dominanceDetails: dominance.map(item => ({ ...item, ...channelDetail(item.channel) })),
    companionship,
    companionshipDetails: companionship.map(channelDetail),
    themes,
  }
}
