import { localToJdUt, offsetMinutesForPerson } from '../astro/timezones.js'
import { activationsForChart, personalityDesignCharts } from './activations.js'
import { CENTERS, CHANNEL_CENTERS, CHANNEL_CIRCUITS, CHANNELS, GATE_CENTER, HARMONIC_GATES } from './constants.js'
import { deriveHumanDesignCorrelations } from './correlations.js'
import { humanDesignStateForGates, sortedGates } from './definition.js'
import { enrichHumanDesignChart } from './details.js'

const sortedUnique = values => [...new Set(values)].sort()

const activationValues = (activations) => Object.values(activations || {})

const collectGates = (...activationSets) =>
  sortedGates(activationSets.flatMap(activations => activationValues(activations).map(item => item.gate)))

const circuitriesFor = (channels) =>
  sortedUnique(channels.map(channel => CHANNEL_CIRCUITS[channel]).filter(Boolean))

export const deriveHumanDesignGraph = ({ personId, personName, birthJd, designJd, lat, lon, personality, design }) => {
  const state            = humanDesignStateForGates(collectGates(personality, design))
  const personalityGates = collectGates(personality)
  const designGates      = collectGates(design)

  const enriched = enrichHumanDesignChart({
    personId,
    personName,
    birthJd,
    designJd,
    lat,
    lon,
    personality,
    design,
    profile:          `${personality.Sun?.line || '-'} / ${design.Sun?.line || '-'}`,
    type:             state.type,
    authority:        state.authority,
    definition:       state.definition,
    definitionAreas:  state.components,
    splitSize:        state.splitSize,
    bridges:          state.bridges,
    motorsToThroat:   state.motorsToThroat,
    centers:          state.centers,
    undefinedCenters: CENTERS.filter(center => !state.centers.includes(center)),
    channels:         state.channels,
    gates:            state.gates,
    personalityGates,
    designGates,
    circuits:         circuitriesFor(state.channels),
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

export { definitionWith, humanDesignStateForGates } from './definition.js'
export { CENTERS, CHANNEL_CENTERS, CHANNEL_CIRCUITS, CHANNELS, GATE_CENTER, HARMONIC_GATES }
export {
  buildHumanDesignTransitChart,
  deriveHumanDesignDetails,
  deriveHumanDesignVariables,
  deriveIncarnationCross,
  humanDesignTeamAnalysis,
  humanDesignTransitConnection,
  lifeCyclesForChart,
  sensitivityForChart,
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
