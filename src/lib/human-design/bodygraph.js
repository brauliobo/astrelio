import { localToJdUt, offsetMinutesForPerson } from '../astro/timezones.js'
import { activationsForChart, channelKey, personalityDesignCharts } from './activations.js'
import { CENTER_COORDS, CENTERS, CHANNEL_CENTERS, CHANNEL_CIRCUITS, HARMONIC_GATES } from './constants.js'
import { deriveHumanDesignCorrelations } from './correlations.js'
import { enrichHumanDesignChart } from './details.js'

const sortedUnique = values => [...new Set(values)].sort()

const activationValues = (activations) => Object.values(activations || {})

const collectGates = (...activationSets) =>
  sortedUnique(activationSets.flatMap(activations => activationValues(activations).map(item => item.gate)))

const channelsForGates = (gates) => {
  const gateSet  = new Set(gates)
  const channels = []

  for (const gate of gateSet) {
    for (const harmonic of HARMONIC_GATES[gate] || []) {
      const key = channelKey(gate, harmonic)
      if (gateSet.has(harmonic) && CHANNEL_CENTERS[key]) channels.push(key)
    }
  }

  return sortedUnique(channels)
}

const centersForChannels = (channels) =>
  sortedUnique(channels.flatMap(channel => CHANNEL_CENTERS[channel] || []))

const hasChannel = (channels, pattern) =>
  channels.some(channel => pattern.test(channel))

const motorToThroat = (channels, centers) => {
  if (!centers.includes('Throat') || !centers.some(center => ['Solar Plexus', 'Sacral', 'Root', 'Ego'].includes(center))) {
    return false
  }

  if (centers.includes('Solar Plexus') && hasChannel(channels, /12-22|35-36/)) return true
  if (centers.includes('Sacral') && hasChannel(channels, /20-34/)) return true
  if (centers.includes('Ego') && hasChannel(channels, /21-45/)) return true

  const gToThroat      = hasChannel(channels, /1-8|7-31|10-20|13-33/)
  const spleenToThroat = hasChannel(channels, /16-48|20-57/)

  if (centers.includes('Sacral') && hasChannel(channels, /2-14|5-15|29-46/) && gToThroat) return true
  if (centers.includes('Sacral') && hasChannel(channels, /27-50/) && spleenToThroat) return true
  if (centers.includes('Ego') && hasChannel(channels, /25-51/) && gToThroat) return true
  if (centers.includes('Ego') && hasChannel(channels, /26-44/) && spleenToThroat) return true
  if (centers.includes('Root') && hasChannel(channels, /18-58|28-38|32-54/) && spleenToThroat) return true

  return false
}

const typeFor = (channels, centers) => {
  if (!channels.length) return 'Reflector'
  if (!centers.includes('Sacral')) return motorToThroat(channels, centers) ? 'Manifestor' : 'Projector'
  return motorToThroat(channels, centers) ? 'Manifesting Generator' : 'Generator'
}

const authorityFor = (centers) => {
  if (!centers.length) return 'Lunar'
  if (centers.includes('Solar Plexus')) return 'Emotional'
  if (centers.includes('Sacral')) return 'Sacral'
  if (centers.includes('Spleen')) return 'Splenic'
  if (centers.includes('Ego')) return 'Ego Projected'
  if (centers.includes('G')) return 'Self Projected'
  return 'Sounding Board'
}

const connectedCenterGroups = (channels) => {
  const groups = []

  for (const channel of channels) {
    const centers = CHANNEL_CENTERS[channel] || []
    if (centers.length !== 2) continue

    const matching = groups.filter(group => centers.some(center => group.has(center)))
    if (!matching.length) {
      groups.push(new Set(centers))
      continue
    }

    const merged = new Set(centers)
    for (const group of matching) {
      for (const center of group) merged.add(center)
      groups.splice(groups.indexOf(group), 1)
    }
    groups.push(merged)
  }

  return groups
}

const definitionFor = (channels, centers) => {
  if (!centers.length) return 'No Definition'
  const count = connectedCenterGroups(channels).length
  if (count <= 1) return 'Single Definition'
  if (count === 2) return 'Split Definition'
  if (count === 3) return 'Triple Split Definition'
  return 'Quad Split Definition'
}

const circuitriesFor = (channels) =>
  sortedUnique(channels.map(channel => CHANNEL_CIRCUITS[channel]).filter(Boolean))

export const deriveHumanDesignGraph = ({ personId, personName, birthJd, designJd, lat, lon, personality, design }) => {
  const gates            = collectGates(personality, design)
  const personalityGates = collectGates(personality)
  const designGates      = collectGates(design)
  const channels         = channelsForGates(gates)
  const centers          = centersForChannels(channels)

  const enriched = enrichHumanDesignChart({
    personId,
    personName,
    birthJd,
    designJd,
    lat,
    lon,
    personality,
    design,
    profile:    `${personality.Sun?.line || '-'} / ${design.Sun?.line || '-'}`,
    type:       typeFor(channels, centers),
    authority:  authorityFor(centers),
    definition: definitionFor(channels, centers),
    centers,
    undefinedCenters: CENTERS.filter(center => !centers.includes(center)),
    channels,
    gates,
    personalityGates,
    designGates,
    circuits: circuitriesFor(channels),
  })

  return {
    ...enriched,
    correlations: deriveHumanDesignCorrelations(enriched),
  }
}

export const buildHumanDesignChart = (person) => {
  if (!person) return null

  const jdUt = localToJdUt(person.isoLocal, offsetMinutesForPerson(person))
  const { personalityChart, designChart, designJd } = personalityDesignCharts(jdUt, person.lat, person.lon)

  return deriveHumanDesignGraph({
    personId:   person.id,
    personName: person.name,
    birthJd:    jdUt,
    designJd,
    lat:         person.lat,
    lon:         person.lon,
    personality: activationsForChart(personalityChart),
    design:      activationsForChart(designChart),
  })
}

export { CENTER_COORDS, CENTERS, CHANNEL_CENTERS, CHANNEL_CIRCUITS, HARMONIC_GATES }
export {
  buildHumanDesignTransitChart,
  deriveHumanDesignDetails,
  deriveHumanDesignVariables,
  deriveIncarnationCross,
  humanDesignTeamAnalysis,
  humanDesignTransitConnection,
} from './details.js'
export {
  bridgeAstrologyHumanDesign,
  circuitStreamBalance,
  deriveHumanDesignCorrelations,
  harmonicCompletionTiming,
  humanDesignAstrologyBridge,
  humanDesignConnectionCorrelations,
  humanDesignCircuitStreamBalance,
  humanDesignEventDiaryCorrelations,
  humanDesignEventCorrelations,
  humanDesignHarmonicCompletionTiming,
  humanDesignIncarnationCrossResonance,
  humanDesignLinePatternAnalysis,
  humanDesignPlanetGateWeighting,
  humanDesignRelationshipActivationOverlay,
  humanDesignTransitThemeClusters,
  humanDesignTransitCorrelations,
  humanDesignVariableConsistencyChecks,
  incarnationCrossResonance,
  linePatternAnalysis,
  planetGateWeighting,
  variableConsistencyChecks,
} from './correlations.js'
export {
  activationLibraryEntry,
  channelLibraryEntry,
  circuitLibrarySummary,
  gateExplorerEntry as humanDesignGateExplorer,
  gateLibraryEntry,
  lineLibraryEntry,
  LINE_ARCHETYPES,
  mandalaDegreeDetailForActivation,
  mandalaDegreeSpanForGate,
  PLANET_ACTIVATION_MEANINGS,
  planetLibraryEntry,
  STREAM_BY_CHANNEL,
} from './gate-library.js'
